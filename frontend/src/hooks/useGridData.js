import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

const MAX_POINTS = 60;

const DEFAULT_ENVIRONMENT = {
  weather: 'clear',
  cloudCover: 10,
  solarIrradiance: 900,
  windSpeed: 6,
  temperature: 28,
  humidity: 40,
  timeOfDay: 12,
  loadMultiplier: 1.0,
  solarGeneration: 0,
  windGeneration: 0,
  totalRenewable: 0,
  load: 25,
  powerImbalance: 0,
  activeScenario: 'normal',
};

export function useGridData() {
  const { isConnected, lastMessage } = useWebSocket('ws://localhost:3002');
  const [gridState, setGridState] = useState({ frequency: 50.0, deviation: 0, requiredPower: 0, nominal: 50.0 });
  const [poolAggregate, setPoolAggregate] = useState({
    count: 0, totalCapacity: 0, availablePower: 0, weightedSoc: 0, netPower: 0, charging: 0, discharging: 0, idle: 0, fault: 0
  });
  const [batteries, setBatteries] = useState([]);
  const [freqHistory, setFreqHistory] = useState([]);
  const [powerHistory, setPowerHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const [environment, setEnvironment] = useState(DEFAULT_ENVIRONMENT);
  const [commandStatus, setCommandStatus] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/events');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setEvents(data);
      }
    } catch {
      // ignore network errors
    }
  }, []);

  useEffect(() => {
    fetch('http://localhost:3001/api/pool')
      .then(res => res.json())
      .then(data => {
        if (data.batteries) setBatteries(data.batteries);
        if (data.aggregate) setPoolAggregate(data.aggregate);
      })
      .catch(() => {});

    fetch('http://localhost:3001/api/grid')
      .then(res => res.json())
      .then(data => setGridState(data))
      .catch(() => {});

    fetchEvents();

    fetch('http://localhost:3001/api/environment')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setEnvironment(prev => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, [fetchEvents]);

  useEffect(() => {
    if (!lastMessage) return;
    const { type, data, timestamp } = lastMessage;
    const timeStr = new Date(timestamp || Date.now()).toLocaleTimeString();

    if (type === 'snapshot') {
      if (data.grid) {
        setGridState(data.grid);
        setFreqHistory(prev => {
          const next = [...prev, { time: timeStr, frequency: data.grid.frequency, nominal: 50.0 }];
          return next.slice(-MAX_POINTS);
        });
      }
      if (data.pool) {
        setPoolAggregate(data.pool);
        setPowerHistory(prev => {
          const next = [...prev, { time: timeStr, netPower: data.pool.netPower, available: data.pool.availablePower }];
          return next.slice(-MAX_POINTS);
        });
      }
      if (data.batteries) setBatteries(data.batteries);
      if (data.environment) {
        setEnvironment(prev => ({ ...prev, ...data.environment }));
      }
      if (data.events && Array.isArray(data.events)) {
        setEvents(data.events);
      }
    } else if (type === 'battery') {
      setBatteries(prev => {
        const idx = prev.findIndex(b => b.id === data.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = data;
          return copy;
        }
        return [...prev, data];
      });
    } else if (type === 'grid') {
      setGridState(data);
      setFreqHistory(prev => {
        const next = [...prev, { time: timeStr, frequency: data.frequency, nominal: 50.0 }];
        return next.slice(-MAX_POINTS);
      });
    } else if (type === 'environment') {
      setEnvironment(prev => ({ ...prev, ...data }));
    } else if (type === 'event') {
      if (data) {
        setEvents(prev => {
          const exists = prev.some(
            e => e.timestamp === data.timestamp && e.type === data.type
          );
          if (exists) return prev;
          return [...prev, data].slice(-200);
        });
      }
    }
  }, [lastMessage]);

  const activateScenario = async (scenario) => {
    setCommandStatus({ status: 'pending', message: `Activating scenario "${scenario}"...` });
    try {
      const res = await fetch('http://localhost:3001/api/environment/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setCommandStatus({ status: 'success', message: `Scenario "${scenario}" activated successfully.` });
      return true;
    } catch (err) {
      setCommandStatus({ status: 'error', message: `Unable to activate scenario: ${err.message}` });
      return false;
    }
  };

  const sendEnvironmentCommand = async (cmd) => {
    setCommandStatus({ status: 'pending', message: `Sending command "${cmd.command}"...` });
    try {
      const res = await fetch('http://localhost:3001/api/environment/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cmd),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setCommandStatus({ status: 'success', message: `Environment command "${cmd.command}" sent.` });
      return true;
    } catch (err) {
      setCommandStatus({ status: 'error', message: `Unable to send command: ${err.message}` });
      return false;
    }
  };

  const resetSimulation = async () => {
    setCommandStatus({ status: 'pending', message: 'Resetting simulation to baseline...' });
    try {
      const res = await fetch('http://localhost:3001/api/environment/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'reset' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setCommandStatus({ status: 'success', message: 'Simulation reset successfully.' });
      return true;
    } catch (err) {
      setCommandStatus({ status: 'error', message: `Reset failed: ${err.message}` });
      return false;
    }
  };

  const dispatchManualCommand = async (batteryId, action, power) => {
    setCommandStatus({ status: 'pending', message: `Dispatching ${action} (${power}kW) to ${batteryId}...` });
    try {
      const res = await fetch('http://localhost:3001/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batteryId, action, power: Number(power) || 0 }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      setCommandStatus({ status: 'success', message: `Manual dispatch to ${batteryId} sent.` });
      return true;
    } catch (e) {
      setCommandStatus({ status: 'error', message: `Manual dispatch failed: ${e.message}` });
      return false;
    }
  };

  const clearCommandStatus = () => setCommandStatus(null);

  return {
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
  };
}
