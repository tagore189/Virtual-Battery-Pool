import numpy as np
from config import GRID_IMBALANCE_COEFF, GRID_NOMINAL_FREQ


class GridSimulator:
    """Simulates power grid frequency dynamics with coupled energy imbalance disturbances."""

    def __init__(self, imbalance_coeff: float = GRID_IMBALANCE_COEFF):
        self.frequency = GRID_NOMINAL_FREQ
        self.nominal = GRID_NOMINAL_FREQ
        self.imbalance_coeff = imbalance_coeff
        self._disturbance = 0.0
        self._t = 0.0

    def trigger_disturbance(self, delta_freq: float):
        """Injects an explicit external frequency disturbance."""
        self._disturbance += delta_freq

    def step(self, dt: float, power_imbalance: float = 0.0) -> float:
        self._t += dt

        base_noise = np.random.normal(0, 0.005)

        if np.random.random() < 0.003:
            self._disturbance += np.random.choice([-1, 1]) * np.random.uniform(0.05, 0.3)

        self._disturbance *= 0.98

        oscillation = 0.01 * np.sin(self._t * 0.1) + 0.005 * np.sin(self._t * 0.37)

        # Coupled physical effect of renewable/load/battery power imbalance on grid frequency
        imbalance_effect = self.imbalance_coeff * power_imbalance

        self.frequency = self.nominal + self._disturbance + base_noise + oscillation + imbalance_effect
        self.frequency = float(np.clip(self.frequency, 49.0, 51.0))

        return round(self.frequency, 4)
