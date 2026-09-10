import React, { useState, useEffect, useMemo } from 'react';

/* ─── helpers ─────────────────────────────────────────────── */

function getSolarGeneration(availablePower) {
  const base = (availablePower || 40) * 0.6;
  const noise = Math.sin(Date.now() / 3000) * base * 0.12;
  return Math.max(0, Math.round((base + noise) * 10) / 10);
}

/* ─── Sun ─────────────────────────────────────────────────── */

function Sun({ cx, cy }) {
  return (
    <g className="animate-sun-pulse" style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <circle cx={cx} cy={cy} r={72} fill="#fbbf24" opacity={0.06} />
      <circle cx={cx} cy={cy} r={62} fill="#fbbf24" opacity={0.12} />
      {[...Array(12)].map((_, i) => {
        const a = (i * 30) * Math.PI / 180;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * 52} y1={cy + Math.sin(a) * 52}
            x2={cx + Math.cos(a) * (i % 2 === 0 ? 74 : 66)}
            y2={cy + Math.sin(a) * (i % 2 === 0 ? 74 : 66)}
            stroke="#fbbf24" strokeWidth={i % 2 === 0 ? 3 : 2}
            strokeLinecap="round" opacity={i % 2 === 0 ? 0.85 : 0.45}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={44} fill="url(#sunGrad)" />
      <circle cx={cx - 12} cy={cy - 12} r={24} fill="#fef3c7" opacity={0.3} />
    </g>
  );
}

/* ─── Solar Panels ────────────────────────────────────────── */

function SolarPanel({ x, y }) {
  const w = 150, h = 95, cols = 4, rows = 3;
  const cw = w / cols, ch = h / rows;
  return (
    <g transform={`translate(${x},${y}) skewY(-8)`}>
      <rect x={0} y={0} width={w} height={h} rx={3}
            fill="#0c1929" stroke="#1e40af" strokeWidth={1.5} />
      {[...Array(rows)].map((_, r) =>
        [...Array(cols)].map((_, c) => (
          <rect key={`${r}${c}`}
                x={c * cw + 2} y={r * ch + 2}
                width={cw - 4} height={ch - 4}
                fill="#1e3a5f" stroke="#2563eb" strokeWidth={0.5} rx={1} />
        ))
      )}
      <rect x={2} y={2} width={w * 0.35} height={h * 0.25}
            fill="white" opacity={0.03} rx={2} />
    </g>
  );
}

/* ─── Battery Icon ────────────────────────────────────────── */

function BatteryUnit({ x, y, soc, mode, fault, id }) {
  const W = 44, H = 62;
  const fillH = Math.max(0, (soc || 0) * (H - 8));
  const fillY = y + H - 4 - fillH;
  const color = fault ? '#ef4444' : soc < 0.2 ? '#ef4444' : soc < 0.5 ? '#f59e0b' : '#10b981';
  const active = mode === 'charging' || mode === 'discharging';

  return (
    <g>
      {active && (
        <rect x={x - 3} y={y - 8} width={W + 6} height={H + 14} rx={7}
              fill={color} opacity={0.06} className="animate-battery-glow" />
      )}
      <rect x={x + 13} y={y - 5} width={18} height={6} rx={2} fill="#475569" />
      <rect x={x} y={y} width={W} height={H} rx={5}
            fill="none" stroke={fault ? '#ef4444' : '#475569'} strokeWidth={1.5} />
      <rect x={x + 3} y={fillY} width={W - 6} height={fillH} rx={3}
            fill={color} opacity={0.7} />
      <text x={x + W / 2} y={y + H / 2 + 4} textAnchor="middle"
            fill="white" fontSize="10" fontFamily="ui-monospace, monospace" fontWeight="bold">
        {Math.round((soc || 0) * 100)}%
      </text>
      <text x={x + W / 2} y={y + H + 14} textAnchor="middle"
            fill="#64748b" fontSize="8" fontFamily="ui-monospace, monospace">
        {(id || '').replace('BAT-', '')}
      </text>
      {fault && (
        <text x={x + W / 2} y={y - 10} textAnchor="middle" fill="#ef4444" fontSize="14">⚠</text>
      )}
      {active && (
        <text x={x + W / 2} y={y + H + 26} textAnchor="middle"
              fill={mode === 'charging' ? '#10b981' : '#f59e0b'} fontSize="7"
              fontFamily="ui-monospace, monospace" fontWeight="bold">
          {mode === 'charging' ? '▼ CHG' : '▲ DIS'}
        </text>
      )}
    </g>
  );
}

/* ─── Grid Tower ──────────────────────────────────────────── */

function GridTower({ x, y }) {
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 175} stroke="#64748b" strokeWidth={3} />
      <line x1={x - 35} y1={y + 18} x2={x + 35} y2={y + 18} stroke="#64748b" strokeWidth={2.5} />
      <line x1={x - 25} y1={y + 52} x2={x + 25} y2={y + 52} stroke="#64748b" strokeWidth={2} />
      <circle cx={x - 35} cy={y + 18} r={3} fill="#94a3b8" />
      <circle cx={x + 35} cy={y + 18} r={3} fill="#94a3b8" />
      <circle cx={x - 25} cy={y + 52} r={3} fill="#94a3b8" />
      <circle cx={x + 25} cy={y + 52} r={3} fill="#94a3b8" />
      <path d={`M ${x - 35} ${y + 18} Q ${x - 35} ${y + 38} ${x - 28} ${y + 42}`}
            fill="none" stroke="#475569" strokeWidth={1} />
      <path d={`M ${x + 35} ${y + 18} Q ${x + 35} ${y + 38} ${x + 28} ${y + 42}`}
            fill="none" stroke="#475569" strokeWidth={1} />
      <line x1={x - 20} y1={y + 175} x2={x} y2={y + 125} stroke="#64748b" strokeWidth={2} />
      <line x1={x + 20} y1={y + 175} x2={x} y2={y + 125} stroke="#64748b" strokeWidth={2} />
      <line x1={x - 10} y1={y + 150} x2={x + 10} y2={y + 150} stroke="#64748b" strokeWidth={1.5} />
      <line x1={x - 28} y1={y + 177} x2={x + 28} y2={y + 177} stroke="#334155" strokeWidth={1} />
    </g>
  );
}

/* ─── Flow Path (animated energy particles) ───────────────── */

function FlowPath({ d, active, direction, color, label, labelX, labelY }) {
  if (!active) {
    return <path d={d} fill="none" stroke="#1e293b" strokeWidth={2} strokeDasharray="6 6" />;
  }
  const animClass = direction === 'right' ? 'animate-flow-right' : 'animate-flow-left';
  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={3} opacity={0.12} />
      <path d={d} fill="none" stroke={color} strokeWidth={2.5}
            strokeDasharray="8 12" className={animClass} opacity={0.8} />
      <path d={d} fill="none" stroke={color} strokeWidth={6} opacity={0.04}
            filter="url(#glow)" />
      {label && (
        <g>
          <rect x={labelX - 32} y={labelY - 11} width={64} height={22}
                rx={5} fill="#0f172a" stroke={color} strokeWidth={0.6} opacity={0.92} />
          <text x={labelX} y={labelY + 4} textAnchor="middle"
                fill={color} fontSize="10" fontFamily="ui-monospace, monospace" fontWeight="bold">
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

/* ─── Main Component ──────────────────────────────────────── */

export function EnergyFlowVisualization({ batteries, gridState, poolAggregate }) {
  const [solarGen, setSolarGen] = useState(0);

  useEffect(() => {
    const tick = () => setSolarGen(getSolarGeneration(poolAggregate.availablePower));
    tick();
    const id = setInterval(tick, 2000);
    return () => clearInterval(id);
  }, [poolAggregate.availablePower]);

  const netPower   = poolAggregate.netPower || 0;
  const isDis      = netPower > 0.01;
  const isChg      = netPower < -0.01;
  const socPct     = Math.round((poolAggregate.weightedSoc || 0) * 100);

  const displayBats = batteries.length > 0
    ? batteries.slice(0, 8)
    : Array.from({ length: 8 }, (_, i) => ({
        id: `BAT-${String(i + 1).padStart(3, '0')}`, soc: 0.5, mode: 'idle', fault: false,
      }));

  const freqColor = Math.abs(gridState.deviation || 0) > 0.05
    ? '#ef4444'
    : Math.abs(gridState.deviation || 0) > 0.015
      ? '#f59e0b' : '#10b981';

  const gridFlowColor = isDis ? '#ef4444' : '#10b981';

  return (
    <div className="glass-panel p-5 rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <span>⚡ Energy Flow Visualization</span>
            <span className="text-xs font-normal text-slate-400">(Real-time simulation model)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Animated energy flow — Solar Source → Virtual Battery Pool → Power Grid
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className={`px-2 py-1 rounded-md font-mono font-bold ${
            solarGen > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'
          }`}>☀️ {solarGen.toFixed(1)} kW</span>
          <span className={`px-2 py-1 rounded-md font-mono font-bold ${
            isDis ? 'bg-rose-500/20 text-rose-400'
              : isChg ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-800 text-slate-400'
          }`}>🔋 {netPower > 0 ? '+' : ''}{netPower.toFixed(2)} kW</span>
        </div>
      </div>

      {/* SVG Visualization */}
      <div className="bg-[#060a12] rounded-xl border border-grid-border overflow-hidden">
        <svg viewBox="0 0 1100 440" className="w-full h-auto" style={{ minHeight: '320px' }}>
          <defs>
            <radialGradient id="sunGrad" cx="40%" cy="40%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* background grid */}
          <pattern id="bgg" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.25" />
          </pattern>
          <rect width="1100" height="440" fill="url(#bgg)" opacity={0.35} />

          {/* ── section labels ── */}
          <text x={110} y={28} textAnchor="middle" fill="#64748b" fontSize="10"
                fontWeight="bold" letterSpacing="2" fontFamily="ui-monospace, monospace">
            SOLAR SOURCE
          </text>
          <text x={550} y={28} textAnchor="middle" fill="#64748b" fontSize="10"
                fontWeight="bold" letterSpacing="2" fontFamily="ui-monospace, monospace">
            VIRTUAL BATTERY POOL
          </text>
          <text x={960} y={28} textAnchor="middle" fill="#64748b" fontSize="10"
                fontWeight="bold" letterSpacing="2" fontFamily="ui-monospace, monospace">
            POWER GRID
          </text>

          {/* ════════ SUN ════════ */}
          <Sun cx={100} cy={140} />

          {/* ════════ SOLAR PANELS ════════ */}
          <SolarPanel x={35} y={260} />

          {/* solar gen label */}
          <rect x={55} y={370} width={100} height={26} rx={6}
                fill="#0f172a" stroke="#f59e0b" strokeWidth={0.6} opacity={0.9} />
          <text x={105} y={387} textAnchor="middle" fill="#fbbf24"
                fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="bold">
            ☀ {solarGen.toFixed(1)} kW
          </text>

          {/* ════════ FLOW: Solar → Pool ════════ */}
          <FlowPath
            d="M 195 300 C 270 300, 300 220, 385 220"
            active={solarGen > 0}
            direction="right"
            color="#f59e0b"
            label={solarGen > 0 ? `${solarGen.toFixed(1)} kW` : null}
            labelX={290} labelY={248}
          />

          {/* ════════ BATTERY POOL ════════ */}
          <rect x={385} y={42} width={330} height={370} rx={12}
                fill="#080e1a" stroke="#1e293b" strokeWidth={1.5} />

          {/* pool SoC header */}
          <text x={550} y={62} textAnchor="middle" fill="#94a3b8"
                fontSize="10" fontFamily="ui-monospace, monospace">
            Pool SoC: {socPct}%  •  {poolAggregate.count || 0} Units
          </text>
          <rect x={405} y={70} width={290} height={8} rx={4} fill="#1e293b" />
          <rect x={405} y={70}
                width={Math.max(0, 290 * (poolAggregate.weightedSoc || 0))}
                height={8} rx={4}
                fill={socPct < 20 ? '#ef4444' : socPct < 50 ? '#f59e0b' : '#10b981'} opacity={0.8} />

          {/* battery grid (4 cols × 2 rows) */}
          {displayBats.map((b, i) => (
            <BatteryUnit
              key={b.id}
              x={410 + (i % 4) * 72}
              y={95 + Math.floor(i / 4) * 140}
              soc={b.soc} mode={b.mode} fault={b.fault} id={b.id}
            />
          ))}

          {/* net power label */}
          <rect x={485} y={380} width={130} height={26} rx={6}
                fill="#0f172a"
                stroke={isDis ? '#ef4444' : isChg ? '#10b981' : '#475569'}
                strokeWidth={0.6} opacity={0.9} />
          <text x={550} y={397} textAnchor="middle"
                fill={isDis ? '#ef4444' : isChg ? '#10b981' : '#94a3b8'}
                fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="bold">
            NET {netPower > 0 ? '+' : ''}{netPower.toFixed(2)} kW
          </text>

          {/* ════════ FLOW: Pool ↔ Grid ════════ */}
          <FlowPath
            d="M 715 220 C 790 220, 830 220, 870 220"
            active={isDis || isChg}
            direction={isDis ? 'right' : 'left'}
            color={gridFlowColor}
            label={`${Math.abs(netPower).toFixed(1)} kW`}
            labelX={793} labelY={248}
          />

          {/* direction arrow */}
          {(isDis || isChg) && (
            <text x={793} y={210} textAnchor="middle" fill={gridFlowColor}
                  fontSize="16" fontFamily="ui-monospace, monospace">
              {isDis ? '→' : '←'}
            </text>
          )}

          {/* ════════ GRID TOWER ════════ */}
          <GridTower x={960} y={60} />

          {/* frequency readout */}
          <rect x={910} y={260} width={100} height={52} rx={8}
                fill="#0f172a" stroke={freqColor} strokeWidth={1} opacity={0.9} />
          <text x={960} y={283} textAnchor="middle" fill={freqColor}
                fontSize="16" fontFamily="ui-monospace, monospace" fontWeight="bold">
            {(gridState.frequency || 50).toFixed(3)}
          </text>
          <text x={960} y={301} textAnchor="middle" fill="#64748b"
                fontSize="10" fontFamily="ui-monospace, monospace">Hz</text>

          {/* deviation */}
          <rect x={918} y={322} width={84} height={22} rx={4}
                fill={freqColor} opacity={0.1} />
          <text x={960} y={337} textAnchor="middle" fill={freqColor}
                fontSize="10" fontFamily="ui-monospace, monospace" fontWeight="bold">
            Δ {(gridState.deviation || 0) >= 0 ? '+' : ''}{(gridState.deviation || 0).toFixed(3)}
          </text>

          {/* grid status */}
          <circle cx={935} cy={362} r={3.5}
                  fill={Math.abs(gridState.deviation || 0) <= 0.015 ? '#10b981' : '#f59e0b'} />
          <text x={960} y={366} textAnchor="middle" fill="#64748b"
                fontSize="9" fontFamily="ui-monospace, monospace">
            {Math.abs(gridState.deviation || 0) <= 0.015 ? 'STABLE' : 'RESPONDING'}
          </text>
        </svg>
      </div>
    </div>
  );
}
