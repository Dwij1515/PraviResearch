import React from 'react';

export const AssetOverview = ({ asset }) => {
  const [lng, lat] = asset?.location?.coordinates || [0, 0];

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
          Asset Information & Specifications
        </h3>
        <p style={{ fontSize: '0.74rem', color: '#667085', marginTop: '2px' }}>
          Administrative classification, jurisdiction, and geographic placement
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Category & Subtype */}
        <div>
          <div style={{ fontSize: '0.72rem', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '2px' }}>
            Infrastructure Class
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#17212B' }}>
            {asset?.category?.replace('_', ' ')}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#667085' }}>
            Sub-type: {asset?.subType || 'General Municipal Asset'}
          </div>
        </div>

        {/* Department */}
        <div>
          <div style={{ fontSize: '0.72rem', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '2px' }}>
            Department Jurisdiction
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#17212B' }}>
            {asset?.departmentId?.name || 'Ahmedabad Municipal Corporation'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#667085' }}>
            Code: <strong style={{ color: '#1769AA' }}>{asset?.departmentId?.code || 'AMC'}</strong> • Zone: {asset?.departmentId?.zone || 'Central Zone'}
          </div>
        </div>

        {/* Physical Location */}
        <div>
          <div style={{ fontSize: '0.72rem', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '2px' }}>
            Deployment Location
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#17212B' }}>
            {asset?.location?.address || 'Ahmedabad, Gujarat'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#667085' }}>
            Ward: {asset?.location?.ward || 'Central'} • City: {asset?.location?.city || 'Ahmedabad'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#1769AA', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {lat.toFixed(5)}° N, {lng.toFixed(5)}° E
          </div>
        </div>

        {/* Responsible Officer */}
        <div>
          <div style={{ fontSize: '0.72rem', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '2px' }}>
            Responsible Custodian
          </div>
          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#17212B' }}>
            {asset?.responsibleOfficerId?.name || 'Designated Officer'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#667085' }}>
            {asset?.responsibleOfficerId?.email || 'officer@amc.gov.in'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#667085' }}>
            Role: {asset?.responsibleOfficerId?.role || 'ASSET_MANAGER'}
          </div>
        </div>

        {/* Dates */}
        <div>
          <div style={{ fontSize: '0.72rem', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '2px' }}>
            Commissioning Timeline
          </div>
          <div style={{ fontSize: '0.82rem', color: '#17212B' }}>
            Installed: {asset?.physicalAttributes?.installationDate ? new Date(asset.physicalAttributes.installationDate).toLocaleDateString('en-IN') : 'N/A'}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#17212B' }}>
            Commissioned: {asset?.physicalAttributes?.commissioningDate ? new Date(asset.physicalAttributes.commissioningDate).toLocaleDateString('en-IN') : 'N/A'}
          </div>
        </div>

        {/* Physical Specs */}
        <div>
          <div style={{ fontSize: '0.72rem', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '2px' }}>
            Physical Specifications
          </div>
          <div style={{ fontSize: '0.82rem', color: '#17212B' }}>
            Manufacturer: {asset?.physicalAttributes?.manufacturer || 'AMC Direct Execution'}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#667085' }}>
            Model / Serial: {asset?.physicalAttributes?.modelNumber || 'Municipal Std.'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetOverview;
