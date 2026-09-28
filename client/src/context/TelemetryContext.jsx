import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import telemetry from '../services/telemetry';
import api from '../services/api';

const TelemetryContext = createContext(null);

export const TelemetryProvider = ({ children }) => {
  const [metrics, setMetrics] = useState(() => telemetry.getMetrics());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState(null);

  useEffect(() => {
    const handleUpdate = () => {
      setMetrics(telemetry.getMetrics());
    };

    telemetry.addEventListener('change', handleUpdate);
    return () => telemetry.removeEventListener('change', handleUpdate);
  }, []);

  const toggleDrawer = () => setIsDrawerOpen(prev => !prev);
  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const toggleTurboMode = () => {
    telemetry.setTurboMode(!metrics.turboMode);
  };

  const clearMetrics = () => {
    telemetry.clearLogs();
    api.clearCache();
    setBenchmarkResult(null);
  };

  // Run real-time performance benchmark
  const runBenchmark = useCallback(async () => {
    setBenchmarking(true);
    const runs = [];

    try {
      const endpoints = [
        '/health',
        '/assets/summary',
        '/departments',
        '/assets?page=1&limit=5',
        '/health'
      ];

      for (const ep of endpoints) {
        const start = performance.now();
        await api.get(ep, {}, { forceRefresh: true });
        const duration = performance.now() - start;
        runs.push({ endpoint: ep, durationMs: Math.round(duration * 10) / 10 });
      }

      const durations = runs.map(r => r.durationMs);
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      const avg = Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10;

      const result = {
        timestamp: new Date().toLocaleTimeString(),
        runs,
        min,
        max,
        avg,
        status: avg < 50 ? 'ULTRA FAST' : avg < 150 ? 'OPTIMAL' : 'STANDARD'
      };

      setBenchmarkResult(result);
    } catch (err) {
      console.error('Benchmark failed:', err);
    } finally {
      setBenchmarking(false);
    }
  }, []);

  return (
    <TelemetryContext.Provider
      value={{
        metrics,
        isDrawerOpen,
        toggleDrawer,
        openDrawer,
        closeDrawer,
        toggleTurboMode,
        clearMetrics,
        runBenchmark,
        benchmarking,
        benchmarkResult
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const ctx = useContext(TelemetryContext);
  if (!ctx) {
    throw new Error('useTelemetry must be used within TelemetryProvider');
  }
  return ctx;
};

export default TelemetryContext;
