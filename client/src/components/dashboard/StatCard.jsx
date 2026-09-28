import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colorMap = {
    blue: {
      accent: 'var(--primary)',
      bg: 'var(--primary-light)',
      border: 'var(--primary-border)'
    },
    emerald: {
      accent: 'var(--success)',
      bg: 'var(--success-light)',
      border: 'var(--success-border)'
    },
    rose: {
      accent: 'var(--danger)',
      bg: 'var(--danger-light)',
      border: 'var(--danger-border)'
    },
    amber: {
      accent: 'var(--warning)',
      bg: 'var(--warning-light)',
      border: 'var(--warning-border)'
    },
    purple: {
      accent: 'var(--accent-violet)',
      bg: 'rgba(139, 92, 246, 0.15)',
      border: 'rgba(139, 92, 246, 0.35)'
    }
  };

  const themeStyle = colorMap[color] || colorMap.blue;

  return (
    <div
      className="card-panel"
      style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderLeft: `4px solid ${themeStyle.accent}`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top row: Title and Icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {title}
        </span>
        {Icon && (
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: themeStyle.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: themeStyle.accent,
              border: `1px solid ${themeStyle.border}`
            }}
          >
            <Icon size={16} />
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{ marginTop: '12px', marginBottom: '4px' }}>
        <div
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            lineHeight: 1.1,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.02em'
          }}
        >
          {value !== undefined && value !== null ? value : '—'}
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: '0.74rem',
          color: 'var(--text-muted)'
        }}
      >
        {subtitle}
      </div>
    </div>
  );
};

export default StatCard;
