import React from 'react';

export const FinancialSummary = ({ financials = {} }) => {
  const formatINR = (val) => {
    if (val === undefined || val === null) return '₹ 0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const items = [
    { label: 'Procurement Cost', value: financials.procurementCost, highlight: true },
    { label: 'Installation Cost', value: financials.installationCost },
    { label: 'Cumulative Maintenance', value: financials.maintenanceCost },
    { label: 'Cumulative Repairs', value: financials.repairCost },
    { label: 'Current Book Value', value: financials.currentBookValue, highlight: true, color: '#16845B' },
    { label: 'Replacement Estimate', value: financials.replacementCostEstimate, color: '#B7791F' },
    { label: 'Useful Life', value: financials.usefulLifeYears ? `${financials.usefulLifeYears} Years` : 'N/A', isText: true },
    { label: 'Annual Depreciation', value: financials.annualDepreciation },
    { label: 'Total Lifecycle Cost', value: financials.totalLifecycleCost, highlight: true, color: '#1769AA' }
  ];

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #D9E0E7',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ borderBottom: '1px solid #EAECF0', paddingBottom: '12px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#17212B' }}>
          Financial Valuation & Depreciation
        </h3>
        <p style={{ fontSize: '0.74rem', color: '#667085', marginTop: '2px' }}>
          Capital expenditure, depreciated book value, and replacement projections (INR ₹)
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              background: item.highlight ? '#EFF8FF' : '#F8FAFC',
              border: item.highlight ? '1px solid #B2DDFF' : '1px solid #EAECF0',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              {item.label}
            </div>
            <div style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: item.color || '#17212B',
              fontFamily: item.isText ? 'var(--font-sans)' : 'var(--font-mono)'
            }}>
              {item.isText ? item.value : formatINR(item.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FinancialSummary;
