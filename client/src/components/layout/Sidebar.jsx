import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTelemetry } from '../../context/TelemetryContext';
import api from '../../services/api';
import {
  LayoutDashboard,
  Server,
  MapPin,
  ClipboardCheck,
  Wrench,
  RefreshCw,
  ShieldCheck,
  Cpu,
  LogOut,
  Building2,
  Gauge,
  Zap
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, prefetch: () => api.prefetch('/assets/summary') },
  { name: 'Assets', path: '/assets', icon: Server, prefetch: () => api.prefetch('/assets', { page: 1, limit: 10 }) },
  { name: 'Map', path: '/map', icon: MapPin, prefetch: () => api.prefetch('/assets', { limit: 100 }) },
  { name: 'Inspections', path: '/inspections', icon: ClipboardCheck, prefetch: () => api.prefetch('/inspections') },
  { name: 'Work Orders', path: '/work-orders', icon: Wrench, prefetch: () => api.prefetch('/work-orders') },
  { name: 'Lifecycle', path: '/lifecycle', icon: RefreshCw },
  { name: 'Audit Logs', path: '/audit', icon: ShieldCheck, prefetch: () => api.prefetch('/audit') },
  { name: 'AI Insights', path: '/ai-insights', icon: Cpu }
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { openDrawer, metrics } = useTelemetry();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      style={{
        width: '240px',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        flexShrink: 0,
        transition: 'all 0.2s ease'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '18px 18px',
          borderBottom: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--primary) 0%, #0284C7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#030712',
              boxShadow: '0 2px 10px rgba(0, 210, 255, 0.3)'
            }}
          >
            <Building2 size={18} />
          </div>
          <div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: 'var(--text-main)',
                fontFamily: 'var(--font-heading)',
                lineHeight: 1.1
              }}
            >
              PRAVI INFRA
            </div>
            <div
              style={{
                fontSize: '0.66rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
                marginTop: '2px'
              }}
            >
              Ahmedabad Municipal Corp
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List with Hover Prefetching */}
      <nav
        style={{
          flex: 1,
          padding: '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
          overflowY: 'auto'
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onMouseEnter={() => {
                if (item.prefetch) item.prefetch();
              }}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                background: isActive ? 'var(--bg-sidebar-active)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 0.15s ease'
              })}
            >
              <Icon size={16} />
              <span style={{ flex: 1 }}>{item.name}</span>
            </NavLink>
          );
        })}

        {/* Loader Analytics Quick Drawer Button in Nav */}
        <button
          onClick={openDrawer}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.84rem',
            fontWeight: 500,
            color: 'var(--primary)',
            background: 'var(--primary-light)',
            border: '1px dashed var(--primary-border)',
            marginTop: '8px',
            textAlign: 'left'
          }}
        >
          <Gauge size={16} />
          <span style={{ flex: 1, fontWeight: 600 }}>Loader Analytics</span>
          <span
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '3px',
              background: 'var(--bg-surface)',
              color: 'var(--success)'
            }}
          >
            {metrics.avgLatencyMs}ms
          </span>
        </button>
      </nav>

      {/* Officer Profile Card */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-sidebar-hover)'
        }}
      >
        <div style={{ marginBottom: '10px' }}>
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {user?.name || 'Municipal Officer'}
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginTop: '2px'
            }}
          >
            {user?.role} • {user?.departmentId?.code || 'AMC-HQ'}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-secondary"
          style={{
            width: '100%',
            padding: '6px 10px',
            fontSize: '0.75rem',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
