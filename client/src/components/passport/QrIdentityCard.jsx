import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { QrCode, CheckCircle2, Clock, ExternalLink } from 'lucide-react';

export const QrIdentityCard = ({ qrCode = {} }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const isPending = qrCode.status === 'PENDING_ACTIVATION';
  const qrId = qrCode.identifier || 'IAMS-UNASSIGNED';

  const resolverUrl = `${window.location.origin}/qr/${qrId}`;

  useEffect(() => {
    if (qrId) {
      QRCode.toDataURL(resolverUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#17212B',
          light: '#FFFFFF'
        }
      })
        .then(setQrDataUrl)
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [qrId, resolverUrl]);

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
          Digital Identity & QR Identifier
        </h3>
        <p style={{ fontSize: '0.74rem', color: '#667085', marginTop: '2px' }}>
          Cryptographic token anchor for physical field verification
        </p>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Real Generated QR Image */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '6px',
          background: '#FFFFFF',
          border: '1px solid #D9E0E7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR for ${qrId}`} style={{ width: '100%', height: '100%' }} />
          ) : (
            <QrCode size={36} color="#1769AA" />
          )}
        </div>

        {/* Token Details */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              QR Token Identifier
            </div>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: 700,
              color: '#17212B',
              fontFamily: 'var(--font-mono)'
            }}>
              {qrId}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 600,
              background: isPending ? '#FEF7C3' : '#ECFDF3',
              border: `1px solid ${isPending ? '#FDE047' : '#A6F4C5'}`,
              color: isPending ? '#B7791F' : '#16845B'
            }}>
              {isPending ? <Clock size={11} /> : <CheckCircle2 size={11} />}
              {qrCode.status || 'PENDING_ACTIVATION'}
            </span>

            <span style={{ fontSize: '0.74rem', color: '#667085' }}>
              Non-sequential cryptographic hash
            </span>
          </div>

          <div style={{ marginTop: '4px' }}>
            <Link
              to={`/qr/${qrId}`}
              target="_blank"
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Scan / Open QR Passport</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrIdentityCard;
