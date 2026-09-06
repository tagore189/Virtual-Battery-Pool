import numpy as np
from config import GRID_NOMINAL_FREQ


class GridSimulator:
    def __init__(self):
        self.frequency = GRID_NOMINAL_FREQ
        self.nominal = GRID_NOMINAL_FREQ
        self._disturbance = 0.0
        self._t = 0.0

    def step(self, dt: float) -> float:
        self._t += dt

        base_noise = np.random.normal(0, 0.005)

        if np.random.random() < 0.003:
            self._disturbance = np.random.choice([-1, 1]) * np.random.uniform(0.05, 0.3)

        self._disturbance *= 0.98

        oscillation = 0.01 * np.sin(self._t * 0.1) + 0.005 * np.sin(self._t * 0.37)

        self.frequency = self.nominal + self._disturbance + base_noise + oscillation
        self.frequency = np.clip(self.frequency, 49.0, 51.0)

        return round(self.frequency, 4)
