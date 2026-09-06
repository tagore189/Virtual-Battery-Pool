import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

export function GridFrequencyChart({ data, currentFreq, deviation }) {
  const isHigh = deviation > 0.015;
  const isLow = deviation < -0.015;

  return (
    <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Grid Frequency Monitor</span>
            <span className="text-xs font-normal text-slate-400">(50 Hz Nominal)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time telemetry stream (1 Hz)</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className={`text-xl font-mono font-bold ${isHigh ? 'text-amber-400' : isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
              {currentFreq.toFixed(3)} Hz
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Δ {deviation >= 0 ? `+${deviation.toFixed(3)}` : deviation.toFixed(3)} Hz
            </div>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis domain={[49.7, 50.3]} stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#121824', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
            />
            <ReferenceLine y={50.0} stroke="#38bdf8" strokeDasharray="3 3" label={{ value: '50.0 Hz', fill: '#38bdf8', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine y={50.015} stroke="#f59e0b" strokeDasharray="2 2" />
            <ReferenceLine y={49.985} stroke="#f59e0b" strokeDasharray="2 2" />
            <Line
              type="monotone"
              dataKey="frequency"
              stroke="#10b981"
              strokeWidth={2}
              isAnimationActive={false}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
