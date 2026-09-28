import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'ADMIN', email: 'admin@amc.gov.in', label: 'Municipal Commissioner (Global)', dept: 'Citywide' },
  { role: 'DIRECTOR', email: 'director.pwd@amc.gov.in', label: 'PWD Director', dept: 'AMC-PWD' },
  { role: 'ASSET_MANAGER', email: 'manager.pwd@amc.gov.in', label: 'Executive Engineer', dept: 'AMC-PWD' },
  { role: 'INSPECTOR', email: 'inspector.pwd@amc.gov.in', label: 'Chief Field Inspector', dept: 'AMC-PWD' },
  { role: 'CONTRACTOR', email: 'contractor.infra@amc.gov.in', label: 'Approved Contractor', dept: 'AMC-PWD' },
  { role: 'AUDITOR', email: 'auditor.gujarat@amc.gov.in', label: 'State Auditor (Read-Only)', dept: 'State Audit' }
];

export const Login = () => {
  const [email, setEmail] = useState('admin@amc.gov.in');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectDemo = (acc) => {
    setEmail(acc.email);
    setPassword('Password@123');
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg-base)',
        transition: 'background-color 0.25s ease'
      }}
    >
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
        className="animate-fade-in"
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary) 0%, #0284C7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#030712',
              marginBottom: '14px',
              boxShadow: 'var(--primary-glow)'
            }}
          >
            <Building2 size={26} />
          </div>

          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '0.04em',
              lineHeight: 1.1,
              fontFamily: 'var(--font-heading)'
            }}
          >
            PRAVI INFRA
          </h1>

          <p style={{ fontSize: '0.86rem', color: 'var(--primary)', marginTop: '4px', fontWeight: 600 }}>
            Municipal Infrastructure Asset Management System
          </p>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
            Ahmedabad Municipal Corporation • High-Velocity Ledger
          </p>
        </div>

        {/* Enterprise Login Card */}
        <div
          className="card-panel"
          style={{
            padding: '28px',
            boxShadow: 'var(--shadow-elevated)'
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--danger-light)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Officer Email
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-dim)' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@amc.gov.in"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 38px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    fontSize: '0.86rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-dim)' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 38px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-main)',
                    fontSize: '0.86rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '0.88rem',
                marginTop: '4px'
              }}
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
              <ArrowRight size={15} />
            </button>
          </form>
        </div>

        {/* Demo Accounts Quick-Select */}
        <div
          className="card-panel"
          style={{
            padding: '18px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Zap size={13} />
            Demo Accounts (Click to Auto-fill)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleSelectDemo(acc)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: email === acc.email ? 'var(--primary-light)' : 'var(--bg-subtle)',
                  border: `1px solid ${email === acc.email ? 'var(--primary)' : 'var(--border-color)'}`,
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {acc.role}
                </div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {acc.dept}
                </div>
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center' }}>
            Universal password: <strong style={{ color: 'var(--text-main)' }}>Password@123</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
