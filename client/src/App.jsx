import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import Map from './pages/Map';
import Inspections from './pages/Inspections';
import WorkOrders from './pages/WorkOrders';
import Lifecycle from './pages/Lifecycle';
import AuditLogs from './pages/AuditLogs';
import AiInsights from './pages/AiInsights';
import QrResolver from './pages/QrResolver';
import PlaceholderModule from './pages/PlaceholderModule';

export const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/qr/:qrIdentifier" element={<QrResolver />} />

      {/* Protected Application Routes wrapped in AppShell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="assets" element={<Assets />} />
        <Route path="assets/:id" element={<AssetDetail />} />
        
        {/* Full Operational Modules */}
        <Route path="map" element={<Map />} />
        <Route path="inspections" element={<Inspections />} />
        <Route path="work-orders" element={<WorkOrders />} />
        <Route path="lifecycle" element={<Lifecycle />} />
        <Route path="audit" element={<AuditLogs />} />
        <Route path="ai-insights" element={<AiInsights />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
