import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  Activity,
  Zap,
  Gauge,
  Clock,
  Database,
  RefreshCw,
  X,
  CheckCircle2,
  Trash2,
  ArrowUpRight,
  Server
} from 'lucide-react';

export const LoaderAnalyticsDrawer = () => {
  const {
    metrics,
    isDrawerOpen,
    closeDrawer,
    toggleTurboMode,
    clearMetrics,
    runBenchmark,
    benchmarking,
    benchmarkResult
  } = useTelemetry();

  if (!isDrawerOpen) return null;

  const {
    avgLatencyMs,
    cacheHitRatio,
    totalRequests,
    cacheHits,
    fastRequestsPct,
    turboMode,
    recentRequests,
    activeRequests
  } = metrics;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDrawer();
      }}
    >
      <div
        style={{
          width: '540px',
          maxWidth: '100%',
          height: '100%',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-elevated)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'var(--primary-light)',
                border: '1px solid var(--primary-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}
            >
              <Gauge size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Loader & Speed Analytics
                </h3>
                <span className="turbo-badge">
                  <Zap size={11} />
                  LIVE
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Real-time API latency, SWR in-memory caching & telemetry
              </p>
            </div>
          </div>

          <button
            onClick={closeDrawer}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Turbo Control & Benchmark Banner */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  className="status-dot pulse"
                  style={{
                    backgroundColor: turboMode ? 'var(--success)' : 'var(--warning)',
                    boxShadow: turboMode ? '0 0 8px var(--success)' : 'none'
                  }}
                />
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {turboMode ? 'Turbo SWR Cache Active' : 'Standard Network Mode'}
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {turboMode
                  ? 'Instant 0ms cached queries with background revalidation'
                  : 'Direct uncached round-trip to MongoDB API'}
              </p>
            </div>

            <button
              onClick={toggleTurboMode}
              className={turboMode ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.76rem', padding: '6px 12px' }}
            >
              <Zap size={13} />
              {turboMode ? 'Turbo ON' : 'Turn On'}
            </button>
          </div>

          {/* 4 KPI Grid Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {/* Avg Latency */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid var(--primary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  AVG LATENCY
                </span>
                <Clock size={15} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>
                {avgLatencyMs} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>ms</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: '2px' }}>
                ✓ {avgLatencyMs < 60 ? 'Ultra Low Latency' : 'Optimal Performance'}
              </div>
            </div>

            {/* Cache Hit Ratio */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid var(--success)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  SWR CACHE RATIO
                </span>
                <Database size={15} color="var(--success)" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>
                {cacheHitRatio}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {cacheHits} of {totalRequests} hits (0ms response)
              </div>
            </div>

            {/* Total Queries */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid var(--accent-violet)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  TOTAL REQUESTS
                </span>
                <Activity size={15} color="var(--accent-violet)" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>
                {totalRequests}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {activeRequests > 0 ? `${activeRequests} pending in flight` : 'All idle / ready'}
              </div>
            </div>

            {/* Fast Rate */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid var(--warning)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  SUB-100MS RATIO
                </span>
                <Zap size={15} color="var(--warning)" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>
                {fastRequestsPct}%
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Near-instantaneous rendering
              </div>
            </div>
          </div>

          {/* Interactive Benchmark Section */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Live API Speed Benchmark
                </h4>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Stress-test 5 endpoints directly against AMC MongoDB
                </p>
              </div>

              <button
                onClick={runBenchmark}
                disabled={benchmarking}
                className="btn-primary"
                style={{ fontSize: '0.78rem', padding: '6px 14px' }}
              >
                <RefreshCw size={13} className={benchmarking ? 'animate-spin' : ''} />
                {benchmarking ? 'Benchmarking...' : 'Run Test'}
              </button>
            </div>

            {benchmarkResult && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Test Result at {benchmarkResult.timestamp}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--success-light)',
                      color: 'var(--success)',
                      border: '1px solid var(--success-border)'
                    }}
                  >
                    ⚡ {benchmarkResult.status} ({benchmarkResult.avg}ms AVG)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                  <div style={{ padding: '6px', background: 'var(--bg-surface)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>MIN</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--success)' }}>
                      {benchmarkResult.min} ms
                    </div>
                  </div>
                  <div style={{ padding: '6px', background: 'var(--bg-surface)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>AVG</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {benchmarkResult.avg} ms
                    </div>
                  </div>
                  <div style={{ padding: '6px', background: 'var(--bg-surface)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>MAX</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--warning)' }}>
                      {benchmarkResult.max} ms
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Request Waterfall Log */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={15} color="var(--primary)" />
                <h4 style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Recent Request Stream ({recentRequests.length})
                </h4>
              </div>

              <button
                onClick={clearMetrics}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  color: 'var(--text-dim)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'var(--bg-subtle)'
                }}
              >
                <Trash2 size={11} />
                Clear
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxHeight: '260px',
                overflowY: 'auto'
              }}
            >
              {recentRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No network queries recorded yet.
                </div>
              ) : (
                recentRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          color: req.method === 'GET' ? 'var(--primary)' : 'var(--warning)',
                          padding: '1px 5px',
                          background: 'var(--bg-subtle)',
                          borderRadius: '3px'
                        }}
                      >
                        {req.method}
                      </span>
                      <span
                        style={{
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '240px'
                        }}
                        title={req.endpoint}
                      >
                        {req.endpoint}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {req.cached ? (
                        <span
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '3px',
                            background: 'var(--success-light)',
                            color: 'var(--success)',
                            border: '1px solid var(--success-border)'
                          }}
                        >
                          SWR 0ms
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: req.durationMs < 60 ? 'var(--success)' : req.durationMs < 150 ? 'var(--primary)' : 'var(--warning)'
                          }}
                        >
                          {req.durationMs}ms
                        </span>
                      )}

                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: req.status === 200 || req.status === 201 ? 'var(--success)' : 'var(--danger)'
                        }}
                      >
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoaderAnalyticsDrawer;
