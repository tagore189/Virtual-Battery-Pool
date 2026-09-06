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
    GRID_UPDATE_INTERVAL,
    MQTT_HOST,
    MQTT_PORT,
    NUM_BATTERIES,
)
from grid import GridSimulator


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
                    battery.step(BATTERY_TELEMETRY_INTERVAL)
                    payload = json.dumps(battery.telemetry())
                    await client.publish(
                        f"battery/{battery.id}/telemetry", payload, qos=1
                    )
                    await asyncio.sleep(BATTERY_TELEMETRY_INTERVAL)

            publish_task = asyncio.create_task(publish_loop())

            try:
                # Fix: client.messages is an async property/iterator, NOT a function call
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


async def run_grid(client: aiomqtt.Client):
    """Periodically publishes grid frequency telemetry."""
    grid = GridSimulator()
    while True:
        freq = grid.step(GRID_UPDATE_INTERVAL)
        payload = json.dumps({"frequency": freq})
        await client.publish("grid/frequency", payload, qos=1)
        await asyncio.sleep(GRID_UPDATE_INTERVAL)


async def main():
    batteries = [Battery(f"BAT-{i:03d}") for i in range(1, NUM_BATTERIES + 1)]
    print(
        f"[SIM] Starting {NUM_BATTERIES} batteries + grid simulator on {MQTT_HOST}:{MQTT_PORT}"
    )

    try:
        async with aiomqtt.Client(
            hostname=MQTT_HOST, port=MQTT_PORT, identifier="sim-grid"
        ) as grid_client:
            grid_task = asyncio.create_task(run_grid(grid_client))

            battery_tasks = [
                asyncio.create_task(run_battery_with_client(b)) for b in batteries
            ]

            await asyncio.gather(grid_task, *battery_tasks)
    except aiomqtt.MqttError as err:
        print(f"[SIM] Connection failed: {err}")
    except KeyboardInterrupt:
        print("\n[SIM] Stopping simulator...")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass