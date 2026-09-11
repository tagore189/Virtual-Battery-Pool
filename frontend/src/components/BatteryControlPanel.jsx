import React, { useState } from 'react';

export function BatteryControlPanel({
  batteries = [],
  onDispatch,
  selectedBatteryId,
  onSelectBattery,
  isConnected,
}) {
  const [targetPower, setTargetPower] = useState(3.0);

  // Fallback battery list if none connected yet
  const displayBatteries = batteries.length > 0
    ? batteries
    : Array.from({ length: 8 }, (_, i) => ({
        id: `BAT-${String(i + 1).padStart(3, '0')}`,
        soc: 0.5,
        voltage: 48.0,
        current: 0.0,
        power: 0.0,
        temperature: 25.0,
        health: 0.98,
        mode: 'idle',
        fault: false,
      }));

  const activeId = selectedBatteryId || displayBatteries[0]?.id || 'BAT-001';
  const selectedBattery = displayBatteries.find(b => b.id === activeId) || displayBatteries[0];

  const soc = Math.round((selectedBattery?.soc || 0) * 100);
  const isFault = selectedBattery?.fault || selectedBattery?.mode === 'fault';
  const isDischarging = (selectedBattery?.power || 0) > 0.01;
  const isCharging = (selectedBattery?.power || 0) < -0.01;

  const handleAction = (action) => {
    if (!onDispatch || isFault) return;
    const p = action === 'idle' ? 0 : Number(targetPower) || 0;
    onDispatch(selectedBattery.id, action, p);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-grid-border flex flex-col justify-between">
      <div>
        {/* Header & Battery Selector */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🔋</span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">Manual Battery Control</h3>
              <p className="text-[11px] text-slate-400">Direct unit telemetry & manual dispatch</p>
            </div>
          </div>

          <div className="relative">
            <select
              value={activeId}
              onChange={(e) => onSelectBattery && onSelectBattery(e.target.value)}
              className="bg-slate-900 border border-slate-700 hover:border-slate-500 text-white rounded-lg px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-sky-500 transition cursor-pointer pr-8"
            >
              {displayBatteries.map(b => (
                <option key={b.id} value={b.id}>
                  {b.id} ({Math.round((b.soc || 0) * 100)}% - {b.mode.toUpperCase()})
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-2 pointer-events-none text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        {/* 8-Battery Status Strip */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-4">
          {displayBatteries.map(b => {
            const isSel = b.id === activeId;
            const bFault = b.fault || b.mode === 'fault';
            const bDis = (b.power || 0) > 0.01;
            const bChg = (b.power || 0) < -0.01;
            const bSoc = Math.round((b.soc || 0) * 100);

            return (
              <button
                key={b.id}
                onClick={() => onSelectBattery && onSelectBattery(b.id)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  isSel
                    ? 'border-sky-500 bg-sky-500/10 shadow-sm shadow-sky-500/20'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span className={isSel ? 'text-sky-400' : 'text-slate-300'}>
                    {b.id.replace('BAT-', '')}
                  </span>
                  {bFault && <span className="text-rose-400 font-normal">⚠</span>}
                </div>
                <div className="text-[11px] font-mono font-bold text-white mt-0.5">
                  {bSoc}%
                </div>
                <div className={`text-[9px] font-mono font-medium truncate ${
                  bFault ? 'text-rose-400' : bDis ? 'text-amber-400' : bChg ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  {bFault ? 'FAULT' : b.power > 0 ? `+${b.power.toFixed(1)}k` : `${(b.power || 0).toFixed(1)}k`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Battery Detailed Telemetry */}
        <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 mb-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-sm text-white">{selectedBattery.id}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                isFault ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                isDischarging ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                isCharging ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                'bg-slate-800 text-slate-400'
              }`}>
                {selectedBattery.mode}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              SoH: <span className="text-slate-200 font-bold">{Math.round((selectedBattery.health || 1) * 100)}%</span>
            </div>
          </div>

          {/* SoC Bar */}
          <div className="mt-2.5">
            <div className="flex justify-between text-[11px] mb-1 font-mono">
              <span className="text-slate-400">State of Charge (SOC)</span>
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

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 mt-3 text-center">
            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500 font-mono">POWER</div>
              <div className={`text-xs font-mono font-bold mt-0.5 ${
                isDischarging ? 'text-amber-400' : isCharging ? 'text-emerald-400' : 'text-slate-200'
              }`}>
                {selectedBattery.power > 0 ? `+${selectedBattery.power.toFixed(2)}` : (selectedBattery.power || 0).toFixed(2)} kW
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500 font-mono">VOLTAGE</div>
              <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                {(selectedBattery.voltage || 48).toFixed(1)} V
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500 font-mono">CURRENT</div>
              <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                {(selectedBattery.current || 0).toFixed(1)} A
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500 font-mono">TEMP</div>
              <div className={`text-xs font-mono font-bold mt-0.5 ${
                (selectedBattery.temperature || 25) > 45 ? 'text-rose-400' : 'text-slate-200'
              }`}>
                {(selectedBattery.temperature || 25).toFixed(1)}°C
              </div>
            </div>
          </div>

          {/* Fault warning if present */}
          {isFault && (
            <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
              <span>⚠️</span>
              <span>Unit in FAULT state — manual dispatch locked until reset.</span>
            </div>
          )}
        </div>

        {/* Dispatch Controls */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 font-medium">Target Power</span>
              <span className="text-sky-400 font-mono font-bold">{targetPower} kW</span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                disabled={!isConnected || isFault}
                value={targetPower}
                onChange={(e) => setTargetPower(Number(e.target.value))}
                className="flex-1 accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none disabled:opacity-50"
              />
              <input
                type="number"
                min="0.1"
                max="5.0"
                step="0.1"
                disabled={!isConnected || isFault}
                value={targetPower}
                onChange={(e) => setTargetPower(Math.max(0.1, Math.min(5.0, Number(e.target.value))))}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-right text-white focus:outline-none focus:border-sky-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              disabled={!isConnected || isFault}
              onClick={() => handleAction('charge')}
              className="py-2 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 font-semibold text-xs transition disabled:opacity-40"
            >
              ⚡ CHARGE
            </button>
            <button
              disabled={!isConnected || isFault}
              onClick={() => handleAction('discharge')}
              className="py-2 px-3 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/40 font-semibold text-xs transition disabled:opacity-40"
            >
              🔋 DISCHARGE
            </button>
            <button
              disabled={!isConnected || isFault}
              onClick={() => handleAction('idle')}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs transition disabled:opacity-40"
            >
              ⏸ IDLE
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between">
        <span>Active unit: {selectedBattery.id}</span>
        <span>Cmd: POST /api/dispatch</span>
      </div>
    </div>
  );
}
