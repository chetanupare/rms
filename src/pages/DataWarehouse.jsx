import { useState, useEffect, useCallback } from 'react';
import { endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const DEVICE_CATEGORIES = [
  { key: 'Laptop', icon: 'laptop' },
  { key: 'Desktop', icon: 'desktop_windows' },
  { key: 'Printer', icon: 'print' },
  { key: 'Scanner', icon: 'scanner' },
  { key: 'Tablet', icon: 'tablet' },
  { key: 'Monitor', icon: 'monitor' },
  { key: 'UPS', icon: 'battery_charging_full' },
  { key: 'Router', icon: 'router' },
  { key: 'Storage', icon: 'storage' },
  { key: 'RAM', icon: 'memory' },
];

export default function DataWarehouse() {
  const { addToast } = useToast();
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('categories');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [brandModal, setBrandModal] = useState(false);
  const [modelModal, setModelModal] = useState(false);
  const [brandForm, setBrandForm] = useState({ name: '', deviceType: 'Laptop' });
  const [modelForm, setModelForm] = useState({ brand: '', deviceType: 'Laptop', modelName: '' });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([endpoints.brands(), endpoints.deviceModels()])
      .then(([bRes, mRes]) => { setBrands(bRes.data); setModels(mRes.data); })
      .catch(() => addToast('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredBrands = deviceFilter ? brands.filter((b) => b.deviceType === deviceFilter) : brands;
  const filteredModels = deviceFilter ? models.filter((m) => m.deviceType === deviceFilter) : models;

  async function handleAddBrand(e) {
    e.preventDefault();
    if (!brandForm.name) return;
    try { await endpoints.createBrand(brandForm); addToast('Brand added', 'success'); setBrandModal(false); setBrandForm({ name: '', deviceType: 'Laptop' }); load(); }
    catch { addToast('Failed to add brand', 'error'); }
  }

  async function handleDeleteBrand(b) {
    if (!confirm(`Delete "${b.name}"?`)) return;
    try { await endpoints.deleteBrand(b._id); addToast('Brand deleted', 'success'); load(); }
    catch { addToast('Failed to delete', 'error'); }
  }

  async function handleAddModel(e) {
    e.preventDefault();
    if (!modelForm.brand || !modelForm.modelName) return;
    try { await endpoints.createDeviceModel(modelForm); addToast('Model added', 'success'); setModelModal(false); setModelForm({ brand: '', deviceType: 'Laptop', modelName: '' }); load(); }
    catch { addToast('Failed to add model', 'error'); }
  }

  async function handleDeleteModel(m) {
    if (!confirm(`Delete "${m.modelName}"?`)) return;
    try { await endpoints.deleteDeviceModel(m._id); addToast('Model deleted', 'success'); load(); }
    catch { addToast('Failed to delete', 'error'); }
  }

  if (loading) return <LoadingSpinner text="Loading warehouse..." />;

  return (
    <div style={{ animation: 'pageIn .25s ease' }}>
      <div className="page-header">
        <div className="page-title">
          <div className="t-2xl">Data Warehouse</div>
          <div className="muted">Device categories, brands, and models</div>
        </div>
        <div className="page-actions">
          {tab !== 'categories' && <>
            <button className="btn btn-primary" onClick={() => tab === 'brands' ? setBrandModal(true) : setModelModal(true)}>
              <span className="material-symbols-rounded">add</span> Add {tab === 'brands' ? 'Brand' : 'Model'}
            </button>
            <button className="btn btn-ghost" onClick={() => {
              const input = document.createElement('input');
              input.type = 'file'; input.accept = '.csv';
              input.onchange = async (e) => {
                const file = e.target.files[0]; if (!file) return;
                const text = await file.text();
                const lines = text.split('\n').filter(Boolean);
                const rows = lines.slice(1).map((l) => l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
                try {
                  if (tab === 'brands') {
                    const { data } = await endpoints.importBrands({ rows: rows.map((r) => ({ name: r[0], deviceType: r[1] || 'Laptop' })) });
                    addToast(`${data.inserted} brands imported`, 'success');
                  } else {
                    const { data } = await endpoints.importDeviceModels({ rows: rows.map((r) => ({ brand: r[0], deviceType: r[1] || 'Laptop', modelName: r[2] })) });
                    addToast(`${data.inserted} models imported (${data.skipped} skipped)`, 'success');
                  }
                  load();
                } catch (err) { addToast(err.response?.data?.message || 'Import failed', 'error'); }
              };
              input.click();
            }} style={{ fontSize: 10, padding: '4px 8px' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 12 }}>upload_file</span> Import CSV
            </button>
          </>}
        </div>
      </div>

      <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
        <button className={`btn ${tab === 'categories' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('categories')}>Categories</button>
        <button className={`btn ${tab === 'brands' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setTab('brands'); setDeviceFilter(''); }}>Brands ({brands.length})</button>
        <button className={`btn ${tab === 'models' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setTab('models'); setDeviceFilter(''); }}>Models ({models.length})</button>
      </div>

      {tab === 'categories' && (
        <div className="grid-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {DEVICE_CATEGORIES.map((cat) => {
            const brandCount = brands.filter((b) => b.deviceType === cat.key).length;
            const modelCount = models.filter((m) => m.deviceType === cat.key).length;
            return (
              <div key={cat.key} className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: 16 }} onClick={() => { setDeviceFilter(cat.key); setTab('brands'); }}>
                <span className="material-symbols-rounded" style={{ fontSize: 28, color: 'var(--c-accent)' }}>{cat.icon}</span>
                <div className="t-sm fw-600 mt-1">{cat.key}</div>
                <div className="t-xs muted">{brandCount} brands · {modelCount} models</div>
              </div>
            );
          })}
        </div>
      )}

      {(tab === 'brands' || tab === 'models') && (
        <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
          <button className={`btn ${!deviceFilter ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDeviceFilter('')}>All</button>
          {DEVICE_CATEGORIES.map((cat) => (
            <button key={cat.key} className={`btn ${deviceFilter === cat.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setDeviceFilter(cat.key)}>
              {cat.key}
            </button>
          ))}
        </div>
      )}

      {tab === 'brands' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredBrands.length === 0 ? <div className="t-sm muted text-center" style={{ padding: 20 }}>No brands {deviceFilter ? `for ${deviceFilter}` : ''}</div>
          : <table className="tbl">
            <thead><tr><th>Brand</th><th>Device Type</th><th></th></tr></thead>
            <tbody>{filteredBrands.map((b) => (
              <tr key={b._id}>
                <td className="fw-600">{b.name}</td>
                <td><span className="badge badge-ghost">{b.deviceType}</span></td>
                <td><button className="btn-icon" onClick={() => handleDeleteBrand(b)}><span className="material-symbols-rounded" style={{ color: 'var(--c-red)' }}>delete</span></button></td>
              </tr>
            ))}</tbody>
          </table>}
        </div>
      )}

      {tab === 'models' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredModels.length === 0 ? <div className="t-sm muted text-center" style={{ padding: 20 }}>No models {deviceFilter ? `for ${deviceFilter}` : ''}</div>
          : <table className="tbl">
            <thead><tr><th>Model</th><th>Brand</th><th>Device Type</th><th></th></tr></thead>
            <tbody>{filteredModels.map((m) => (
              <tr key={m._id}>
                <td className="fw-600">{m.modelName}</td>
                <td>{m.brand}</td>
                <td><span className="badge badge-ghost">{m.deviceType}</span></td>
                <td><button className="btn-icon" onClick={() => handleDeleteModel(m)}><span className="material-symbols-rounded" style={{ color: 'var(--c-red)' }}>delete</span></button></td>
              </tr>
            ))}</tbody>
          </table>}
        </div>
      )}

      <Modal open={brandModal} onClose={() => setBrandModal(false)} title="Add Brand">
        <form onSubmit={handleAddBrand}>
          <div className="form-group">
            <label className="form-label">Brand Name</label>
            <input className="form-input" value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} placeholder="e.g. HP, Dell" required />
          </div>
          <div className="form-group">
            <label className="form-label">Device Type</label>
            <select className="form-input" value={brandForm.deviceType} onChange={(e) => setBrandForm({ ...brandForm, deviceType: e.target.value })}>
              {DEVICE_CATEGORIES.map((d) => <option key={d.key}>{d.key}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" className="btn btn-ghost" onClick={() => setBrandModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Brand</button>
          </div>
        </form>
      </Modal>

      <Modal open={modelModal} onClose={() => setModelModal(false)} title="Add Device Model">
        <form onSubmit={handleAddModel}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Brand</label>
              <select className="form-input" value={modelForm.brand} onChange={(e) => setModelForm({ ...modelForm, brand: e.target.value })} required>
                <option value="">Select brand</option>
                {brands.filter((b) => !deviceFilter || b.deviceType === deviceFilter).map((b) => <option key={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Device Type</label>
              <select className="form-input" value={modelForm.deviceType} onChange={(e) => setModelForm({ ...modelForm, deviceType: e.target.value })}>
                {DEVICE_CATEGORIES.map((d) => <option key={d.key}>{d.key}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Model Name</label>
            <input className="form-input" value={modelForm.modelName} onChange={(e) => setModelForm({ ...modelForm, modelName: e.target.value })} placeholder="e.g. Pavilion 15" required />
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" className="btn btn-ghost" onClick={() => setModelModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Model</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
