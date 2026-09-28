import React from 'react';

export const FinancialSnapshot = ({ assets = [] }) => {
  // Aggregate real financial values from loaded assets
  const totals = assets.reduce(
    (acc, a) => {
      const fin = a.financials || {};
      acc.procurement += Number(fin.procurementCost || 0);
      acc.bookValue += Number(fin.currentBookValue || fin.procurementCost || 0);
      acc.replacement += Number(fin.replacementCostEstimate || 0);
      acc.maintenance += Number(fin.maintenanceCost || 0) + Number(fin.repairCost || 0);
      return acc;
    },
    { procurement: 0, bookValue: 0, replacement: 0, maintenance: 0 }
  );

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div
      className="card-panel"
      style={{
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Capital Valuation & Expenditure
          </h3>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Cumulative capital valuation across scoped infrastructure portfolio
          </p>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-subtle)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-color)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          INR (₹) Standard
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
            Procurement Value
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
            {formatINR(totals.procurement)}
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
            Current Book Value
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>
            {formatINR(totals.bookValue)}
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
            Replacement Estimate
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning)', fontFamily: 'var(--font-heading)' }}>
            {formatINR(totals.replacement)}
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
            Maintenance & Repairs
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#F97316', fontFamily: 'var(--font-heading)' }}>
            {formatINR(totals.maintenance)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSnapshot;
