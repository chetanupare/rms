import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { formatDate, formatCurrency, formatDateTime, statusBadgeClass, openWhatsApp } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

const COLUMNS = [
  { key: 'Pending', label: 'Pending', color: '#f59e0b' },
  { key: 'In Progress', label: 'In Progress', color: '#60a5fa' },
  { key: 'Completed', label: 'Completed', color: '#34d399' },
  { key: 'Billed', label: 'Billed', color: '#c084fc' },
  { key: 'Delivered', label: 'Delivered', color: '#22d3ee' },
];

const SLA_LIMITS = { Pending: 48, 'In Progress': 72 };

function getSLAClass(job) {
  const limit = SLA_LIMITS[job.status];
  if (!limit) return null;
  const hours = (Date.now() - new Date(job.createdAt).getTime()) / 3600000;
  if (hours > limit) return 'overdue';
  if (hours > limit * 0.75) return 'warning';
  return null;
}

function KanbanCard({ job, onOpen, onStart, onComplete, onDeliver, onTransfer }) {
  const sla = getSLAClass(job);
  const customer = job.customer || {};
  const hours = (Date.now() - new Date(job.createdAt).getTime()) / 3600000;

  function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: job._id, jobId: job.jobId, fromStatus: job.status }));
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpen(job)}
      style={{
        background: 'var(--c-surface2)', border: '1px solid var(--c-border)', borderRadius: 8,
        padding: '8px 10px', cursor: 'grab', marginBottom: 6, transition: 'border-color .12s',
        borderLeft: `3px solid ${sla === 'overdue' ? 'var(--c-red)' : sla === 'warning' ? 'var(--c-amber)' : 'transparent'}`,
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--c-border2)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--c-border)'}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="mono t-xs fw-600" style={{ color: 'var(--c-accent)' }}>{job.jobId}</div>
        {sla === 'overdue' && <span className="material-symbols-rounded" style={{ fontSize: 13, color: 'var(--c-red)' }} title={`Overdue! ${Math.round(hours)}h`}>local_fire_department</span>}
        {sla === 'warning' && <span className="material-symbols-rounded" style={{ fontSize: 13, color: 'var(--c-amber)' }} title={`${Math.round(hours)}h elapsed`}>schedule</span>}
      </div>
      <div className="t-xs fw-600 mt-1">{customer.name || '—'}</div>
      <div className="t-xs dim" style={{ lineHeight: 1.2 }}>{job.device || ''}{job.model ? ' · ' + job.model : ''}</div>
      {job.technician && <div className="t-xs dim" style={{ marginTop: 2 }}>🔧 {job.technician}</div>}
      <div className="flex gap-1 mt-1" style={{ flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
        {job.status === 'Pending' && <button className="btn btn-primary" onClick={() => onStart(job)} style={{ fontSize: 8, padding: '1px 5px' }}>Start</button>}
        {job.status === 'In Progress' && <button className="btn btn-primary" onClick={() => onComplete(job)} style={{ fontSize: 8, padding: '1px 5px' }}>Complete</button>}
        {job.status === 'Billed' && <button className="btn btn-primary" onClick={() => onDeliver(job)} style={{ fontSize: 8, padding: '1px 5px' }}>Deliver</button>}
        <button className="btn btn-ghost" onClick={(e) => { e.preventDefault(); onTransfer(job); }} style={{ fontSize: 8, padding: '1px 4px' }} title="Transfer"><span className="material-symbols-rounded" style={{ fontSize: 10 }}>swap_horiz</span></button>
      </div>
    </div>
  );
}

export default function Repairs() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { branch } = useBranch();
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [techFilter, setTechFilter] = useState('');
  const [allTechs, setAllTechs] = useState([]);
  const [repairData, setRepairData] = useState({ diagnosis: '', estimateCost: '', technician: user?.username || '' });
  const [transferModal, setTransferModal] = useState(null);
  const [transferTo, setTransferTo] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([endpoints.jobCards(), endpoints.repairs()]).then(([jobsRes, repairsRes]) => {
      const j = jobsRes.data;
      setJobs(j);
      const techs = [...new Set(repairsRes.data.map((r) => r.technician).filter(Boolean))];
      setAllTechs(techs);
    }).catch(() => addToast('Failed to load repairs', 'error')).finally(() => setLoading(false));
  }, [branch]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let result = jobs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((job) => {
        const c = job.customer || {};
        return job.jobId.toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q) || (c.mobile || '').includes(q);
      });
    }
    if (techFilter) result = result.filter((job) => job.technician === techFilter);
    if (statusFilter) result = result.filter((job) => job.status === statusFilter);
    setFiltered(result);
  }, [searchQuery, techFilter, statusFilter, jobs]);

  useEffect(() => {
    const handler = (e) => setSearchQuery(e.detail);
    window.addEventListener('global-search', handler);
    return () => window.removeEventListener('global-search', handler);
  }, []);

  useEffect(() => {
    const s = searchParams.get('status');
    if (s) setStatusFilter(s);
  }, [searchParams]);

  async function handleDrop(e, targetStatus) {
    e.preventDefault();
    try {
      const { id, jobId } = JSON.parse(e.dataTransfer.getData('text/plain'));
      await endpoints.updateJobCard(id, { status: targetStatus });
      await api.post('/activity', { jobId, action: `Moved to ${targetStatus}`, user: user?.username });
      addToast(`Moved to ${targetStatus}`, 'success');
      load();
    } catch { addToast('Failed to update', 'error'); }
  }

  function openRepair(job) {
    setSelectedJob(job);
    setRepairData({ diagnosis: '', estimateCost: '', technician: user?.username || '' });
    setModalOpen(true);
  }

  async function logActivity(jobId, action, details) {
    try { await api.post('/activity', { jobId, action, details, user: user?.username || 'system' }); } catch {}
  }

  async function handleSaveRepair(e) {
    e.preventDefault();
    if (!repairData.diagnosis || !repairData.estimateCost) return addToast('Please fill diagnosis and estimate', 'warning');
    try {
      await endpoints.createRepair({ jobId: selectedJob.jobId, ...repairData, estimateCost: Number(repairData.estimateCost) });
      await endpoints.updateJobCard(selectedJob._id, { status: 'In Progress' });
      await logActivity(selectedJob.jobId, 'Repair started', `Diagnosis: ${repairData.diagnosis}, Estimate: ₹${repairData.estimateCost}`);
      addToast('Repair started', 'success');
      setModalOpen(false);
      load();
    } catch (err) { addToast('Failed to save repair', 'error'); }
  }

  async function handleComplete(job) {
    try {
      await endpoints.updateJobCard(job._id, { status: 'Completed' });
      await logActivity(job.jobId, 'Repair completed');
      addToast('Completed', 'success');
      load();
    } catch { addToast('Failed', 'error'); }
  }

  async function handleDeliver(job) {
    if (!confirm('Confirm delivery?')) return;
    try {
      await endpoints.updateJobCard(job._id, { status: 'Delivered' });
      await logActivity(job.jobId, 'Device delivered');
      addToast('Delivered', 'success');
      load();
    } catch { addToast('Failed', 'error'); }
  }

  async function handleTransfer() {
    if (!transferTo || !transferModal) return;
    try {
      await endpoints.transferJob(transferModal._id, { toBranch: transferTo, notes: transferNotes });
      await logActivity(transferModal.jobId, `Transferred to ${transferTo}`, transferNotes || 'Inter-branch transfer');
      addToast(`Transferred to ${transferTo}`, 'success');
      setTransferModal(null); setTransferTo(''); setTransferNotes(''); load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
  }

  if (loading) return <LoadingSpinner text="Loading repairs..." />;

  return (
    <div style={{ animation: 'pageIn .25s ease' }}>
      <div className="page-header">
        <div className="page-title">
          <div className="t-2xl">Repairs</div>
          <div className="muted">{filtered.length} jobs · {jobs.filter((j) => j.status !== 'Delivered').length} active</div>
        </div>
        <div className="page-actions">
          <div className="flex gap-1">
            <button className={`btn ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('list')} style={{ fontSize: 10, padding: '3px 8px' }}>List</button>
            <button className={`btn ${view === 'kanban' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('kanban')} style={{ fontSize: 10, padding: '3px 8px' }}>Kanban</button>
          </div>
          {allTechs.length > 0 && (
            <select className="form-input" value={techFilter} onChange={(e) => setTechFilter(e.target.value)} style={{ width: 120, fontSize: 10, padding: '3px 6px' }}>
              <option value="">All Techs</option>
              {allTechs.map((t) => <option key={t}>{t}</option>)}
            </select>
          )}
          {statusFilter && <button className="btn btn-ghost" onClick={() => { setStatusFilter(''); navigate('/repairs'); }} style={{ fontSize: 9, padding: '3px 6px' }}>Clear Filter</button>}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon="build" title={searchQuery || techFilter ? 'No matches' : 'No jobs yet'} /></div>
      ) : view === 'kanban' ? (
        <div style={{ display: 'flex', gap: 8, overflow: 'auto', paddingBottom: 8, minHeight: 400 }}>
          {COLUMNS.map((col) => {
            const colJobs = filtered.filter((j) => j.status === col.key);
            return (
              <div
                key={col.key} style={{ flex: 1, minWidth: 200, background: 'var(--c-surface)', borderRadius: 8, border: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.key)}
              >
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="flex items-center gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                    <span className="t-sm fw-600">{col.label}</span>
                  </div>
                  <span className="badge badge-ghost" style={{ fontSize: 9 }}>{colJobs.length}</span>
                </div>
                <div style={{ flex: 1, padding: '6px', overflow: 'auto', minHeight: 100 }}>
                  {colJobs.length === 0 ? (
                    <div className="t-xs dim text-center" style={{ padding: 12 }}>Drop here</div>
                  ) : (
                    colJobs.map((job) => (
                      <KanbanCard key={job._id} job={job} onOpen={(j) => navigate(`/job/${j._id}`)} onStart={openRepair} onComplete={handleComplete} onDeliver={handleDeliver} onTransfer={(j) => { setTransferModal(j); setTransferTo(''); setTransferNotes(''); }} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Job ID</th><th>Customer</th><th>Device</th><th>Model</th><th>Status</th><th>Technician</th><th>Date</th><th>SLA</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => {
                const customer = job.customer || {};
                const sla = getSLAClass(job);
                const hours = Math.round((Date.now() - new Date(job.createdAt).getTime()) / 3600000);
                return (
                  <tr key={job._id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/job/${job._id}`)}>
                    <td className="mono t-xs">{job.jobId}</td>
                    <td><span className="fw-600 t-xs">{customer.name}</span><div className="t-xs muted">{customer.mobile}</div></td>
                    <td className="t-xs">{job.device || customer.device || '—'}</td>
                    <td className="muted t-xs">{job.model || customer.model || '—'}</td>
                    <td><span className={`badge ${statusBadgeClass(job.status)}`}>{job.status}</span></td>
                    <td className="muted t-xs">{job.technician || '—'}</td>
                    <td className="muted t-xs">{formatDate(job.createdAt)}</td>
                    <td>
                      {sla === 'overdue' ? (
                        <span className="badge badge-red flex items-center gap-1" style={{ fontSize: 9 }}><span className="material-symbols-rounded" style={{ fontSize: 10 }}>local_fire_department</span> {hours}h</span>
                      ) : sla === 'warning' ? (
                        <span className="badge badge-amber" style={{ fontSize: 9 }}>{hours}h</span>
                      ) : (
                        <span className="t-xs dim">{hours}h</span>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1" style={{ justifyContent: 'flex-end' }}>
                        {job.status === 'Pending' && <button className="btn btn-primary" onClick={() => openRepair(job)} style={{ fontSize: 9, padding: '2px 6px' }}>Start</button>}
                        {job.status === 'In Progress' && <button className="btn btn-primary" onClick={() => handleComplete(job)} style={{ fontSize: 9, padding: '2px 6px' }}>Complete</button>}
                        {job.status === 'Billed' && <button className="btn btn-primary" onClick={() => handleDeliver(job)} style={{ fontSize: 9, padding: '2px 6px' }}>Deliver</button>}
                        <button className="btn btn-ghost" onClick={() => { setTransferModal(job); setTransferTo(''); setTransferNotes(''); }} style={{ fontSize: 9, padding: '2px 5px' }} title="Transfer branch"><span className="material-symbols-rounded" style={{ fontSize: 11 }}>swap_horiz</span></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!transferModal} onClose={() => setTransferModal(null)} title={`Transfer Branch — ${transferModal?.jobId}`}>
        <div className="form-group">
          <label className="form-label">Transfer To</label>
          <select className="form-input" value={transferTo} onChange={(e) => setTransferTo(e.target.value)}>
            <option value="">Select branch</option>
            <option value="WANI">Wani</option>
            <option value="NAGPUR">Nagpur</option>
            <option value="PANDHARKAWDA">Pandharkawda</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <textarea className="form-input" rows={2} value={transferNotes} onChange={(e) => setTransferNotes(e.target.value)} placeholder="Reason for transfer..." />
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => setTransferModal(null)}>Cancel</button>
          <button className="btn btn-primary" disabled={!transferTo} onClick={handleTransfer}>Transfer</button>
        </div>
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Start Repair — ${selectedJob?.jobId}`}>
        <form onSubmit={handleSaveRepair}>
          <div className="form-group"><label className="form-label">Customer</label><div className="t-base">{selectedJob?.customer?.name} — {selectedJob?.customer?.device} {selectedJob?.customer?.model}</div></div>
          <div className="form-group"><label className="form-label">Problem</label><div className="t-sm muted">{selectedJob?.problem || selectedJob?.customer?.problem || '—'}</div></div>
          <div className="form-group"><label className="form-label">Diagnosis</label><textarea className="form-input" rows={3} value={repairData.diagnosis} onChange={(e) => setRepairData({ ...repairData, diagnosis: e.target.value })} placeholder="Enter diagnosis notes" required /></div>
          <div className="form-group"><label className="form-label">Estimate Cost (₹)</label><input className="form-input" type="number" value={repairData.estimateCost} onChange={(e) => setRepairData({ ...repairData, estimateCost: e.target.value })} placeholder="0" min="0" required /></div>
          <div className="form-group"><label className="form-label">Technician</label><input className="form-input" value={repairData.technician} onChange={(e) => setRepairData({ ...repairData, technician: e.target.value })} required /></div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Start Repair</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
