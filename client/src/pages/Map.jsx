import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import { MapPin, RotateCw, Filter, ExternalLink } from 'lucide-react';
import AssetStatusBadge from '../components/assets/AssetStatusBadge';
import ConditionBadge from '../components/assets/ConditionBadge';

// Helper to generate distinct colored marker icons
const createMarkerIcon = (rating) => {
  const colorMap = {
    EXCELLENT: '#16845B',
    GOOD: '#0E7090',
    FAIR: '#B7791F',
    POOR: '#C05621',
    CRITICAL: '#C53030'
  };
  const color = colorMap[rating] || '#1769AA';

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${color};
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid #FFFFFF;
        box-shadow: 0 1px 4px rgba(0,0,0,0.35);
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

export const Map = () => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [activeAsset, setActiveAsset] = useState(null);

  // Fetch real assets from backend
  const fetchMapAssets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/assets', { limit: 100 });
      if (res.success && res.data?.items) {
        setAssets(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load map assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapAssets();
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered on Ahmedabad
      const map = L.map(mapContainerRef.current, {
        center: [23.0225, 72.5714],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | AMC Geographic Information System',
        maxZoom: 18
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when assets or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = assets.filter((a) => {
      if (selectedCategory && a.category !== selectedCategory) return false;
      if (selectedCondition && a.condition?.rating !== selectedCondition) return false;
      if (selectedStatus && a.status !== selectedStatus) return false;
      return true;
    });

    filtered.forEach((asset) => {
      const coords = asset.location?.coordinates;
      if (!Array.isArray(coords) || coords.length !== 2) return;
      const [lng, lat] = coords;
      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng], {
        icon: createMarkerIcon(asset.condition?.rating)
      });

      marker.on('click', () => {
        setActiveAsset(asset);
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [assets, selectedCategory, selectedCondition, selectedStatus]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: 'calc(100vh - 120px)' }}>
      {/* Header & Controls Bar */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #D9E0E7',
        borderRadius: '8px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#17212B' }}>
              Municipal Infrastructure Map
            </h2>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: '#EFF8FF',
              color: '#1769AA',
              border: '1px solid #B2DDFF'
            }}>
              {assets.length} Monitored Geopoints
            </span>
          </div>
          <p style={{ color: '#667085', fontSize: '0.78rem', marginTop: '2px' }}>
            Ahmedabad Municipal Corporation • Spatial Asset Distribution
          </p>
        </div>

        {/* Filter controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '6px 10px',
              background: '#FFFFFF',
              border: '1px solid #D9E0E7',
              borderRadius: '6px',
              fontSize: '0.78rem',
              color: '#344054'
            }}
          >
            <option value="">All Categories</option>
            <option value="TRANSPORTATION">Transportation</option>
            <option value="WATER_SUPPLY">Water Supply</option>
            <option value="HEALTHCARE">Healthcare</option>
            <option value="EDUCATION">Education</option>
            <option value="SMART_INFRASTRUCTURE">Smart Infrastructure</option>
          </select>

          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            style={{
              padding: '6px 10px',
              background: '#FFFFFF',
              border: '1px solid #D9E0E7',
              borderRadius: '6px',
              fontSize: '0.78rem',
              color: '#344054'
            }}
          >
            <option value="">All Conditions</option>
            <option value="EXCELLENT">Excellent (Green)</option>
            <option value="GOOD">Good (Teal)</option>
            <option value="FAIR">Fair (Amber)</option>
            <option value="POOR">Poor (Orange)</option>
            <option value="CRITICAL">Critical (Red)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              padding: '6px 10px',
              background: '#FFFFFF',
              border: '1px solid #D9E0E7',
              borderRadius: '6px',
              fontSize: '0.78rem',
              color: '#344054'
            }}
          >
            <option value="">All Statuses</option>
            <option value="OPERATIONAL">Operational</option>
            <option value="UNDER_INSPECTION">Under Inspection</option>
            <option value="NEEDS_REPAIR">Needs Repair</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="OUT_OF_SERVICE">Out of Service</option>
          </select>

          <button
            onClick={fetchMapAssets}
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
          >
            <RotateCw size={12} />
            Refresh
          </button>
        </div>
      </div>

      {/* Map Canvas and Drawer Layout */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid #D9E0E7' }}>
        <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '100%', zIndex: 1 }}
        />

        {/* Selected Asset Floating Details Panel */}
        {activeAsset && (
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '320px',
            background: '#FFFFFF',
            border: '1px solid #D9E0E7',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="code-pill" style={{ fontSize: '0.74rem' }}>{activeAsset.assetTag}</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#17212B', marginTop: '4px' }}>
                  {activeAsset.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveAsset(null)}
                style={{ fontSize: '1.1rem', color: '#667085', lineHeight: 1 }}
              >
                &times;
              </button>
            </div>

            <div style={{ fontSize: '0.78rem', color: '#667085' }}>
              {activeAsset.departmentId?.name || 'Ahmedabad Municipal Corporation'}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <AssetStatusBadge status={activeAsset.status} />
              <ConditionBadge rating={activeAsset.condition?.rating} score={activeAsset.condition?.score} />
            </div>

            <div style={{
              background: '#F8FAFC',
              padding: '8px 10px',
              borderRadius: '4px',
              fontSize: '0.76rem',
              color: '#344054',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <div>Ward: <strong>{activeAsset.location?.ward || 'Central'}</strong></div>
              <div>Address: {activeAsset.location?.address || 'Ahmedabad'}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#1769AA', marginTop: '2px' }}>
                {activeAsset.location?.coordinates?.[1]?.toFixed(4)}° N, {activeAsset.location?.coordinates?.[0]?.toFixed(4)}° E
              </div>
            </div>

            <Link
              to={`/assets/${activeAsset._id}`}
              className="btn-primary"
              style={{ width: '100%', padding: '6px', fontSize: '0.78rem', textAlign: 'center' }}
            >
              <span>Open Asset Passport</span>
              <ExternalLink size={12} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;
