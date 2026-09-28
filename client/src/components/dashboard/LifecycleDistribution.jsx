import React from 'react';

const STATES = [
  { key: 'PLANNING', label: 'Planning', color: '#64748B' },
  { key: 'PROCUREMENT', label: 'Procurement', color: 'var(--primary)' },
  { key: 'INSTALLATION', label: 'Installation', color: '#8B5CF6' },
  { key: 'COMMISSIONING', label: 'Commissioning', color: '#EC4899' },
  { key: 'OPERATIONAL', label: 'Operational', color: 'var(--success)' },
  { key: 'UNDER_INSPECTION', label: 'Under Inspection', color: 'var(--accent-blue)' },
  { key: 'NEEDS_REPAIR', label: 'Needs Repair', color: '#F97316' },
  { key: 'UNDER_MAINTENANCE', label: 'Under Maint.', color: 'var(--warning)' },
  { key: 'OUT_OF_SERVICE', label: 'Out of Service', color: 'var(--danger)' },
  { key: 'DECOMMISSIONED', label: 'Decommissioned', color: 'var(--text-dim)' },
  { key: 'DISPOSED', label: 'Disposed', color: '#475569' }
];

export const LifecycleDistribution = ({ distribution = {}, total = 0 }) => {
  return (
    <div
      className="card-panel"
      style={{
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Lifecycle State Breakdown
          </h3>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Assets distributed across 11 canonical lifecycle stages
          </p>
        </div>
        <span
          style={{
            fontSize: '0.7rem',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-subtle)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            fontWeight: 700
          }}
        >
          11 States
        </span>
      </div>

      {/* Grid of horizontal mini-bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '8px' }}>
        {STATES.map((state) => {
          const count = distribution[state.key] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div
              key={state.key}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {state.label}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {count} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>({pct.toFixed(0)}%)</span>
                </span>
              </div>
              <div
                style={{
                  height: '4px',
                  width: '100%',
                  borderRadius: '9999px',
                  background: 'var(--bg-muted)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.max(pct, count > 0 ? 5 : 0)}%`,
                    background: state.color,
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LifecycleDistribution;
