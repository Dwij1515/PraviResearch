import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import AssetStatusBadge from '../components/assets/AssetStatusBadge';
import ConditionBadge from '../components/assets/ConditionBadge';
import AssetOverview from '../components/passport/AssetOverview';
import LifecycleTimeline from '../components/passport/LifecycleTimeline';
import FinancialSummary from '../components/passport/FinancialSummary';
import QrIdentityCard from '../components/passport/QrIdentityCard';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const AssetDetail = () => {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAssetPassport = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await api.get(`/assets/${id}`);
      if (res.success && res.data) {
        setAsset(res.data);
      }
    } catch (err) {
      console.error('Failed to load asset passport:', err);
      setError(err.message || 'Unable to retrieve asset passport record.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAssetPassport();
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #D9E0E7',
        borderRadius: '8px',
        padding: '48px',
        textAlign: 'center',
        color: '#667085'
      }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1769AA' }}>
          LOADING ASSET DOSSIER FROM AMC REGISTRY...
        </div>
        <div style={{ fontSize: '0.78rem', color: '#667085', marginTop: '4px' }}>
          Retrieving physical specifications and historical lifecycle event chain
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #FECDCA',
        borderRadius: '8px',
        padding: '32px',
        textAlign: 'center'
      }}>
        <AlertCircle size={36} color="#C53030" style={{ margin: '0 auto 10px' }} />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#17212B', marginBottom: '6px' }}>
          Asset Record Retrieval Failure
        </h3>
        <p style={{ color: '#667085', fontSize: '0.84rem', maxWidth: '440px', margin: '0 auto 14px' }}>
          {error || 'Requested asset record does not exist or access was denied.'}
        </p>
        <Link to="/assets" className="btn-secondary">
          <ArrowLeft size={13} />
          Return to Registry
        </Link>
      </div>
    );
  }

  const score = asset.condition?.score || 0;
  const rating = asset.condition?.rating || 'UNRATED';

  const getConditionColor = (s) => {
    if (s >= 90) return '#16845B';
    if (s >= 75) return '#0E7090';
    if (s >= 60) return '#B7791F';
    if (s >= 40) return '#C05621';
    return '#C53030';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Back button */}
      <div>
        <Link
          to="/assets"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: '#1769AA',
            fontWeight: 500
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Asset Registry</span>
        </Link>
      </div>

      {/* Top Section Header Card */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="code-pill">
                {asset.assetTag}
              </span>
              <AssetStatusBadge status={asset.status} />
              <ConditionBadge rating={asset.condition?.rating} score={asset.condition?.score} />
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '4px',
                background: asset.criticality === 'CRITICAL' ? '#FEF2F2' :
                            asset.criticality === 'HIGH' ? '#FFEDD5' : '#F2F4F7',
                color: asset.criticality === 'CRITICAL' ? '#C53030' :
                       asset.criticality === 'HIGH' ? '#C05621' : '#475467',
                border: `1px solid ${
                  asset.criticality === 'CRITICAL' ? '#FECDCA' :
                  asset.criticality === 'HIGH' ? '#FDBA74' : '#D0D5DD'
                }`
              }}>
                {asset.criticality} CRITICALITY
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#17212B', letterSpacing: '-0.01em', marginTop: '4px' }}>
              {asset.name}
            </h1>

            <div style={{ fontSize: '0.8rem', color: '#667085', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Department: <strong style={{ color: '#17212B' }}>{asset.departmentId?.name || 'AMC'}</strong></span>
              <span>•</span>
              <span>QR: <strong style={{ color: '#17212B', fontFamily: 'var(--font-mono)' }}>{asset.qrCode?.identifier}</strong></span>
            </div>
          </div>

          {/* Condition Score Box */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #EAECF0',
            borderRadius: '6px',
            padding: '12px 18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: '130px'
          }}>
            <div style={{ fontSize: '0.7rem', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Condition Score
            </div>
            <div style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: getConditionColor(score),
              lineHeight: 1.1,
              fontFamily: 'var(--font-mono)',
              marginTop: '2px'
            }}>
              {score}<span style={{ fontSize: '0.9rem', color: '#667085', fontWeight: 500 }}>/100</span>
            </div>
            <div style={{
              fontSize: '0.74rem',
              fontWeight: 600,
              color: getConditionColor(score),
              marginTop: '1px'
            }}>
              {rating}
            </div>
          </div>
        </div>

        {/* Clean Condition Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#667085' }}>
            <span>Structural Health Meter</span>
            <span style={{ fontWeight: 600, color: getConditionColor(score) }}>{score}%</span>
          </div>
          <div style={{
            height: '6px',
            borderRadius: '3px',
            background: '#EAECF0',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: `${score}%`,
              background: getConditionColor(score),
              borderRadius: '3px'
            }} />
          </div>
        </div>
      </div>

      {/* Grid of Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
        {/* ASSET INFORMATION */}
        <AssetOverview asset={asset} />

        {/* DIGITAL IDENTITY */}
        <QrIdentityCard qrCode={asset.qrCode} />
      </div>

      {/* LIFECYCLE HISTORY */}
      <LifecycleTimeline
        events={asset.lifecycleHistory || []}
        currentStatus={asset.status}
      />

      {/* FINANCIAL INFORMATION */}
      <FinancialSummary financials={asset.financials} />
    </div>
  );
};

export default AssetDetail;
