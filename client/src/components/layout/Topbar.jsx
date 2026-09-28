import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { Clock, Moon, Sun, Sparkles, Gauge, Zap } from 'lucide-react';

export const Topbar = () => {
  const { user } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const { metrics, openDrawer } = useTelemetry();
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getThemeIcon = () => {
    if (theme === THEMES.LIGHT) return <Sun size={15} color="#F59E0B" />;
    if (theme === THEMES.CYBER) return <Sparkles size={15} color="#06B6D4" />;
    return <Moon size={15} color="#00D2FF" />;
  };

  const getThemeLabel = () => {
    if (theme === THEMES.LIGHT) return 'Daylight';
    if (theme === THEMES.CYBER) return 'Cyber Neon';
    return 'Obsidian';
  };

  return (
    <header
      style={{
        height: '60px',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        transition: 'all 0.2s ease'
      }}
    >
      {/* Left indicator: AMC Ledger & Scope */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--success-light)',
            border: '1px solid var(--success-border)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--success)',
            letterSpacing: '0.04em'
          }}
        >
          <span className="status-dot pulse" style={{ backgroundColor: 'var(--success)' }} />
          <span>AMC LEDGER ONLINE</span>
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Ahmedabad Municipal Command System
        </div>
      </div>

      {/* Right side controls: Loader Analytics Pill, Theme Toggle, Time, User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Loader Analytics Live Pill */}
        <button
          onClick={openDrawer}
          title="Open Loader & Speed Analytics Console"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '5px 11px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            fontSize: '0.74rem',
            fontWeight: 600,
            color: 'var(--text-main)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Gauge size={14} color="var(--primary)" />
          <span>{metrics.avgLatencyMs}ms</span>
          <span
            style={{
              padding: '1px 5px',
              borderRadius: '3px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: '0.66rem',
              fontWeight: 700
            }}
          >
            {metrics.cacheHitRatio}% CACHE
          </span>
        </button>

        {/* Theme Switcher Button */}
        <button
          onClick={cycleTheme}
          title={`Active: ${getThemeLabel()} Theme. Click to cycle.`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-color)',
            fontSize: '0.74rem',
            fontWeight: 600,
            color: 'var(--text-secondary)'
          }}
        >
          {getThemeIcon()}
          <span>{getThemeLabel()}</span>
        </button>

        {/* Live IST Clock */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <Clock size={13} color="var(--text-dim)" />
          <span>{timeStr || 'LIVE IST'}</span>
        </div>

        <div
          style={{
            height: '18px',
            width: '1px',
            background: 'var(--border-color)'
          }}
        />

        {/* User Role Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '0.78rem', textAlign: 'right' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user?.email}</div>
          </div>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-light)',
              border: '1px solid var(--primary-border)',
              color: 'var(--primary)',
              fontSize: '0.7rem',
              fontWeight: 700
            }}
          >
            {user?.role}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
