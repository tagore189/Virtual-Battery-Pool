import React from 'react';

export function Sidebar({ activeTab, setActiveTab, eventCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'visualization', label: 'Visualization', icon: '🔮' },
    { id: 'batteries', label: 'Battery Pool', icon: '🔋' },
    { id: 'analytics', label: 'Power Flow', icon: '📈' },
    { id: 'events', label: 'Event Log', icon: '📋' },
  ];

  return (
    <aside className="w-64 border-r border-grid-border bg-grid-dark flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-1">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === item.id
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span className="flex-1 text-left">{item.label}</span>
            {item.id === 'events' && eventCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                {eventCount > 99 ? '99+' : eventCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="glass-panel p-3 rounded-xl space-y-2">
        <div className="text-xs font-medium text-slate-300">Stabilization Logic</div>
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Nominal</span>
          <span className="text-slate-200 font-mono">50.00 Hz</span>
        </div>
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Deadband</span>
          <span className="text-slate-200 font-mono">±0.015 Hz</span>
        </div>
        <div className="flex justify-between text-[11px] text-slate-400">
          <span>Droop Gain</span>
          <span className="text-slate-200 font-mono">4.0 %</span>
        </div>
      </div>
    </aside>
  );
}
