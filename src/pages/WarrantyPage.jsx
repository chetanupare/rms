import { useState, useEffect, useCallback } from 'react';
import { api, endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDate, formatCurrency } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const RMA_STATUSES = ['Open', 'In Progress', 'Resolved', 'Rejected'];

export default function WarrantyPage() {
  const { addToast } = useToast();
  const [tab, setTab] = useState('active');
  const [rmaList, setRmaList] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [returnable, setReturnable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkModal, setCheckModal] = useState(false);
  const [checkMobile, setCheckMobile] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  const [rmaModal, setRmaModal] = useState(false);
  const [rmaForm, setRmaForm] = useState({ jobId: '', customerPhone: '', device: '', brand: '', model: '', problem: '', warrantyBillId: '' });
  const [rmaEdit, setRmaEdit] = useState(null);
  const [resolveForm, setResolveForm] = useState({ status: '', resolution: '' });
  
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [brandIsOther, setBrandIsOther] = useState(false);
  const [modelIsOther, setModelIsOther] = useState(false);
  const [customBrand, setCustomBrand] = useState('');
  const [customModel, setCustomModel] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      endpoints.rmaList({}),
      endpoints.warrantyExpiring({ days: 7 }),
      endpoints.supplierReturnable(),
    ]).then(([rRes, eRes, sRes]) => {
      setRmaList(rRes.data); setExpiring(eRes.data); setReturnable(sRes.data);
    }).catch(() => addToast('Failed to load', 'error')).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); loadBrands(); }, [load]);

  async function loadBrands() {
    try {
      const { data: brandData } = await endpoints.brands();
      const uniqueBrands = [...new Set((brandData || []).map(b => b.name))].sort();
      setBrands(uniqueBrands);
      const uniqueTypes = [...new Set((brandData || []).map(b => b.deviceType))].sort();
      setDeviceTypes(uniqueTypes);
    } catch { }
  }

  async function loadModels(brandName) {
    try {
      const { data: modelData } = await endpoints.deviceModels();
      const filtered = (modelData || []).filter(m => m.brand === brandName);
      setModels(filtered.map(m => m.modelName).sort());
    } catch { }
  }

  async function handleCheckWarranty() {
    if (!checkMobile) return addToast('Enter mobile number', 'warning');
    try {
      const { data } = await endpoints.warrantyCheck({ mobile: checkMobile });
      setCheckResult(data);
    } catch { addToast('Check failed', 'error'); }
  }

  async function handleCreateRMA(e) {
    e.preventDefault();
    if (!rmaForm.jobId || !rmaForm.customerPhone) return addToast('Job ID and Customer Mobile required', 'warning');
    try {
      await endpoints.createRMA(rmaForm);
      addToast('RMA claim created', 'success');
      setRmaModal(false); setRmaForm({ jobId: '', customerPhone: '', device: '', brand: '', model: '', problem: '', warrantyBillId: '' }); load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
  }

  async function handleUpdateRMA(claim) {
    if (!resolveForm.status) return addToast('Select status', 'warning');
    try {
      await endpoints.updateRMA(claim._id, resolveForm);
      addToast('RMA updated', 'success');
      setRmaEdit(null); setResolveForm({ status: '', resolution: '' }); load();
    } catch (err) { addToast('Failed', 'error'); }
  }

  if (loading) return <LoadingSpinner text="Loading warranty data..." />;

  return (
    <div style={{ animation: 'pageIn .25s ease' }}>
      <div className="page-header">
        <div className="page-title">
          <div className="t-2xl">Warranty & RMA</div>
          <div className="muted">{rmaList.filter((r) => r.status === 'Open').length} open claims · {expiring.length} expiring soon</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" onClick={() => setCheckModal(true)}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>search</span> Check Warranty</button>
          <button className="btn btn-primary" onClick={() => setRmaModal(true)}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>assignment_return</span> New RMA</button>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <button className={`btn ${tab === 'active' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('active')}>Active Claims ({rmaList.filter((r) => r.status !== 'Resolved').length})</button>
        <button className={`btn ${tab === 'all' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('all')}>All Claims ({rmaList.length})</button>
        <button className={`btn ${tab === 'expiring' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('expiring')}>Expiring ({expiring.length})</button>
        <button className={`btn ${tab === 'returns' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('returns')}>Supplier Returns ({returnable.length})</button>
      </div>

      {tab === 'expiring' && (
        <div className="card" style={{ padding: 0 }}>
          {expiring.length === 0 ? <div className="t-sm muted text-center" style={{ padding: 24 }}>No warranties expiring within 7 days</div> : (
            <table className="tbl">
              <thead><tr><th>Invoice</th><th>Job ID</th><th>Bill Type</th><th>Expires</th><th>Days Left</th></tr></thead>
              <tbody>{expiring.map((b) => (
                <tr key={b._id}>
                  <td className="mono fw-600">{b.invoiceNo}</td>
                  <td className="mono t-xs">{b.jobId}</td>
                  <td>{b.billType}</td>
                  <td className="t-xs">{formatDate(b.warrantyEnd)}</td>
                  <td><span className={`badge ${b.daysLeft <= 2 ? 'badge-red' : 'badge-amber'}`}>{b.daysLeft}d</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'returns' && (
        <div className="card" style={{ padding: 0 }}>
          {returnable.length === 0 ? <div className="t-sm muted text-center" style={{ padding: 24 }}>No returnable parts</div> : (
            <table className="tbl">
              <thead><tr><th>Part</th><th>SKU</th><th>Stock</th><th>Return By</th><th>Days Left</th></tr></thead>
              <tbody>{returnable.map((p) => (
                <tr key={p._id}>
                  <td className="fw-600 t-sm">{p.name}</td>
                  <td className="mono t-xs dim">{p.sku}</td>
                  <td className="fw-600">{p.stock}</td>
                  <td className="t-xs">{p.supplierWarrantyEnd ? formatDate(p.supplierWarrantyEnd) : '—'}</td>
                  <td><span className={`badge ${p.returnDaysLeft <= 7 ? 'badge-red' : 'badge-cyan'}`}>{p.returnDaysLeft}d</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      )}

      {tab !== 'expiring' && tab !== 'returns' && (
        <div className="card" style={{ padding: 0 }}>
          {rmaList.length === 0 ? <div className="t-sm muted text-center" style={{ padding: 24 }}>No RMA claims</div> : (
            <table className="tbl">
              <thead><tr><th>RMA ID</th><th>Customer</th><th>Device</th><th>Original Job</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {rmaList.filter((r) => tab === 'active' ? r.status !== 'Resolved' : true).map((claim) => (
                  <tr key={claim._id}>
                    <td className="mono fw-600 t-xs">{claim.rmaId}</td>
                    <td className="t-sm fw-600">{claim.customer?.name || '—'}</td>
                    <td className="t-sm">{claim.device} {claim.model}</td>
                    <td className="mono t-xs dim">{claim.originalJobId}</td>
                    <td><span className={`badge ${claim.status === 'Open' ? 'badge-red' : claim.status === 'In Progress' ? 'badge-blue' : claim.status === 'Resolved' ? 'badge-green' : 'badge-ghost'}`}>{claim.status}</span></td>
                    <td className="t-xs muted">{formatDate(claim.createdAt)}</td>
                    <td>
                      <button className="btn btn-ghost" onClick={() => { setRmaEdit(claim); setResolveForm({ status: claim.status, resolution: claim.resolution || '' }); }} style={{ fontSize: 9, padding: '2px 6px' }}>
                        {claim.status !== 'Resolved' ? 'Update' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal open={checkModal} onClose={() => { setCheckModal(false); setCheckResult(null); setCheckMobile(''); }} title="Check Warranty">
        <div className="form-group">
          <label className="form-label">Customer Mobile</label>
          <input className="form-input" value={checkMobile} onChange={(e) => setCheckMobile(e.target.value)} placeholder="Enter mobile number" />
        </div>
        <button className="btn btn-primary" onClick={handleCheckWarranty}>Check</button>
        {checkResult && (
          <div className="card mt-3" style={{ background: 'var(--c-surface2)' }}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ color: checkResult.active ? 'var(--c-green)' : 'var(--c-red)' }}>
                {checkResult.active ? 'verified' : 'cancel'}
              </span>
              <span className="fw-600">{checkResult.message}</span>
            </div>
            {checkResult.warranties?.map((w, i) => (
              <div key={i} className="t-xs mt-2" style={{ borderTop: '1px solid var(--c-border)', paddingTop: 4 }}>
                <div>Job: {w.jobId} · {w.billType} · Expires: {formatDate(w.warrantyEnd)}</div>
                <div className="dim">Device: {w.job?.device} {w.job?.model} · {w.daysLeft} days left</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={rmaModal} onClose={() => setRmaModal(false)} title="New RMA Claim">
        <form onSubmit={handleCreateRMA}>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Original Job ID</label><input className="form-input" value={rmaForm.jobId} onChange={(e) => setRmaForm({ ...rmaForm, jobId: e.target.value })} placeholder="e.g. RM-20260626-000123" required /></div>
            <div className="form-group"><label className="form-label">Customer Mobile</label><input className="form-input" value={rmaForm.customerPhone} onChange={(e) => setRmaForm({ ...rmaForm, customerPhone: e.target.value })} placeholder="Enter mobile number" required /></div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Device Type</label>
              <select className="form-input" value={rmaForm.device} onChange={(e) => setRmaForm({ ...rmaForm, device: e.target.value })}>
                <option value="">Select device...</option>
                {deviceTypes.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Brand</label>
              {brandIsOther ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="form-input" value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} placeholder="Enter brand" style={{ flex: 1 }} />
                  <button type="button" className="btn btn-ghost" onClick={() => { setBrandIsOther(false); setCustomBrand(''); }} style={{ padding: '6px 10px' }}>✕</button>
                </div>
              ) : (
                <select className="form-input" value={rmaForm.brand} onChange={(e) => {
                  if (e.target.value === '__other__') { setBrandIsOther(true); setRmaForm({ ...rmaForm, brand: '', model: '' }); }
                  else { setRmaForm({ ...rmaForm, brand: e.target.value, model: '' }); loadModels(e.target.value); }
                }}>
                  <option value="">Select brand...</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  <option value="__other__">+ Add New Brand</option>
                </select>
              )}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Model</label>
            {modelIsOther ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="form-input" value={customModel} onChange={(e) => setCustomModel(e.target.value)} placeholder="Enter model" style={{ flex: 1 }} />
                <button type="button" className="btn btn-ghost" onClick={() => { setModelIsOther(false); setCustomModel(''); }} style={{ padding: '6px 10px' }}>✕</button>
              </div>
            ) : (
              <select className="form-input" value={rmaForm.model} onChange={(e) => {
                if (e.target.value === '__other__') { setModelIsOther(true); setRmaForm({ ...rmaForm, model: '' }); }
                else setRmaForm({ ...rmaForm, model: e.target.value });
              }} disabled={!rmaForm.brand}>
                <option value="">Select model...</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
                <option value="__other__">+ Add New Model</option>
              </select>
            )}
          </div>
          <div className="form-group"><label className="form-label">Problem</label><textarea className="form-input" rows={2} value={rmaForm.problem} onChange={(e) => setRmaForm({ ...rmaForm, problem: e.target.value })} /></div>
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" className="btn btn-ghost" onClick={() => setRmaModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create RMA</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!rmaEdit} onClose={() => setRmaEdit(null)} title="Update RMA Claim">
        <div className="card mb-3" style={{ background: 'var(--c-surface2)' }}>
          <div className="t-xs"><span className="dim">RMA:</span> <strong>{rmaEdit?.rmaId}</strong></div>
          <div className="t-xs"><span className="dim">Job:</span> {rmaEdit?.originalJobId} · {rmaEdit?.device} {rmaEdit?.model}</div>
          <div className="t-xs"><span className="dim">Problem:</span> {rmaEdit?.problem}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input" value={resolveForm.status} onChange={(e) => setResolveForm({ ...resolveForm, status: e.target.value })}>
            {RMA_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Resolution Notes</label>
          <textarea className="form-input" rows={3} value={resolveForm.resolution} onChange={(e) => setResolveForm({ ...resolveForm, resolution: e.target.value })} placeholder="Describe resolution" />
        </div>
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={() => setRmaEdit(null)}>Cancel</button>
          <button className="btn btn-primary" onClick={() => handleUpdateRMA(rmaEdit)}>Update</button>
        </div>
      </Modal>
    </div>
  );
}
