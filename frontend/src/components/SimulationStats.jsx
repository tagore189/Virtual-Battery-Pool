import React, { useMemo } from 'react';

/* ─── Stat Card ───────────────────────────────────────────── */

function StatCard({ label, value, unit, sublabel, color, icon }) {
  return (
    <div className="glass-panel p-4 rounded-xl border border-grid-border">
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </div>
      <div className={`text-xl font-bold font-mono ${color || 'text-white'}`}>
        {value} <span className="text-sm font-normal text-slate-400">{unit}</span>
      </div>
      {sublabel && (
        <div className="text-[11px] text-slate-500 mt-1.5">{sublabel}</div>
      )}
    </div>
  );
}

/* ─── Ring Gauge (SVG donut) ──────────────────────────────── */

function RingGauge({ value, max, color, label, size = 72 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value / (max || 1)));
  const dash = circ * pct;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke="#1e293b" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r}
                fill="none" stroke={color} strokeWidth={6}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                className="transition-all duration-700" />
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle"
              fill="white" fontSize="13" fontWeight="bold" fontFamily="ui-monospace, monospace">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <span className="text-[10px] text-slate-400 mt-1 font-medium">{label}</span>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */

export function SimulationStats({ batteries, gridState, poolAggregate, environment = {} }) {
  const stats = useMemo(() => {
    const chargeEff  = 0.95;
    const dischargeEff = 0.93;
    const rtEfficiency = (chargeEff * dischargeEff * 100).toFixed(1);

    const activeCount = (poolAggregate.charging || 0) + (poolAggregate.discharging || 0);
    const totalCount  = Math.max(1, poolAggregate.count || 1);
    const utilization = Math.round((activeCount / totalCount) * 100);

    const dev = Math.abs(gridState.deviation || 0);
    const stabilityScore = dev <= 0.015
      ? 100
      : Math.max(0, Math.round(100 - (dev - 0.015) * 2000));

    const absPower = Math.abs(poolAggregate.netPower || 0);
    const energyThroughput = (absPower * 0.28).toFixed(1);       // rough ≈ kWh

    const solarGen = Number(environment.solarGeneration ?? 0);
    const co2Offset = (solarGen * 0.28 * 0.5).toFixed(1);        // 0.5 kg/kWh

    const avgTemp = batteries.length > 0
      ? (batteries.reduce((s, b) => s + (b.temperature || 25), 0) / batteries.length).toFixed(1)
      : '25.0';

    const avgHealth = batteries.length > 0
      ? Math.round(batteries.reduce((s, b) => s + (b.health || 1), 0) / batteries.length * 100)
      : 100;

    const capacityUtil = totalCount > 0 && poolAggregate.totalCapacity > 0
      ? Math.round((absPower / (poolAggregate.availablePower || 1)) * 100)
      : 0;

    return {
      rtEfficiency, utilization, stabilityScore,
      energyThroughput, solarGen: solarGen.toFixed(1),
      co2Offset, avgTemp, avgHealth, capacityUtil,
    };
  }, [batteries, gridState, poolAggregate, environment]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white">Simulation Statistics</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Derived performance metrics from live simulation data
        </p>
      </div>

      {/* Ring gauges */}
      <div className="glass-panel p-5 rounded-2xl border border-grid-border">
        <div className="flex items-center justify-around flex-wrap gap-4">
          <RingGauge
            value={parseFloat(stats.rtEfficiency)} max={100}
            color="#38bdf8" label="Round-Trip η"
          />
          <RingGauge
            value={stats.utilization} max={100}
            color={stats.utilization > 50 ? '#10b981' : '#f59e0b'} label="Fleet Utilization"
          />
          <RingGauge
            value={stats.stabilityScore} max={100}
            color={stats.stabilityScore >= 95 ? '#10b981' : stats.stabilityScore >= 70 ? '#f59e0b' : '#ef4444'}
            label="Stability Score"
          />
          <RingGauge
            value={stats.capacityUtil} max={100}
            color="#a78bfa" label="Power Utilization"
          />
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="☀️" label="Solar Generation"
          value={stats.solarGen} unit="kW"
          sublabel={parseFloat(stats.solarGen) > 0 ? 'Active generation (simulated)' : 'No generation'}
          color={parseFloat(stats.solarGen) > 0 ? 'text-amber-400' : 'text-slate-500'}
        />
        <StatCard
          icon="⚡" label="Round-Trip Efficiency"
          value={stats.rtEfficiency} unit="%"
          sublabel="η_charge (95%) × η_discharge (93%)"
          color="text-sky-400"
        />
        <StatCard
          icon="🔋" label="Fleet Utilization"
          value={stats.utilization} unit="%"
          sublabel={`${(poolAggregate.charging || 0) + (poolAggregate.discharging || 0)} of ${poolAggregate.count || 0} active`}
          color={stats.utilization > 50 ? 'text-emerald-400' : 'text-amber-400'}
        />
        <StatCard
          icon="📊" label="Stability Score"
          value={stats.stabilityScore} unit="%"
          sublabel={stats.stabilityScore >= 95 ? 'Frequency within deadband' : 'Droop response active'}
          color={stats.stabilityScore >= 95 ? 'text-emerald-400' : stats.stabilityScore >= 70 ? 'text-amber-400' : 'text-rose-400'}
        />
        <StatCard
          icon="🔄" label="Energy Throughput"
          value={stats.energyThroughput} unit="kWh"
          sublabel="Session estimate"
          color="text-sky-400"
        />
        <StatCard
          icon="🌿" label="CO₂ Offset"
          value={stats.co2Offset} unit="kg"
          sublabel="From solar displacement"
          color="text-emerald-400"
        />
        <StatCard
          icon="🌡️" label="Avg Temperature"
          value={stats.avgTemp} unit="°C"
          sublabel="Fleet thermal average"
          color={parseFloat(stats.avgTemp) > 40 ? 'text-rose-400' : 'text-sky-400'}
        />
        <StatCard
          icon="❤️" label="Avg Fleet Health"
          value={stats.avgHealth} unit="%"
          sublabel="State of Health average"
          color={stats.avgHealth >= 95 ? 'text-emerald-400' : 'text-amber-400'}
        />
      </div>
    </div>
  );
}
