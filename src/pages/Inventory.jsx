import { useState, useEffect, useCallback } from 'react';
import { endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const PART_CATEGORIES = ['Screens', 'Batteries', 'RAM', 'Storage', 'Chargers', 'Cooling', 'Keyboards', 'Networking', 'Consumables', 'Adapters', 'Cables', 'General'];

export default function Inventory() {
  const { addToast } = useToast();
  const [tab, setTab] = useState('parts');
  const [parts, setParts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pos, setPos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partModal, setPartModal] = useState(false);
  const [supplierModal, setSupplierModal] = useState(false);
  const [poModal, setPoModal] = useState(false);
  const [receiveModal, setReceiveModal] = useState(null);
  const [editPart, setEditPart] = useState(null);
  const [editSupplier, setEditSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [partForm, setPartForm] = useState({ name: '', sku: '', category: 'General', unit: 'pcs', stock: 0, threshold: 5, price: 0 });
  const [supplierForm, setSupplierForm] = useState({ name: '', contact: '', phone: '', email: '', address: '', gst: '' });
  const [poForm, setPoForm] = useState({ supplierId: '', supplierName: '', items: [{ partId: '', partName: '', sku: '', qty: 1 }], notes: '' });

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([endpoints.inventoryParts({ search: searchTerm || undefined }), endpoints.suppliers(), endpoints.purchaseOrders({})])
      .then(([pRes, sRes, poRes]) => { setParts(Array.isArray(pRes.data) ? pRes.data : []); setSuppliers(Array.isArray(sRes.data) ? sRes.data : []); setPos(Array.isArray(poRes.data) ? poRes.data : []); })
      .catch(() => addToast('Failed to load inventory', 'error')).finally(() => setLoading(false));
  }, [searchTerm]);

  useEffect(() => { load(); }, [load]);

  async function handleSavePart(e) {
    e.preventDefault();
    if (!partForm.name || !partForm.sku) return addToast('Name and SKU required', 'warning');
    try {
      if (editPart) { await endpoints.updatePart(editPart._id, partForm); addToast('Part updated', 'success'); }
      else { await endpoints.createPart(partForm); addToast('Part created', 'success'); }
      setPartModal(false); setEditPart(null); setPartForm({ name: '', sku: '', category: 'General', unit: 'pcs', stock: 0, threshold: 5, price: 0 }); load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
  }

  async function handleDeletePart(p) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try { await endpoints.deletePart(p._id); addToast('Deleted', 'success'); load(); }
    catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
  }

  async function handleSaveSupplier(e) {
    e.preventDefault();
    if (!supplierForm.name) return addToast('Name required', 'warning');
    try {
      if (editSupplier) { await endpoints.updateSupplier(editSupplier._id, supplierForm); addToast('Supplier updated', 'success'); }
      else { await endpoints.createSupplier(supplierForm); addToast('Supplier created', 'success'); }
      setSupplierModal(false); setEditSupplier(null); setSupplierForm({ name: '', contact: '', phone: '', email: '', address: '', gst: '' }); load();
    } catch (err) { addToast('Failed', 'error'); }
  }

  async function handleCreatePO(e) {
    e.preventDefault();
    if (!poForm.supplierId || !poForm.items[0]?.partId) return addToast('Supplier and at least one item required', 'warning');
    try {
      await endpoints.createPurchaseOrder(poForm);
      addToast('Purchase order created', 'success');
      setPoModal(false); setPoForm({ supplierId: '', supplierName: '', items: [{ partId: '', partName: '', sku: '', qty: 1 }], notes: '' }); load();
    } catch (err) { addToast('Failed', 'error'); }
  }

  async function handleReceivePO() {
    if (!receiveModal) return;
    try {
      await endpoints.receivePurchaseOrder(receiveModal._id, { items: receiveModal.items.map((it) => ({ partId: it.partId, partName: it.partName, sku: it.sku, qty: it.qty })) });
      addToast('Stock received', 'success'); setReceiveModal(null); load();
    } catch (err) { addToast('Failed', 'error'); }
  }

  function openEditPart(p) { setEditPart(p); setPartForm({ name: p.name, sku: p.sku, category: p.category, unit: p.unit, stock: p.stock, threshold: p.threshold, price: p.price }); setPartModal(true); }
  function openNewPart() { setEditPart(null); setPartForm({ name: '', sku: '', category: 'General', unit: 'pcs', stock: 0, threshold: 5, price: 0 }); setPartModal(true); }

  if (loading) return <LoadingSpinner text="Loading inventory..." />;

  const lowStockItems = parts.filter((p) => p.stock <= p.threshold);

  return (
    <div style={{ animation: 'pageIn .25s ease' }}>
      <div className="page-header">
        <div className="page-title">
          <div className="t-2xl">Inventory</div>
          <div className="muted">{parts.length} parts · {lowStockItems.length} low stock</div>
        </div>
        <div className="page-actions">
          {tab === 'parts' && <button className="btn btn-primary" onClick={openNewPart}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>add</span> Add Part</button>}
          {tab === 'suppliers' && <button className="btn btn-primary" onClick={() => { setEditSupplier(null); setSupplierForm({ name: '', contact: '', phone: '', email: '', address: '', gst: '' }); setSupplierModal(true); }}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>add</span> Add Supplier</button>}
          {tab === 'pos' && <button className="btn btn-primary" onClick={() => { setPoForm({ supplierId: '', supplierName: '', items: [{ partId: '', partName: '', sku: '', qty: 1 }], notes: '' }); setPoModal(true); }}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>add</span> New PO</button>}
        </div>
      </div>

      {lowStockItems.length > 0 && tab === 'parts' && (
        <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 'var(--r-lg)', padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--c-red)' }}>warning</span>
          <span className="fw-600" style={{ color: 'var(--c-red)' }}>{lowStockItems.length} low stock items</span>
          <span className="dim">—</span>
          {lowStockItems.slice(0, 5).map((p) => (
            <span key={p._id} className="badge badge-ghost" style={{ fontSize: 9 }}>{p.name} ({p.stock})</span>
          ))}
          {lowStockItems.length > 5 && <span className="t-xs dim">+{lowStockItems.length - 5} more</span>}
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <button className={`btn ${tab === 'parts' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('parts')}>Parts ({parts.length})</button>
        <button className={`btn ${tab === 'suppliers' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('suppliers')}>Suppliers ({suppliers.length})</button>
        <button className={`btn ${tab === 'pos' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('pos')}>Purchase Orders ({pos.length})</button>
      </div>

      {tab === 'parts' && (
        <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
          <input className="form-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search parts..." style={{ width: 200, fontSize: 11, padding: '5px 8px' }} />
        </div>
      )}

      {tab === 'parts' && (
        <div className="card" style={{ padding: 0 }}>
          {parts.length === 0 ? <div className="t-sm muted text-center" style={{ padding: 24 }}>No parts found</div> : (
            <table className="tbl">
              <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th style={{ textAlign: 'right' }}>Stock</th><th style={{ textAlign: 'right' }}>Threshold</th><th style={{ textAlign: 'right' }}>Price</th><th></th></tr></thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p._id} onClick={() => openEditPart(p)} style={{ cursor: 'pointer' }}>
                    <td className="mono t-xs dim">{p.sku}</td>
                    <td className="fw-600 t-sm">{p.name}</td>
                    <td><span className="badge badge-ghost" style={{ fontSize: 8 }}>{p.category}</span></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: p.stock <= p.threshold ? 'var(--c-red)' : 'var(--c-green)' }}>{p.stock}</td>
                    <td style={{ textAlign: 'right', color: 'var(--c-text3)' }}>{p.threshold}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(p.price)}</td>
                    <td><button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleDeletePart(p); }}><span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--c-red)' }}>delete</span></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="card" style={{ padding: 0 }}>
          {suppliers.length === 0 ? <div className="t-sm muted text-center" style={{ padding: 24 }}>No suppliers</div> : (
            <table className="tbl">
              <thead><tr><th>Name</th><th>Contact</th><th>Phone</th><th>Email</th><th>GST</th><th></th></tr></thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s._id}>
                    <td className="fw-600 t-sm">{s.name}</td>
                    <td className="t-sm">{s.contact || '—'}</td>
                    <td className="t-sm">{s.phone || '—'}</td>
                    <td className="t-xs dim">{s.email || '—'}</td>
                    <td className="mono t-xs">{s.gst || '—'}</td>
                    <td><button className="btn-icon" onClick={() => { setEditSupplier(s); setSupplierForm({ name: s.name, contact: s.contact || '', phone: s.phone || '', email: s.email || '', address: s.address || '', gst: s.gst || '' }); setSupplierModal(true); }}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>edit</span></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'pos' && (
        <div className="card" style={{ padding: 0 }}>
          {pos.length === 0 ? <div className="t-sm muted text-center" style={{ padding: 24 }}>No purchase orders</div> : (
            <table className="tbl">
              <thead><tr><th>Supplier</th><th>Items</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {pos.map((po) => (
                  <tr key={po._id}>
                    <td className="fw-600 t-sm">{po.supplierName}</td>
                    <td className="t-xs">{po.items.length} items</td>
                    <td><span className={`badge ${po.status === 'Received' ? 'badge-green' : 'badge-amber'}`}>{po.status}</span></td>
                    <td className="t-xs muted">{new Date(po.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>{po.status === 'Pending' && <button className="btn btn-ghost" onClick={() => setReceiveModal(po)} style={{ fontSize: 9, padding: '2px 6px' }}>Receive</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={partModal} onClose={() => setPartModal(false)} title={editPart ? 'Edit Part' : 'New Part'}>
        <form onSubmit={handleSavePart}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Part Name</label>
              <input className="form-input" value={partForm.name} onChange={(e) => setPartForm({ ...partForm, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">SKU</label>
              <input className="form-input" value={partForm.sku} onChange={(e) => setPartForm({ ...partForm, sku: e.target.value })} placeholder="e.g. LCD-156-HD" required />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={partForm.category} onChange={(e) => setPartForm({ ...partForm, category: e.target.value })}>
                {PART_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <input className="form-input" value={partForm.unit} onChange={(e) => setPartForm({ ...partForm, unit: e.target.value })} />
            </div>
          </div>
          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Current Stock</label>
              <input className="form-input" type="number" value={partForm.stock} onChange={(e) => setPartForm({ ...partForm, stock: Number(e.target.value) })} min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Low Stock Threshold</label>
              <input className="form-input" type="number" value={partForm.threshold} onChange={(e) => setPartForm({ ...partForm, threshold: Number(e.target.value) })} min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price (₹)</label>
              <input className="form-input" type="number" value={partForm.price} onChange={(e) => setPartForm({ ...partForm, price: Number(e.target.value) })} min="0" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" className="btn btn-ghost" onClick={() => setPartModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editPart ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={supplierModal} onClose={() => setSupplierModal(false)} title={editSupplier ? 'Edit Supplier' : 'New Supplier'}>
        <form onSubmit={handleSaveSupplier}>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Company Name</label><input className="form-input" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Contact Person</label><input className="form-input" value={supplierForm.contact} onChange={(e) => setSupplierForm({ ...supplierForm, contact: e.target.value })} /></div>
          </div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={supplierForm.address} onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">GST Number</label><input className="form-input" value={supplierForm.gst} onChange={(e) => setSupplierForm({ ...supplierForm, gst: e.target.value })} /></div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" className="btn btn-ghost" onClick={() => setSupplierModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editSupplier ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={poModal} onClose={() => setPoModal(false)} title="New Purchase Order" wide>
        <form onSubmit={handleCreatePO}>
          <div className="form-group">
            <label className="form-label">Supplier</label>
            <select className="form-input" value={poForm.supplierId} onChange={(e) => {
              const s = suppliers.find((s) => s._id === e.target.value);
              setPoForm({ ...poForm, supplierId: e.target.value, supplierName: s?.name || '' });
            }} required>
              <option value="">Select supplier</option>
              {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <input className="form-input" value={poForm.notes} onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })} placeholder="Optional notes" />
          </div>
          <div className="sec-head mt-3"><span className="t-sm">Items</span></div>
          {poForm.items.map((item, i) => (
            <div key={i} className="flex items-start gap-1 mb-2">
              <select className="form-input" value={item.partId} onChange={(e) => {
                const p = parts.find((p) => p._id === e.target.value);
                const items = [...poForm.items];
                items[i] = { ...items[i], partId: e.target.value, partName: p?.name || '', sku: p?.sku || '' };
                setPoForm({ ...poForm, items });
              }} style={{ flex: 1, fontSize: 11, padding: '5px 6px' }} required>
                <option value="">Select part</option>
                {parts.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
              </select>
              <input className="form-input" type="number" value={item.qty} onChange={(e) => {
                const items = [...poForm.items]; items[i] = { ...items[i], qty: Number(e.target.value) }; setPoForm({ ...poForm, items });
              }} placeholder="Qty" style={{ width: 60, fontSize: 11, padding: '5px 6px' }} min="1" />
              {poForm.items.length > 1 && <button type="button" className="btn-icon" onClick={() => setPoForm({ ...poForm, items: poForm.items.filter((_, j) => j !== i) })}><span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--c-red)' }}>remove_circle</span></button>}
            </div>
          ))}
          <button type="button" className="btn btn-ghost" onClick={() => setPoForm({ ...poForm, items: [...poForm.items, { partId: '', partName: '', sku: '', qty: 1 }] })} style={{ fontSize: 10, padding: '4px 8px' }}><span className="material-symbols-rounded" style={{ fontSize: 12 }}>add</span> Add Item</button>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" className="btn btn-ghost" onClick={() => setPoModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create PO</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!receiveModal} onClose={() => setReceiveModal(null)} title="Receive Stock">
        {receiveModal && (
          <div>
            <div className="t-sm mb-2">Supplier: <strong>{receiveModal.supplierName}</strong></div>
            <table className="tbl">
              <thead><tr><th>Part</th><th>SKU</th><th style={{ textAlign: 'right' }}>Ordered</th><th style={{ textAlign: 'right' }}>To Receive</th></tr></thead>
              <tbody>
                {receiveModal.items.map((item, i) => (
                  <tr key={i}>
                    <td className="t-sm">{item.partName}</td>
                    <td className="mono t-xs dim">{item.sku}</td>
                    <td style={{ textAlign: 'right' }}>{item.qty}</td>
                    <td style={{ textAlign: 'right' }}>
                      <input className="form-input" type="number" value={item.qty} onChange={(e) => {
                        const items = [...receiveModal.items]; items[i] = { ...items[i], qty: Number(e.target.value) }; setReceiveModal({ ...receiveModal, items });
                      }} style={{ width: 60, fontSize: 11, padding: '3px 4px' }} min="0" max={item.qty} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-end gap-2 mt-3">
              <button className="btn btn-ghost" onClick={() => setReceiveModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleReceivePO}>Receive Stock</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
