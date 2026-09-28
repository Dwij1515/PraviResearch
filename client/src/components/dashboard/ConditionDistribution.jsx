import React from 'react';

const BANDS = [
  { key: 'EXCELLENT', label: 'Excellent (90-100)', color: 'var(--success)' },
  { key: 'GOOD', label: 'Good (75-89)', color: 'var(--primary)' },
  { key: 'FAIR', label: 'Fair (60-74)', color: 'var(--warning)' },
  { key: 'POOR', label: 'Poor (40-59)', color: '#F97316' },
  { key: 'CRITICAL', label: 'Critical (0-39)', color: 'var(--danger)' }
];

export const ConditionDistribution = ({ distribution = {}, total = 0 }) => {
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
            Condition Health Distribution
          </h3>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Physical structural integrity rating across assets
          </p>
        </div>
        <span
          style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)'
          }}
        >
          {total} Total Assets
        </span>
      </div>

      {/* Segmented Bar Chart */}
      <div
        style={{
          height: '10px',
          width: '100%',
          borderRadius: '9999px',
          background: 'var(--bg-subtle)',
          display: 'flex',
          overflow: 'hidden',
          border: '1px solid var(--border-color)'
        }}
      >
        {BANDS.map((band) => {
          const count = distribution[band.key] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={band.key}
              title={`${band.label}: ${count} (${pct.toFixed(1)}%)`}
              style={{
                width: `${pct}%`,
                background: band.color,
                transition: 'width 0.3s ease'
              }}
            />
          );
        })}
      </div>

      {/* Detail List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {BANDS.map((band) => {
          const count = distribution[band.key] || 0;
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
          return (
            <div
              key={band.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: band.color }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)' }}>
                  {band.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {pct}%
                </span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text-main)',
                    minWidth: '24px',
                    textAlign: 'right'
                  }}
                >
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConditionDistribution;
