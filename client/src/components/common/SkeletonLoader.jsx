import React from 'react';

export const SkeletonCard = ({ height = '110px' }) => (
  <div
    className="skeleton-shimmer"
    style={{
      height,
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-color)',
      width: '100%'
    }}
  />
);

export const SkeletonRow = ({ count = 5 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="skeleton-shimmer"
        style={{
          height: '42px',
          borderRadius: 'var(--radius-sm)',
          width: '100%'
        }}
      />
    ))}
  </div>
);

export const SkeletonDashboard = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    {/* KPI cards skeleton */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '12px'
    }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonCard key={i} height="100px" />
      ))}
    </div>

    {/* Row 2 charts */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '16px'
    }}>
      <SkeletonCard height="240px" />
      <SkeletonCard height="240px" />
    </div>

    {/* Row 3 table skeleton */}
    <SkeletonCard height="320px" />
  </div>
);

export default SkeletonDashboard;
