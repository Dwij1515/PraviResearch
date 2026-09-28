import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

const CATEGORIES = [
  'TRANSPORTATION',
  'WATER_SUPPLY',
  'SEWERAGE',
  'SOLID_WASTE',
  'HEALTHCARE',
  'EDUCATION',
  'PUBLIC_BUILDING',
  'SMART_INFRASTRUCTURE',
  'POWER_LIGHTING',
  'PARKS_RECREATION'
];

const STATUSES = [
  'PLANNING',
  'PROCUREMENT',
  'INSTALLATION',
  'COMMISSIONING',
  'OPERATIONAL',
  'UNDER_INSPECTION',
  'NEEDS_REPAIR',
  'UNDER_MAINTENANCE',
  'OUT_OF_SERVICE',
  'DECOMMISSIONED',
  'DISPOSED'
];

const RATINGS = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'];
const CRITICALITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const AssetFilters = ({ filters, onChange, onReset }) => {
  const handleInput = (e) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value, page: 1 });
  };

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #D9E0E7',
      borderRadius: '8px',
      padding: '16px 18px',
      boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Search Input */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div style={{
          position: 'relative',
          flex: 1,
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              color: '#667085',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            name="search"
            value={filters.search || ''}
            onChange={handleInput}
            placeholder="Search by asset tag, name, ward, or address..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              background: '#FFFFFF',
              border: '1px solid #D9E0E7',
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: '#17212B',
              outline: 'none'
            }}
          />
        </div>

        <button
          onClick={onReset}
          className="btn-secondary"
          style={{ padding: '8px 14px', fontSize: '0.8rem' }}
          title="Reset All Filters"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      {/* Filter Selects Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '10px'
      }}>
        {/* Category */}
        <select
          name="category"
          value={filters.category || ''}
          onChange={handleInput}
          style={{
            padding: '7px 10px',
            background: '#FFFFFF',
            border: '1px solid #D9E0E7',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#344054',
            outline: 'none'
          }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
          ))}
        </select>

        {/* Status */}
        <select
          name="status"
          value={filters.status || ''}
          onChange={handleInput}
          style={{
            padding: '7px 10px',
            background: '#FFFFFF',
            border: '1px solid #D9E0E7',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#344054',
            outline: 'none'
          }}
        >
          <option value="">All Lifecycle States</option>
          {STATUSES.map((st) => (
            <option key={st} value={st}>{st.replace('_', ' ')}</option>
          ))}
        </select>

        {/* Condition */}
        <select
          name="conditionRating"
          value={filters.conditionRating || ''}
          onChange={handleInput}
          style={{
            padding: '7px 10px',
            background: '#FFFFFF',
            border: '1px solid #D9E0E7',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#344054',
            outline: 'none'
          }}
        >
          <option value="">All Conditions</option>
          {RATINGS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {/* Criticality */}
        <select
          name="criticality"
          value={filters.criticality || ''}
          onChange={handleInput}
          style={{
            padding: '7px 10px',
            background: '#FFFFFF',
            border: '1px solid #D9E0E7',
            borderRadius: '6px',
            fontSize: '0.8rem',
            color: '#344054',
            outline: 'none'
          }}
        >
          <option value="">All Criticalities</option>
          {CRITICALITIES.map((crit) => (
            <option key={crit} value={crit}>{crit}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AssetFilters;
