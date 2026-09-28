import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ConditionBadge from '../components/assets/ConditionBadge';
import {
  ClipboardCheck,
  Plus,
  AlertTriangle,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Wrench,
  ExternalLink
} from 'lucide-react';

export const Inspections = () => {
  const [inspections, setInspections] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastSubmissionResult, setLastSubmissionResult] = useState(null);

  const [searchParams] = useSearchParams();
  const prefillAssetId = searchParams.get('assetId');

  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    assetId: prefillAssetId || '',
    overallConditionScore: 75,
    type: 'ROUTINE_QUARTERLY',
    findings: '',
    defectDescription: '',
    defectSeverity: 'SEVERE',
    recommendation: '',
    nextInspectionDue: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [insRes, assetRes] = await Promise.all([
        api.get('/inspections', { limit: 50 }),
        api.get('/assets', { limit: 100 })
      ]);

      if (insRes.success) setInspections(insRes.data.items || []);
      if (assetRes.success) setAssets(assetRes.data.items || []);

      if (prefillAssetId) {
        setShowModal(true);
      }
    } catch (err) {
      console.error('Failed to load inspection data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getRatingForScore = (s) => {
    if (s >= 90) return 'EXCELLENT';
    if (s >= 75) return 'GOOD';
    if (s >= 60) return 'FAIR';
    if (s >= 40) return 'POOR';
    return 'CRITICAL';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const defects = formData.defectDescription.trim()
        ? [{ description: formData.defectDescription, severity: formData.defectSeverity }]
        : [];

      const payload = {
        assetId: formData.assetId,
        overallConditionScore: Number(formData.overallConditionScore),
        type: formData.type,
        findings: formData.findings,
        defects,
        recommendation: formData.recommendation,
        nextInspectionDue: formData.nextInspectionDue || undefined
      };

      const res = await api.post('/inspections', payload);
      if (res.success) {
        setLastSubmissionResult(res.data);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit inspection');
    } finally {
      setSubmitting(false);
    }
  };

  const currentScore = Number(formData.overallConditionScore);
  const currentRating = getRatingForScore(currentScore);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
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
              Field Inspection Clearance Workflow
            </h2>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#ECFDF3',
              color: '#16845B',
              border: '1px solid #A6F4C5'
            }}>
              Operational
            </span>
          </div>
          <p style={{ color: '#667085', fontSize: '0.8rem', marginTop: '2px' }}>
            Periodic physical inspections, defect evaluation, and automated asset condition recalculation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => {
              setLastSubmissionResult(null);
              setShowModal(true);
            }}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '0.82rem' }}
          >
            <Plus size={14} />
            Start Inspection
          </button>
          <button onClick={fetchData} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.82rem' }}>
            <RotateCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Inspection No</th>
              <th>Asset</th>
              <th>Inspection Date</th>
              <th>Inspector</th>
              <th>Score / Health</th>
              <th>Defects Identified</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                  Loading inspection records...
                </td>
              </tr>
            ) : inspections.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                  No inspections recorded yet. Click "Start Inspection" to log field telemetry.
                </td>
              </tr>
            ) : (
              inspections.map((ins) => (
                <tr key={ins._id}>
                  <td>
                    <span className="code-pill">{ins.inspectionNumber}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#17212B' }}>
                      {ins.assetId?.name || 'Municipal Asset'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#667085' }}>
                      {ins.assetId?.assetTag}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: '#17212B' }}>
                      {new Date(ins.performedDate).toLocaleDateString('en-IN')}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#667085' }}>
                      {ins.type}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: '#344054', fontWeight: 500 }}>
                      {ins.inspectorId?.name || 'AMC Inspector'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#667085' }}>
                      {ins.inspectorId?.role}
                    </div>
                  </td>
                  <td>
                    <ConditionBadge rating={ins.conditionRating} score={ins.overallConditionScore} />
                  </td>
                  <td>
                    {ins.defects?.length > 0 ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: '#FEF2F2',
                        border: '1px solid #FECDCA',
                        color: '#C53030'
                      }}>
                        <AlertTriangle size={11} />
                        {ins.defects.length} Defect(s)
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.74rem', color: '#16845B' }}>
                        None detected
                      </span>
                    )}
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: '#F2F4F7',
                      color: '#475467'
                    }}>
                      {ins.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {ins.assetId?._id && (
                      <Link
                        to={`/assets/${ins.assetId._id}`}
                        className="btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                      >
                        Passport
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Start Inspection Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Log Field Inspection
                </h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Evaluate structural integrity & record physical observations
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
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

            {/* If previous submission identified defect, prompt for work order! */}
            {lastSubmissionResult && lastSubmissionResult.defectDetected && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECDCA',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C53030', fontWeight: 600, fontSize: '0.84rem' }}>
                  <AlertTriangle size={16} />
                  <span>DEFECT DETECTED — REPAIR REQUIRED</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#344054' }}>
                  Asset condition dropped and was auto-transitioned to <strong>NEEDS_REPAIR</strong>. Dispatch a corrective work order immediately.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/work-orders?assetId=${lastSubmissionResult.asset.id}`);
                  }}
                  className="btn-primary"
                  style={{ background: '#C53030', borderColor: '#C53030', padding: '6px 12px', fontSize: '0.78rem', alignSelf: 'flex-start' }}
                >
                  <Wrench size={13} />
                  Create Work Order Now
                </button>
              </div>
            )}

            {error && (
              <div style={{
                padding: '10px',
                borderRadius: '6px',
                background: '#FEF2F2',
                border: '1px solid #FECDCA',
                color: '#C53030',
                fontSize: '0.82rem',
                marginBottom: '14px'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Target Asset *
                </label>
                <select
                  required
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle)',
                    fontSize: '0.84rem',
                    color: 'var(--text-main)'
                  }}
                >
                  <option value="" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>Select Municipal Asset</option>
                  {assets.map((a) => (
                    <option key={a._id} value={a._id} style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                      {a.assetTag} — {a.name} ({a.departmentId?.code || 'AMC'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Condition Score (0–100) *
                  </label>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {currentScore}/100 → {currentRating}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.overallConditionScore}
                  onChange={(e) => setFormData({ ...formData, overallConditionScore: e.target.value })}
                  style={{ width: '100%', accentColor: 'var(--primary)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Field Findings & Observations
                </label>
                <textarea
                  rows="2"
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  placeholder="Record structural, mechanical, or surface condition notes..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle)',
                    fontSize: '0.84rem',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Defect Description (Leave blank if fully operational)
                </label>
                <input
                  type="text"
                  value={formData.defectDescription}
                  onChange={(e) => setFormData({ ...formData, defectDescription: e.target.value })}
                  placeholder="e.g. Concrete spalling on pier 4, hydraulic valve seal leakage..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-subtle)',
                    fontSize: '0.84rem',
                    color: 'var(--text-main)'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Defect Severity
                  </label>
                  <select
                    value={formData.defectSeverity}
                    onChange={(e) => setFormData({ ...formData, defectSeverity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-subtle)',
                      fontSize: '0.82rem',
                      color: 'var(--text-main)'
                    }}
                  >
                    <option value="SEVERE" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>Severe (Critical / Immediate Hazard)</option>
                    <option value="MODERATE" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>Moderate (Repair Needed)</option>
                    <option value="MINOR" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>Minor (Superficial / Wear)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Next Inspection Due
                  </label>
                  <input
                    type="date"
                    value={formData.nextInspectionDue}
                    onChange={(e) => setFormData({ ...formData, nextInspectionDue: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-subtle)',
                      fontSize: '0.82rem',
                      color: 'var(--text-main)'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Field Clearance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inspections;
