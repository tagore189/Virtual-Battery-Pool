import math
import numpy as np
from environment import Environment


class ScenarioEngine:
    """Manages real-time execution and progression of simulation scenarios.

    Each scenario modifies actual simulation state (environment, batteries, grid).
    Only one scenario is active at a time.
    Switching scenarios first calls reset() to remove all previous scenario modifiers.

    Scenarios:
        normal:                   Stable clear weather, baseline load.
        cloud_passing:            Cloud cover cycles 15%-85% over 30s, irradiance follows.
        solar_drop:               Irradiance drops to 100 W/m2, cloud cover 75%.
        high_wind:                Wind speed ramps to 16 m/s.
        storm:                    Cloud 95%, irradiance 100, wind 18-22 m/s variable.
        night:                    Time=23:00, irradiance=0.
        evening_peak:             Time=19:00, irradiance=50, load multiplier=1.4.
        sudden_load_increase:     Load multiplier=1.8.
        renewable_collapse:       Irradiance=30, wind=1.5 m/s.
        battery_failure:          Faults battery[0] using existing fault mechanism.
        multiple_battery_failure: Faults batteries[0..2] using existing fault mechanism.
        grid_disturbance:         Injects -0.35 Hz disturbance via grid.trigger_disturbance().
    """

    SCENARIOS = [
        "normal",
        "cloud_passing",
        "solar_drop",
        "high_wind",
        "storm",
        "night",
        "evening_peak",
        "sudden_load_increase",
        "renewable_collapse",
        "battery_failure",
        "multiple_battery_failure",
        "grid_disturbance",
    ]

    def __init__(self):
        self.active_scenario = "normal"
        self.scenario_time = 0.0
        self._faulted_by_scenario = []  # track which batteries were faulted BY a scenario

    def reset(self, env: Environment, batteries: list):
        """Fully removes all temporary scenario modifications and returns to baseline.

        - Restores weather to 'clear' preset
        - Restores load multiplier to 1.0
        - Clears faults on batteries that were faulted BY a scenario
          (does NOT clear faults that occurred naturally, e.g. thermal overload)
        - Resets scenario timer
        """
        env.set_weather("clear")
        env.set_load_multiplier(1.0)

        # Only clear faults that were set by a scenario, not naturally occurring ones
        for b_id in self._faulted_by_scenario:
            for b in batteries:
                if b.id == b_id:
                    b.fault = False
                    break

        self._faulted_by_scenario = []
        self.active_scenario = "normal"
        self.scenario_time = 0.0

    def set_scenario(self, scenario_name: str, env: Environment, batteries: list, grid) -> bool:
        """Activates a scenario. First resets all previous scenario state."""
        s_name = scenario_name.lower().strip()
        if s_name not in self.SCENARIOS:
            return False

        # Reset previous scenario state before applying new one
        self.reset(env, batteries)

        self.active_scenario = s_name
        self.scenario_time = 0.0

        if s_name == "normal":
            # reset() already restored baseline
            pass

        elif s_name == "solar_drop":
            env.set_weather("cloudy")
            env.set_solar_irradiance(100.0)

        elif s_name == "high_wind":
            env.set_weather("high_wind")
            env.set_wind_speed(16.0)

        elif s_name == "storm":
            env.set_weather("storm")

        elif s_name == "night":
            env.set_weather("night")

        elif s_name == "evening_peak":
            env.set_time_of_day(19.0)
            env.set_solar_irradiance(50.0)
            env.set_load_multiplier(1.4)

        elif s_name == "sudden_load_increase":
            env.set_load_multiplier(1.8)

        elif s_name == "renewable_collapse":
            env.set_solar_irradiance(30.0)
            env.set_wind_speed(1.5)

        elif s_name == "battery_failure":
            if len(batteries) > 0:
                batteries[0].fault = True
                batteries[0].power = 0.0
                batteries[0]._target_power = 0.0
                self._faulted_by_scenario.append(batteries[0].id)

        elif s_name == "multiple_battery_failure":
            fail_count = min(3, len(batteries))
            for i in range(fail_count):
                batteries[i].fault = True
                batteries[i].power = 0.0
                batteries[i]._target_power = 0.0
                self._faulted_by_scenario.append(batteries[i].id)

        elif s_name == "grid_disturbance":
            grid.trigger_disturbance(-0.35)

        # cloud_passing is handled dynamically in step()

        return True

    def step(self, dt: float, env: Environment, batteries: list, grid):
        """Advances dynamic scenario effects per simulation timestep."""
        self.scenario_time += dt

        if self.active_scenario == "cloud_passing":
            # Cloud cover cycles between 15% and 85% over a 30-second period
            progress = (self.scenario_time % 30.0) / 30.0
            cloud_val = 15.0 + 70.0 * math.sin(math.pi * progress)
            env.set_cloud_cover(cloud_val)
            # Irradiance inversely tracks cloud cover
            irr_val = 900.0 * (1.0 - (cloud_val / 100.0) * 0.8)
            env.set_solar_irradiance(irr_val)

        elif self.active_scenario == "storm":
            # Continuous wind volatility during storm
            fluctuation = np.random.uniform(-2.0, 2.0)
            env.set_wind_speed(18.0 + fluctuation)
