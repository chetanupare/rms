import { useState, useEffect, useRef, useCallback } from 'react';
import { endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const CATEGORIES_IN = ['Repair Payment', 'Part Sale', 'Advance', 'Credit Received', 'Other Income'];
const CATEGORIES_OUT = ['Part Purchase', 'Expense', 'Petty Cash', 'Salary', 'Rent', 'Credit Given', 'Other Expense'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit'];

const QUICK_IN = [
  { label: 'Repair ₹500', category: 'Repair Payment', amount: 500 },
  { label: 'Repair ₹1000', category: 'Repair Payment', amount: 1000 },
  { label: 'Repair ₹1500', category: 'Repair Payment', amount: 1500 },
  { label: 'Repair ₹2000', category: 'Repair Payment', amount: 2000 },
  { label: 'Part Sale', category: 'Part Sale', amount: 0 },
];

const QUICK_OUT = [
  { label: 'Tea ₹20', category: 'Petty Cash', amount: 20 },
  { label: 'Snacks ₹50', category: 'Petty Cash', amount: 50 },
  { label: 'Auto ₹100', category: 'Expense', amount: 100 },
  { label: 'Part Buy', category: 'Part Purchase', amount: 0 },
];

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '1px', background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
    {t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
  </div>;
}

export default function DailyRegistrar() {
  const { addToast } = useToast();
  const [tab, setTab] = useState('today');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState([]);
  const [viewDay, setViewDay] = useState(null);
  const [viewEntries, setViewEntries] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const defaultForm = { type: 'in', category: 'Repair Payment', amount: '', description: '', paymentMode: 'Cash', customerName: '', customerMobile: '', productName: '', quantity: '', isReturn: false };
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showCustomerSuggest, setShowCustomerSuggest] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const amountRef = useRef(null);
  const customerRef = useRef(null);
  const descRef = useRef(null);
  const customerTimerRef = useRef(null);

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const targetDate = tab === 'today' ? today : yesterday;
  const isToday = tab === 'today';

  const load = useCallback(() => {
    if (tab === 'history') return;
    setLoading(true);
    endpoints.register(targetDate).then(({ data }) => { setData(data); setEntries(data.entries || []); }).catch(() => addToast('Failed to load', 'error')).finally(() => setLoading(false));
  }, [targetDate, tab]);
  useEffect(() => { load(); }, [load]);

  const loadSummary = useCallback(() => {
    setLoading(true);
    endpoints.registerSummary({}).then(({ data }) => setSummary(data || [])).catch(() => addToast('Failed to load history', 'error')).finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (tab === 'history') loadSummary(); }, [tab]);

  async function viewDayDetails(date) {
    try { const { data } = await endpoints.register(date); setViewDay(date); setViewEntries(data.entries || []); }
    catch { addToast('Failed to load', 'error'); }
  }

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') { if (modalOpen) { setModalOpen(false); } else if (viewDay) { setViewDay(null); } return; }
      if (modalOpen) return;
      if (e.key === 'i' && !e.ctrlKey && !e.metaKey && isToday && !data?.finalized) { e.preventDefault(); openNewModal('in'); }
      if (e.key === 'o' && !e.ctrlKey && !e.metaKey && isToday && !data?.finalized) { e.preventDefault(); openNewModal('out'); }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [modalOpen, isToday, data, viewDay]);

  function openNewModal(type, quick) {
    setEditingEntry(null);
    const cat = quick?.category || (type === 'in' ? 'Repair Payment' : 'Expense');
    const amt = quick?.amount ? String(quick.amount) : '';
    setForm({ ...defaultForm, type, category: cat, amount: amt });
    setSelectedCustomer(null);
    setModalOpen(true);
    setTimeout(() => {
      if (amt) customerRef.current?.focus();
      else amountRef.current?.focus();
    }, 100);
  }

  function openEditModal(entry) {
    setEditingEntry(entry);
    setForm({
      type: entry.type,
      category: entry.category || 'Other',
      amount: String(entry.amount || ''),
      description: entry.description || '',
      paymentMode: entry.paymentMode || 'Cash',
      customerName: entry.customerName || '',
      customerMobile: entry.customerMobile || '',
      productName: entry.productName || '',
      quantity: entry.quantity ? String(entry.quantity) : '',
      isReturn: entry.isReturn || false,
    });
    setSelectedCustomer(null);
    setModalOpen(true);
    setTimeout(() => amountRef.current?.focus(), 100);
  }

  function handleCustomerSearch(val) {
    setForm({ ...form, customerName: val, customerMobile: '' });
    setSelectedCustomer(null);
    if (customerTimerRef.current) clearTimeout(customerTimerRef.current);
    if (val.length >= 2) {
      customerTimerRef.current = setTimeout(async () => {
        try {
          const { data } = await endpoints.searchCustomers(val);
          setCustomerSuggestions(data || []);
          setShowCustomerSuggest((data || []).length > 0);
        } catch { setCustomerSuggestions([]); setShowCustomerSuggest(false); }
      }, 300);
    } else { setCustomerSuggestions([]); setShowCustomerSuggest(false); }
  }

  function selectCustomer(c) {
    setSelectedCustomer(c);
    setForm({ ...form, customerName: c.name, customerMobile: c.mobile });
    setShowCustomerSuggest(false);
    setCustomerSuggestions([]);
    descRef.current?.focus();
  }

  function handleFormKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (e.target === amountRef.current && form.amount) customerRef.current?.focus();
      else if (e.target === customerRef.current) descRef.current?.focus();
      else if (form.amount) handleSave();
    }
  }

  async function handleSave() {
    if (!form.amount || Number(form.amount) <= 0) return addToast('Enter amount', 'warning');
    setSaving(true);
    try {
      let customerName = form.customerName;
      let customerMobile = form.customerMobile;
      if (customerName && !selectedCustomer) {
        try {
          const { data: existing } = await endpoints.searchCustomers(customerName);
          const match = existing?.find(c => c.name.toLowerCase() === customerName.toLowerCase());
          if (match) { customerName = match.name; customerMobile = match.mobile; }
          else if (customerName.length >= 2) {
            const { data: newCust } = await endpoints.createCustomer({ name: customerName, mobile: customerMobile || '' });
            customerMobile = newCust.mobile || customerMobile;
          }
        } catch { }
      }

      const payload = { ...form, amount: Number(form.amount), quantity: form.quantity ? Number(form.quantity) : undefined, customerName, customerMobile };

      if (editingEntry) {
        await endpoints.updateRegisterEntry(editingEntry._id, payload);
        addToast('Updated', 'success');
      } else {
        await endpoints.createRegisterEntry(payload);
        addToast('Added', 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete?')) return;
    try { await endpoints.deleteRegisterEntry(id); addToast('Deleted', 'success'); load(); }
    catch { addToast('Failed', 'error'); }
  }

  async function handleFinalize() {
    if (!confirm('Finalize today? Email will be sent. Cannot undo.')) return;
    try {
      const { data } = await endpoints.finalizeRegister();
      addToast(data.emailSent ? 'Finalized & emailed!' : 'Finalized!', 'success');
      load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
  }

  const totalIn = data?.totalIn || 0;
  const totalOut = data?.totalOut || 0;
  const openingBalance = data?.openingBalance || 0;
  const closingBalance = data?.closingBalance || 0;
  const isFinalized = data?.finalized;
  const inEntries = entries.filter(e => e.type === 'in');
  const outEntries = entries.filter(e => e.type === 'out');

  if (loading && tab !== 'history') return <LoadingSpinner text="Loading register..." />;

  if (tab === 'history' && !viewDay) return (
    <div style={{ animation: 'pageIn .2s ease' }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-icon" onClick={() => setTab('today')}><span className="material-symbols-rounded">arrow_back</span></button>
            <div><div style={{ fontSize: 20, fontWeight: 700 }}>Register History</div><div style={{ fontSize: 12, color: 'var(--c-text3)' }}>Past days</div></div>
          </div>
        </div>
      </div>
      {summary.length === 0 ? <LoadingSpinner /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {summary.map(d => (
            <div key={d.date} className="card" style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => viewDayDetails(d.date)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-text3)', marginTop: 2 }}>{d.count} entries</div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10, color: 'var(--c-text3)' }}>In</div><div style={{ fontWeight: 700, color: 'var(--c-green)', fontSize: 13 }}>₹{d.totalIn.toLocaleString('en-IN')}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 10, color: 'var(--c-text3)' }}>Out</div><div style={{ fontWeight: 700, color: 'var(--c-red)', fontSize: 13 }}>₹{d.totalOut.toLocaleString('en-IN')}</div></div>
                  <div style={{ textAlign: 'right', minWidth: 80 }}><div style={{ fontSize: 10, color: 'var(--c-text3)' }}>Balance</div><div style={{ fontWeight: 700, fontSize: 15, color: (d.totalIn - d.totalOut) >= 0 ? 'var(--c-green)' : 'var(--c-red)' }}>₹{(d.totalIn - d.totalOut).toLocaleString('en-IN')}</div></div>
                  <span className={`badge ${d.finalized ? 'badge-cyan' : 'badge-amber'}`} style={{ fontSize: 9 }}>{d.finalized ? 'Done' : 'Open'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (tab === 'history' && viewDay) return (
    <div style={{ animation: 'pageIn .2s ease' }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-icon" onClick={() => setViewDay(null)}><span className="material-symbols-rounded">arrow_back</span></button>
            <div><div style={{ fontSize: 18, fontWeight: 700 }}>{new Date(viewDay + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div><div style={{ fontSize: 11, color: 'var(--c-text3)' }}>Read-only</div></div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--c-text3)', fontWeight: 600 }}>IN</div><div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-green)' }}>₹{viewEntries.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}</div></div>
        <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--c-text3)', fontWeight: 600 }}>OUT</div><div style={{ fontSize: 18, fontWeight: 700, color: 'var(--c-red)' }}>₹{viewEntries.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}</div></div>
        <div className="card" style={{ padding: 12, textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--c-text3)', fontWeight: 600 }}>BALANCE</div><div style={{ fontSize: 18, fontWeight: 700 }}>₹{viewEntries.reduce((s, e) => s + (e.type === 'in' ? e.amount : -e.amount), 0).toLocaleString('en-IN')}</div></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {viewEntries.map(e => <EntryCard key={e._id} entry={e} />)}
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'pageIn .2s ease', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['today', 'Today'], ['yesterday', 'Yesterday'], ['history', 'History']].map(([key, label]) => (
          <button key={key} className={`btn ${tab === key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setTab(key); setEditingEntry(null); setViewDay(null); }} style={{ fontSize: 11, padding: '6px 14px' }}>{label}</button>
        ))}
        {isFinalized && <span className="badge badge-cyan" style={{ marginLeft: 'auto' }}>Finalized</span>}
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: 16, background: 'linear-gradient(135deg, var(--c-surface), var(--c-surface2))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--c-text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{new Date(targetDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{new Date(targetDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            <div style={{ fontSize: 12, color: 'var(--c-text3)', marginTop: 4 }}>{entries.length} entries</div>
          </div>
          <Clock />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div className="card" style={{ padding: '10px 14px' }}><div style={{ fontSize: 10, color: 'var(--c-text3)', fontWeight: 600, textTransform: 'uppercase' }}>Opening</div><div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>₹{openingBalance.toLocaleString('en-IN')}</div></div>
        <div className="card" style={{ padding: '10px 14px', borderLeft: '3px solid var(--c-green)' }}><div style={{ fontSize: 10, color: 'var(--c-text3)', fontWeight: 600, textTransform: 'uppercase' }}>Income</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-green)', marginTop: 2 }}>+₹{totalIn.toLocaleString('en-IN')}</div></div>
        <div className="card" style={{ padding: '10px 14px', borderLeft: '3px solid var(--c-red)' }}><div style={{ fontSize: 10, color: 'var(--c-text3)', fontWeight: 600, textTransform: 'uppercase' }}>Expense</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-red)', marginTop: 2 }}>-₹{totalOut.toLocaleString('en-IN')}</div></div>
        <div className="card" style={{ padding: '10px 14px', background: 'linear-gradient(135deg, #0f0c29, #302b63)', color: '#fff' }}><div style={{ fontSize: 10, opacity: 0.7, fontWeight: 600, textTransform: 'uppercase' }}>Closing</div><div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>₹{closingBalance.toLocaleString('en-IN')}</div></div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 140 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '0 4px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--c-green)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--c-text2)' }}>Income</span>
            <span style={{ fontSize: 11, color: 'var(--c-text3)', marginLeft: 'auto' }}>{inEntries.length}</span>
          </div>
          {inEntries.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--c-text3)', fontSize: 12, background: 'var(--c-surface)', borderRadius: 10, border: '1px dashed var(--c-border)' }}>No entries</div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{inEntries.map(e => <EntryCard key={e._id} entry={e} onEdit={() => openEditModal(e)} onDelete={() => handleDelete(e._id)} canEdit={isToday && !e.finalized && !isFinalized} />)}</div>}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '0 4px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--c-red)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--c-text2)' }}>Expenses</span>
            <span style={{ fontSize: 11, color: 'var(--c-text3)', marginLeft: 'auto' }}>{outEntries.length}</span>
          </div>
          {outEntries.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--c-text3)', fontSize: 12, background: 'var(--c-surface)', borderRadius: 10, border: '1px dashed var(--c-border)' }}>No entries</div> : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{outEntries.map(e => <EntryCard key={e._id} entry={e} onEdit={() => openEditModal(e)} onDelete={() => handleDelete(e._id)} canEdit={isToday && !e.finalized && !isFinalized} />)}</div>}
        </div>
      </div>

      {isToday && !isFinalized && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', padding: '10px 16px', boxShadow: '0 -4px 20px rgba(0,0,0,.15)' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {QUICK_IN.map((q, i) => <button key={i} onClick={() => openNewModal('in', q)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-surface2)', color: 'var(--c-text)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{q.label}</button>)}
            <div style={{ width: 1, background: 'var(--c-border)', flexShrink: 0 }} />
            {QUICK_OUT.map((q, i) => <button key={i} onClick={() => openNewModal('out', q)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--c-border)', background: 'var(--c-surface2)', color: 'var(--c-text)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>{q.label}</button>)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <button onClick={() => openNewModal('in')} style={{ padding: '12px 32px', fontSize: 14, fontWeight: 700, borderRadius: 12, border: 'none', background: 'var(--c-green)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>add</span> Add In <span style={{ fontSize: 10, opacity: 0.7 }}>I</span>
            </button>
            <button onClick={() => openNewModal('out')} style={{ padding: '12px 32px', fontSize: 14, fontWeight: 700, borderRadius: 12, border: 'none', background: 'var(--c-red)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>remove</span> Add Out <span style={{ fontSize: 10, opacity: 0.7 }}>O</span>
            </button>
            {entries.length > 0 && (
              <button onClick={handleFinalize} style={{ padding: '12px 24px', fontSize: 13, fontWeight: 700, borderRadius: 12, border: '2px solid var(--c-accent)', background: 'transparent', color: 'var(--c-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>lock</span> Finalize
              </button>
            )}
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingEntry ? 'Edit Entry' : (form.type === 'in' ? 'Add Income' : 'Add Expense')}>
        <div onKeyDown={handleFormKeyDown}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={() => setForm({ ...form, type: 'in' })} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${form.type === 'in' ? 'var(--c-green)' : 'var(--c-border)'}`, background: form.type === 'in' ? 'rgba(16,185,129,.08)' : 'transparent', color: form.type === 'in' ? 'var(--c-green)' : 'var(--c-text3)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>+ IN</button>
            <button onClick={() => setForm({ ...form, type: 'out' })} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${form.type === 'out' ? 'var(--c-red)' : 'var(--c-border)'}`, background: form.type === 'out' ? 'rgba(239,68,68,.08)' : 'transparent', color: form.type === 'out' ? 'var(--c-red)' : 'var(--c-text3)', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>- OUT</button>
          </div>

          <div className="form-group">
            <label className="form-label">Amount *</label>
            <input ref={amountRef} type="number" className="form-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" autoFocus style={{ fontSize: 24, fontWeight: 700, padding: '12px 16px', textAlign: 'center' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(form.type === 'in' ? CATEGORIES_IN : CATEGORIES_OUT).map(cat => (
                <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })} style={{ padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${form.category === cat ? 'var(--c-accent)' : 'var(--c-border2)'}`, background: form.category === cat ? 'rgba(205,0,99,.08)' : 'transparent', color: form.category === cat ? 'var(--c-accent)' : 'var(--c-text2)', fontWeight: 600, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>{cat}</button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">{form.type === 'in' ? 'Customer' : 'Paid To'}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input ref={customerRef} className="form-input" value={form.customerName} onChange={(e) => handleCustomerSearch(e.target.value)} onFocus={() => customerSuggestions.length > 0 && setShowCustomerSuggest(true)} onBlur={() => setTimeout(() => setShowCustomerSuggest(false), 200)} placeholder="Search or type name..." style={{ flex: 1 }} />
              {form.type === 'in' && <input className="form-input" value={form.customerMobile} onChange={(e) => setForm({ ...form, customerMobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })} placeholder="Mobile" maxLength={10} style={{ width: 120, fontSize: 13 }} />}
            </div>
            {showCustomerSuggest && customerSuggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--c-surface3)', border: '1px solid var(--c-border2)', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: 180, overflow: 'auto', marginTop: 4 }}>
                {customerSuggestions.map(c => (
                  <button key={c._id} type="button" onMouseDown={(e) => { e.preventDefault(); selectCustomer(c); }} style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid var(--c-border)', color: 'var(--c-text)', cursor: 'pointer', fontSize: 12, textAlign: 'left', fontFamily: 'inherit', display: 'flex', justifyContent: 'space-between' }}>
                    <div><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 10, color: 'var(--c-text3)' }}>{c.mobile}</div></div>
                  </button>
                ))}
              </div>
            )}
            {selectedCustomer && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--c-green)' }}>✓ {selectedCustomer.name}</div>}
            {!selectedCustomer && form.customerName.length >= 2 && !showCustomerSuggest && <div style={{ marginTop: 4, fontSize: 11, color: 'var(--c-amber)' }}>+ New: "{form.customerName}"</div>}
          </div>

          {(form.category === 'Part Sale' || form.category === 'Part Purchase' || form.productName) && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
              <div className="form-group"><label className="form-label">Product</label><input className="form-input" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="Product name..." /></div>
              <div className="form-group"><label className="form-label">Qty</label><input type="number" className="form-input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="1" min="1" /></div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Note</label>
            <input ref={descRef} className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description..." />
          </div>

          <div className="form-group">
            <label className="form-label">Payment</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PAYMENT_MODES.map(mode => (
                <button key={mode} type="button" onClick={() => setForm({ ...form, paymentMode: mode })} style={{ padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${form.paymentMode === mode ? (mode === 'Credit' ? 'var(--c-amber)' : 'var(--c-accent)') : 'var(--c-border2)'}`, background: form.paymentMode === mode ? (mode === 'Credit' ? 'rgba(245,158,11,.1)' : 'rgba(205,0,99,.08)') : 'transparent', color: form.paymentMode === mode ? (mode === 'Credit' ? 'var(--c-amber)' : 'var(--c-accent)') : 'var(--c-text2)', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{mode}</button>
              ))}
            </div>
          </div>

          {form.type === 'out' && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isReturn} onChange={(e) => setForm({ ...form, isReturn: e.target.checked })} style={{ width: 16, height: 16, accentColor: 'var(--c-accent)' }} />
                <span style={{ fontSize: 13 }}>Return / Refund</span>
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '12px', fontSize: 13 }}>Cancel <span style={{ fontSize: 10, opacity: 0.6 }}>Esc</span></button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.amount} style={{ flex: 2, padding: '12px', fontSize: 14, fontWeight: 700 }}>
              {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : (editingEntry ? 'Update' : 'Save')} <span style={{ fontSize: 10, opacity: 0.7 }}>Enter</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function EntryCard({ entry, onEdit, onDelete, canEdit }) {
  return (
    <div className="card" style={{ padding: '10px 14px', borderLeft: `3px solid ${entry.type === 'in' ? 'var(--c-green)' : 'var(--c-red)'}`, opacity: entry.finalized ? 0.6 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text2)' }}>{entry.category}</span>
            {entry.isReturn && <span className="badge badge-amber" style={{ fontSize: 8 }}>Return</span>}
            {entry.paymentMode === 'Credit' && <span className="badge" style={{ fontSize: 8, background: 'rgba(245,158,11,.12)', color: 'var(--c-amber)' }}>Credit</span>}
          </div>
          {entry.productName && <div style={{ fontSize: 11, color: 'var(--c-text3)' }}>{entry.productName}{entry.quantity > 1 ? ` ×${entry.quantity}` : ''}</div>}
          {entry.customerName && <div style={{ fontSize: 11, color: 'var(--c-text3)' }}>{entry.customerName}{entry.customerMobile ? ` · ${entry.customerMobile}` : ''}</div>}
          {entry.description && <div style={{ fontSize: 11, color: 'var(--c-text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.description}</div>}
          <div style={{ fontSize: 10, color: 'var(--c-text3)', marginTop: 4 }}>
            <span className="badge badge-ghost" style={{ fontSize: 8 }}>{entry.paymentMode}</span>
            <span style={{ marginLeft: 6 }}>{entry.createdBy}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: entry.type === 'in' ? 'var(--c-green)' : 'var(--c-red)' }}>{entry.type === 'in' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}</div>
          {canEdit && (
            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn-icon" onClick={onEdit} style={{ width: 22, height: 22 }}><span className="material-symbols-rounded" style={{ fontSize: 13 }}>edit</span></button>
              <button className="btn-icon" onClick={onDelete} style={{ width: 22, height: 22, color: 'var(--c-red)' }}><span className="material-symbols-rounded" style={{ fontSize: 13 }}>delete</span></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
