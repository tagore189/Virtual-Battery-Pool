const NOMINAL_FREQ = 50.0;
const DEADBAND = 0.015;
const DROOP = 0.04;
const MAX_HISTORY = 120;

export class GridController {
  constructor(pool, mqttClient) {
    this.pool = pool;
    this.mqtt = mqttClient;
    this.frequency = NOMINAL_FREQ;
    this.deviation = 0;
    this.requiredPower = 0;
    this.dispatches = [];
    this.freqHistory = [];
    this.events = [];
    this.onEvent = null;
  }

  onFrequencyUpdate(freq) {
    this.frequency = freq;
    this.deviation = freq - NOMINAL_FREQ;

    this.freqHistory.push({ timestamp: Date.now(), frequency: freq, deviation: this.deviation });
    if (this.freqHistory.length > MAX_HISTORY) this.freqHistory.shift();

    if (Math.abs(this.deviation) <= DEADBAND) {
      this.requiredPower = 0;
      return;
    }

    const agg = this.pool.aggregate();
    if (agg.count === 0) return;

    this.requiredPower = -(this.deviation / (DROOP * NOMINAL_FREQ)) * agg.availablePower;
    this.dispatch(this.requiredPower);
  }

  dispatch(totalPower) {
    const batteries = this.pool.getAll().filter((b) => b.status !== "fault");
    if (batteries.length === 0) return;

    const perUnit = totalPower / batteries.length;

    for (const b of batteries) {
      const clampedPower = Math.max(-b.maxPower, Math.min(b.maxPower, perUnit));
      const cmd = {
        action: clampedPower > 0 ? "discharge" : clampedPower < 0 ? "charge" : "idle",
        power: Math.abs(clampedPower),
        timestamp: Date.now(),
      };

      this.mqtt.publish(`battery/${b.id}/command`, JSON.stringify(cmd), { qos: 1 });
    }

    const event = {
      type: "dispatch",
      totalPower,
      frequency: this.frequency,
      deviation: this.deviation,
      batteryCount: batteries.length,
      timestamp: Date.now(),
    };
    this.dispatches.push(event);
    this.events.push(event);
    if (this.dispatches.length > MAX_HISTORY) this.dispatches.shift();
    if (this.events.length > 500) this.events.shift();

    if (typeof this.onEvent === "function") {
      this.onEvent(event);
    }
  }

  addEvent(event) {
    const fullEvent = { ...event, timestamp: Date.now() };
    this.events.push(fullEvent);
    if (this.events.length > 500) this.events.shift();

    if (typeof this.onEvent === "function") {
      this.onEvent(fullEvent);
    }
  }

  getState() {
    return {
      frequency: this.frequency,
      deviation: this.deviation,
      requiredPower: this.requiredPower,
      nominal: NOMINAL_FREQ,
    };
  }

  getFreqHistory() {
    return this.freqHistory;
  }

  getEvents() {
    return this.events;
  }
}
