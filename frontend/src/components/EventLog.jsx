import React from 'react';

export function EventLog({ events }) {
  return (
    <div className="glass-panel p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white">System Events & Dispatch Logs</h2>
          <p className="text-xs text-slate-400 mt-0.5">Automated droop control dispatches and manual overrides</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Type</th>
              <th className="p-3">Grid Freq</th>
              <th className="p-3">Deviation</th>
              <th className="p-3">Total Response</th>
              <th className="p-3">Target Nodes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {events.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-slate-500 italic">
                  No dispatch events logged yet. Monitoring frequency deadband...
                </td>
              </tr>
            ) : (
              events.slice().reverse().map((ev, i) => (
                <tr key={i} className="hover:bg-slate-900/40">
                  <td className="p-3 text-slate-400">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      ev.type === 'manual_dispatch' ? 'bg-amber-500/20 text-amber-400' : 'bg-sky-500/20 text-sky-400'
                    }`}>
                      {ev.type || 'dispatch'}
                    </span>
                  </td>
                  <td className="p-3">{ev.frequency ? `${ev.frequency.toFixed(3)} Hz` : '-'}</td>
                  <td className={`p-3 ${ev.deviation > 0 ? 'text-amber-400' : ev.deviation < 0 ? 'text-rose-400' : ''}`}>
                    {ev.deviation ? `${ev.deviation > 0 ? '+' : ''}${ev.deviation.toFixed(3)} Hz` : '-'}
                  </td>
                  <td className="p-3 font-bold">
                    {ev.totalPower !== undefined ? `${ev.totalPower > 0 ? '+' : ''}${ev.totalPower.toFixed(2)} kW` : ev.power ? `${ev.power} kW` : '-'}
                  </td>
                  <td className="p-3 text-slate-400">{ev.batteryCount ? `${ev.batteryCount} Nodes` : ev.batteryId || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
