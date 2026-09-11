import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GridFrequencyChart } from './components/GridFrequencyChart';
import { PoolOverview } from './components/PoolOverview';
import { BatteryGrid } from './components/BatteryGrid';
import { PowerFlowChart } from './components/PowerFlowChart';
import { EventLog } from './components/EventLog';
import { EnergyFlowVisualization } from './components/EnergyFlowVisualization';
import { WeatherControls } from './components/WeatherControls';
import { ScenarioControls } from './components/ScenarioControls';
import { BatteryControlPanel } from './components/BatteryControlPanel';
import { SimulationStats } from './components/SimulationStats';
import { BatteryHeatmap } from './components/BatteryHeatmap';
import { useGridData } from './hooks/useGridData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedBatteryId, setSelectedBatteryId] = useState('BAT-001');
  const {
    isConnected,
    gridState,
    poolAggregate,
    batteries,
    freqHistory,
    powerHistory,
    events,
    environment,
    commandStatus,
    activateScenario,
    sendEnvironmentCommand,
    resetSimulation,
    dispatchManualCommand,
    clearCommandStatus,
    fetchEvents,
  } = useGridData();

  return (
    <div className="flex flex-col h-screen bg-grid-dark text-slate-100 overflow-hidden">
      <Header
        isConnected={isConnected}
        gridState={gridState}
        poolAggregate={poolAggregate}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} eventCount={events.length} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Command Feedback Notification */}
          {commandStatus && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
                commandStatus.status === 'error'
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  : commandStatus.status === 'pending'
                  ? 'bg-sky-950/40 border-sky-500/50 text-sky-300'
                  : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <span>
                  {commandStatus.status === 'error' ? '❌' : commandStatus.status === 'pending' ? '⏳' : '✅'}
                </span>
                <span>{commandStatus.message}</span>
              </div>
              <button
                onClick={clearCommandStatus}
                className="text-slate-400 hover:text-white px-2 py-0.5 rounded text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <>
              <PoolOverview poolAggregate={poolAggregate} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GridFrequencyChart
                  data={freqHistory}
                  currentFreq={gridState.frequency}
                  deviation={gridState.deviation}
                />
                <PowerFlowChart data={powerHistory} />
              </div>

              <BatteryGrid batteries={batteries} onDispatch={dispatchManualCommand} />
            </>
          )}

          {activeTab === 'visualization' && (
            <div className="space-y-6">
              {/* Primary 2D Energy Flow Visualization */}
              <EnergyFlowVisualization
                batteries={batteries}
                gridState={gridState}
                poolAggregate={poolAggregate}
                environment={environment}
                isConnected={isConnected}
                selectedBatteryId={selectedBatteryId}
                onSelectBattery={setSelectedBatteryId}
              />

              {/* 12 Scenario Stress Controls & Reset */}
              <ScenarioControls
                activeScenario={environment.activeScenario}
                onActivateScenario={activateScenario}
                onResetSimulation={resetSimulation}
                isConnected={isConnected}
              />

              {/* Weather & Battery Control Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <WeatherControls
                  environment={environment}
                  onSendCommand={sendEnvironmentCommand}
                  isConnected={isConnected}
                />
                <BatteryControlPanel
                  batteries={batteries}
                  onDispatch={dispatchManualCommand}
                  selectedBatteryId={selectedBatteryId}
                  onSelectBattery={setSelectedBatteryId}
                  isConnected={isConnected}
                />
              </div>

              {/* Performance Statistics & Heatmap */}
              <SimulationStats
                batteries={batteries}
                gridState={gridState}
                poolAggregate={poolAggregate}
                environment={environment}
              />
              <BatteryHeatmap batteries={batteries} />
            </div>
          )}

          {activeTab === 'batteries' && (
            <div className="space-y-6">
              <PoolOverview poolAggregate={poolAggregate} />
              <BatteryGrid batteries={batteries} onDispatch={dispatchManualCommand} />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <PowerFlowChart data={powerHistory} />
              <GridFrequencyChart
                data={freqHistory}
                currentFreq={gridState.frequency}
                deviation={gridState.deviation}
              />
            </div>
          )}

          {activeTab === 'events' && (
            <EventLog events={events} onRefresh={fetchEvents} />
          )}
        </main>
      </div>
    </div>
  );
}

