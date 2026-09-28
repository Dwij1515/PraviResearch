import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Zap, Gauge, Database, Clock, RefreshCw, ChevronRight } from 'lucide-react';

export const LoaderAnalyticsWidget = () => {
  const { metrics, openDrawer, runBenchmark, benchmarking, benchmarkResult, toggleTurboMode } = useTelemetry();
  const { avgLatencyMs, cacheHitRatio, totalRequests, turboMode } = metrics;

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              border: '1px solid var(--primary-border)'
            }}
          >
            <Gauge size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Loader & Performance Analytics
              </h3>
              <span className="turbo-badge">
                <Zap size={10} />
                TURBO {turboMode ? 'ON' : 'OFF'}
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Real-time response latency & SWR memory cache telemetry
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={runBenchmark}
            disabled={benchmarking}
            className="btn-secondary"
            style={{ fontSize: '0.74rem', padding: '5px 10px' }}
          >
            <RefreshCw size={12} className={benchmarking ? 'animate-spin' : ''} />
            {benchmarking ? 'Testing...' : 'Test Latency'}
          </button>

          <button
            onClick={openDrawer}
            className="btn-primary"
            style={{ fontSize: '0.74rem', padding: '5px 12px' }}
          >
            Open Console
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* 4 Stat Highlights */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px'
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>AVG LATENCY</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
            {avgLatencyMs} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>ms</span>
          </div>
        </div>

        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>CACHE RATIO</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>
            {cacheHitRatio}%
          </div>
        </div>

        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL REQUESTS</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
            {totalRequests}
          </div>
        </div>

        <div
          style={{
            padding: '10px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)' }}>BENCHMARK SCORE</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-violet)', marginTop: '2px' }}>
            {benchmarkResult ? `${benchmarkResult.avg}ms` : 'Ready'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoaderAnalyticsWidget;
