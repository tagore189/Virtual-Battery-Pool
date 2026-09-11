import asyncio
import json
import sys
import aiomqtt

# Fix for Windows asyncio event loop issue with aiomqtt / socket listeners
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from battery import Battery
from config import (
    BATTERY_TELEMETRY_INTERVAL,
    ENVIRONMENT_TELEMETRY_INTERVAL,
    GRID_UPDATE_INTERVAL,
    MQTT_HOST,
    MQTT_PORT,
    NUM_BATTERIES,
)
from environment import Environment
from grid import GridSimulator
from load import LoadModel
from renewable import RenewableGenerator
from scenario import ScenarioEngine


async def run_battery_with_client(battery: Battery):
    """Manages MQTT connection, publishing telemetry, and listening for commands for a single battery."""
    client_id = f"sim-{battery.id}"
    try:
        async with aiomqtt.Client(
            hostname=MQTT_HOST, port=MQTT_PORT, identifier=client_id
        ) as client:
            await client.subscribe(f"battery/{battery.id}/command")

            async def publish_loop():
                while True:
                    payload = json.dumps(battery.telemetry())
                    await client.publish(
                        f"battery/{battery.id}/telemetry", payload, qos=1
                    )
                    await asyncio.sleep(BATTERY_TELEMETRY_INTERVAL)

            publish_task = asyncio.create_task(publish_loop())

            try:
                async for msg in client.messages:
                    try:
                        cmd = json.loads(msg.payload.decode())
                        battery.command(
                            cmd.get("action", "idle"), cmd.get("power", 0)
                        )
                    except Exception as e:
                        print(
                            f"[SIM] Error parsing command for {battery.id}: {e}"
                        )
            finally:
                publish_task.cancel()
                try:
                    await publish_task
                except asyncio.CancelledError:
                    pass

    except aiomqtt.MqttError as err:
        print(f"[SIM] MQTT Error on {battery.id}: {err}")
    except Exception as e:
        print(f"[SIM] Unexpected error on {battery.id}: {e}")


async def run_simulation_core(batteries: list):
    """Core simulation loop integrating Environment, Renewables, Load, Grid, Scenarios, and Batteries."""
    env = Environment()
    renewables = RenewableGenerator()
    load_model = LoadModel()
    grid = GridSimulator()
    scenario_engine = ScenarioEngine()

    client_id = "sim-environment-grid"
    try:
        async with aiomqtt.Client(
            hostname=MQTT_HOST, port=MQTT_PORT, identifier=client_id
        ) as client:
            await client.subscribe("environment/command")

            async def env_command_listener():
                async for msg in client.messages:
                    try:
                        cmd = json.loads(msg.payload.decode())
                        action = cmd.get("command", cmd.get("action", "")).lower()

                        if action in ["set_weather", "weather"]:
                            env.set_weather(cmd.get("weather", "clear"))

                        elif action in ["set_cloud", "set_cloud_cover"]:
                            env.set_cloud_cover(float(cmd.get("cloud_cover", cmd.get("cloudCover", 0))))

                        elif action in ["set_solar", "set_solar_irradiance"]:
                            env.set_solar_irradiance(float(cmd.get("irradiance", cmd.get("solarIrradiance", 0))))

                        elif action in ["set_wind", "set_wind_speed"]:
                            env.set_wind_speed(float(cmd.get("speed", cmd.get("windSpeed", 0))))

                        elif action in ["set_temp", "set_temperature"]:
                            env.set_temperature(float(cmd.get("temperature", 25)))

                        elif action in ["set_time", "set_time_of_day"]:
                            env.set_time_of_day(float(cmd.get("timeOfDay", cmd.get("time", 12))))

                        elif action in ["set_load", "set_load_multiplier"]:
                            env.set_load_multiplier(float(cmd.get("multiplier", cmd.get("loadMultiplier", 1.0))))

                        elif action in ["set_scenario", "scenario"]:
                            s_name = cmd.get("scenario", cmd.get("name", "normal"))
                            scenario_engine.set_scenario(s_name, env, batteries, grid)

                        elif action == "reset":
                            scenario_engine.reset(env, batteries)

                    except Exception as e:
                        print(f"[SIM] Error handling environment command: {e}")

            listener_task = asyncio.create_task(env_command_listener())

            last_env_pub = 0.0
            dt = GRID_UPDATE_INTERVAL

            # =====================================================================
            # SIMULATION TIMESTEP ORDER (mandatory — do not reorder)
            #
            # Sign convention:
            #   Battery power > 0  →  discharging (injecting kW into grid)
            #   Battery power < 0  →  charging    (absorbing kW from grid)
            #
            # Power balance formula:
            #   power_imbalance = renewable_generation + net_battery_power - load
            #
            # Steps 1-10 execute in the Python simulator each timestep.
            # Steps 11-15 execute asynchronously in the Node.js backend
            # when it receives the grid/frequency MQTT message.
            #
            #  1. Environment advances (time, wind noise)
            #  2. Scenario effects are applied
            #  3. Solar generation is calculated from environment state
            #  4. Wind generation is calculated from environment state
            #  5. Load is calculated from environment state
            #  6. Existing battery physics advances (ramp toward _target_power
            #     set by PREVIOUS controller commands)
            #  7. Current battery power is read (reflects previous commands)
            #  8. Net power imbalance is calculated
            #  9. Grid frequency is calculated (existing model + imbalance effect)
            # 10. Grid frequency is published via MQTT
            #
            # --- Asynchronous boundary (MQTT) ---
            #
            # 11. Backend controller receives frequency
            # 12. Controller calculates droop response (UNTOUCHED)
            # 13. Controller sends battery commands via MQTT
            # 14. Battery.command() sets _target_power
            # 15. Batteries ramp toward targets on the NEXT timestep (step 6)
            #
            # NO double-counting: controller commands from step 13 only
            # affect battery power in step 6 of the NEXT iteration.
            # =====================================================================

            try:
                while True:
                    # Step 1: Environment advances
                    env.step(dt)

                    # Step 2: Scenario effects applied
                    scenario_engine.step(dt, env, batteries, grid)

                    # Steps 3-4: Solar and wind generation calculated
                    ren_data = renewables.get_telemetry(env)
                    solar_gen = ren_data["solarGeneration"]
                    wind_gen = ren_data["windGeneration"]
                    total_renewable = ren_data["totalRenewable"]

                    # Step 5: Load calculated
                    total_load = load_model.calculate_load(env)

                    # Step 6: Existing battery physics advances
                    # Batteries ramp toward _target_power from PREVIOUS commands
                    for b in batteries:
                        b.step(dt)

                    # Step 7: Current battery power is read
                    # Positive = discharge (into grid), Negative = charge (from grid)
                    net_battery_power = sum(b.power for b in batteries)

                    # Step 8: Net power imbalance (kW)
                    # Surplus (>0) → frequency rises; Deficit (<0) → frequency drops
                    power_imbalance = total_renewable + net_battery_power - total_load

                    # Step 9: Grid frequency updated (existing model + additive imbalance)
                    freq = grid.step(dt, power_imbalance=power_imbalance)

                    # Step 10: Publish grid frequency via MQTT
                    # Steps 11-15 happen asynchronously in Node.js backend
                    grid_payload = json.dumps({
                        "frequency": freq,
                        "powerImbalance": round(power_imbalance, 3),
                    })
                    await client.publish("grid/frequency", grid_payload, qos=1)

                    # Periodically publish environment & generation telemetry
                    last_env_pub += dt
                    if last_env_pub >= ENVIRONMENT_TELEMETRY_INTERVAL:
                        last_env_pub = 0.0
                        env_payload = json.dumps({
                            **env.telemetry(),
                            **ren_data,
                            "load": total_load,
                            "powerImbalance": round(power_imbalance, 3),
                            "activeScenario": scenario_engine.active_scenario,
                        })
                        await client.publish("environment/telemetry", env_payload, qos=1)

                    await asyncio.sleep(dt)

            finally:
                listener_task.cancel()
                try:
                    await listener_task
                except asyncio.CancelledError:
                    pass

    except aiomqtt.MqttError as err:
        print(f"[SIM] MQTT Error in core simulation loop: {err}")
    except Exception as e:
        print(f"[SIM] Unexpected error in simulation core: {e}")


async def main():
    batteries = [Battery(f"BAT-{i:03d}") for i in range(1, NUM_BATTERIES + 1)]
    print(
        f"[SIM] Starting {NUM_BATTERIES} batteries + Environment/Renewables/Load/Grid simulator on {MQTT_HOST}:{MQTT_PORT}"
    )

    core_task = asyncio.create_task(run_simulation_core(batteries))
    battery_tasks = [
        asyncio.create_task(run_battery_with_client(b)) for b in batteries
    ]

    try:
        await asyncio.gather(core_task, *battery_tasks)
    except KeyboardInterrupt:
        print("\n[SIM] Stopping simulator...")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass