import React, { useState, useEffect } from 'react';

export function Header({ isConnected, gridState, poolAggregate }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-grid-border bg-grid-card px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/50 flex items-center justify-center font-bold text-sky-400">
          ⚡
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wide text-white leading-none">GridPulse</h1>
          <p className="text-xs text-slate-400 mt-0.5">Virtual Battery Pool Grid Stabilizer</p>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-md bg-slate-900/80 border border-slate-800 flex items-center space-x-2">
            <span className="text-slate-400">GRID FREQ:</span>
            <span className={`font-bold ${Math.abs(gridState.deviation) > 0.05 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {gridState.frequency.toFixed(3)} Hz
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-md bg-slate-900/80 border border-slate-800 flex items-center space-x-2">
            <span className="text-slate-400">POOL NET:</span>
            <span className={`font-bold ${poolAggregate.netPower > 0 ? 'text-rose-400' : poolAggregate.netPower < 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {poolAggregate.netPower > 0 ? `+${poolAggregate.netPower.toFixed(2)}` : poolAggregate.netPower.toFixed(2)} kW
            </span>
          </div>

          <div className="text-slate-400">{time}</div>
        </div>

        <div className="flex items-center space-x-2 border-l border-slate-800 pl-4">
          <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-xs text-slate-300 font-medium">{isConnected ? 'LIVE (WS)' : 'DISCONNECTED'}</span>
        </div>
      </div>
    </header>
  );
}
