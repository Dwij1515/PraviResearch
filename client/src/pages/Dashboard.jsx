import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/dashboard/StatCard';
import ConditionDistribution from '../components/dashboard/ConditionDistribution';
import LifecycleDistribution from '../components/dashboard/LifecycleDistribution';
import CriticalAssets from '../components/dashboard/CriticalAssets';
import FinancialSnapshot from '../components/dashboard/FinancialSnapshot';
import LoaderAnalyticsWidget from '../components/dashboard/LoaderAnalyticsWidget';
import SkeletonDashboard from '../components/common/SkeletonLoader';
import {
  Server,
  Activity,
  AlertTriangle,
  Clock,
  Wrench,
  RotateCw,
  AlertCircle
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [criticalList, setCriticalList] = useState([]);
  const [sampleAssets, setSampleAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else if (!summary) {
      setLoading(true);
    }
    setError('');

    try {
      const summaryRes = await api.get('/assets/summary', {}, { forceRefresh });
      if (summaryRes?.success) {
        setSummary(summaryRes.data);
      }

      const assetsRes = await api.get('/assets', { limit: 50 }, { forceRefresh });
      if (assetsRes?.success && assetsRes.data?.items) {
        const items = assetsRes.data.items;
        setSampleAssets(items);

        const attentionAssets = items.filter(
          (a) =>
            (a.condition?.score !== undefined && a.condition.score < 60) ||
            ['NEEDS_REPAIR', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE'].includes(a.status) ||
            a.criticality === 'CRITICAL'
        ).slice(0, 5);

        setCriticalList(attentionAssets);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Failed to connect to AMC Municipal Infrastructure server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false);
  }, []);

  if (loading && !summary) {
    return <SkeletonDashboard />;
  }

  if (error && !summary) {
    return (
      <div
        className="card-panel"
        style={{
          padding: '40px',
          textAlign: 'center',
          borderColor: 'var(--danger-border)'
        }}
      >
        <AlertCircle size={40} color="var(--danger)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
          Unable to Load Municipal Dashboard
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', maxWidth: '460px', margin: '0 auto 16px' }}>
          {error}
        </p>
        <button onClick={() => fetchDashboardData(true)} className="btn-primary">
          <RotateCw size={14} />
          Retry Connection
        </button>
      </div>
    );
  }

  const needsAttentionCount = (summary?.needsRepair || 0) + (summary?.underMaintenance || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }} className="animate-fade-in">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Municipal Infrastructure Overview
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '2px' }}>
            Ahmedabad Municipal Corporation • Jurisdiction:{' '}
            <strong style={{ color: 'var(--primary)' }}>
              {user?.role === 'ADMIN' ? 'Global Citywide' : user?.role}
            </strong>
          </p>
        </div>

        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="btn-secondary"
          style={{ padding: '7px 14px', fontSize: '0.78rem' }}
        >
          <RotateCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Fast Refresh'}
        </button>
      </div>

      {/* Real-time Loader Analytics & Speed Telemetry Widget */}
      <LoaderAnalyticsWidget />

      {/* Row 1: 5 KPI cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}
      >
        <StatCard
          title="Total Assets"
          value={summary?.totalAssets || 0}
          subtitle="Monitored in municipal registry"
          icon={Server}
          color="blue"
        />

        <StatCard
          title="Operational"
          value={summary?.operationalAssets || 0}
          subtitle="Active field service"
          icon={Activity}
          color="emerald"
        />

        <StatCard
          title="Critical Assets"
          value={summary?.criticalAssets || 0}
          subtitle="Condition < 40 or service outage"
          icon={AlertTriangle}
          color="rose"
        />

        <StatCard
          title="Needs Attention"
          value={needsAttentionCount}
          subtitle="In repair or maintenance"
          icon={Wrench}
          color="amber"
        />

        <StatCard
          title="Overdue Inspections"
          value={summary?.overdueInspectionCount || 0}
          subtitle="Past due inspection threshold"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Row 2: Condition Health & Lifecycle Distribution */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '16px'
        }}
      >
        <ConditionDistribution
          distribution={summary?.conditionDistribution}
          total={summary?.totalAssets}
        />

        <LifecycleDistribution
          distribution={summary?.statusDistribution}
          total={summary?.totalAssets}
        />
      </div>

      {/* Row 3: Critical Infrastructure Watchlist & Financial Snapshot */}
      <CriticalAssets
        assets={criticalList}
        loading={loading}
      />

      <FinancialSnapshot
        assets={sampleAssets}
      />
    </div>
  );
};

export default Dashboard;
