import React from 'react';
import AssetStatusBadge from '../assets/AssetStatusBadge';

export const LifecycleTimeline = ({ events = [], currentStatus }) => {
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EAECF0', paddingBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#17212B' }}>
            Lifecycle Transition History
          </h3>
          <p style={{ fontSize: '0.74rem', color: '#667085', marginTop: '2px' }}>
            Deterministic state transition audit trail
          </p>
        </div>
        <div>
          <AssetStatusBadge status={currentStatus} />
        </div>
      </div>

      {events.length === 0 ? (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: '#667085',
          background: '#F8FAFC',
          borderRadius: '6px',
          border: '1px solid #EAECF0',
          fontSize: '0.82rem'
        }}>
          Initial state record: Asset currently in <strong>{currentStatus}</strong>. No subsequent transitions recorded.
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Vertical gray line */}
          <div style={{
            position: 'absolute',
            left: '5px',
            top: '6px',
            bottom: '6px',
            width: '2px',
            background: '#D9E0E7'
          }} />

          {events.map((ev, index) => {
            const timeFormatted = ev.timestamp
              ? new Date(ev.timestamp).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  dateStyle: 'medium',
                  timeStyle: 'short'
                }) + ' IST'
              : 'N/A';

            return (
              <div key={ev._id || index} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Node dot */}
                <div style={{
                  position: 'absolute',
                  left: '-20px',
                  top: '4px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: index === 0 ? '#1769AA' : '#FFFFFF',
                  border: '2px solid #1769AA'
                }} />

                {/* Transition Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475467' }}>
                    {ev.fromState}
                  </span>
                  <span style={{ color: '#1769AA', fontWeight: 700 }}>→</span>
                  <AssetStatusBadge status={ev.toState} />

                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '0.72rem',
                    color: '#667085',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    {timeFormatted}
                  </span>
                </div>

                {/* Reason & Performer */}
                <div style={{
                  background: '#F8FAFC',
                  border: '1px solid #EAECF0',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px'
                }}>
                  <div style={{ fontSize: '0.82rem', color: '#17212B' }}>
                    <strong>Reason:</strong> {ev.reason || 'Routine municipal lifecycle progression'}
                  </div>

                  <div style={{
                    fontSize: '0.72rem',
                    color: '#667085'
                  }}>
                    Authorized By: <strong style={{ color: '#344054' }}>{ev.triggeredById?.name || 'Authorized Officer'}</strong> ({ev.triggeredById?.role || 'SYSTEM'})
                  </div>

                  {ev.evidenceDocumentUrls && ev.evidenceDocumentUrls.length > 0 && (
                    <div style={{ marginTop: '4px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {ev.evidenceDocumentUrls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#EFF8FF',
                            color: '#1769AA',
                            border: '1px solid #B2DDFF'
                          }}
                        >
                          Document #{i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LifecycleTimeline;
