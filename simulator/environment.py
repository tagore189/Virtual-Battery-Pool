import numpy as np


WEATHER_PRESETS = {
    "clear": {
        "cloud_cover": 10.0,
        "solar_irradiance": 900.0,
        "wind_speed": 6.0,
        "temperature": 28.0,
        "humidity": 40.0,
    },
    "partly_cloudy": {
        "cloud_cover": 40.0,
        "solar_irradiance": 650.0,
        "wind_speed": 8.0,
        "temperature": 26.0,
        "humidity": 50.0,
    },
    "cloudy": {
        "cloud_cover": 75.0,
        "solar_irradiance": 350.0,
        "wind_speed": 9.0,
        "temperature": 24.0,
        "humidity": 65.0,
    },
    "rain": {
        "cloud_cover": 90.0,
        "solar_irradiance": 200.0,
        "wind_speed": 11.0,
        "temperature": 21.0,
        "humidity": 85.0,
    },
    "storm": {
        "cloud_cover": 95.0,
        "solar_irradiance": 100.0,
        "wind_speed": 20.0,
        "temperature": 19.0,
        "humidity": 95.0,
    },
    "night": {
        "cloud_cover": 20.0,
        "solar_irradiance": 0.0,
        "wind_speed": 5.0,
        "temperature": 18.0,
        "humidity": 70.0,
        "time_of_day": 23.0,
    },
    "high_wind": {
        "cloud_cover": 30.0,
        "solar_irradiance": 750.0,
        "wind_speed": 16.0,
        "temperature": 25.0,
        "humidity": 55.0,
    },
    "extreme_weather": {
        "cloud_cover": 98.0,
        "solar_irradiance": 50.0,
        "wind_speed": 26.0,
        "temperature": 35.0,
        "humidity": 90.0,
    },
}


class Environment:
    """Maintains and updates environmental conditions in real time."""

    def __init__(self):
        self.weather = "clear"
        self.cloud_cover = 10.0  # percentage [0 - 100]
        self.solar_irradiance = 900.0  # W/m2 [0 - 1500]
        self.wind_speed = 6.0  # m/s [0 - 50]
        self.temperature = 28.0  # deg C [-20 - 60]
        self.humidity = 40.0  # percentage [0 - 100]
        self.time_of_day = 12.0  # hours [0 - 24]
        self.load_multiplier = 1.0  # demand multiplier [0.1 - 5.0]
        self.auto_advance_time = True

    def set_weather(self, weather_state: str) -> bool:
        state_key = weather_state.lower().strip()
        if state_key not in WEATHER_PRESETS:
            return False
        self.weather = state_key
        preset = WEATHER_PRESETS[state_key]
        self.cloud_cover = float(preset["cloud_cover"])
        self.solar_irradiance = float(preset["solar_irradiance"])
        self.wind_speed = float(preset["wind_speed"])
        self.temperature = float(preset["temperature"])
        self.humidity = float(preset["humidity"])
        if "time_of_day" in preset:
            self.time_of_day = float(preset["time_of_day"])
        return True

    def set_cloud_cover(self, val: float):
        self.cloud_cover = float(np.clip(val, 0.0, 100.0))

    def set_solar_irradiance(self, val: float):
        self.solar_irradiance = float(np.clip(val, 0.0, 1500.0))

    def set_wind_speed(self, val: float):
        self.wind_speed = float(np.clip(val, 0.0, 50.0))

    def set_temperature(self, val: float):
        self.temperature = float(np.clip(val, -20.0, 60.0))

    def set_humidity(self, val: float):
        self.humidity = float(np.clip(val, 0.0, 100.0))

    def set_time_of_day(self, val: float):
        self.time_of_day = float(val % 24.0)

    def set_load_multiplier(self, val: float):
        self.load_multiplier = float(np.clip(val, 0.1, 5.0))

    def step(self, dt: float):
        """Advances environmental state slightly per simulation step."""
        if self.auto_advance_time:
            # 1 real second = 0.05 sim hour (~3 minutes sim time per second)
            self.time_of_day = (self.time_of_day + (dt * 0.02)) % 24.0

        # Subtle natural fluctuation in wind & temperature
        if self.weather not in ["storm", "extreme_weather"]:
            wind_noise = np.random.normal(0, 0.05)
            self.wind_speed = float(np.clip(self.wind_speed + wind_noise, 0.0, 50.0))

    def telemetry(self) -> dict:
        return {
            "weather": self.weather,
            "cloudCover": round(self.cloud_cover, 1),
            "solarIrradiance": round(self.solar_irradiance, 1),
            "windSpeed": round(self.wind_speed, 2),
            "temperature": round(self.temperature, 1),
            "humidity": round(self.humidity, 1),
            "timeOfDay": round(self.time_of_day, 2),
            "loadMultiplier": round(self.load_multiplier, 2),
        }
