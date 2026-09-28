import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Cpu, ClipboardCheck, Wrench, MapPin, RefreshCw } from 'lucide-react';

const MODULES = {
  map: {
    title: 'Municipal GIS Asset Map',
    phase: 'Phase 4',
    icon: MapPin,
    color: '#1769AA',
    desc: 'Leaflet geospatial viewer and AMC ward boundary asset mapping.'
  },
  inspections: {
    title: 'Inspection Clearance Workflow',
    phase: 'Phase 5',
    icon: ClipboardCheck,
    color: '#B7791F',
    desc: 'Field inspection logging, checklist evaluation, and condition score recalculations.'
  },
  workorders: {
    title: 'Work Orders & Field Maintenance',
    phase: 'Phase 6',
    icon: Wrench,
    color: '#C05621',
    desc: 'Contractor assignment, dispatch, and safety clearance verification.'
  },
  lifecycle: {
    title: 'Lifecycle State Engine Control',
    phase: 'Phase 2 Active',
    icon: RefreshCw,
    color: '#1769AA',
    desc: 'The backend deterministic 11-stage engine is fully operational with PATCH /api/v1/assets/:id/lifecycle.'
  },
  audit: {
    title: 'Cryptographic Audit Ledger',
    phase: 'Phase 1 Active',
    icon: ShieldCheck,
    color: '#16845B',
    desc: 'Tamper-evident SHA-256 chained audit verification. View status via GET /api/v1/audit/verify.'
  },
  aiinsights: {
    title: 'AI Preventive Advisory (PADI)',
    phase: 'Phase 7',
    icon: Cpu,
    color: '#6941C6',
    desc: 'Predictive failure risk ranking and natural language maintenance assistant.'
  }
};

export const PlaceholderModule = ({ moduleKey = 'map' }) => {
  const mod = MODULES[moduleKey] || MODULES.map;
  const Icon = mod.icon;

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        padding: '36px',
        textAlign: 'center',
        background: '#FFFFFF',
        border: '1px solid #D9E0E7',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '14px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '8px',
          background: '#F8FAFC',
          border: `1px solid #D9E0E7`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: mod.color
        }}>
          <Icon size={26} />
        </div>

        <span style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '4px',
          background: '#F2F4F7',
          border: '1px solid #D0D5DD',
          color: '#475467',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {mod.phase} Module
        </span>

        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#17212B' }}>
          {mod.title}
        </h2>

        <p style={{ color: '#667085', fontSize: '0.85rem', lineHeight: 1.5, maxWidth: '400px' }}>
          {mod.desc}
        </p>

        <div style={{
          marginTop: '8px',
          padding: '10px 14px',
          borderRadius: '6px',
          background: '#EFF8FF',
          border: '1px solid #B2DDFF',
          fontSize: '0.78rem',
          color: '#1769AA'
        }}>
          Scheduled in project roadmap. Core backend schema and APIs operational.
        </div>

        <Link to="/assets" className="btn-primary" style={{ marginTop: '8px' }}>
          <span>Explore Asset Registry</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default PlaceholderModule;
