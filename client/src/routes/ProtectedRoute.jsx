import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        background: 'var(--bg-base)',
        color: 'var(--text-muted)'
      }}>
        <Loader2 className="animate-spin" size={36} color="var(--accent-blue)" />
        <div style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}>
          VERIFYING INFRASTRUCTURE CLEARANCE...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        gap: '16px'
      }}>
        <ShieldAlert size={48} color="var(--accent-rose)" />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Access Restricted</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '480px' }}>
          Your municipal role (<strong style={{ color: '#fff' }}>{user?.role}</strong>) does not have clearance to view this operational module.
        </p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
