import React, { useState } from 'react';

const SCENARIOS = [
  {
    id: 'normal',
    name: 'Normal Operation',
    icon: '☀️',
    badge: 'Baseline',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    desc: 'Clear weather, nominal irradiance & wind, baseline microgrid load.',
  },
  {
    id: 'cloud_passing',
    name: 'Cloud Passing',
    icon: '⛅',
    badge: 'Dynamic',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    desc: 'Cloud cover cycles 15%-85% over 30s; solar fluctuates dynamically.',
  },
  {
    id: 'solar_drop',
    name: 'Solar Drop',
    icon: '📉',
    badge: 'Solar',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    desc: 'Solar irradiance drops to 100 W/m² under sudden cloud cover (75%).',
  },
  {
    id: 'high_wind',
    name: 'High Wind',
    icon: '💨',
    badge: 'Wind',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    desc: 'Wind speed ramps to 16 m/s; wind turbine generates maximum output.',
  },
  {
    id: 'storm',
    name: 'Severe Storm',
    icon: '⛈️',
    badge: 'Extreme',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    desc: 'Heavy overcast (95%), irradiance 100 W/m², volatile wind 18-22 m/s.',
  },
  {
    id: 'night',
    name: 'Night Operation',
    icon: '🌙',
    badge: 'Zero Solar',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    desc: 'Time advanced to 23:00, solar generation drops to 0.00 kW, load continues.',
  },
  {
    id: 'evening_peak',
    name: 'Evening Peak',
    icon: '🌆',
    badge: 'Load Surge',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    desc: 'Sunset (19:00), low solar, load multiplier ramps to 1.4x baseline.',
  },
  {
    id: 'sudden_load_increase',
    name: 'Sudden Load Surge',
    icon: '⚡',
    badge: 'Deficit',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    desc: 'Instant 1.8x load increase causing significant microgrid power deficit.',
  },
  {
    id: 'renewable_collapse',
    name: 'Renewable Collapse',
    icon: '⚠️',
    badge: 'Critical',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    desc: 'Simultaneous loss of sun (30 W/m²) and wind (1.5 m/s); pool must compensate.',
  },
  {
    id: 'battery_failure',
    name: 'Battery Failure',
    icon: '🔴',
    badge: 'Asset Fault',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    desc: 'Injects hardware fault into BAT-001; controller shifts load to healthy units.',
  },
  {
    id: 'multiple_battery_failure',
    name: 'Multiple Battery Failure',
    icon: '💥',
    badge: 'Major Fault',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    desc: 'Faults 3 units (BAT-001..003); tests N-3 resilience of remaining 5 units.',
  },
  {
    id: 'grid_disturbance',
    name: 'Grid Disturbance',
    icon: '⚡',
    badge: 'Frequency Dip',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    desc: 'Injects sudden -0.35 Hz transient disturbance to test droop stabilization.',
  },
];

export function ScenarioControls({
  activeScenario = 'normal',
  onActivateScenario,
  onResetSimulation,
  isConnected,
}) {
  const [activatingId, setActivatingId] = useState(null);

  const handleActivate = async (scenarioId) => {
    setActivatingId(scenarioId);
    try {
      await onActivateScenario(scenarioId);
    } finally {
      setActivatingId(null);
    }
  };

  const currentScenarioObj = SCENARIOS.find(s => s.id === activeScenario) || {
    id: activeScenario,
    name: activeScenario,
    icon: '🎮',
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-grid-border">
      {/* Header with Active Scenario & Reset Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">🎯</span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">Scenario Engine</h3>
              <p className="text-[11px] text-slate-400">12 stress test scenarios affecting real simulation telemetry</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Active Scenario Indicator derived from Simulator Telemetry */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">ACTIVE:</span>
            <span className="text-xs font-bold font-mono text-white flex items-center space-x-1">
              <span>{currentScenarioObj.icon}</span>
              <span>{currentScenarioObj.name}</span>
            </span>
          </div>

          {/* Reset Button */}
          <button
            onClick={onResetSimulation}
            disabled={!isConnected}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-semibold hover:border-slate-400 transition disabled:opacity-50"
            title="Reset simulation back to baseline (Clear weather, 1.0x load, cleared scenario faults)"
          >
            <span>↺</span>
            <span>RESET SIMULATION</span>
          </button>
        </div>
      </div>

      {/* 12 Scenario Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {SCENARIOS.map((scenario) => {
          const isActive = activeScenario === scenario.id;
          const isPending = activatingId === scenario.id;

          return (
            <div
              key={scenario.id}
              className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all duration-200 ${
                isActive
                  ? 'border-emerald-500/60 bg-emerald-950/20 shadow-md shadow-emerald-500/10'
                  : 'border-grid-border bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{scenario.icon}</span>
                    <span className="text-xs font-bold text-white leading-tight">{scenario.name}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-medium ${scenario.badgeColor}`}>
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug mb-3">
                  {scenario.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">{scenario.id}</span>
                <button
                  disabled={!isConnected || isPending}
                  onClick={() => handleActivate(scenario.id)}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400'
                      : 'bg-sky-500/15 hover:bg-sky-500/30 text-sky-400 border border-sky-500/40'
                  } disabled:opacity-40`}
                >
                  {isPending ? 'ACTIVATING...' : isActive ? '● ACTIVE' : 'ACTIVATE'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
