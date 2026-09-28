import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { RefreshCw, ArrowRight, CheckCircle2, AlertTriangle, ShieldCheck, Activity, Layers } from 'lucide-react';

const LIFECYCLE_STAGES = [
  'PLANNING',
  'PROCUREMENT',
  'INSTALLATION',
  'COMMISSIONING',
  'OPERATIONAL',
  'UNDER_INSPECTION',
  'NEEDS_REPAIR',
  'UNDER_MAINTENANCE',
  'OUT_OF_SERVICE',
  'DECOMMISSIONED',
  'DISPOSED'
];

export const Lifecycle = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [error, setError] = useState('');

  const fetchAssets = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/assets', { limit: 100 });
      if (res.success && res.data?.items) {
        setAssets(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load assets for lifecycle view:', err);
      setError('Unable to load lifecycle asset records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Calculate counts per stage
  const stageCounts = LIFECYCLE_STAGES.reduce((acc, stage) => {
    acc[stage] = assets.filter(a => a.status === stage).length;
    return acc;
  }, {});

  const filteredAssets = selectedStage === 'ALL'
    ? assets
    : assets.filter(a => a.status === selectedStage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Institutional Header */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #D9E0E7',
        borderRadius: '6px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: '#1769AA',
              color: '#FFFFFF',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '3px'
            }}>
              AMC LIFECYCLE ENGINE
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Deterministic State Pipeline • 11 Standardized States
            </span>
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#17212B', margin: '4px 0 2px' }}>
            Municipal Asset Lifecycle Management
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#667085', margin: 0 }}>
            Monitor and govern physical assets across Planning, Commissioning, Active Service, Repair, and Decommissioning.
          </p>
        </div>

        <button
          onClick={fetchAssets}
          className="btn-secondary"
          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
        >
          <RefreshCw size={13} />
          Refresh Pipeline
        </button>
      </div>

      {/* 11-Stage Pipeline Overview Bar */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #D9E0E7',
        borderRadius: '6px',
        padding: '16px 20px'
      }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#17212B', marginBottom: '12px' }}>
          LIFECYCLE PIPELINE DISTRIBUTION
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '8px'
        }}>
          <div
            onClick={() => setSelectedStage('ALL')}
            style={{
              padding: '10px',
              borderRadius: '4px',
              border: selectedStage === 'ALL' ? '2px solid #1769AA' : '1px solid #E2E8F0',
              background: selectedStage === 'ALL' ? '#F0F7FF' : '#F8FAFC',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B' }}>TOTAL INVENTORY</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#17212B' }}>{assets.length}</div>
          </div>

          {LIFECYCLE_STAGES.map(stage => {
            const count = stageCounts[stage] || 0;
            const isSelected = selectedStage === stage;
            const isCritical = ['NEEDS_REPAIR', 'OUT_OF_SERVICE'].includes(stage) && count > 0;
            
            return (
              <div
                key={stage}
                onClick={() => setSelectedStage(stage)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '4px',
                  border: isSelected ? '2px solid #1769AA' : isCritical ? '1px solid #FECACA' : '1px solid #E2E8F0',
                  background: isSelected ? '#F0F7FF' : isCritical ? '#FEF2F2' : '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: isCritical ? '#B91C1C' : '#64748B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {stage.replace('_', ' ')}
                </div>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: isCritical ? '#DC2626' : count > 0 ? '#17212B' : '#94A3B8'
                }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtered Assets Table */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #D9E0E7',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid #D9E0E7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC'
        }}>
          <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#17212B' }}>
            Assets in {selectedStage === 'ALL' ? 'All Lifecycle Stages' : selectedStage.replace('_', ' ')} ({filteredAssets.length})
          </div>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Click 'View Passport & State Engine' to execute transitions
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748B', fontSize: '0.84rem' }}>
            Loading municipal assets...
          </div>
        ) : filteredAssets.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#64748B', fontSize: '0.84rem' }}>
            No assets currently in {selectedStage.replace('_', ' ')} stage.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Asset Tag</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Asset Name</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Department</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Status</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Condition Score</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569' }}>Criticality</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map(asset => {
                  const score = asset.condition?.score ?? 0;
                  const scoreColor = score >= 80 ? '#166534' : score >= 60 ? '#854D0E' : score >= 40 ? '#C2410C' : '#991B1B';

                  return (
                    <tr
                      key={asset._id}
                      style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.1s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600, color: '#1E293B' }}>
                        {asset.assetTag}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0F172A' }}>
                        {asset.name}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>
                        {asset.departmentId?.name || asset.departmentId?.code || 'AMC-CIVIL'}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: asset.status === 'OPERATIONAL' ? '#DCFCE7' : asset.status === 'NEEDS_REPAIR' ? '#FEE2E2' : '#FEF3C7',
                          color: asset.status === 'OPERATIONAL' ? '#166534' : asset.status === 'NEEDS_REPAIR' ? '#991B1B' : '#92400E'
                        }}>
                          {asset.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontWeight: 700, color: scoreColor }}>
                          {score} / 100
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: asset.criticality === 'CRITICAL' ? '#DC2626' : '#475569'
                        }}>
                          {asset.criticality || 'STANDARD'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => navigate(`/assets/${asset._id}`)}
                          className="btn-primary"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          Passport & Engine
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lifecycle;
