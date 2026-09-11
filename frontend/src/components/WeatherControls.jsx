import React, { useState, useEffect } from 'react';

const WEATHER_PRESETS = [
  { id: 'clear', label: 'Clear Sky', icon: '☀️' },
  { id: 'cloudy', label: 'Cloudy', icon: '⛅' },
  { id: 'high_wind', label: 'High Wind', icon: '💨' },
  { id: 'storm', label: 'Severe Storm', icon: '⛈️' },
  { id: 'night', label: 'Night', icon: '🌙' },
];

export function WeatherControls({ environment, onSendCommand, isConnected }) {
  const [localVals, setLocalVals] = useState({
    cloudCover: environment?.cloudCover ?? 10,
    solarIrradiance: environment?.solarIrradiance ?? 900,
    windSpeed: environment?.windSpeed ?? 6,
    temperature: environment?.temperature ?? 28,
    timeOfDay: environment?.timeOfDay ?? 12,
    loadMultiplier: environment?.loadMultiplier ?? 1.0,
  });

  // Sync with incoming telemetry when not actively dragging
  useEffect(() => {
    if (environment) {
      setLocalVals({
        cloudCover: Math.round(environment.cloudCover ?? 10),
        solarIrradiance: Math.round(environment.solarIrradiance ?? 900),
        windSpeed: Number((environment.windSpeed ?? 6).toFixed(1)),
        temperature: Number((environment.temperature ?? 28).toFixed(1)),
        timeOfDay: Number((environment.timeOfDay ?? 12).toFixed(1)),
        loadMultiplier: Number((environment.loadMultiplier ?? 1.0).toFixed(2)),
      });
    }
  }, [
    environment?.cloudCover,
    environment?.solarIrradiance,
    environment?.windSpeed,
    environment?.temperature,
    environment?.timeOfDay,
    environment?.loadMultiplier,
  ]);

  const handleWeatherChange = (weather) => {
    onSendCommand({ command: 'set_weather', weather });
  };

  const commitParam = (key, value) => {
    switch (key) {
      case 'cloudCover':
        onSendCommand({ command: 'set_cloud_cover', cloud_cover: Number(value), cloudCover: Number(value) });
        break;
      case 'solarIrradiance':
        onSendCommand({ command: 'set_solar_irradiance', irradiance: Number(value), solarIrradiance: Number(value) });
        break;
      case 'windSpeed':
        onSendCommand({ command: 'set_wind_speed', speed: Number(value), windSpeed: Number(value) });
        break;
      case 'temperature':
        onSendCommand({ command: 'set_temperature', temperature: Number(value) });
        break;
      case 'timeOfDay':
        onSendCommand({ command: 'set_time_of_day', timeOfDay: Number(value), time: Number(value) });
        break;
      case 'loadMultiplier':
        onSendCommand({ command: 'set_load_multiplier', multiplier: Number(value), loadMultiplier: Number(value) });
        break;
      default:
        break;
    }
  };

  const handleSliderChange = (key, value) => {
    setLocalVals(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-grid-border flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🌤️</span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">Weather Controls</h3>
              <p className="text-[11px] text-slate-400">Environment & renewable resource parameters</p>
            </div>
          </div>
          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
            isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* Weather Preset Dropdown */}
        <div className="mb-4">
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Weather Preset
          </label>
          <div className="relative">
            <select
              value={environment?.weather || 'clear'}
              onChange={(e) => handleWeatherChange(e.target.value)}
              disabled={!isConnected}
              className="w-full bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-white rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-sky-500 transition cursor-pointer appearance-none disabled:opacity-50"
            >
              {WEATHER_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.label} ({p.id})
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400 text-xs">
              ▼
            </div>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="space-y-3.5">
          {/* Cloud Cover */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Cloud Cover</span>
              <span className="text-sky-400 font-mono font-bold">{localVals.cloudCover}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              disabled={!isConnected}
              value={localVals.cloudCover}
              onChange={(e) => handleSliderChange('cloudCover', e.target.value)}
              onMouseUp={(e) => commitParam('cloudCover', e.target.value)}
              onTouchEnd={(e) => commitParam('cloudCover', e.target.value)}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none disabled:opacity-50"
            />
          </div>

          {/* Solar Irradiance */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Solar Irradiance</span>
              <span className="text-amber-400 font-mono font-bold">{localVals.solarIrradiance} W/m²</span>
            </div>
            <input
              type="range"
              min="0"
              max="1200"
              step="25"
              disabled={!isConnected}
              value={localVals.solarIrradiance}
              onChange={(e) => handleSliderChange('solarIrradiance', e.target.value)}
              onMouseUp={(e) => commitParam('solarIrradiance', e.target.value)}
              onTouchEnd={(e) => commitParam('solarIrradiance', e.target.value)}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none disabled:opacity-50"
            />
          </div>

          {/* Wind Speed */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Wind Speed</span>
              <span className="text-teal-400 font-mono font-bold">{localVals.windSpeed} m/s</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="0.5"
              disabled={!isConnected}
              value={localVals.windSpeed}
              onChange={(e) => handleSliderChange('windSpeed', e.target.value)}
              onMouseUp={(e) => commitParam('windSpeed', e.target.value)}
              onTouchEnd={(e) => commitParam('windSpeed', e.target.value)}
              className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none disabled:opacity-50"
            />
          </div>

          {/* Temperature */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Temperature</span>
              <span className="text-rose-400 font-mono font-bold">{localVals.temperature}°C</span>
            </div>
            <input
              type="range"
              min="-10"
              max="50"
              step="1"
              disabled={!isConnected}
              value={localVals.temperature}
              onChange={(e) => handleSliderChange('temperature', e.target.value)}
              onMouseUp={(e) => commitParam('temperature', e.target.value)}
              onTouchEnd={(e) => commitParam('temperature', e.target.value)}
              className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none disabled:opacity-50"
            />
          </div>

          {/* Time of Day */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Time of Day</span>
              <span className="text-indigo-400 font-mono font-bold">
                {String(Math.floor(localVals.timeOfDay)).padStart(2, '0')}:{String(Math.round((localVals.timeOfDay % 1) * 60)).padStart(2, '0')} ({localVals.timeOfDay}h)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="0.5"
              disabled={!isConnected}
              value={localVals.timeOfDay}
              onChange={(e) => handleSliderChange('timeOfDay', e.target.value)}
              onMouseUp={(e) => commitParam('timeOfDay', e.target.value)}
              onTouchEnd={(e) => commitParam('timeOfDay', e.target.value)}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none disabled:opacity-50"
            />
          </div>

          {/* Load Multiplier */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium">Load Multiplier</span>
              <span className="text-purple-400 font-mono font-bold">{localVals.loadMultiplier}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              disabled={!isConnected}
              value={localVals.loadMultiplier}
              onChange={(e) => handleSliderChange('loadMultiplier', e.target.value)}
              onMouseUp={(e) => commitParam('loadMultiplier', e.target.value)}
              onTouchEnd={(e) => commitParam('loadMultiplier', e.target.value)}
              className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex justify-between">
        <span>Updates dispatch directly to simulator</span>
        <span>Cmd: POST /api/environment/command</span>
      </div>
    </div>
  );
}
