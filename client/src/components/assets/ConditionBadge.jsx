import React from 'react';

const RATING_CONFIG = {
  EXCELLENT: { label: 'Excellent', color: '#16845B', bg: '#ECFDF3', border: '#A6F4C5' },
  GOOD: { label: 'Good', color: '#0E7090', bg: '#F0FDFA', border: '#99F6E4' },
  FAIR: { label: 'Fair', color: '#B7791F', bg: '#FEF7C3', border: '#FDE047' },
  POOR: { label: 'Poor', color: '#C05621', bg: '#FFEDD5', border: '#FDBA74' },
  CRITICAL: { label: 'Critical', color: '#C53030', bg: '#FEF2F2', border: '#FECDCA' }
};

export const ConditionBadge = ({ rating, score }) => {
  const conf = RATING_CONFIG[rating] || {
    label: rating || 'Unrated',
    color: '#475467',
    bg: '#F2F4F7',
    border: '#D0D5DD'
  };

  return (
    <span
      className="badge"
      style={{
        background: conf.bg,
        border: `1px solid ${conf.border}`,
        color: conf.color,
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: conf.color,
          display: 'inline-block'
        }}
      />
      {conf.label}
      {score !== undefined && score !== null && (
        <span style={{ fontWeight: 700, marginLeft: '3px' }}>
          ({score})
        </span>
      )}
    </span>
  );
};

export default ConditionBadge;
