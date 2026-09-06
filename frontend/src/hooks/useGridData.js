import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

const MAX_POINTS = 60;

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

    fetch('http://localhost:3001/api/events')
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(() => {});
  }, []);

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
    }
  }, [lastMessage]);

  const dispatchManualCommand = async (batteryId, action, power) => {
    try {
      await fetch('http://localhost:3001/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batteryId, action, power }),
      });
    } catch (e) {
      console.error('Manual dispatch failed', e);
    }
  };

  return {
    isConnected,
    gridState,
    poolAggregate,
    batteries,
    freqHistory,
    powerHistory,
    events,
    dispatchManualCommand,
  };
}
