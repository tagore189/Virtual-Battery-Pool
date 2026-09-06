import React from 'react';

export function PoolOverview({ poolAggregate }) {
  const socPercent = Math.round((poolAggregate.weightedSoc || 0) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Capacity */}
      <div className="glass-panel p-4 rounded-xl border border-grid-border">
        <div className="text-xs text-slate-400 font-medium">Pool Capacity</div>
        <div className="text-2xl font-bold font-mono text-white mt-1">
          {poolAggregate.totalCapacity ? poolAggregate.totalCapacity.toFixed(1) : 0} <span className="text-sm font-normal text-slate-400">kWh</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">Max Power: {poolAggregate.availablePower ? poolAggregate.availablePower.toFixed(1) : 0} kW</div>
      </div>

      {/* Aggregate SoC */}
      <div className="glass-panel p-4 rounded-xl border border-grid-border">
        <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
          <span>Weighted SoC</span>
          <span className="font-mono text-white">{socPercent}%</span>
        </div>
        <div className="w-full bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              socPercent < 20 ? 'bg-rose-500' : socPercent < 50 ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, socPercent))}%` }}
          />
        </div>
        <div className="text-[11px] text-slate-500 mt-2">Aggregated state of charge</div>
      </div>

      {/* Net Power Flow */}
      <div className="glass-panel p-4 rounded-xl border border-grid-border">
        <div className="text-xs text-slate-400 font-medium">Net Power Output</div>
        <div className={`text-2xl font-bold font-mono mt-1 ${
          poolAggregate.netPower > 0 ? 'text-rose-400' : poolAggregate.netPower < 0 ? 'text-emerald-400' : 'text-slate-300'
        }`}>
          {poolAggregate.netPower > 0 ? `+${poolAggregate.netPower.toFixed(2)}` : poolAggregate.netPower ? poolAggregate.netPower.toFixed(2) : '0.00'} <span className="text-sm font-normal text-slate-400">kW</span>
        </div>
        <div className="text-[11px] text-slate-500 mt-2">
          {poolAggregate.netPower > 0 ? 'Discharging to grid' : poolAggregate.netPower < 0 ? 'Charging from grid' : 'Standby / Balanced'}
        </div>
      </div>

      {/* Node Status Summary */}
      <div className="glass-panel p-4 rounded-xl border border-grid-border">
        <div className="text-xs text-slate-400 font-medium mb-1">Active Fleet ({poolAggregate.count || 0} Nodes)</div>
        <div className="flex items-center space-x-2 text-xs mt-2">
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">{poolAggregate.discharging || 0} Discharge</span>
          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono">{poolAggregate.charging || 0} Charge</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{poolAggregate.idle || 0} Idle</span>
          {poolAggregate.fault > 0 && (
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono">{poolAggregate.fault} Fault</span>
          )}
        </div>
      </div>
    </div>
  );
}
