const MAX_HISTORY = 300;

export class BatteryPool {
  constructor() {
    this.batteries = new Map();
    this.history = [];
  }

  update(id, telemetry) {
    const prev = this.batteries.get(id);
    this.batteries.set(id, {
      id,
      ...telemetry,
      lastSeen: Date.now(),
      status: telemetry.fault ? "fault" : telemetry.power > 0 ? "discharging" : telemetry.power < 0 ? "charging" : "idle",
    });
    return this.batteries.get(id);
  }

  remove(id) {
    this.batteries.delete(id);
  }

  getAll() {
    return Array.from(this.batteries.values());
  }

  get(id) {
    return this.batteries.get(id);
  }

  aggregate() {
    const all = this.getAll();
    if (all.length === 0) {
      return { count: 0, totalCapacity: 0, availablePower: 0, weightedSoc: 0, netPower: 0, charging: 0, discharging: 0, idle: 0, fault: 0 };
    }

    let totalCapacity = 0, weightedSocSum = 0, netPower = 0, availablePower = 0;
    let charging = 0, discharging = 0, idle = 0, fault = 0;

    for (const b of all) {
      totalCapacity += b.capacity || 0;
      weightedSocSum += (b.soc || 0) * (b.capacity || 0);
      netPower += b.power || 0;
      availablePower += b.maxPower || 0;
      if (b.status === "charging") charging++;
      else if (b.status === "discharging") discharging++;
      else if (b.status === "fault") fault++;
      else idle++;
    }

    const agg = {
      count: all.length,
      totalCapacity,
      availablePower,
      weightedSoc: totalCapacity > 0 ? weightedSocSum / totalCapacity : 0,
      netPower,
      charging,
      discharging,
      idle,
      fault,
      timestamp: Date.now(),
    };

    this.history.push(agg);
    if (this.history.length > MAX_HISTORY) this.history.shift();

    return agg;
  }

  getHistory() {
    return this.history;
  }
}
