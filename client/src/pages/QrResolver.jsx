import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import AssetStatusBadge from '../components/assets/AssetStatusBadge';
import ConditionBadge from '../components/assets/ConditionBadge';
import {
  QrCode,
  ShieldCheck,
  Building2,
  MapPin,
  Clock,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export const QrResolver = () => {
  const { qrIdentifier } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const resolveQr = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/assets/qr/${qrIdentifier}`);
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'QR token verification failed');
      } finally {
        setLoading(false);
      }
    };

    if (qrIdentifier) {
      resolveQr();
    }
  }, [qrIdentifier]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F7FA',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', color: '#667085' }}>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1769AA', marginBottom: '6px' }}>
            VERIFYING CRYPTOGRAPHIC ASSET TOKEN...
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            Resolving identifier against Ahmedabad Municipal Corporation registry
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F7FA',
        padding: '20px'
      }}>
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #D9E0E7',
          borderRadius: '8px',
          padding: '32px',
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center'
        }}>
          <AlertCircle size={36} color="#C53030" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#17212B' }}>
            Unregistered QR Token
          </h2>
          <p style={{ color: '#667085', fontSize: '0.84rem', marginTop: '6px', marginBottom: '16px' }}>
            {error || 'This QR identifier does not exist in the official AMC infrastructure registry.'}
          </p>
          <Link to="/login" className="btn-secondary">
            Command Center Login
          </Link>
        </div>
      </div>
    );
  }

  const { asset, qrStatus, fieldActive, message } = data;
  const coords = asset.location?.coordinates || [0, 0];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F7FA',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* AMC Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: '#1769AA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            marginBottom: '8px'
          }}>
            <Building2 size={22} />
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#17212B' }}>
            Ahmedabad Municipal Corporation
          </div>
          <div style={{ fontSize: '0.76rem', color: '#667085' }}>
            Digital Infrastructure Identity Passport
          </div>
        </div>

        {/* Token Status Banner */}
        <div style={{
          background: fieldActive ? '#ECFDF3' : '#FEF7C3',
          border: `1px solid ${fieldActive ? '#A6F4C5' : '#FDE047'}`,
          borderRadius: '6px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {fieldActive ? <ShieldCheck size={20} color="#16845B" /> : <Clock size={20} color="#B7791F" />}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: fieldActive ? '#16845B' : '#B7791F' }}>
              Token Status: {qrStatus}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#344054' }}>
              {message}
            </div>
          </div>
        </div>

        {/* Asset Details Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #D9E0E7',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(16, 24, 40, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div>
            <span className="code-pill" style={{ fontSize: '0.76rem' }}>
              {asset.assetTag}
            </span>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#17212B', marginTop: '4px' }}>
              {asset.name}
            </h1>
            <div style={{ fontSize: '0.78rem', color: '#667085', marginTop: '2px' }}>
              {asset.category?.replace('_', ' ')} • {asset.subType || 'Infrastructure'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <AssetStatusBadge status={asset.status} />
            <ConditionBadge rating={asset.condition?.rating} score={asset.condition?.score} />
          </div>

          <div style={{
            background: '#F8FAFC',
            border: '1px solid #EAECF0',
            borderRadius: '6px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: '#667085', textTransform: 'uppercase' }}>
                Department
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#17212B' }}>
                {asset.department?.name || 'AMC'} ({asset.department?.code})
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: '#667085', textTransform: 'uppercase' }}>
                Location
              </div>
              <div style={{ fontSize: '0.84rem', color: '#17212B' }}>
                {asset.location?.address || 'Ahmedabad, Gujarat'} • Ward: {asset.location?.ward || 'Central'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#1769AA', fontFamily: 'var(--font-mono)' }}>
                {coords[1]?.toFixed(5)}° N, {coords[0]?.toFixed(5)}° E
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', color: '#667085', textTransform: 'uppercase' }}>
                Cryptographic Token Nonce
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#17212B', fontFamily: 'var(--font-mono)' }}>
                {asset.qrCode?.identifier}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '6px' }}>
            <Link to="/login" style={{ fontSize: '0.78rem', color: '#1769AA', fontWeight: 600 }}>
              Authorized AMC Command Access →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrResolver;
