import React from 'react';

const STATUS_CONFIG = {
  PLANNING: { label: 'Planning', bg: '#F0F4F8', border: '#D0D9E2', color: '#334E68' },
  PROCUREMENT: { label: 'Procurement', bg: '#EFF8FF', border: '#B2DDFF', color: '#1769AA' },
  INSTALLATION: { label: 'Installation', bg: '#F5F3FF', border: '#DDD6FE', color: '#5B21B6' },
  COMMISSIONING: { label: 'Commissioning', bg: '#FDF4FF', border: '#F5D0FE', color: '#86198F' },
  OPERATIONAL: { label: 'Operational', bg: '#ECFDF3', border: '#A6F4C5', color: '#16845B' },
  UNDER_INSPECTION: { label: 'Under Inspection', bg: '#EFF8FF', border: '#B2DDFF', color: '#1769AA' },
  NEEDS_REPAIR: { label: 'Needs Repair', bg: '#FFEDD5', border: '#FDBA74', color: '#C05621' },
  UNDER_MAINTENANCE: { label: 'Under Maint.', bg: '#FEF7C3', border: '#FDE047', color: '#B7791F' },
  OUT_OF_SERVICE: { label: 'Out of Service', bg: '#FEF2F2', border: '#FECDCA', color: '#C53030' },
  DECOMMISSIONED: { label: 'Decommissioned', bg: '#F2F4F7', border: '#D0D5DD', color: '#475467' },
  DISPOSED: { label: 'Disposed', bg: '#EAECF0', border: '#D0D5DD', color: '#344054' }
};

export const AssetStatusBadge = ({ status }) => {
  const conf = STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    bg: '#F2F4F7',
    border: '#D0D5DD',
    color: '#475467'
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
        className="status-dot"
        style={{ background: conf.color }}
      />
      {conf.label}
    </span>
  );
};

export default AssetStatusBadge;
