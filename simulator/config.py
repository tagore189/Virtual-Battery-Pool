MQTT_HOST = "broker.emqx.io"
MQTT_PORT = 1883
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
