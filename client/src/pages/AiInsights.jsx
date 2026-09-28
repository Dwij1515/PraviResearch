import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ConditionBadge from '../components/assets/ConditionBadge';
import {
  Cpu,
  RotateCw,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Info
} from 'lucide-react';

export const AiInsights = () => {
  const [data, setData] = useState({ items: [], totalEvaluated: 0, highRiskCount: 0 });
  const [loading, setLoading] = useState(true);
  const [evaluatingId, setEvaluatingId] = useState(null);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ai/insights');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load AI risk insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleEvaluate = async (assetId) => {
    setEvaluatingId(assetId);
    try {
      await api.post(`/ai/evaluate/${assetId}`);
      fetchInsights();
    } catch (err) {
      alert(err.message || 'Evaluation failed');
    } finally {
      setEvaluatingId(null);
    }
  };

  const getRiskBadge = (tier) => {
    const config = {
      CRITICAL: { color: '#C53030', bg: '#FEF2F2', border: '#FECDCA' },
      HIGH: { color: '#C05621', bg: '#FFEDD5', border: '#FDBA74' },
      MEDIUM: { color: '#B7791F', bg: '#FEF7C3', border: '#FDE047' },
      LOW: { color: '#16845B', bg: '#ECFDF3', border: '#A6F4C5' }
    };
    const c = config[tier] || config.LOW;
    return (
      <span style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.72rem',
        fontWeight: 700,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.color
      }}>
        {tier} RISK
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Bar */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #D9E0E7',
        borderRadius: '8px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#17212B' }}>
              Asset Risk & AI Advisory (Deterministic PADI)
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
              Explainable Heuristic
            </span>
          </div>
          <p style={{ color: '#667085', fontSize: '0.8rem', marginTop: '2px' }}>
            Multi-factor structural risk ranking factoring condition deficit, age vs useful life, inspection recency, and disruption status
          </p>
        </div>

        <button onClick={fetchInsights} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.82rem' }}>
          <RotateCw size={13} />
          Recalculate Risk Index
        </button>
      </div>

      {/* Explanatory Banner */}
      <div style={{
        background: '#EFF8FF',
        border: '1px solid #B2DDFF',
        borderRadius: '6px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '0.78rem',
        color: '#1769AA'
      }}>
        <Info size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>Operational Safeguard:</strong> Advisory assessments provide decision-support ranking for municipal engineers. Recommendations do not autonomously alter ledger records without engineering verification.
        </span>
      </div>

      {/* Risk Assessments Table / Cards */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset Target</th>
              <th>Department / Ward</th>
              <th>Condition</th>
              <th>Criticality</th>
              <th>PADI Risk Score</th>
              <th>Risk Tier</th>
              <th>Explainable Risk Drivers</th>
              <th>Actionable Advisory</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                  Evaluating municipal infrastructure risk index...
                </td>
              </tr>
            ) : data.items.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: '#667085' }}>
                  No assets evaluated.
                </td>
              </tr>
            ) : (
              data.items.map((item) => (
                <tr key={item.assetId}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#17212B' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#667085' }}>
                      {item.assetTag}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', color: '#17212B' }}>
                      {item.department}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#667085' }}>
                      {item.location}
                    </div>
                  </td>
                  <td>
                    <ConditionBadge rating={item.conditionRating} score={item.conditionScore} />
                  </td>
                  <td>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475467' }}>
                      {item.criticality}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: item.riskScore >= 70 ? '#C53030' : item.riskScore >= 50 ? '#C05621' : '#16845B'
                      }}>
                        {item.riskScore}
                      </div>
                      <div style={{ width: '50px', height: '5px', background: '#EAECF0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${item.riskScore}%`,
                          background: item.riskScore >= 70 ? '#C53030' : item.riskScore >= 50 ? '#C05621' : '#16845B'
                        }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    {getRiskBadge(item.riskTier)}
                  </td>
                  <td>
                    <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '0.74rem', color: '#344054', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {item.drivers?.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.76rem', color: '#17212B', maxWidth: '240px', fontWeight: 500 }}>
                      {item.recommendationText}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                      <Link
                        to={`/assets/${item.assetId}`}
                        className="btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                      >
                        Passport
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AiInsights;
