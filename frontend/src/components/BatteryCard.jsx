import React from 'react';

export function BatteryCard({ battery, onDispatch }) {
  const soc = Math.round((battery.soc || 0) * 100);
  const isFault = battery.fault || battery.mode === 'fault';
  const isDischarging = battery.power > 0.01;
  const isCharging = battery.power < -0.01;

  return (
    <div className={`glass-panel p-4 rounded-xl border transition-all ${
      isFault ? 'border-rose-500/50 bg-rose-950/10' : 'border-grid-border hover:border-slate-700'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-mono font-bold text-white text-sm">{battery.id}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase ${
            isFault ? 'bg-rose-500/20 text-rose-400' :
            isDischarging ? 'bg-amber-500/20 text-amber-400' :
            isCharging ? 'bg-emerald-500/20 text-emerald-400' :
            'bg-slate-800 text-slate-400'
          }`}>
            {battery.mode}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          SoH {(battery.health * 100).toFixed(0)}%
        </div>
      </div>

      {/* SoC bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1 font-mono">
          <span className="text-slate-400">SoC</span>
          <span className="text-white font-bold">{soc}%</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              soc < 20 ? 'bg-rose-500' : soc < 50 ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${soc}%` }}
          />
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-3 gap-2 mt-4 text-[11px] font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
        <div>
          <div className="text-slate-500">POWER</div>
          <div className={`font-bold ${isDischarging ? 'text-rose-400' : isCharging ? 'text-emerald-400' : 'text-slate-300'}`}>
            {battery.power > 0 ? `+${battery.power.toFixed(2)}` : battery.power.toFixed(2)} kW
          </div>
        </div>
        <div>
          <div className="text-slate-500">VOLTAGE</div>
          <div className="text-slate-200">{battery.voltage.toFixed(1)} V</div>
        </div>
        <div>
          <div className="text-slate-500">TEMP</div>
          <div className={`text-slate-200 ${battery.temperature > 45 ? 'text-rose-400 font-bold' : ''}`}>
            {battery.temperature.toFixed(1)}°C
          </div>
        </div>
      </div>

      {/* Manual Control Buttons */}
      <div className="flex space-x-2 mt-3 text-[11px]">
        <button
          disabled={isFault}
          onClick={() => onDispatch(battery.id, 'charge', 3.0)}
          className="flex-1 py-1 px-2 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 disabled:opacity-30 transition"
        >
          Charge 3kW
        </button>
        <button
          disabled={isFault}
          onClick={() => onDispatch(battery.id, 'discharge', 3.0)}
          className="flex-1 py-1 px-2 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 disabled:opacity-30 transition"
        >
          Discharge 3kW
        </button>
        <button
          disabled={isFault}
          onClick={() => onDispatch(battery.id, 'idle', 0)}
          className="py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-30 transition"
        >
          Idle
        </button>
      </div>
    </div>
  );
}
