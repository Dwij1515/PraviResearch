import React from 'react';
import { Link } from 'react-router-dom';
import AssetStatusBadge from './AssetStatusBadge';
import ConditionBadge from './ConditionBadge';
import { SkeletonRow } from '../common/SkeletonLoader';

export const AssetTable = ({ assets = [], loading = false }) => {
  if (loading) {
    return (
      <div
        className="card-panel"
        style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ color: 'var(--primary)', fontSize: '0.86rem', fontWeight: 700 }}>
            ⚡ SYNCHRONIZING ASSET REGISTRY VIA SWR CACHE...
          </div>
          <span className="turbo-badge">FAST QUERY</span>
        </div>
        <SkeletonRow count={7} />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div
        className="card-panel"
        style={{
          padding: '48px',
          textAlign: 'center'
        }}
      >
        <div style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>
          No Matching Municipal Assets Found
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          Try clearing search filters or adjusting department scope.
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Asset Tag</th>
            <th>Department</th>
            <th>Lifecycle</th>
            <th>Condition</th>
            <th>Criticality</th>
            <th>Location</th>
            <th style={{ textAlign: 'right' }}>Passport</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => {
            const [lng, lat] = asset.location?.coordinates || [0, 0];
            const coordStr = `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;

            return (
              <tr key={asset._id}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.86rem' }}>
                    {asset.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {asset.category?.replace('_', ' ')} • {asset.subType || 'Infrastructure'}
                  </div>
                </td>

                <td>
                  <span className="code-pill">{asset.assetTag}</span>
                </td>

                <td>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {asset.departmentId?.name || 'Municipal Corp'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {asset.departmentId?.code || 'AMC'}
                  </div>
                </td>

                <td>
                  <AssetStatusBadge status={asset.status} />
                </td>

                <td>
                  <ConditionBadge
                    rating={asset.condition?.rating}
                    score={asset.condition?.score}
                  />
                </td>

                <td>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: asset.criticality === 'CRITICAL' ? 'var(--danger-light)' :
                                  asset.criticality === 'HIGH' ? 'var(--warning-light)' :
                                  asset.criticality === 'MEDIUM' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-subtle)',
                      color: asset.criticality === 'CRITICAL' ? 'var(--danger)' :
                             asset.criticality === 'HIGH' ? 'var(--warning)' :
                             asset.criticality === 'MEDIUM' ? '#F59E0B' : 'var(--text-muted)',
                      border: `1px solid ${
                        asset.criticality === 'CRITICAL' ? 'var(--danger-border)' :
                        asset.criticality === 'HIGH' ? 'var(--warning-border)' :
                        asset.criticality === 'MEDIUM' ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)'
                      }`
                    }}
                  >
                    {asset.criticality}
                  </span>
                </td>

                <td>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-main)' }}>
                    {asset.location?.ward || 'Ahmedabad'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {coordStr}
                  </div>
                </td>

                <td style={{ textAlign: 'right' }}>
                  <Link
                    to={`/assets/${asset._id}`}
                    className="btn-primary"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      display: 'inline-flex'
                    }}
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AssetTable;
