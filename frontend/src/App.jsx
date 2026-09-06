import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GridFrequencyChart } from './components/GridFrequencyChart';
import { PoolOverview } from './components/PoolOverview';
import { BatteryGrid } from './components/BatteryGrid';
import { PowerFlowChart } from './components/PowerFlowChart';
import { EventLog } from './components/EventLog';
import { useGridData } from './hooks/useGridData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const {
    isConnected,
    gridState,
    poolAggregate,
    batteries,
    freqHistory,
    powerHistory,
    events,
    dispatchManualCommand,
  } = useGridData();

  return (
    <div className="flex flex-col h-screen bg-grid-dark text-slate-100 overflow-hidden">
      <Header
        isConnected={isConnected}
        gridState={gridState}
        poolAggregate={poolAggregate}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
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
            <EventLog events={events} />
          )}
        </main>
      </div>
    </div>
  );
}
