import math
from config import LOAD_BASE_KW
from environment import Environment


class LoadModel:
    """Calculates realistic electricity demand based on time of day, weather, and scenario multipliers."""

    def __init__(self, base_kw: float = LOAD_BASE_KW):
        self.base_kw = base_kw

    def _daily_profile_factor(self, t: float) -> float:
        """Normalized load profile across 24 hours."""
        if 0.0 <= t < 6.0:
            # Night trough
            return 0.60 + 0.05 * math.sin(math.pi * t / 6.0)
        elif 6.0 <= t < 9.0:
            # Morning ramp up
            ramp = (t - 6.0) / 3.0
            return 0.65 + 0.35 * ramp
        elif 9.0 <= t < 17.0:
            # Daytime business load
            return 1.00 + 0.08 * math.sin(math.pi * (t - 9.0) / 8.0)
        elif 17.0 <= t < 21.0:
            # Evening residential peak
            peak_progress = (t - 17.0) / 4.0
            return 1.08 + 0.32 * math.sin(math.pi * peak_progress)
        else:
            # Late night decay
            decay = (t - 21.0) / 3.0
            return 1.40 - 0.75 * decay

    def calculate_load(self, env: Environment) -> float:
        profile_factor = self._daily_profile_factor(env.time_of_day)

        # Weather thermal load adjustment (HVAC heating/cooling)
        thermal_add = 0.0
        if env.temperature > 25.0:
            thermal_add = 0.5 * (env.temperature - 25.0)  # Cooling (AC)
        elif env.temperature < 15.0:
            thermal_add = 0.6 * (15.0 - env.temperature)  # Heating

        unscaled_load = (self.base_kw * profile_factor) + thermal_add
        total_load = unscaled_load * env.load_multiplier

        return round(max(1.0, float(total_load)), 3)
