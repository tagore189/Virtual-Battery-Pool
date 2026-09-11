import React, { useMemo } from 'react';

/* ─── Sun Graphic ─────────────────────────────────────────── */
function Sun({ cx, cy, isDay = true, irradiance = 900 }) {
  if (!isDay || irradiance <= 5) {
    return (
      <g style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={28} fill="#334155" opacity={0.6} />
        <circle cx={cx + 7} cy={cy - 6} r={22} fill="#060a12" />
        <text x={cx} y={cy + 42} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="ui-monospace, monospace">
          NIGHT
        </text>
      </g>
    );
  }

  const intensity = Math.min(1, Math.max(0.2, irradiance / 1000));

  return (
    <g className="animate-sun-pulse" style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <circle cx={cx} cy={cy} r={55 * intensity + 15} fill="#fbbf24" opacity={0.06 * intensity} />
      <circle cx={cx} cy={cy} r={45 * intensity + 10} fill="#fbbf24" opacity={0.12 * intensity} />
      {[...Array(12)].map((_, i) => {
        const a = (i * 30) * Math.PI / 180;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * 36}
            y1={cy + Math.sin(a) * 36}
            x2={cx + Math.cos(a) * (i % 2 === 0 ? 54 : 46)}
            y2={cy + Math.sin(a) * (i % 2 === 0 ? 54 : 46)}
            stroke="#fbbf24"
            strokeWidth={i % 2 === 0 ? 2.5 : 1.5}
            strokeLinecap="round"
            opacity={i % 2 === 0 ? 0.85 : 0.45}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={32} fill="url(#sunGrad)" />
      <circle cx={cx - 8} cy={cy - 8} r={16} fill="#fef3c7" opacity={0.3} />
    </g>
  );
}

/* ─── Solar Panel Array ───────────────────────────────────── */
function SolarPanelArray({ x, y, generation = 0 }) {
  const w = 110, h = 65, cols = 4, rows = 3;
  const cw = w / cols, ch = h / rows;
  const active = generation > 0.05;

  return (
    <g transform={`translate(${x},${y}) skewY(-6)`}>
      <rect
        x={0}
        y={0}
        width={w}
        height={h}
        rx={3}
        fill="#0a1526"
        stroke={active ? '#2563eb' : '#334155'}
        strokeWidth={1.5}
      />
      {[...Array(rows)].map((_, r) =>
        [...Array(cols)].map((_, c) => (
          <rect
            key={`${r}${c}`}
            x={c * cw + 2}
            y={r * ch + 2}
            width={cw - 4}
            height={ch - 4}
            fill={active ? '#173059' : '#0f172a'}
            stroke={active ? '#3b82f6' : '#1e293b'}
            strokeWidth={0.5}
            rx={1}
          />
        ))
      )}
      {active && (
        <rect x={2} y={2} width={w * 0.35} height={h * 0.25} fill="#93c5fd" opacity={0.08} rx={2} />
      )}
    </g>
  );
}

/* ─── Wind Turbine Graphic ────────────────────────────────── */
function WindTurbine({ x, y, speed = 0, generation = 0 }) {
  const active = generation > 0.05;
  const rotorSpeedSec = speed > 3 ? Math.max(0.8, 4.0 - (speed / 30) * 3.0) : 0;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Mast */}
      <line x1={0} y1={70} x2={-4} y2={130} stroke="#64748b" strokeWidth={2.5} />
      <line x1={0} y1={70} x2={4} y2={130} stroke="#64748b" strokeWidth={2.5} />
      <line x1={-6} y1={130} x2={6} y2={130} stroke="#475569" strokeWidth={3} />
      {/* Nacelle */}
      <rect x={-8} y={64} width={16} height={12} rx={3} fill="#94a3b8" />
      <circle cx={0} cy={70} r={4} fill="#f1f5f9" />
      {/* Blades with rotation if active */}
      <g>
        {active && rotorSpeedSec > 0 && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 70"
            to="360 0 70"
            dur={`${rotorSpeedSec}s`}
            repeatCount="indefinite"
          />
        )}
        {[0, 120, 240].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x2 = Math.sin(rad) * 44;
          const y2 = 70 - Math.cos(rad) * 44;
          return (
            <line
              key={i}
              x1={0}
              y1={70}
              x2={x2}
              y2={y2}
              stroke={active ? '#38bdf8' : '#64748b'}
              strokeWidth={3}
              strokeLinecap="round"
            />
          );
        })}
      </g>
    </g>
  );
}

/* ─── Grid Transmission Tower ─────────────────────────────── */
function GridTower({ x, y }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <line x1={0} y1={0} x2={0} y2={130} stroke="#64748b" strokeWidth={2.5} />
      <line x1={-30} y1={18} x2={30} y2={18} stroke="#64748b" strokeWidth={2} />
      <line x1={-22} y1={45} x2={22} y2={45} stroke="#64748b" strokeWidth={1.8} />
      <circle cx={-30} cy={18} r={3} fill="#94a3b8" />
      <circle cx={30} cy={18} r={3} fill="#94a3b8" />
      <circle cx={-22} cy={45} r={3} fill="#94a3b8" />
      <circle cx={22} cy={45} r={3} fill="#94a3b8" />
      {/* Diagonal supports */}
      <line x1={-18} y1={130} x2={0} y2={85} stroke="#475569" strokeWidth={1.5} />
      <line x1={18} y1={130} x2={0} y2={85} stroke="#475569" strokeWidth={1.5} />
      <line x1={-24} y1={132} x2={24} y2={132} stroke="#334155" strokeWidth={2} />
    </g>
  );
}

/* ─── Factory / Load Graphic ──────────────────────────────── */
function LoadGraphic({ x, y, load = 0 }) {
  const active = load > 0.1;
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Factory buildings */}
      <rect x={-45} y={40} width={40} height={60} fill="#1e293b" stroke="#334155" strokeWidth={1.5} rx={2} />
      <rect x={-5} y={20} width={50} height={80} fill="#0f172a" stroke="#334155" strokeWidth={1.5} rx={2} />
      {/* Sawtooth roof */}
      <path d="M -45 40 L -25 25 L -25 40 L -5 25 L -5 40" fill="none" stroke="#475569" strokeWidth={1.5} />
      {/* Windows */}
      {active && (
        <>
          <rect x={5} y={35} width={8} height={10} fill="#fbbf24" opacity={0.7} />
          <rect x={20} y={35} width={8} height={10} fill="#fbbf24" opacity={0.7} />
          <rect x={5} y={55} width={8} height={10} fill="#fbbf24" opacity={0.5} />
          <rect x={20} y={55} width={8} height={10} fill="#fbbf24" opacity={0.7} />
          <rect x={-35} y={55} width={8} height={8} fill="#fbbf24" opacity={0.6} />
        </>
      )}
      {/* Chimney / Smoke */}
      <rect x={30} y={5} width={8} height={15} fill="#475569" />
      {active && (
        <circle cx={34} cy={-2} r={3} fill="#64748b" opacity={0.4} className="animate-pulse" />
      )}
    </g>
  );
}

/* ─── Battery Unit Graphic ────────────────────────────────── */
function BatteryUnit({ x, y, soc, mode, fault, id, isSelected, onClick }) {
  const W = 36, H = 52;
  const fillH = Math.max(0, (soc || 0) * (H - 8));
  const fillY = y + H - 4 - fillH;
  const color = fault ? '#ef4444' : soc < 0.2 ? '#ef4444' : soc < 0.5 ? '#f59e0b' : '#10b981';
  const active = mode === 'charging' || mode === 'discharging';

  return (
    <g onClick={onClick} className="cursor-pointer transition-transform hover:scale-105">
      {isSelected && (
        <rect x={x - 4} y={y - 7} width={W + 8} height={H + 14} rx={6}
              fill="none" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="3 3" />
      )}
      {active && (
        <rect x={x - 2} y={y - 5} width={W + 4} height={H + 10} rx={5}
              fill={color} opacity={0.08} className="animate-battery-glow" />
      )}
      {/* Terminal */}
      <rect x={x + 11} y={y - 4} width={14} height={4} rx={1.5} fill="#64748b" />
      {/* Body */}
      <rect x={x} y={y} width={W} height={H} rx={4}
            fill="#090e17" stroke={fault ? '#ef4444' : isSelected ? '#38bdf8' : '#334155'} strokeWidth={1.5} />
      {/* Fill Level */}
      <rect x={x + 2.5} y={fillY} width={W - 5} height={fillH} rx={2} fill={color} opacity={0.75} />
      {/* SoC Text */}
      <text x={x + W / 2} y={y + H / 2 + 3} textAnchor="middle"
            fill="white" fontSize="9" fontFamily="ui-monospace, monospace" fontWeight="bold">
        {Math.round((soc || 0) * 100)}%
      </text>
      {/* Battery ID */}
      <text x={x + W / 2} y={y + H + 11} textAnchor="middle"
            fill="#94a3b8" fontSize="8" fontFamily="ui-monospace, monospace">
        {(id || '').replace('BAT-', '')}
      </text>
      {/* Fault indicator */}
      {fault && (
        <text x={x + W / 2} y={y - 7} textAnchor="middle" fill="#ef4444" fontSize="12" fontWeight="bold">⚠</text>
      )}
    </g>
  );
}

/* ─── Animated Flow Path (SVG native dash animation) ──────── */
function FlowPath({ d, active, direction = 'forward', color = '#38bdf8', label, labelX, labelY, powerKw = 0 }) {
  if (!active) {
    return <path d={d} fill="none" stroke="#1e293b" strokeWidth={2} strokeDasharray="5 5" opacity={0.5} />;
  }

  // Speed inversely proportional to power (more kW = faster particle movement)
  const animDur = Math.max(0.6, Math.min(2.5, 3.5 - Math.min(powerKw, 40) * 0.07));
  const animFrom = direction === 'forward' ? 24 : 0;
  const animTo = direction === 'forward' ? 0 : 24;

  return (
    <g>
      {/* Glow path */}
      <path d={d} fill="none" stroke={color} strokeWidth={5} opacity={0.15} filter="url(#glow)" />
      {/* Solid background line */}
      <path d={d} fill="none" stroke={color} strokeWidth={2.5} opacity={0.3} />
      {/* Animated dash line */}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray="8 12"
        opacity={0.9}
      >
        <animate
          attributeName="stroke-dashoffset"
          from={animFrom}
          to={animTo}
          dur={`${animDur}s`}
          repeatCount="indefinite"
        />
      </path>
      {/* Power Badge */}
      {label && (
        <g>
          <rect
            x={labelX - 35}
            y={labelY - 11}
            width={70}
            height={22}
            rx={5}
            fill="#060a12"
            stroke={color}
            strokeWidth={0.8}
            opacity={0.95}
          />
          <text
            x={labelX}
            y={labelY + 4}
            textAnchor="middle"
            fill={color}
            fontSize="10"
            fontFamily="ui-monospace, monospace"
            fontWeight="bold"
          >
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

/* ─── Main EnergyFlowVisualization Component ─────────────── */
export function EnergyFlowVisualization({
  batteries = [],
  gridState = {},
  poolAggregate = {},
  environment = {},
  isConnected = false,
  selectedBatteryId,
  onSelectBattery,
}) {
  // Real values extracted directly from simulator telemetry
  const solarGen = Number(environment.solarGeneration ?? 0);
  const windGen = Number(environment.windGeneration ?? 0);
  const totalRenewable = Number(environment.totalRenewable ?? (solarGen + windGen));
  const load = Number(environment.load ?? 25.0);
  const powerImbalance = Number(environment.powerImbalance ?? (gridState.powerImbalance ?? 0));
  const frequency = Number(gridState.frequency ?? 50.0);
  const deviation = Number(gridState.deviation ?? (frequency - 50.0));
  const netPower = Number(poolAggregate.netPower ?? 0);

  // Sign conventions from Phase 1:
  // Battery power > 0 = discharging (injecting into grid)
  // Battery power < 0 = charging (absorbing from grid)
  // Power imbalance > 0 = surplus
  // Power imbalance < 0 = deficit
  const isDischarging = netPower > 0.05;
  const isCharging = netPower < -0.05;
  const hasRenewables = totalRenewable > 0.05;
  const hasLoad = load > 0.05;
  const isSurplus = powerImbalance > 0.01;
  const isDeficit = powerImbalance < -0.01;

  const isStable = Math.abs(deviation) <= 0.015;
  const freqColor = Math.abs(deviation) > 0.05 ? '#ef4444' : Math.abs(deviation) > 0.015 ? '#f59e0b' : '#10b981';
  const imbalanceColor = isSurplus ? '#10b981' : isDeficit ? '#ef4444' : '#94a3b8';
  const battFlowColor = isDischarging ? '#f59e0b' : isCharging ? '#10b981' : '#64748b';

  const socPct = Math.round((poolAggregate.weightedSoc ?? 0.5) * 100);

  const displayBatteries = batteries.length > 0
    ? batteries.slice(0, 8)
    : Array.from({ length: 8 }, (_, i) => ({
        id: `BAT-${String(i + 1).padStart(3, '0')}`,
        soc: 0.5,
        mode: 'idle',
        fault: false,
      }));

  return (
    <div className="glass-panel p-5 rounded-2xl border border-grid-border">
      {/* ─── Top Header: System Visualization Title & Connection ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚡</span>
            <h2 className="text-base font-bold text-white tracking-wide uppercase">
              Energy System Visualization
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
              2D MICROGRID TWIN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time power dispatch: Renewables → Virtual Battery Pool ↔ Grid → Load
          </p>
        </div>

        {/* Live Simulator Status Badge */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="font-mono text-slate-300">
              {isConnected ? 'SIMULATOR TELEMETRY' : 'SIMULATOR OFFLINE'}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-700">
            <span className="text-slate-400">SCENARIO:</span>
            <span className="font-mono font-bold text-sky-400 uppercase">
              {environment.activeScenario || 'NORMAL'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Top Telemetry Strip: Weather & Scenario + Live Grid Status ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Weather / Scenario Card */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Weather & Environmental State
            </span>
            <span className="text-xs font-mono font-bold text-white uppercase flex items-center space-x-1">
              <span>{environment.weather === 'storm' ? '⛈️' : environment.weather === 'night' ? '🌙' : environment.weather === 'cloudy' ? '⛅' : '☀️'}</span>
              <span>{environment.weather || 'CLEAR'}</span>
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500">CLOUD</div>
              <div className="font-bold text-sky-300 mt-0.5">{Math.round(environment.cloudCover ?? 10)}%</div>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500">IRRADIANCE</div>
              <div className="font-bold text-amber-400 mt-0.5">{Math.round(environment.solarIrradiance ?? 900)} W/m²</div>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500">WIND</div>
              <div className="font-bold text-teal-400 mt-0.5">{(environment.windSpeed ?? 6).toFixed(1)} m/s</div>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500">TEMP</div>
              <div className="font-bold text-rose-400 mt-0.5">{(environment.temperature ?? 28).toFixed(1)}°C</div>
            </div>
          </div>
        </div>

        {/* Live Grid Status Card */}
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Live Grid Status & Balance
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                isStable ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isStable ? '● STABLE' : '▲ RESPONDING'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500">GRID FREQ</div>
              <div className="font-bold text-sm mt-0.5" style={{ color: freqColor }}>
                {frequency.toFixed(3)} Hz
              </div>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500">IMBALANCE</div>
              <div className="font-bold text-sm mt-0.5" style={{ color: imbalanceColor }}>
                {powerImbalance > 0 ? `+${powerImbalance.toFixed(2)}` : powerImbalance.toFixed(2)} kW
              </div>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500">LOAD MULT</div>
              <div className="font-bold text-sm mt-0.5 text-purple-300">
                {(environment.loadMultiplier ?? 1.0).toFixed(2)}x
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2D Animated Energy Flow SVG Diagram ─── */}
      <div className="relative bg-[#050811] rounded-xl border border-grid-border overflow-hidden">
        {!isConnected && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center">
            <span className="text-3xl mb-2">🔌</span>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Simulator Offline</h3>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              Backend/MQTT telemetry not detected. Start EMQX broker, backend, and simulator to stream live energy flows.
            </p>
          </div>
        )}

        <svg viewBox="0 0 1180 500" className="w-full h-auto" style={{ minHeight: '380px' }}>
          <defs>
            <radialGradient id="sunGrad" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="60%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id="flowGrid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#131c2e" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Canvas Background Grid */}
          <rect width="1180" height="500" fill="url(#flowGrid)" />

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 1: RENEWABLE GENERATION (Solar & Wind)                */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <g>
            <rect x={20} y={35} width={240} height={430} rx={12} fill="#080e1a" stroke="#1e293b" strokeWidth={1.5} />
            <text x={140} y={60} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" letterSpacing="2" fontFamily="ui-monospace, monospace">
              RENEWABLES
            </text>

            {/* Sun Graphic */}
            <Sun cx={80} cy={125} isDay={(environment.timeOfDay ?? 12) >= 6 && (environment.timeOfDay ?? 12) <= 18} irradiance={environment.solarIrradiance} />

            {/* Solar Panels */}
            <SolarPanelArray x={135} y={105} generation={solarGen} />

            {/* Solar Readout */}
            <rect x={35} y={175} width={210} height={28} rx={6} fill="#0b1322" stroke="#f59e0b" strokeWidth={0.8} />
            <text x={45} y={193} fill="#fbbf24" fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="bold">
              ☀ Solar Generation:
            </text>
            <text x={235} y={193} textAnchor="end" fill="#fbbf24" fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="bold">
              {solarGen.toFixed(2)} kW
            </text>

            {/* Wind Turbine */}
            <WindTurbine x={85} y={235} speed={environment.windSpeed ?? 6} generation={windGen} />

            {/* Wind Readout */}
            <rect x={35} y={375} width={210} height={28} rx={6} fill="#0b1322" stroke="#14b8a6" strokeWidth={0.8} />
            <text x={45} y={393} fill="#2dd4bf" fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="bold">
              💨 Wind Generation:
            </text>
            <text x={235} y={393} textAnchor="end" fill="#2dd4bf" fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="bold">
              {windGen.toFixed(2)} kW
            </text>

            {/* Renewable Total Badge */}
            <rect x={35} y={420} width={210} height={32} rx={6} fill="#0c192c" stroke="#38bdf8" strokeWidth={1} />
            <text x={45} y={441} fill="#e0f2fe" fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="bold">
              ⚡ Total Renewable:
            </text>
            <text x={235} y={441} textAnchor="end" fill="#38bdf8" fontSize="12" fontFamily="ui-monospace, monospace" fontWeight="bold">
              {totalRenewable.toFixed(2)} kW
            </text>
          </g>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 2: CENTRAL POWER GRID BUS & LIVE READOUTS             */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <g>
            <rect x={490} y={35} width={200} height={260} rx={12} fill="#080e1a" stroke="#1e293b" strokeWidth={1.5} />
            <text x={590} y={60} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" letterSpacing="2" fontFamily="ui-monospace, monospace">
              POWER GRID BUS
            </text>

            {/* Transmission Tower */}
            <GridTower x={590} y={75} />

            {/* Frequency Box */}
            <rect x={510} y={215} width={160} height={32} rx={6} fill="#0c1322" stroke={freqColor} strokeWidth={1} />
            <text x={590} y={236} textAnchor="middle" fill={freqColor} fontSize="14" fontFamily="ui-monospace, monospace" fontWeight="bold">
              {frequency.toFixed(3)} Hz
            </text>

            {/* Imbalance Box */}
            <rect x={510} y={253} width={160} height={26} rx={6} fill="#0c1322" stroke={imbalanceColor} strokeWidth={0.8} />
            <text x={590} y={270} textAnchor="middle" fill={imbalanceColor} fontSize="10" fontFamily="ui-monospace, monospace" fontWeight="bold">
              {isSurplus ? '▲ SURPLUS' : isDeficit ? '▼ DEFICIT' : '● BALANCED'}: {powerImbalance > 0 ? `+${powerImbalance.toFixed(2)}` : powerImbalance.toFixed(2)} kW
            </text>
          </g>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 3: LOAD DEMAND (Right)                                */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <g>
            <rect x={920} y={35} width={240} height={260} rx={12} fill="#080e1a" stroke="#1e293b" strokeWidth={1.5} />
            <text x={1040} y={60} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" letterSpacing="2" fontFamily="ui-monospace, monospace">
              MICROGRID LOAD
            </text>

            {/* Factory Load Graphic */}
            <LoadGraphic x={1040} y={85} load={load} />

            {/* Load Telemetry Readout */}
            <rect x={940} y={215} width={200} height={32} rx={6} fill="#0c1322" stroke="#c084fc" strokeWidth={1} />
            <text x={950} y={236} fill="#e9d5ff" fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="bold">
              Demand Load:
            </text>
            <text x={1130} y={236} textAnchor="end" fill="#c084fc" fontSize="13" fontFamily="ui-monospace, monospace" fontWeight="bold">
              {load.toFixed(2)} kW
            </text>

            <rect x={940} y={253} width={200} height={26} rx={6} fill="#0c1322" stroke="#64748b" strokeWidth={0.6} />
            <text x={1040} y={270} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="ui-monospace, monospace">
              Scale Multiplier: {(environment.loadMultiplier ?? 1.0).toFixed(2)}x
            </text>
          </g>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* SECTION 4: VIRTUAL BATTERY POOL (Bottom Center)               */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <g>
            <rect x={380} y={325} width={620} height={140} rx={12} fill="#080e1a" stroke="#1e293b" strokeWidth={1.5} />
            <text x={690} y={347} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold" letterSpacing="2" fontFamily="ui-monospace, monospace">
              VIRTUAL BATTERY POOL ({displayBatteries.length} ASSETS)
            </text>

            {/* Pool SoC & Net Power Bar */}
            <text x={400} y={367} fill="#94a3b8" fontSize="10" fontFamily="ui-monospace, monospace">
              Pool SoC: {socPct}%
            </text>
            <rect x={480} y={358} width={240} height={10} rx={5} fill="#1e293b" />
            <rect
              x={480}
              y={358}
              width={Math.max(0, 240 * (poolAggregate.weightedSoc ?? 0.5))}
              height={10}
              rx={5}
              fill={socPct < 20 ? '#ef4444' : socPct < 50 ? '#f59e0b' : '#10b981'}
            />

            <text x={840} y={367} fill="#94a3b8" fontSize="10" fontFamily="ui-monospace, monospace">
              Net Power:
            </text>
            <text x={985} y={367} textAnchor="end" fill={battFlowColor} fontSize="11" fontFamily="ui-monospace, monospace" fontWeight="bold">
              {netPower > 0 ? `+${netPower.toFixed(2)} kW (DIS)` : netPower < -0.01 ? `${netPower.toFixed(2)} kW (CHG)` : '0.00 kW (IDLE)'}
            </text>

            {/* 8 Battery Units */}
            {displayBatteries.map((b, i) => (
              <BatteryUnit
                key={b.id}
                x={400 + i * 72}
                y={385}
                soc={b.soc}
                mode={b.mode}
                fault={b.fault}
                id={b.id}
                isSelected={b.id === selectedBatteryId}
                onClick={() => onSelectBattery && onSelectBattery(b.id)}
              />
            ))}
          </g>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* FLOW PATH 1: Renewables → Grid                                */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <FlowPath
            d="M 260 160 C 375 160, 400 160, 490 160"
            active={hasRenewables}
            direction="forward"
            color="#38bdf8"
            label={hasRenewables ? `${totalRenewable.toFixed(1)} kW` : null}
            labelX={375}
            labelY={142}
            powerKw={totalRenewable}
          />

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* FLOW PATH 2: Battery Pool ↔ Grid (Bidirectional)              */}
          {/* ═════════════════════════════════════════════════════════════ */}
          {/* Battery power > 0 = discharge (Pool -> Grid)                  */}
          {/* Battery power < 0 = charge (Grid -> Pool)                     */}
          <FlowPath
            d="M 590 295 L 590 325"
            active={isDischarging || isCharging}
            direction={isDischarging ? 'backward' : 'forward'}
            color={battFlowColor}
            label={isDischarging || isCharging ? `${Math.abs(netPower).toFixed(1)} kW` : null}
            labelX={640}
            labelY={310}
            powerKw={Math.abs(netPower)}
          />

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* FLOW PATH 3: Grid → Load                                      */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <FlowPath
            d="M 690 160 C 785 160, 825 160, 920 160"
            active={hasLoad}
            direction="forward"
            color="#c084fc"
            label={hasLoad ? `${load.toFixed(1)} kW` : null}
            labelX={805}
            labelY={142}
            powerKw={load}
          />
        </svg>
      </div>
    </div>
  );
}
