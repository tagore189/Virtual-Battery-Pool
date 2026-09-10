import React from 'react';

/* ─── Heatmap Cell ────────────────────────────────────────── */

function HeatCell({ value, max, label, sublabel, colorFn, title }) {
  const pct = Math.min(1, Math.max(0, value / max));
  const bg  = colorFn(value);
  const opacity = 0.25 + pct * 0.75;

  return (
    <div
      className={`${bg} rounded-lg p-2.5 text-center transition-all duration-300 cursor-default`}
      style={{ opacity }}
      title={title}
    >
      <div className="text-[11px] font-mono text-white font-bold leading-tight">{label}</div>
      <div className="text-[8px] font-mono text-white/60 mt-0.5">{sublabel}</div>
    </div>
  );
}

/* ─── Legend ───────────────────────────────────────────────── */

function Legend({ items }) {
  return (
    <div className="flex items-center space-x-4 text-[10px] text-slate-400">
      {items.map((it, i) => (
        <div key={i} className="flex items-center space-x-1.5">
          <span className={`w-3 h-3 rounded ${it.bg}`} />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */

export function BatteryHeatmap({ batteries }) {
  if (!batteries || batteries.length === 0) {
    return (
      <div className="glass-panel p-5 rounded-2xl">
        <h2 className="text-base font-bold text-white mb-1">Battery Fleet Heatmap</h2>
        <p className="text-xs text-slate-500 italic mt-2">
          No battery data available. Waiting for simulation…
        </p>
      </div>
    );
  }

  const socColorFn = (soc) =>
    soc < 0.2 ? 'bg-rose-500' : soc < 0.5 ? 'bg-amber-500' : 'bg-emerald-500';

  const tempColorFn = (temp) =>
    temp > 45 ? 'bg-rose-500' : temp > 35 ? 'bg-amber-500' : 'bg-sky-500';

  const modeColorFn = (mode) => {
    if (mode === 'fault')       return 'bg-rose-600';
    if (mode === 'discharging') return 'bg-amber-500';
    if (mode === 'charging')    return 'bg-emerald-500';
    return 'bg-slate-600';
  };

  return (
    <div className="glass-panel p-5 rounded-2xl">
      <div className="mb-4">
        <h2 className="text-base font-bold text-white">Battery Fleet Heatmap</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          At-a-glance view of SoC, temperature, and operational mode across the fleet
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ── SoC Heatmap ── */}
        <div>
          <div className="text-xs text-slate-300 mb-2 font-semibold">State of Charge</div>
          <div className="grid grid-cols-4 gap-1.5">
            {batteries.map((b) => (
              <HeatCell
                key={`soc-${b.id}`}
                value={b.soc || 0} max={1}
                label={`${Math.round((b.soc || 0) * 100)}%`}
                sublabel={b.id.replace('BAT-', '')}
                colorFn={socColorFn}
                title={`${b.id}: ${Math.round((b.soc || 0) * 100)}% SoC`}
              />
            ))}
          </div>
          <div className="mt-3">
            <Legend items={[
              { bg: 'bg-emerald-500', label: '≥ 50%' },
              { bg: 'bg-amber-500',   label: '20–50%' },
              { bg: 'bg-rose-500',    label: '< 20%' },
            ]} />
          </div>
        </div>

        {/* ── Temperature Heatmap ── */}
        <div>
          <div className="text-xs text-slate-300 mb-2 font-semibold">Temperature (°C)</div>
          <div className="grid grid-cols-4 gap-1.5">
            {batteries.map((b) => (
              <HeatCell
                key={`temp-${b.id}`}
                value={(b.temperature || 25) - 15} max={40}
                label={`${(b.temperature || 25).toFixed(0)}°`}
                sublabel={b.id.replace('BAT-', '')}
                colorFn={() => tempColorFn(b.temperature || 25)}
                title={`${b.id}: ${(b.temperature || 25).toFixed(1)}°C`}
              />
            ))}
          </div>
          <div className="mt-3">
            <Legend items={[
              { bg: 'bg-sky-500',   label: '< 35°C' },
              { bg: 'bg-amber-500', label: '35–45°C' },
              { bg: 'bg-rose-500',  label: '> 45°C' },
            ]} />
          </div>
        </div>

        {/* ── Mode Heatmap ── */}
        <div>
          <div className="text-xs text-slate-300 mb-2 font-semibold">Operational Mode</div>
          <div className="grid grid-cols-4 gap-1.5">
            {batteries.map((b) => {
              const mode = b.fault ? 'fault' : b.mode || 'idle';
              return (
                <HeatCell
                  key={`mode-${b.id}`}
                  value={1} max={1}
                  label={mode.slice(0, 3).toUpperCase()}
                  sublabel={b.id.replace('BAT-', '')}
                  colorFn={() => modeColorFn(mode)}
                  title={`${b.id}: ${mode}`}
                />
              );
            })}
          </div>
          <div className="mt-3">
            <Legend items={[
              { bg: 'bg-emerald-500', label: 'Charging' },
              { bg: 'bg-amber-500',   label: 'Discharging' },
              { bg: 'bg-slate-600',   label: 'Idle' },
              { bg: 'bg-rose-600',    label: 'Fault' },
            ]} />
          </div>
        </div>
      </div>
    </div>
  );
}
