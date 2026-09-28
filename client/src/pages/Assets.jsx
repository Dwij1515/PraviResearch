import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AssetFilters from '../components/assets/AssetFilters';
import AssetTable from '../components/assets/AssetTable';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  AlertCircle,
  Plus,
  X,
  CheckCircle2,
  Building2,
  ArrowRight
} from 'lucide-react';

const CATEGORIES = [
  'ROAD',
  'BRIDGE',
  'BUILDING',
  'SCHOOL',
  'HOSPITAL',
  'WATER',
  'STREETLIGHT',
  'PARK',
  'VEHICLE'
];

const CRITICALITY_LEVELS = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL_INFRASTRUCTURE'
];

export const Assets = () => {
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Register Modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [createdAsset, setCreatedAsset] = useState(null);

  const [formData, setFormData] = useState({
    assetTag: `AMC-INFRA-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    category: 'ROAD',
    departmentId: '',
    criticality: 'MEDIUM',
    address: 'Ashram Road, Navrangpura',
    ward: 'Ward 12',
    zone: 'WEST',
    longitude: 72.5714,
    latitude: 23.0225,
    conditionScore: 85,
    procurementCost: 2500000,
    usefulLifeYears: 25
  });

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    conditionRating: '',
    criticality: '',
    page: 1,
    limit: 10
  });

  const fetchAssets = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get('/assets', filters);
      if (res.success && res.data) {
        setAssets(res.data.items || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to load assets:', err);
      setError(err.message || 'Error querying asset directory.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.success && Array.isArray(res.data)) {
        setDepartments(res.data);
        if (res.data.length > 0 && !formData.departmentId) {
          setFormData((prev) => ({ ...prev, departmentId: res.data[0]._id }));
        }
      }
    } catch (err) {
      console.warn('Unable to load departments list:', err);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [filters]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: '',
      status: '',
      conditionRating: '',
      criticality: '',
      page: 1,
      limit: 10
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleOpenModal = () => {
    setFormData({
      assetTag: `AMC-INFRA-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'ROAD',
      departmentId: departments[0]?._id || '',
      criticality: 'MEDIUM',
      address: 'Ashram Road, Navrangpura',
      ward: 'Ward 12',
      zone: 'WEST',
      longitude: 72.5714,
      latitude: 23.0225,
      conditionScore: 85,
      procurementCost: 2500000,
      usefulLifeYears: 25
    });
    setModalError('');
    setCreatedAsset(null);
    setShowModal(true);
  };

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      const payload = {
        assetTag: formData.assetTag.trim().toUpperCase(),
        name: formData.name.trim(),
        category: formData.category,
        departmentId: formData.departmentId || departments[0]?._id,
        criticality: formData.criticality,
        location: {
          type: 'Point',
          coordinates: [Number(formData.longitude), Number(formData.latitude)],
          address: formData.address.trim(),
          ward: formData.ward.trim(),
          zone: formData.zone.trim()
        },
        condition: {
          score: Number(formData.conditionScore)
        },
        financials: {
          procurementCost: Number(formData.procurementCost),
          installationCost: Math.round(Number(formData.procurementCost) * 0.1),
          usefulLifeYears: Number(formData.usefulLifeYears)
        }
      };

      const res = await api.post('/assets', payload);
      if (res.success && res.data) {
        setCreatedAsset(res.data);
        fetchAssets();
      }
    } catch (err) {
      console.error('Failed to create asset:', err);
      setModalError(err.message || 'Failed to register municipal asset.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Title & Stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#17212B', letterSpacing: '-0.01em' }}>
              Municipal Asset Registry
            </h2>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#EFF8FF',
              border: '1px solid #B2DDFF',
              color: '#1769AA'
            }}>
              {pagination.total} Records
            </span>
          </div>
          <p style={{ color: '#667085', fontSize: '0.84rem', marginTop: '2px' }}>
            Central physical infrastructure registry of Ahmedabad Municipal Corporation
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleOpenModal}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            <Plus size={14} />
            Register Asset
          </button>

          <button onClick={fetchAssets} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            <RotateCw size={13} />
            Sync
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <AssetFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Error alert */}
      {error && (
        <div style={{
          padding: '10px 12px',
          borderRadius: '6px',
          background: '#FEF2F2',
          border: '1px solid #FECDCA',
          color: '#C53030',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Asset Table */}
      <AssetTable assets={assets} loading={loading} />

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderRadius: '6px',
          background: '#FFFFFF',
          border: '1px solid #D9E0E7',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#667085' }}>
            Showing page <strong style={{ color: '#17212B' }}>{pagination.page}</strong> of{' '}
            <strong style={{ color: '#17212B' }}>{pagination.pages}</strong> ({pagination.total} total assets)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              <ChevronLeft size={13} />
              Previous
            </button>

            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#17212B', padding: '0 6px' }}>
              {pagination.page} / {pagination.pages}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              Next
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Register Asset Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface-elevated)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Register New Municipal Asset
                </h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Commission physical infrastructure into the Ahmedabad AMC registry
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
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              {createdAsset ? (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '6px'
                }}>
                  <CheckCircle2 size={40} color="#16A34A" style={{ margin: '0 auto 10px' }} />
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#166534', margin: '0 0 6px' }}>
                    Asset Commissioned Successfully!
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: '#15803D', margin: '0 0 16px' }}>
                    <strong>{createdAsset.name}</strong> has been assigned tag{' '}
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{createdAsset.assetTag}</span> with a secure cryptographic QR identifier.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => navigate(`/assets/${createdAsset._id}`)}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      Open Asset Passport
                      <ArrowRight size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setCreatedAsset(null);
                        handleOpenModal();
                      }}
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                    >
                      Register Another
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateAsset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {modalError && (
                    <div style={{
                      padding: '10px 12px',
                      background: '#FEF2F2',
                      border: '1px solid #FECDCA',
                      borderRadius: '6px',
                      color: '#B91C1C',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <AlertCircle size={15} />
                      <span>{modalError}</span>
                    </div>
                  )}

                  {/* Row 1: Tag & Name */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Asset Tag *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.assetTag}
                        onChange={(e) => setFormData({ ...formData, assetTag: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '4px',
                          fontSize: '0.82rem',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Asset Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ellis Bridge Span Reconstruction"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '4px',
                          fontSize: '0.82rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 2: Category, Department, Criticality */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          background: '#FFFFFF'
                        }}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Department *
                      </label>
                      <select
                        value={formData.departmentId}
                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          background: '#FFFFFF'
                        }}
                      >
                        {departments.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.code} — {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Criticality *
                      </label>
                      <select
                        value={formData.criticality}
                        onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '7px 8px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          background: '#FFFFFF'
                        }}
                      >
                        {CRITICALITY_LEVELS.map((crit) => (
                          <option key={crit} value={crit}>{crit.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Location details */}
                  <div style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                      GIS & FIELD LOCATION (Ahmedabad Corporation)
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', marginBottom: '2px' }}>
                          Physical Address
                        </label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.78rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', marginBottom: '2px' }}>
                          Ward
                        </label>
                        <input
                          type="text"
                          value={formData.ward}
                          onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.78rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', marginBottom: '2px' }}>
                          Zone
                        </label>
                        <select
                          value={formData.zone}
                          onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.78rem', background: '#FFFFFF' }}
                        >
                          <option value="CENTRAL">CENTRAL</option>
                          <option value="WEST">WEST</option>
                          <option value="EAST">EAST</option>
                          <option value="NORTH">NORTH</option>
                          <option value="SOUTH">SOUTH</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', marginBottom: '2px' }}>
                          Longitude [72.4 – 72.7]
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.78rem', fontFamily: 'monospace' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748B', marginBottom: '2px' }}>
                          Latitude [22.9 – 23.2]
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                          style={{ width: '100%', padding: '6px 8px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.78rem', fontFamily: 'monospace' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Condition Score & Cost */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#475569' }}>
                          Initial Condition Score: {formData.conditionScore}/100
                        </label>
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: formData.conditionScore >= 80 ? '#16A34A' : '#D97706' }}>
                          {formData.conditionScore >= 80 ? 'EXCELLENT / GOOD' : 'FAIR'}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={formData.conditionScore}
                        onChange={(e) => setFormData({ ...formData, conditionScore: parseInt(e.target.value, 10) })}
                        style={{ width: '100%', accentColor: '#1769AA' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Procurement Cost (₹ INR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={formData.procurementCost}
                        onChange={(e) => setFormData({ ...formData, procurementCost: parseFloat(e.target.value) || 0 })}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          border: '1px solid #CBD5E1',
                          borderRadius: '4px',
                          fontSize: '0.8rem'
                        }}
                      />
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
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
                      style={{ padding: '8px 18px', fontSize: '0.8rem' }}
                    >
                      {submitting ? 'Registering...' : 'Register Asset in Registry'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
