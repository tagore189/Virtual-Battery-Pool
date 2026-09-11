import math
import numpy as np
from config import (
    SOLAR_CAPACITY_KW,
    WIND_CAPACITY_KW,
    WIND_CUT_IN_SPEED,
    WIND_RATED_SPEED,
    WIND_CUT_OUT_SPEED,
)
from environment import Environment


class SolarModel:
    """Calculates realistic solar PV generation based on environmental parameters."""

    def __init__(self, capacity_kw: float = SOLAR_CAPACITY_KW):
        self.capacity_kw = capacity_kw

    def calculate_generation(self, env: Environment) -> float:
        # Time of day sun factor (smooth zenith arc between 06:00 and 18:00)
        t = env.time_of_day
        if t < 6.0 or t > 18.0:
            time_factor = 0.0
        else:
            time_factor = math.sin(math.pi * (t - 6.0) / 12.0)

        # Irradiance factor (STC is 1000 W/m2)
        irradiance_factor = env.solar_irradiance / 1000.0

        # Cloud attenuation factor (100% cloud cover reduces output down to ~15%)
        cloud_factor = 1.0 - (env.cloud_cover / 100.0) * 0.85

        # Temperature derating factor (standard -0.4% per degree C above 25 deg C)
        temp_loss = 0.004 * max(0.0, env.temperature - 25.0)
        temp_factor = max(0.7, 1.0 - temp_loss)

        # Combined solar power output
        power = self.capacity_kw * irradiance_factor * cloud_factor * temp_factor * time_factor
        return round(max(0.0, float(power)), 3)


class WindModel:
    """Calculates wind turbine generation using a physics cubic power curve."""

    def __init__(
        self,
        capacity_kw: float = WIND_CAPACITY_KW,
        cut_in: float = WIND_CUT_IN_SPEED,
        rated: float = WIND_RATED_SPEED,
        cut_out: float = WIND_CUT_OUT_SPEED,
    ):
        self.capacity_kw = capacity_kw
        self.cut_in = cut_in
        self.rated = rated
        self.cut_out = cut_out

    def calculate_generation(self, env: Environment) -> float:
        v = env.wind_speed

        if v < self.cut_in or v > self.cut_out:
            return 0.0
        elif v >= self.rated:
            power = self.capacity_kw
        else:
            # Cubic power ramp between cut-in and rated speeds
            v_cubed_diff = (v ** 3) - (self.cut_in ** 3)
            denom = (self.rated ** 3) - (self.cut_in ** 3)
            power = self.capacity_kw * (v_cubed_diff / denom)

        return round(max(0.0, float(power)), 3)


class RenewableGenerator:
    """Unified manager for solar and wind generation."""

    def __init__(self):
        self.solar_model = SolarModel()
        self.wind_model = WindModel()

    def get_telemetry(self, env: Environment) -> dict:
        solar_gen = self.solar_model.calculate_generation(env)
        wind_gen = self.wind_model.calculate_generation(env)
        total_gen = round(solar_gen + wind_gen, 3)

        return {
            "solarGeneration": solar_gen,
            "windGeneration": wind_gen,
            "totalRenewable": total_gen,
        }
