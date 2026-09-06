import React, { useState } from 'react';
import { BatteryCard } from './BatteryCard';

export function BatteryGrid({ batteries, onDispatch }) {
  const [filter, setFilter] = useState('all');

  const filtered = batteries.filter(b => {
    if (filter === 'discharging') return b.mode === 'discharging';
    if (filter === 'charging') return b.mode === 'charging';
    if (filter === 'idle') return b.mode === 'idle';
    if (filter === 'fault') return b.fault || b.mode === 'fault';
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-white">Distributed Battery Pool ({batteries.length} Assets)</h2>
        <div className="flex space-x-1.5 text-xs bg-slate-900/80 p-1 rounded-lg border border-slate-800">
          {['all', 'discharging', 'charging', 'idle', 'fault'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md capitalize transition font-medium ${
                filter === f ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filtered.map(b => (
          <BatteryCard key={b.id} battery={b} onDispatch={onDispatch} />
        ))}
      </div>
    </div>
  );
}
