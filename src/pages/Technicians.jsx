import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const STATUS_COLORS = {
  on_duty: { bg: 'rgba(16,185,129,.12)', color: 'var(--c-green)', label: 'On Duty' },
  off_duty: { bg: 'rgba(139,146,168,.12)', color: 'var(--c-text3)', label: 'Off Duty' },
};

export default function Technicians() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ username: '', password: '', phone: '' });

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    try {
      const { data } = await endpoints.receptionTechnicians();
      setTechnicians(data);
    } catch { addToast('Failed to load technicians', 'error'); }
    finally { setLoading(false); }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!addForm.username || !addForm.password) return;
    try {
      await endpoints.createUser({ ...addForm, role: 'Technician' });
      addToast('Technician added', 'success');
      setAddModal(false);
      setAddForm({ username: '', password: '', phone: '' });
      load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add technician', 'error');
    }
  }

  if (loading) return <LoadingSpinner text="Loading technicians..." />;

  const online = technicians.filter(t => t.status === 'on_duty');
  const offline = technicians.filter(t => t.status !== 'on_duty');

  return (
    <div style={{ animation: 'pageIn .25s ease' }}>
      <div className="page-header">
        <div className="page-title">
          <div style={{ fontSize: 20, fontWeight: 700 }}>Technicians</div>
          <div style={{ fontSize: 12, color: 'var(--c-text3)' }}>{online.length} online · {offline.length} offline · {technicians.length} total</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setAddModal(true)}>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span> Add Technician
          </button>
          <button className="btn btn-ghost" onClick={load}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>refresh</span> Refresh</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(16,185,129,.12)' }}><span className="material-symbols-rounded" style={{ color: 'var(--c-green)' }}>person</span></div>
          <div><div className="kpi-label">Online</div><div className="kpi-value" style={{ color: 'var(--c-green)' }}>{online.length}</div></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(139,146,168,.12)' }}><span className="material-symbols-rounded" style={{ color: 'var(--c-text3)' }}>person_off</span></div>
          <div><div className="kpi-label">Offline</div><div className="kpi-value">{offline.length}</div></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(245,158,11,.12)' }}><span className="material-symbols-rounded" style={{ color: 'var(--c-amber)' }}>work</span></div>
          <div><div className="kpi-label">Total Active Jobs</div><div className="kpi-value">{technicians.reduce((s, t) => s + t.activeJobs, 0)}</div></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(205,0,99,.12)' }}><span className="material-symbols-rounded" style={{ color: 'var(--c-accent)' }}>speed</span></div>
          <div><div className="kpi-label">Avg Workload</div><div className="kpi-value">{technicians.length ? (technicians.reduce((s, t) => s + t.activeJobs, 0) / technicians.length).toFixed(1) : '0'}</div></div>
        </div>
      </div>

      {/* Online Technicians */}
      {online.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-green)' }} /> On Duty ({online.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {online.map(tech => (
              <div key={tech._id} className="card" style={{ padding: 16, border: '1px solid rgba(16,185,129,.2)' }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--c-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#fff' }}>person</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t-sm fw-700">{tech.name}</div>
                    <div className="t-xs dim">{tech.phone || 'No phone'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: tech.activeJobs >= 5 ? 'var(--c-amber)' : 'var(--c-text)', lineHeight: 1 }}>{tech.activeJobs}</div>
                    <div className="t-xs dim">jobs</div>
                  </div>
                </div>
                {tech.lastSeen && (
                  <div className="t-xs dim" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--c-border)' }}>
                    Last active: {new Date(tech.lastSeen).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline Technicians */}
      {offline.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-text3)' }} /> Off Duty ({offline.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {offline.map(tech => (
              <div key={tech._id} className="card" style={{ padding: 16, opacity: 0.6 }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--c-surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--c-text3)' }}>person</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t-sm fw-700">{tech.name}</div>
                    <div className="t-xs dim">{tech.phone || 'No phone'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--c-text)', lineHeight: 1 }}>{tech.activeJobs}</div>
                    <div className="t-xs dim">jobs</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {technicians.length === 0 && (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 48, color: 'var(--c-text3)', display: 'block', marginBottom: 12 }}>group</span>
          <div className="t-base dim">No technicians found</div>
        </div>
      )}

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Technician">
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" value={addForm.username} onChange={(e) => setAddForm({ ...addForm, username: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" className="btn btn-ghost" onClick={() => setAddModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Technician</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
