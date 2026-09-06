import numpy as np
from config import BATTERY_DEFAULTS as BD


class Battery:
    def __init__(self, battery_id: str):
        self.id = battery_id
        self.capacity = BD["capacity_kwh"]
        self.max_power = BD["max_power_kw"]
        self.soc = np.random.uniform(*BD["initial_soc_range"])
        self.voltage = BD["nominal_voltage"]
        self.temperature = BD["ambient_temp"] + np.random.uniform(-2, 2)
        self.power = 0.0
        self.current = 0.0
        self.health = round(np.random.uniform(0.92, 1.0), 3)
        self.fault = False
        self.mode = "idle"
        self._target_power = 0.0

    def command(self, action: str, power: float):
        if self.fault:
            return
        if action == "charge":
            self._target_power = -min(power, self.max_power)
        elif action == "discharge":
            self._target_power = min(power, self.max_power)
        else:
            self._target_power = 0.0

    def step(self, dt: float):
        ramp_rate = self.max_power * 0.5 * dt
        diff = self._target_power - self.power
        self.power += np.clip(diff, -ramp_rate, ramp_rate)

        if self.power > 0 and self.soc <= 0.05:
            self.power = 0.0
            self._target_power = 0.0
        elif self.power < 0 and self.soc >= 0.98:
            self.power = 0.0
            self._target_power = 0.0

        eff = BD["discharge_efficiency"] if self.power > 0 else BD["charge_efficiency"]
        energy = (self.power * dt / 3600) * eff
        self.soc = np.clip(self.soc - energy / self.capacity, 0.0, 1.0)

        v_min, v_max = BD["voltage_range"]
        self.voltage = v_min + (v_max - v_min) * self.soc + np.random.normal(0, 0.05)
        self.current = (self.power * 1000) / self.voltage if self.voltage > 0 else 0.0

        heat = abs(self.power) * BD["thermal_coeff"] * dt
        cooling = (self.temperature - BD["ambient_temp"]) * 0.005 * dt
        self.temperature += heat - cooling + np.random.normal(0, 0.02)

        if self.temperature > 55:
            self.fault = True
            self.power = 0.0
            self._target_power = 0.0

        self.mode = "fault" if self.fault else "discharging" if self.power > 0.01 else "charging" if self.power < -0.01 else "idle"

    def telemetry(self) -> dict:
        return {
            "soc": round(self.soc, 4),
            "voltage": round(self.voltage, 2),
            "current": round(self.current, 2),
            "power": round(self.power, 3),
            "temperature": round(self.temperature, 1),
            "health": self.health,
            "fault": self.fault,
            "mode": self.mode,
            "capacity": self.capacity,
            "maxPower": self.max_power,
        }
