import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, endpoints } from '../services/api';
import Modal from '../components/Modal';

const isElectron = !!window.electronAPI?.isElectron;

export default function Settings() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [mongoUri, setMongoUri] = useState(localStorage.getItem('slcg_mongo_uri') || '');
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [health, setHealth] = useState({ server: false, db: false });

  useEffect(() => {
    if (!isElectron) return;
    window.api.getAutoStart().then(setAutoStart);
    window.api.getHealth().then(setHealth);
    window.api.onHealthUpdate((data) => setHealth(data));
    window.api.onSyncComplete((data) => setLastSync(data.timestamp));
  }, []);

  function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    localStorage.setItem('slcg_mongo_uri', mongoUri);
    setTimeout(() => {
      addToast('Settings saved', 'success');
      setSaving(false);
    }, 500);
  }

  async function handleBackup() {
    setBackingUp(true);
    try {
      const token = localStorage.getItem('slcg_token');
      const res = await fetch('/api/backup', { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `slcg-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Backup downloaded', 'success');
    } catch {
      addToast('Backup failed', 'error');
    } finally {
      setBackingUp(false);
    }
  }

  const [clearing, setClearing] = useState('');
  const [serviceCenters, setServiceCenters] = useState([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [centerModalOpen, setCenterModalOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState(null);
  const [centerForm, setCenterForm] = useState({ brand: '', deviceType: '', location: '', city: '', contact: '' });
  const [savingCenter, setSavingCenter] = useState(false);
  const [centerFilter, setCenterFilter] = useState('');

  useEffect(() => {
    loadServiceCenters();
  }, []);

  async function loadServiceCenters() {
    setLoadingCenters(true);
    try {
      const { data } = await endpoints.serviceCenters();
      setServiceCenters(Array.isArray(data) ? data : []);
    } catch { } finally { setLoadingCenters(false); }
  }

  function openAddCenter() {
    setEditingCenter(null);
    setCenterForm({ brand: '', deviceType: '', location: '', city: '', contact: '' });
    setCenterModalOpen(true);
  }

  function openEditCenter(center) {
    setEditingCenter(center);
    setCenterForm({ brand: center.brand, deviceType: center.deviceType, location: center.location || '', city: center.city || '', contact: center.contact || '' });
    setCenterModalOpen(true);
  }

  async function handleSaveCenter(e) {
    e.preventDefault();
    if (!centerForm.brand || !centerForm.deviceType) return addToast('Brand and Device Type required', 'error');
    setSavingCenter(true);
    try {
      if (editingCenter) {
        await endpoints.updateServiceCenter(editingCenter._id, centerForm);
        addToast('Service center updated', 'success');
      } else {
        await endpoints.createServiceCenter(centerForm);
        addToast('Service center added', 'success');
      }
      setCenterModalOpen(false);
      loadServiceCenters();
    } catch { addToast('Failed to save', 'error'); } finally { setSavingCenter(false); }
  }

  async function handleDeleteCenter(id) {
    if (!confirm('Delete this service center?')) return;
    try {
      await endpoints.deleteServiceCenter(id);
      addToast('Deleted', 'success');
      loadServiceCenters();
    } catch { addToast('Failed to delete', 'error'); }
  }

  async function handleClear(type) {
    const labels = { jobs: 'all repair jobs & billing', customers: 'all customers', all: 'ALL data (jobs, customers, everything)' };
    if (!confirm(`Are you sure you want to delete ${labels[type]}? This cannot be undone.`)) return;
    setClearing(type);
    try {
      const { data } = await endpoints[type === 'jobs' ? 'clearJobs' : type === 'customers' ? 'clearCustomers' : 'clearAll']();
      addToast(data.message, 'success');
    } catch { addToast('Failed to clear data', 'error'); }
    finally { setClearing(''); }
  }

  return (
    <div style={{ animation: 'pageIn .25s ease' }}>
      <div className="page-header">
        <div className="page-title">
          <div className="t-2xl">Settings</div>
          <div className="muted">System configuration</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <div className="sec-head">
          <span className="t-sm">Database Configuration</span>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">MongoDB URI</label>
            <input className="form-input" value={mongoUri} onChange={(e) => setMongoUri(e.target.value)} placeholder="mongodb+srv://..." />
            <div className="t-xs muted mt-1">Current connection will remain active; changes apply on next login</div>
          </div>
          <div className="form-group">
            <label className="form-label">Branch</label>
            <input className="form-input" defaultValue={user?.branch || 'Wani'} disabled />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <div className="spinner" style={{ width: 12, height: 12 }} /> : 'Save Settings'}
          </button>
        </form>
      </div>

      <div className="card mt-4" style={{ maxWidth: 480 }}>
        <div className="sec-head">
          <span className="t-sm">Backup & Restore</span>
        </div>
        <p className="t-sm muted mb-2">Download all data as JSON backup file.</p>
        <button className="btn btn-primary" onClick={handleBackup} disabled={backingUp}>
          {backingUp ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <span className="material-symbols-rounded" style={{ fontSize: 14 }}>download</span>}
          {backingUp ? 'Downloading...' : 'Download Backup'}
        </button>
      </div>

      <div className="card mt-4" style={{ maxWidth: 480 }}>
        <div className="sec-head">
          <span className="t-sm" style={{ color: 'var(--c-red)' }}>Danger Zone — Clear Data</span>
        </div>
        <p className="t-xs muted mb-3">Permanently delete data. This cannot be undone.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn" style={{ background: 'rgba(239,68,68,.1)', color: 'var(--c-red)', border: '1px solid rgba(239,68,68,.2)', justifyContent: 'flex-start' }} onClick={() => handleClear('jobs')} disabled={!!clearing}>
            {clearing === 'jobs' ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete_sweep</span>}
            Clear All Repair Jobs & Billing
          </button>
          <button className="btn" style={{ background: 'rgba(239,68,68,.1)', color: 'var(--c-red)', border: '1px solid rgba(239,68,68,.2)', justifyContent: 'flex-start' }} onClick={() => handleClear('customers')} disabled={!!clearing}>
            {clearing === 'customers' ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <span className="material-symbols-rounded" style={{ fontSize: 16 }}>person_remove</span>}
            Clear All Customers
          </button>
          <button className="btn" style={{ background: 'rgba(239,68,68,.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,.3)', justifyContent: 'flex-start', fontWeight: 600 }} onClick={() => handleClear('all')} disabled={!!clearing}>
            {clearing === 'all' ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete_forever</span>}
            Clear ALL Data (Factory Reset)
          </button>
        </div>
      </div>

      <div className="card mt-4" style={{ maxWidth: 480 }}>
        <div className="sec-head">
          <span className="t-sm">System Info</span>
        </div>
        <div className="grid-2">
          <div><span className="dim">User:</span> <span className="fw-600">{user?.username}</span></div>
          <div><span className="dim">Role:</span> <span className="fw-600">{user?.role}</span></div>
          <div><span className="dim">Branch:</span> <span className="fw-600">{user?.branch || 'Wani'}</span></div>
          <div><span className="dim">Version:</span> <span className="fw-600">1.1.0</span></div>
        </div>
      </div>

      <div className="card mt-4" style={{ maxWidth: 700 }}>
        <div className="sec-head" style={{ justifyContent: 'space-between' }}>
          <span className="t-sm">Service Centers (Warranty/RMA) — {serviceCenters.length}</span>
          <button className="btn btn-primary btn-sm" onClick={openAddCenter} style={{ padding: '4px 12px', fontSize: 12 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>add</span> Add
          </button>
        </div>
        <p className="t-xs muted mb-3">Manage authorized service centers for warranty claims. These appear in the warranty details dropdown.</p>
        <div style={{ marginBottom: 12 }}>
          <input className="form-input" value={centerFilter} onChange={(e) => setCenterFilter(e.target.value)} placeholder="Filter by brand, device, city..." style={{ fontSize: 12, padding: '8px 12px' }} />
        </div>
        {loadingCenters ? (
          <div style={{ textAlign: 'center', padding: 20 }}><div className="spinner" style={{ width: 20, height: 20, margin: '0 auto' }} /></div>
        ) : serviceCenters.length === 0 ? (
          <div className="t-sm muted" style={{ textAlign: 'center', padding: 20 }}>No service centers added yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--c-border)' }}>
                  <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text3)' }}>Brand</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text3)' }}>Device</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text3)' }}>Location</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text3)' }}>City</th>
                  <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', color: 'var(--c-text3)' }}>Contact</th>
                  <th style={{ padding: '8px 6px', width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {serviceCenters
                  .filter(c => {
                    if (!centerFilter) return true;
                    const q = centerFilter.toLowerCase();
                    return c.brand.toLowerCase().includes(q) || 
                           c.deviceType.toLowerCase().includes(q) || 
                           (c.city || '').toLowerCase().includes(q) ||
                           (c.location || '').toLowerCase().includes(q);
                  })
                  .map(c => (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--c-border)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: 600 }}>{c.brand}</td>
                    <td style={{ padding: '8px 6px' }}>{c.deviceType}</td>
                    <td style={{ padding: '8px 6px', fontSize: 11 }}>{c.location}</td>
                    <td style={{ padding: '8px 6px' }}>{c.city}</td>
                    <td style={{ padding: '8px 6px', fontFamily: 'monospace', fontSize: 11 }}>{c.contact}</td>
                    <td style={{ padding: '8px 6px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn-icon" onClick={() => openEditCenter(c)} style={{ width: 24, height: 24 }}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>edit</span></button>
                        <button className="btn-icon" onClick={() => handleDeleteCenter(c._id)} style={{ width: 24, height: 24, color: 'var(--c-red)' }}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>delete</span></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isElectron && (
        <>
          <div className="card mt-4" style={{ maxWidth: 480 }}>
            <div className="sec-head">
              <span className="t-sm">Desktop Settings</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
              <div>
                <div className="t-sm fw-600">Auto Start on Boot</div>
                <div className="t-xs muted">Launch RMS when Windows starts</div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 40, height: 22, cursor: 'pointer' }}>
                <input type="checkbox" checked={autoStart} onChange={async (e) => {
                  await window.api.setAutoStart(e.target.checked);
                  setAutoStart(e.target.checked);
                  addToast(e.target.checked ? 'Auto start enabled' : 'Auto start disabled', 'success');
                }} style={{ display: 'none' }} />
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: 11, transition: '.3s',
                  background: autoStart ? 'var(--c-green)' : 'var(--c-surface3)',
                }} />
                <span style={{
                  position: 'absolute', left: autoStart ? 20 : 2, top: 2,
                  width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: '.3s',
                }} />
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--c-border)' }}>
              <div>
                <div className="t-sm fw-600">Auto Sync Data</div>
                <div className="t-xs muted">Sync every 5 minutes in background</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {lastSync && <span className="t-xs muted">Last: {new Date(lastSync).toLocaleTimeString()}</span>}
                <button className="btn btn-ghost" onClick={async () => {
                  setSyncing(true);
                  const result = await window.api.syncNow();
                  setHealth(result);
                  setLastSync(Date.now());
                  setSyncing(false);
                  addToast('Data synced', 'success');
                }} disabled={syncing}>
                  {syncing ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <span className="material-symbols-rounded" style={{ fontSize: 14 }}>sync</span>}
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>
            </div>
          </div>

          <div className="card mt-4" style={{ maxWidth: 480 }}>
            <div className="sec-head">
              <span className="t-sm">Connection Status</span>
            </div>
            <div className="grid-2">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: health.server ? 'var(--c-green)' : 'var(--c-red)' }}>cloud</span>
                <div>
                  <div className="t-xs fw-600">Server</div>
                  <div className="t-xs" style={{ color: health.server ? 'var(--c-green)' : 'var(--c-red)' }}>{health.server ? 'Connected' : 'Offline'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: health.db ? 'var(--c-green)' : 'var(--c-red)' }}>database</span>
                <div>
                  <div className="t-xs fw-600">Database</div>
                  <div className="t-xs" style={{ color: health.db ? 'var(--c-green)' : 'var(--c-red)' }}>{health.db ? 'Connected' : 'Offline'}</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Modal open={centerModalOpen} onClose={() => setCenterModalOpen(false)} title={editingCenter ? 'Edit Service Center' : 'Add Service Center'}>
        <form onSubmit={handleSaveCenter}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Brand *</label>
              <input className="form-input" value={centerForm.brand} onChange={(e) => setCenterForm({ ...centerForm, brand: e.target.value })} placeholder="e.g. HP, Dell, Lenovo" required />
            </div>
            <div className="form-group">
              <label className="form-label">Device Type *</label>
              <input className="form-input" value={centerForm.deviceType} onChange={(e) => setCenterForm({ ...centerForm, deviceType: e.target.value })} placeholder="e.g. Laptop, Printer, Router" required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Service Location</label>
            <input className="form-input" value={centerForm.location} onChange={(e) => setCenterForm({ ...centerForm, location: e.target.value })} placeholder="Full address" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input className="form-input" value={centerForm.city} onChange={(e) => setCenterForm({ ...centerForm, city: e.target.value })} placeholder="e.g. Chandrapur, Nagpur" />
            </div>
            <div className="form-group">
              <label className="form-label">Contact</label>
              <input className="form-input" value={centerForm.contact} onChange={(e) => setCenterForm({ ...centerForm, contact: e.target.value })} placeholder="Phone / Toll-free / Walk-in" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" className="btn btn-ghost" onClick={() => setCenterModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={savingCenter}>
              {savingCenter ? <span className="spinner" style={{ width: 14, height: 14 }} /> : (editingCenter ? 'Update' : 'Add Center')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
