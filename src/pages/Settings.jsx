import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export default function Settings() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [mongoUri, setMongoUri] = useState(localStorage.getItem('slcg_mongo_uri') || '');
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

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
          <span className="t-sm">System Info</span>
        </div>
        <div className="grid-2">
          <div><span className="dim">User:</span> <span className="fw-600">{user?.username}</span></div>
          <div><span className="dim">Role:</span> <span className="fw-600">{user?.role}</span></div>
          <div><span className="dim">Branch:</span> <span className="fw-600">{user?.branch || 'Wani'}</span></div>
          <div><span className="dim">Version:</span> <span className="fw-600">1.0.0</span></div>
        </div>
      </div>
    </div>
  );
}
