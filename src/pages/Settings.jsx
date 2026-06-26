import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

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
          <div><span className="dim">Version:</span> <span className="fw-600">1.1.0</span></div>
        </div>
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
    </div>
  );
}
