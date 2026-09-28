import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  Wrench,
  Plus,
  RotateCw,
  CheckCircle2,
  Clock,
  Play,
  Check,
  AlertCircle
} from 'lucide-react';

export const WorkOrders = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [activeWo, setActiveWo] = useState(null);
  const [actionType, setActionType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [searchParams] = useSearchParams();
  const prefillAssetId = searchParams.get('assetId');

  // Create form state
  const [createData, setCreateData] = useState({
    assetId: prefillAssetId || '',
    title: '',
    description: '',
    priority: 'HIGH',
    estimatedCostInr: 25000,
    targetCompletionDate: ''
  });

  // Action modal form state (e.g. for complete work / verification)
  const [actionData, setActionData] = useState({
    actualCostInr: 25000,
    resolutionNotes: 'Corrective maintenance completed per municipal standards.',
    safetyClearanceVerified: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [woRes, assetRes] = await Promise.all([
        api.get('/work-orders', { limit: 50 }),
        api.get('/assets', { limit: 100 })
      ]);

      if (woRes.success) setWorkOrders(woRes.data.items || []);
      if (assetRes.success) setAssets(assetRes.data.items || []);

      if (prefillAssetId) {
        setShowCreateModal(true);
        // Prepopulate title
        const found = (assetRes.data?.items || []).find((a) => a._id === prefillAssetId);
        if (found) {
          setCreateData((prev) => ({
            ...prev,
            assetId: prefillAssetId,
            title: `Remediate defect on ${found.name}`,
            description: `Corrective structural repair initiated from field inspection on ${found.assetTag}`
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load work orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await api.post('/work-orders', createData);
      if (res.success) {
        setShowCreateModal(false);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to dispatch work order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteAction = async (wo, nextStatus) => {
    // If transitioning to PENDING_VERIFICATION or CLOSED, open modal for notes & cost
    if (['PENDING_VERIFICATION', 'VERIFIED'].includes(nextStatus)) {
      setActiveWo(wo);
      setActionType(nextStatus);
      setShowActionModal(true);
      return;
    }

    try {
      await api.patch(`/work-orders/${wo._id}/status`, { status: nextStatus });
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to advance work order status');
    }
  };

  const handleActionModalSubmit = async (e) => {
    e.preventDefault();
    if (!activeWo) return;
    setSubmitting(true);

    try {
      const payload = {
        status: actionType,
        resolutionNotes: actionData.resolutionNotes,
        actualCostInr: Number(actionData.actualCostInr) || 0,
        safetyClearanceVerified: actionData.safetyClearanceVerified
      };

      await api.patch(`/work-orders/${activeWo._id}/status`, payload);
      setShowActionModal(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getStatusBadge = (status) => {
    const config = {
      OPEN: { label: 'Open', color: '#1769AA', bg: '#EFF8FF', border: '#B2DDFF' },
      ASSIGNED: { label: 'Assigned', color: '#5B21B6', bg: '#F5F3FF', border: '#DDD6FE' },
      IN_PROGRESS: { label: 'In Progress', color: '#C05621', bg: '#FFEDD5', border: '#FDBA74' },
      PENDING_VERIFICATION: { label: 'Pending Verification', color: '#B7791F', bg: '#FEF7C3', border: '#FDE047' },
      VERIFIED: { label: 'Verified & Restored', color: '#16845B', bg: '#ECFDF3', border: '#A6F4C5' },
      CLOSED: { label: 'Closed', color: '#475467', bg: '#F2F4F7', border: '#D0D5DD' }
    };
    const c = config[status] || config.OPEN;
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.72rem',
        fontWeight: 600,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color
      }}>
        {c.label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Bar */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #D9E0E7',
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#17212B' }}>
              Municipal Work Orders & Maintenance Dispatch
            </h2>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#EFF8FF',
              color: '#1769AA',
              border: '1px solid #B2DDFF'
            }}>
              {workOrders.length} Work Orders
            </span>
          </div>
          <p style={{ color: '#667085', fontSize: '0.8rem', marginTop: '2px' }}>
            Contractor assignment, remediation execution, safety sign-off, and operational asset recovery
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          >
            <Plus size={14} />
            Dispatch Work Order
          </button>
          <button onClick={fetchData} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.82rem' }}>
            <RotateCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Work Order No</th>
              <th>Asset Target</th>
              <th>Task Description</th>
              <th>Priority</th>
              <th>Contractor / Custodian</th>
              <th>Status</th>
              <th>Cost (Approved)</th>
              <th style={{ textAlign: 'right' }}>Workflow Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                  Loading municipal work orders...
                </td>
              </tr>
            ) : workOrders.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                  No work orders currently active. Dispatch a corrective work order to remediate identified defects.
                </td>
              </tr>
            ) : (
              workOrders.map((wo) => (
                <tr key={wo._id}>
                  <td>
                    <span className="code-pill">{wo.workOrderNumber}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#17212B' }}>
                      {wo.assetId?.name || 'Municipal Asset'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#667085' }}>
                      {wo.assetId?.assetTag}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#17212B' }}>
                      {wo.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#667085', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {wo.description}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: wo.priority === 'CRITICAL' ? '#FEF2F2' : wo.priority === 'HIGH' ? '#FFEDD5' : '#F2F4F7',
                      color: wo.priority === 'CRITICAL' ? '#C53030' : wo.priority === 'HIGH' ? '#C05621' : '#475467'
                    }}>
                      {wo.priority}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: '#344054', fontWeight: 500 }}>
                      {wo.assignedContractorId?.name || 'Ahmedabad Infra Pvt Ltd'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#667085' }}>
                      {wo.assignedContractorId?.role || 'CONTRACTOR'}
                    </div>
                  </td>
                  <td>
                    {getStatusBadge(wo.status)}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#17212B', fontFamily: 'var(--font-mono)' }}>
                      {formatINR(wo.costBreakdown?.totalApprovedCostInr || wo.costBreakdown?.estimatedCostInr)}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {wo.status === 'OPEN' && (
                        <button
                          onClick={() => handleExecuteAction(wo, 'ASSIGNED')}
                          className="btn-primary"
                          style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                        >
                          Assign Contractor
                        </button>
                      )}

                      {wo.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleExecuteAction(wo, 'IN_PROGRESS')}
                          className="btn-primary"
                          style={{ padding: '3px 8px', fontSize: '0.74rem', background: '#C05621', borderColor: '#C05621' }}
                        >
                          <Play size={11} />
                          Start Work
                        </button>
                      )}

                      {wo.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleExecuteAction(wo, 'PENDING_VERIFICATION')}
                          className="btn-primary"
                          style={{ padding: '3px 8px', fontSize: '0.74rem', background: '#B7791F', borderColor: '#B7791F' }}
                        >
                          <Check size={11} />
                          Mark Completed
                        </button>
                      )}

                      {wo.status === 'PENDING_VERIFICATION' && (
                        <button
                          onClick={() => handleExecuteAction(wo, 'VERIFIED')}
                          className="btn-primary"
                          style={{ padding: '3px 8px', fontSize: '0.74rem', background: '#16845B', borderColor: '#16845B' }}
                        >
                          <CheckCircle2 size={11} />
                          Verify & Restore
                        </button>
                      )}

                      {['VERIFIED', 'CLOSED'].includes(wo.status) && (
                        <span style={{ fontSize: '0.74rem', color: '#16845B', fontWeight: 600 }}>
                          Restored & Active
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dispatch Work Order Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '540px', width: '100%', padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Dispatch Municipal Work Order
                </h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Authorize contractor deployment for asset remediation
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  fontSize: '1.2rem'
                }}
              >
                &times;
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--danger-light)', border: '1px solid var(--danger-border)', color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Target Infrastructure Asset *
                </label>
                <select
                  required
                  value={createData.assetId}
                  onChange={(e) => setCreateData({ ...createData, assetId: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                >
                  <option value="" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>Select Asset</option>
                  {assets.map((a) => (
                    <option key={a._id} value={a._id} style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                      {a.assetTag} — {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Work Order Title *
                </label>
                <input
                  type="text"
                  required
                  value={createData.title}
                  onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                  placeholder="e.g. Concrete crack injection and seal replacement..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Detailed Scope of Work *
                </label>
                <textarea
                  rows="3"
                  required
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  placeholder="Describe necessary engineering intervention, safety clearances, and materials..."
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Priority
                  </label>
                  <select
                    value={createData.priority}
                    onChange={(e) => setCreateData({ ...createData, priority: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                  >
                    <option value="CRITICAL" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>Critical</option>
                    <option value="HIGH" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>High</option>
                    <option value="MEDIUM" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>Medium</option>
                    <option value="LOW" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>Low</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Estimated Budget (INR ₹)
                  </label>
                  <input
                    type="number"
                    value={createData.estimatedCostInr}
                    onChange={(e) => setCreateData({ ...createData, estimatedCostInr: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
                  {submitting ? 'Dispatching...' : 'Authorize Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action / Completion / Verification Modal */}
      {showActionModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '500px', width: '100%', padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {actionType === 'VERIFIED' ? 'Executive Engineer Verification' : 'Contractor Work Completion'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {actionType === 'VERIFIED' ? 'Sign off safety clearance & restore asset to OPERATIONAL' : 'Log actual costs and engineering remediation notes'}
                </p>
              </div>
              <button
                onClick={() => setShowActionModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-subtle)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  fontSize: '1.2rem'
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleActionModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Final Incurred Repair Cost (INR ₹)
                </label>
                <input
                  type="number"
                  required
                  value={actionData.actualCostInr}
                  onChange={(e) => setActionData({ ...actionData, actualCostInr: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Resolution Notes & Physical Work Completed
                </label>
                <textarea
                  rows="3"
                  required
                  value={actionData.resolutionNotes}
                  onChange={(e) => setActionData({ ...actionData, resolutionNotes: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.84rem' }}
                />
              </div>

              {actionType === 'VERIFIED' && (
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--success-light)',
                  border: '1px solid var(--success-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <input
                    type="checkbox"
                    id="safetyCheck"
                    checked={actionData.safetyClearanceVerified}
                    onChange={(e) => setActionData({ ...actionData, safetyClearanceVerified: e.target.checked })}
                    style={{ accentColor: 'var(--success)', width: '16px', height: '16px' }}
                  />
                  <label htmlFor="safetyCheck" style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>
                    Confirm physical safety inspection verified. Restore asset condition score to healthy baseline.
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowActionModal(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.82rem' }}>
                  {submitting ? 'Submitting...' : actionType === 'VERIFIED' ? 'Verify & Restore' : 'Submit Completion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrders;
