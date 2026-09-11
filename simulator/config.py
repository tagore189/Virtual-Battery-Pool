import os

MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
NUM_BATTERIES = 8
BATTERY_DEFAULTS = {
    "capacity_kwh": 13.5,
    "max_power_kw": 5.0,
    "voltage_range": (46.0, 54.0),
    "nominal_voltage": 51.2,
    "initial_soc_range": (0.3, 0.9),
    "charge_efficiency": 0.95,
    "discharge_efficiency": 0.93,
    "thermal_coeff": 0.02,
    "ambient_temp": 25.0,
}

GRID_NOMINAL_FREQ = 50.0
GRID_UPDATE_INTERVAL = 0.5
BATTERY_TELEMETRY_INTERVAL = 1.0
ENVIRONMENT_TELEMETRY_INTERVAL = 1.0

# Grid imbalance coupling coefficient (Hz per kW of net imbalance)
# Calibrated so normal renewable/load fluctuations (e.g. 10-30 kW) produce realistic frequency deviation (~0.03 - 0.15 Hz)
GRID_IMBALANCE_COEFF = 0.003

# Renewable generation capacity (kW)
SOLAR_CAPACITY_KW = 30.0
WIND_CAPACITY_KW = 25.0

# Turbine power curve limits (m/s)
WIND_CUT_IN_SPEED = 3.0
WIND_RATED_SPEED = 12.0
WIND_CUT_OUT_SPEED = 25.0

# Load model baseline (kW)
LOAD_BASE_KW = 25.0

