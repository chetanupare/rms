import { useState, useEffect, useCallback } from 'react';
import { api, endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useBranch } from '../context/BranchContext';
import { formatCurrency, statusBadgeClass } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Reports() {
  const { addToast } = useToast();
  const { branch } = useBranch();
  const [reportType, setReportType] = useState('daily');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    endpoints.reports({ type: reportType }).then(({ data }) => setData(data && typeof data === 'object' ? data : null)).catch(() => addToast('Failed to load reports', 'error')).finally(() => setLoading(false));
  }, [reportType, branch]);

  useEffect(() => { load(); }, [load]);

  function exportCSV() {
    const params = new URLSearchParams({ type: reportType, format: 'csv' });
    if (branch) params.set('branch', branch);
    const baseUrl = api.defaults.baseURL.replace('/api', '');
    window.open(`${baseUrl}/api/reports?${params.toString()}`, '_blank');
  }

  if (loading) return <LoadingSpinner text="Loading reports..." />;

  return (
    <div style={{ animation: 'pageIn .25s ease' }}>
      <div className="page-header">
        <div className="page-title">
          <div className="t-2xl">Reports</div>
          <div className="muted">Service and revenue analytics</div>
        </div>
        <div className="page-actions">
          <select className="form-input" value={reportType} onChange={(e) => setReportType(e.target.value)} style={{ width: 140 }}>
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="pending">Pending Jobs</option>
          </select>
          {data?.jobs?.length > 0 && (
            <button className="btn btn-ghost" onClick={exportCSV}>
              <span className="material-symbols-rounded">download</span> CSV
            </button>
          )}
        </div>
      </div>

      {data && (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">Total Jobs</div>
              <div className="kpi-value">{data.totalJobs || 0}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Completed</div>
              <div className="kpi-value" style={{ color: 'var(--c-green)' }}>{data.completed || 0}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Revenue</div>
              <div className="kpi-value">{formatCurrency(data.revenue || 0)}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Pending</div>
              <div className="kpi-value" style={{ color: 'var(--c-amber)' }}>{data.pending || 0}</div>
            </div>
          </div>

          {data.jobs?.length > 0 && (
            <div className="card mt-4">
              <div className="sec-head">
                <span className="t-sm">Job Details</span>
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Job ID</th><th>Customer</th><th>Device</th><th>Status</th><th>Amount</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.jobs.map((job) => (
                    <tr key={job._id}>
                      <td className="mono" style={{ fontSize: 11 }}>{job.jobId}</td>
                      <td><span className="fw-600">{job.customer?.name}</span></td>
                      <td className="muted">{job.device || job.customer?.device || '—'}</td>
                      <td><span className={`badge ${statusBadgeClass(job.status)}`}>{job.status}</span></td>
                      <td className="fw-600">{job.amount ? formatCurrency(job.amount) : '—'}</td>
                      <td className="muted">{new Date(job.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
