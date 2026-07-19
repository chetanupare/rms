import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useBranch } from '../context/BranchContext';
import { formatDate, formatCurrency, statusBadgeClass } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

const DEVICE_TYPES = ['Laptop', 'Desktop', 'Printer', 'Scanner', 'Tablet', 'Monitor', 'UPS', 'Router', 'Storage', 'RAM'];
const INITIAL_FORM = { name: '', mobile: '', address: '', device: 'Laptop', brand: '', model: '', problem: '' };

export default function Customers() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { branch } = useBranch();
  const [customers, setCustomers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSource, setMergeSource] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');
  const [mergeSearchSource, setMergeSearchSource] = useState([]);
  const [mergeSearchTarget, setMergeSearchTarget] = useState([]);
  const [mergeSourceId, setMergeSourceId] = useState(null);
  const [mergeTargetId, setMergeTargetId] = useState(null);
  const isTechnician = user?.role === 'Technician';

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback((isLoadMore = false) => {
    if (!isLoadMore) setLoading(true);
    else setLoadingMore(true);

    const currentPage = isLoadMore ? page + 1 : 1;
    endpoints.customers({ page: currentPage, limit: 50 }).then((res) => {
      const data = res.data || [];
      if (isLoadMore) {
        setCustomers(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const newCustomers = data.filter(c => !existingIds.has(c._id));
          return [...prev, ...newCustomers];
        });
        setFiltered(prev => {
          const existingIds = new Set(prev.map(p => p._id));
          const newCustomers = data.filter(c => !existingIds.has(c._id));
          return [...prev, ...newCustomers];
        });
      } else {
        setCustomers(data);
        setFiltered(data);
      }
      setHasMore(res.pagination ? res.pagination.page < res.pagination.totalPages : false);
      setPage(currentPage);
    }).catch(() => addToast('Failed to load customers', 'error')).finally(() => {
      setLoading(false);
      setLoadingMore(false);
    });
  }, [branch, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!searchVal.trim()) { setFiltered(customers); return; }
    const q = searchVal.toLowerCase();
    setFiltered(customers.filter((c) => c.name.toLowerCase().includes(q) || c.mobile.includes(q) || c.address.toLowerCase().includes(q)));
  }, [searchVal, customers]);

  function openCreate() {
    setEditing(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({ name: c.name, mobile: c.mobile, address: c.address, device: '', brand: '', model: '', problem: '' });
    setModalOpen(true);
  }

  async function openHistory(c) {
    try {
      const { data } = await endpoints.customerHistory(c._id);
      setHistoryData(data);
      setHistoryOpen(true);
    } catch {
      addToast('Failed to load history', 'error');
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name || !form.mobile) return addToast('Name and mobile are required', 'warning');
    setSaving(true);
    try {
      if (editing) { await endpoints.updateCustomer(editing._id, form); addToast('Customer updated', 'success'); }
      else {
        // Create user account
        let customerPassword = '';
        try {
          const { data: userData } = await endpoints.createUser({ name: form.name, phone: form.mobile, role: 'customer' });
          customerPassword = userData.credentials?.password || '';
        } catch {}

        await endpoints.createCustomer(form);
        addToast('Customer created with job', 'success');

        // Open WhatsApp with credentials
        if (customerPassword) {
          const waMessage = encodeURIComponent(`Hello ${form.name},\n\nYour account has been created.\n\nLogin to track your repairs:\nPhone: ${form.mobile}\nPassword: ${customerPassword}\n\nApp: ${window.location.origin}\n\n- Sai Laptop & Computer Gallery`);
          window.open(`https://wa.me/91${form.mobile}?text=${waMessage}`, '_blank');
        }
      }
      setModalOpen(false);
      load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed to save', 'error'); }
    finally { setSaving(false); }
  }

  async function handleDelete(c) {
    if (!confirm('Delete this customer and all related records?')) return;
    try { await endpoints.deleteCustomer(c._id); addToast('Customer deleted', 'success'); load(); }
    catch { addToast('Failed to delete', 'error'); }
  }

  async function handleMerge() {
    if (!confirm('This will permanently merge the source customer into the target. Continue?')) return;
    try {
      const { data } = await endpoints.mergeCustomers({ sourceId: mergeSourceId, targetId: mergeTargetId });
      addToast(`Merged into ${data.targetName} (${data.movedJobs} jobs moved)`, 'success');
      setMergeOpen(false); setMergeSource(''); setMergeTarget(''); setMergeSourceId(null); setMergeTargetId(null); load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed to merge', 'error'); }
  }

  if (loading) return <LoadingSpinner text="Loading customers..." />;

  return (
    <div style={{ animation: 'pageIn .25s ease' }}>
      <div className="page-header">
        <div className="page-title">
          <div className="t-2xl">Customers</div>
          <div className="muted">{filtered.length} of {customers.length} registered</div>
        </div>
        <div className="page-actions">
          <div className="header-search" style={{ maxWidth: 180 }}>
            <span className="material-symbols-rounded si">search</span>
            <input placeholder="Search name, mobile..." value={searchVal} onChange={(e) => setSearchVal(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <span className="material-symbols-rounded">add</span> New Customer
          </button>
          {!isTechnician && <button className="btn btn-ghost" onClick={() => setMergeOpen(true)}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>merge</span> Merge</button>}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card"><EmptyState icon="people" title={searchVal ? 'No matching customers' : 'No customers yet'} description={searchVal ? 'Try a different search term' : 'Register a customer to start a service job'} action={searchVal ? undefined : 'Add Customer'} onAction={openCreate} /></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 44 }}>#</th>
                <th>Name / Mobile</th>
                <th>Address</th>
                <th style={{ width: 85 }}>Date</th>
                <th style={{ width: 88 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id} onClick={() => openHistory(c)} style={{ cursor: 'pointer' }}>
                  <td className="mono dim t-xs text-center">{c.customerId}</td>
                  <td>
                    <span className="fw-600 t-xs">{c.name}</span>
                    <div className="t-xs muted">{c.mobile}</div>
                  </td>
                  <td className="muted t-xs truncate" style={{ maxWidth: 220 }}>{c.address}</td>
                  <td className="muted t-xs">{formatDate(c.createdAt)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn-icon" onClick={() => openHistory(c)} title="History"><span className="material-symbols-rounded" style={{ fontSize: 14 }}>receipt_long</span></button>
                      <button className="btn-icon" onClick={() => openEdit(c)} title="Edit"><span className="material-symbols-rounded" style={{ fontSize: 14 }}>edit</span></button>
                      {!isTechnician && <button className="btn-icon" onClick={() => handleDelete(c)} title="Delete"><span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--c-red)' }}>delete</span></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => load(true)} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'New Customer'}>
        <form onSubmit={handleSave}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name" />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile *</label>
              <input className="form-input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Mobile number" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" />
          </div>
          {!editing && (
            <>
              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Device Type</label>
                  <select className="form-input" value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value })}>
                    {DEVICE_TYPES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Brand</label>
                  <input className="form-input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. HP" />
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input className="form-input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Model name" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Problem Description</label>
                <textarea className="form-input" rows={3} value={form.problem} onChange={(e) => setForm({ ...form, problem: e.target.value })} placeholder="Describe the issue" />
              </div>
            </>
          )}
          <div className="flex justify-end gap-2 mt-3">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <div className="spinner" style={{ width: 12, height: 12 }} /> : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title={`Service History — ${historyData?.customer?.name}`} wide>
        {historyData && (
          <div>
            <div className="t-sm muted mb-2">{historyData.customer.mobile} — {historyData.customer.address}</div>
            {(!historyData.jobCards || historyData.jobCards.length === 0) ? (
              <div className="t-xs muted">No service jobs</div>
            ) : (
              <>
                <div className="sec-head mt-3"><span className="t-sm">Job Cards</span></div>
                <table className="tbl">
                  <thead><tr><th>Job ID</th><th>Device</th><th>Model</th><th>Problem</th><th>Status</th><th>Branch</th><th>Date</th></tr></thead>
                  <tbody>{(historyData.jobCards || []).map((j) => (
                    <tr key={j._id}>
                      <td className="mono t-xs">{j.jobId}</td>
                      <td>{j.device || '—'}</td>
                      <td className="muted">{j.model || '—'}</td>
                      <td className="muted truncate t-xs" style={{ maxWidth: 160 }}>{j.problem || '—'}</td>
                      <td><span className={`badge ${statusBadgeClass(j.status)}`}>{j.status}</span></td>
                      <td>{j.branch}</td>
                      <td className="muted t-xs">{formatDate(j.createdAt)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </>
            )}
            {(historyData.repairs || []).length > 0 && (
              <><div className="sec-head mt-3"><span className="t-sm">Repairs</span></div>
              <table className="tbl">
                <thead><tr><th>Job ID</th><th>Technician</th><th>Diagnosis</th><th>Estimate</th><th>Status</th></tr></thead>
                <tbody>{(historyData.repairs || []).map((r) => (
                  <tr key={r._id}>
                    <td className="mono t-xs">{r.jobId}</td><td>{r.technician}</td>
                    <td className="muted truncate t-xs" style={{ maxWidth: 180 }}>{r.diagnosis}</td>
                    <td>{formatCurrency(r.estimateCost)}</td>
                    <td><span className={`badge ${r.status === 'Completed' ? 'badge-green' : 'badge-blue'}`}>{r.status}</span></td>
                  </tr>
                ))}</tbody>
              </table></>
            )}
            {(historyData.billing || []).length > 0 && (
              <><div className="sec-head mt-3"><span className="t-sm">Billing</span></div>
              <table className="tbl">
                <thead><tr><th>Invoice</th><th>Job ID</th><th>Type</th><th>Amount</th><th>Payment</th><th>Date</th></tr></thead>
                <tbody>{(historyData.billing || []).map((b) => (
                  <tr key={b._id}>
                    <td className="mono fw-600">{b.invoiceNo}</td>
                    <td className="mono dim t-xs">{b.jobId}</td>
                    <td>{b.billType}</td>
                    <td className="fw-600">{formatCurrency(b.amount)}</td>
                    <td><span className="badge badge-ghost">{b.paymentMode}</span></td>
                    <td className="muted t-xs">{formatDate(b.createdAt)}</td>
                  </tr>
                ))}</tbody>
              </table></>
            )}
          </div>
        )}
      </Modal>

      <Modal open={mergeOpen} onClose={() => setMergeOpen(false)} title="Merge Customers" wide>
        <div className="t-sm muted mb-3">Combine two duplicate customer profiles. All job history from the source will be moved to the target. Source will be deleted.</div>
        <div className="grid-2" style={{ gap: 16 }}>
          <div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--c-red)' }}>Source Customer (will be removed)</label>
              <input className="form-input" value={mergeSource} onChange={async (e) => {
                setMergeSource(e.target.value);
                if (e.target.value.length >= 2) {
                  try { const { data } = await endpoints.searchCustomers(e.target.value); setMergeSearchSource(Array.isArray(data) ? data : []); }
                  catch { setMergeSearchSource([]); }
                }
              }} placeholder="Search by name/mobile..." />
              {mergeSearchSource.length > 0 && <div style={{ background: 'var(--c-surface2)', borderRadius: 4, marginTop: 2 }}>
                {mergeSearchSource.map((c) => <button key={c._id} type="button" onClick={() => { setMergeSource(`${c.name} (${c.mobile})`); setMergeSearchSource([]); setMergeSourceId(c._id); }} style={{ display: 'block', width: '100%', padding: '4px 8px', background: 'none', border: 'none', color: 'var(--c-text)', cursor: 'pointer', fontSize: 11, textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>{c.name} — {c.mobile}</button>)}
              </div>}
            </div>
          </div>
          <div>
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--c-green)' }}>Target Customer (will be kept)</label>
              <input className="form-input" value={mergeTarget} onChange={async (e) => {
                setMergeTarget(e.target.value);
                if (e.target.value.length >= 2) {
                  try { const { data } = await endpoints.searchCustomers(e.target.value); setMergeSearchTarget(Array.isArray(data) ? data : []); }
                  catch { setMergeSearchTarget([]); }
                }
              }} placeholder="Search by name/mobile..." />
              {mergeSearchTarget.length > 0 && <div style={{ background: 'var(--c-surface2)', borderRadius: 4, marginTop: 2 }}>
                {mergeSearchTarget.map((c) => <button key={c._id} type="button" onClick={() => { setMergeTarget(`${c.name} (${c.mobile})`); setMergeSearchTarget([]); setMergeTargetId(c._id); }} style={{ display: 'block', width: '100%', padding: '4px 8px', background: 'none', border: 'none', color: 'var(--c-text)', cursor: 'pointer', fontSize: 11, textAlign: 'left', borderBottom: '1px solid var(--c-border)' }}>{c.name} — {c.mobile}</button>)}
              </div>}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <button className="btn btn-ghost" onClick={() => setMergeOpen(false)}>Cancel</button>
          <button className="btn btn-danger" disabled={!mergeSourceId || !mergeTargetId} onClick={handleMerge}>Merge Customers</button>
        </div>
      </Modal>
    </div>
  );
}
