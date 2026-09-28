import React from 'react';
import { Link } from 'react-router-dom';
import AssetStatusBadge from '../assets/AssetStatusBadge';
import ConditionBadge from '../assets/ConditionBadge';
import { SkeletonRow } from '../common/SkeletonLoader';

export const CriticalAssets = ({ assets = [], loading = false }) => {
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Critical Infrastructure Watchlist
          </h3>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Assets flagged with critical condition scores or active service disruptions
          </p>
        </div>
        <Link
          to="/assets"
          style={{
            fontSize: '0.8rem',
            color: 'var(--primary)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          View Full Registry →
        </Link>
      </div>

      {/* Asset Table */}
      {loading ? (
        <div style={{ padding: '12px 0' }}>
          <SkeletonRow count={4} />
        </div>
      ) : assets.length === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            fontSize: '0.84rem'
          }}
        >
          No assets currently flagged in critical state. All monitored systems operational.
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Asset Tag</th>
                <th>Department</th>
                <th>Status</th>
                <th>Condition</th>
                <th>Criticality</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{asset.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{asset.category?.replace('_', ' ')}</div>
                  </td>
                  <td>
                    <span className="code-pill">{asset.assetTag}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {asset.departmentId?.name || asset.departmentId?.code || 'AMC'}
                    </span>
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
                                    asset.criticality === 'HIGH' ? 'var(--warning-light)' : 'var(--bg-subtle)',
                        color: asset.criticality === 'CRITICAL' ? 'var(--danger)' :
                               asset.criticality === 'HIGH' ? 'var(--warning)' : 'var(--text-secondary)',
                        border: `1px solid ${
                          asset.criticality === 'CRITICAL' ? 'var(--danger-border)' :
                          asset.criticality === 'HIGH' ? 'var(--warning-border)' : 'var(--border-color)'
                        }`
                      }}
                    >
                      {asset.criticality}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      to={`/assets/${asset._id}`}
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                    >
                      Passport
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CriticalAssets;
