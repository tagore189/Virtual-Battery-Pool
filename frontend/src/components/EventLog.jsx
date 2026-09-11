import React from 'react';

export function EventLog({ events = [], onRefresh }) {
  return (
    <div className="glass-panel p-5 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-bold text-white">System Events & Dispatch Logs</h2>
            <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-800 text-sky-400 border border-slate-700">
              {events.length} Events
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Automated droop control dispatches and manual overrides</p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <span>↻</span>
            <span>Refresh</span>
          </button>
        )}
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
              <th className="p-3">Target / Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {events.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-slate-500 italic">
                  No dispatch events logged yet. Monitoring frequency deadband...
                </td>
              </tr>
            ) : (
              events.slice().reverse().map((ev, i) => (
                <tr key={ev.timestamp ? `${ev.timestamp}-${i}` : i} className="hover:bg-slate-900/40">
                  <td className="p-3 text-slate-400 whitespace-nowrap">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                      ev.type === 'manual_dispatch'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : ev.type === 'scenario_change'
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        : ev.type === 'environment_command'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                    }`}>
                      {ev.type || 'dispatch'}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{ev.frequency ? `${Number(ev.frequency).toFixed(3)} Hz` : '-'}</td>
                  <td className={`p-3 font-mono ${ev.deviation > 0 ? 'text-amber-400' : ev.deviation < 0 ? 'text-rose-400' : ''}`}>
                    {ev.deviation !== undefined && ev.deviation !== null
                      ? `${ev.deviation > 0 ? '+' : ''}${Number(ev.deviation).toFixed(3)} Hz`
                      : '-'}
                  </td>
                  <td className="p-3 font-mono font-bold">
                    {ev.totalPower !== undefined
                      ? `${ev.totalPower > 0 ? '+' : ''}${Number(ev.totalPower).toFixed(2)} kW`
                      : ev.power !== undefined
                      ? `${Number(ev.power) > 0 ? '+' : ''}${Number(ev.power).toFixed(2)} kW`
                      : '-'}
                  </td>
                  <td className="p-3 text-slate-400">
                    {ev.batteryCount
                      ? `${ev.batteryCount} Nodes`
                      : ev.batteryId
                      ? `${ev.batteryId} (${ev.action || 'cmd'})`
                      : ev.scenario
                      ? `Scenario: ${ev.scenario}`
                      : ev.command
                      ? `Cmd: ${ev.command}`
                      : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
