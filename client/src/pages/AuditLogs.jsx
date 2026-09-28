import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, RotateCw, CheckCircle2, Lock } from 'lucide-react';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [verified, setVerified] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const [logsRes, verifyRes] = await Promise.all([
        api.get('/audit', { limit: 100 }),
        api.get('/audit/verify')
      ]);

      if (logsRes.success) {
        setLogs(logsRes.data?.records || logsRes.data || []);
      }
      if (verifyRes.success) {
        setVerified(verifyRes.data?.isValid !== false);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, []);

  const getActionBadge = (action) => {
    const config = {
      CREATE: { color: '#16845B', bg: '#ECFDF3', border: '#A6F4C5' },
      UPDATE: { color: '#1769AA', bg: '#EFF8FF', border: '#B2DDFF' },
      STATE_TRANSITION: { color: '#B7791F', bg: '#FEF7C3', border: '#FDE047' },
      ARCHIVE_ATTEMPT: { color: '#C53030', bg: '#FEF2F2', border: '#FECDCA' }
    };
    const c = config[action] || { color: '#475467', bg: '#F2F4F7', border: '#D0D5DD' };
    return (
      <span style={{
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: 600,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color
      }}>
        {action}
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
              SHA-256 Chained Audit Ledger
            </h2>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              background: verified ? '#ECFDF3' : '#FEF2F2',
              color: verified ? '#16845B' : '#C53030',
              border: `1px solid ${verified ? '#A6F4C5' : '#FECDCA'}`
            }}>
              <CheckCircle2 size={12} />
              {verified ? 'CHAIN VERIFIED (CRYPTOGRAPHIC INTEGRITY INTACT)' : 'CHAIN ANOMALY DETECTED'}
            </span>
          </div>
          <p style={{ color: '#667085', fontSize: '0.8rem', marginTop: '2px' }}>
            Sequential hash-linked audit records capturing every mutation across assets, transitions, and work orders
          </p>
        </div>

        <button onClick={fetchAuditData} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.82rem' }}>
          <RotateCw size={13} />
          Verify Ledger Chain
        </button>
      </div>

      {/* Audit Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp (IST)</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Officer / Performer</th>
              <th>Justification / Context</th>
              <th>Previous Hash</th>
              <th>Entry Hash</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                  Loading cryptographic audit ledger...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                  No audit entries found.
                </td>
              </tr>
            ) : (
              logs.map((log, index) => (
                <tr key={log._id || index}>
                  <td>
                    <div style={{ fontSize: '0.78rem', color: '#17212B', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.timestamp).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        dateStyle: 'short',
                        timeStyle: 'medium'
                      })}
                    </div>
                  </td>
                  <td>
                    {getActionBadge(log.action)}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#344054' }}>
                      {log.entityName}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: '#17212B' }}>
                      {log.performedById?.name || log.performedById?.email || 'System Authority'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#667085' }}>
                      {log.performerRole}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.78rem', color: '#475467', maxWidth: '300px' }}>
                      {log.justification || 'Administrative ledger entry'}
                    </div>
                  </td>
                  <td>
                    <span className="code-pill" style={{ fontSize: '0.7rem' }}>
                      {log.previousHash ? log.previousHash.slice(0, 10) + '...' : 'GENESIS'}
                    </span>
                  </td>
                  <td>
                    <span className="code-pill" style={{ fontSize: '0.7rem', color: '#1769AA', background: '#EFF8FF', borderColor: '#B2DDFF' }}>
                      {log.hash ? log.hash.slice(0, 10) + '...' : 'SEALED'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
