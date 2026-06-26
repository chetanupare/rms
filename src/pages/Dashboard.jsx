import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../services/api';
import { useBranch } from '../context/BranchContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import NewServiceJob from '../components/NewServiceJob';

const KPI_ICONS = {
  total: { icon: 'build', color: '#60a5fa', bg: 'rgba(96,165,250,.12)' },
  pending: { icon: 'pending', color: '#f59e0b', bg: 'rgba(245,158,11,.12)' },
  completed: { icon: 'check_circle', color: '#34d399', bg: 'rgba(16,185,129,.12)' },
  revenue: { icon: 'payments', color: '#c084fc', bg: 'rgba(168,85,247,.15)' },
};

function Chart({ data }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="card mt-4">
      <div className="sec-head"><span className="t-sm">7-Day Revenue Trend</span></div>
      <div style={{ padding: '16px 4px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120, borderLeft: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)', paddingLeft: 8, paddingBottom: 4 }}>
          {data.map((d, i) => {
            const pct = d.revenue / maxRevenue;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div className="t-xs fw-600" style={{ color: 'var(--c-accent)', fontSize: 9, lineHeight: 1.1 }}>{d.revenue > 0 ? `₹${d.revenue.toLocaleString('en-IN')}` : ''}</div>
                <div style={{
                  width: '100%', maxWidth: 32,
                  height: `${Math.max(6, pct * 80)}px`,
                  background: pct > 0.7 ? 'var(--gradient-brand)' : pct > 0.4 ? 'linear-gradient(180deg, #cd0063, #5e0792)' : 'var(--c-accent2)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height .4s ease',
                  opacity: 0.8 + pct * 0.2,
                }} />
                <div className="t-xs dim" style={{ fontSize: 8, lineHeight: 1 }}>{d.date.slice(5)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { branch } = useBranch();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    endpoints.dashboard().then(({ data }) => setData(data)).catch(() => addToast('Failed to load dashboard', 'error')).finally(() => setLoading(false));
  }, [branch]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const kpis = data ? [
    { label: 'Total Service Jobs', value: data.totalJobs || 0, ...KPI_ICONS.total, link: '/repairs' },
    { label: 'Pending Repairs', value: data.pendingJobs || 0, ...KPI_ICONS.pending, link: '/repairs?status=Pending' },
    { label: 'Completed Jobs', value: data.completedJobs || 0, ...KPI_ICONS.completed, link: '/repairs?status=Completed' },
    { label: "Today's Collection", value: `₹${(data.todayRevenue || 0).toLocaleString('en-IN')}`, ...KPI_ICONS.revenue },
  ] : [];

  return (
    <div style={{ animation: 'pageIn .25s ease' }}>
      <div className="page-header">
        <div className="page-title">
          <div className="t-2xl">Dashboard</div>
          <div className="muted">Service overview at a glance</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setWizardOpen(true)}>
            <span className="material-symbols-rounded">add</span> New Service Job
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/register')}>
            <span className="material-symbols-rounded">account_balance</span> Daily Register
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <div className="kpi-card" key={kpi.label} onClick={() => kpi.link ? navigate(kpi.link) : null} style={{ cursor: kpi.link ? 'pointer' : 'default' }}>
            <div className="kpi-top">
              <span className="kpi-label">{kpi.label}</span>
              <div className="kpi-icon" style={{ background: kpi.bg }}>
                <span className="material-symbols-rounded" style={{ color: kpi.color }}>{kpi.icon}</span>
              </div>
            </div>
            <div className="kpi-value">{kpi.value}</div>
          </div>
        ))}
      </div>

      {data?.chartData?.length > 0 && <Chart data={data.chartData} />}

      {data?.recentJobs?.length > 0 && (
        <div className="card mt-4">
          <div className="sec-head"><span className="t-sm">Recent Service Jobs</span></div>
          <table className="tbl">
            <thead><tr><th>Job ID</th><th>Customer</th><th>Device</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {data.recentJobs.map((job) => (
                <tr key={job._id} style={{ cursor: 'pointer' }} onClick={() => navigate('/repairs')}>
                  <td className="mono t-xs">{job.jobId}</td>
                  <td><span className="fw-600">{job.customer?.name}</span></td>
                  <td className="muted t-xs">{job.device || job.customer?.device || '—'} — {job.model || job.customer?.model || '—'}</td>
                  <td><span className={`badge ${job.status === 'Pending' ? 'badge-amber' : job.status === 'In Progress' ? 'badge-blue' : job.status === 'Completed' ? 'badge-green' : job.status === 'Billed' ? 'badge-purple' : 'badge-cyan'}`}>{job.status}</span></td>
                  <td className="muted t-xs">{new Date(job.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewServiceJob open={wizardOpen} onClose={() => setWizardOpen(false)} onDone={(jobId) => { load(); if (jobId) navigate(`/job/${jobId}`); }} />
    </div>
  );
}
