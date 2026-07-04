import { useState, useEffect } from 'react';
import { endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

export default function ServiceCenters() {
  const { addToast } = useToast();
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ brand: '', deviceType: '', location: '', city: '', contact: '' });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => { loadCenters(); }, []);

  async function loadCenters() {
    setLoading(true);
    try {
      const { data } = await endpoints.serviceCenters();
      setCenters(data || []);
    } catch { } finally { setLoading(false); }
  }

  function openAdd() {
    setEditing(null);
    setForm({ brand: '', deviceType: '', location: '', city: '', contact: '' });
    setModalOpen(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({ brand: c.brand, deviceType: c.deviceType, location: c.location || '', city: c.city || '', contact: c.contact || '' });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.brand || !form.deviceType) return addToast('Brand and Device required', 'warning');
    setSaving(true);
    try {
      if (editing) {
        await endpoints.updateServiceCenter(editing._id, form);
        addToast('Updated', 'success');
      } else {
        await endpoints.createServiceCenter(form);
        addToast('Added', 'success');
      }
      setModalOpen(false);
      loadCenters();
    } catch { addToast('Failed', 'error'); } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this service center?')) return;
    try { await endpoints.deleteServiceCenter(id); addToast('Deleted', 'success'); loadCenters(); }
    catch { addToast('Failed', 'error'); }
  }

  const filtered = centers.filter(c => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return c.brand.toLowerCase().includes(q) || c.deviceType.toLowerCase().includes(q) || (c.city || '').toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q);
  });

  const brands = [...new Set(centers.map(c => c.brand))].sort();

  if (loading) return <LoadingSpinner text="Loading service centers..." />;

  return (
    <div style={{ animation: 'pageIn .2s ease' }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-title">
          <div style={{ fontSize: 20, fontWeight: 700 }}>Service Centers</div>
          <div style={{ fontSize: 12, color: 'var(--c-text3)' }}>{centers.length} centers · {brands.length} brands</div>
        </div>
        <div className="page-actions">
          <input className="form-input" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter..." style={{ width: 200, fontSize: 12, padding: '6px 12px' }} />
          <button className="btn btn-primary" onClick={openAdd} style={{ fontSize: 12, padding: '6px 14px' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>add</span> Add Center
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--c-text3)' }}>No service centers found</div>
        ) : (
          filtered.map(c => (
            <div key={c._id} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--c-accent)' }}>support_agent</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{c.brand}</span>
                  <span style={{ fontSize: 11, color: 'var(--c-text3)' }}>·</span>
                  <span style={{ fontSize: 12, color: 'var(--c-text2)' }}>{c.deviceType}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--c-text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.location}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--c-text2)' }}>{c.city}</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--c-text3)' }}>{c.contact}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button className="btn-icon" onClick={() => openEdit(c)} style={{ width: 24, height: 24 }}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>edit</span></button>
                <button className="btn-icon" onClick={() => handleDelete(c._id)} style={{ width: 24, height: 24, color: 'var(--c-red)' }}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>delete</span></button>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Service Center' : 'Add Service Center'}>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">Brand *</label><input className="form-input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="HP, Dell, Lenovo..." required /></div>
            <div className="form-group"><label className="form-label">Device Type *</label><input className="form-input" value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })} placeholder="Laptop, Printer..." required /></div>
          </div>
          <div className="form-group"><label className="form-label">Location</label><input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Full address" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">City</label><input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Chandrapur, Nagpur..." /></div>
            <div className="form-group"><label className="form-label">Contact</label><input className="form-input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Phone / Toll-free" /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2 }}>{saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : (editing ? 'Update' : 'Add')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
