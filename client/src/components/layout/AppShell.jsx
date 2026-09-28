import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import LoaderAnalyticsDrawer from '../analytics/LoaderAnalyticsDrawer';

export const AppShell = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', transition: 'background-color 0.2s ease' }}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar />
        <main
          style={{
            flex: 1,
            padding: '24px 28px 40px',
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Real-time Loader & Speed Analytics Drawer */}
      <LoaderAnalyticsDrawer />
    </div>
  );
};

export default AppShell;
