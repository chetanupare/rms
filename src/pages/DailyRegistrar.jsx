import { useState, useEffect, useRef, useCallback } from 'react';
import { endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const CATEGORIES_IN = ['Repair Payment', 'Part Sale', 'Advance', 'Credit Received', 'Other Income'];
const CATEGORIES_OUT = ['Part Purchase', 'Food/Drink', 'Transport', 'Salary', 'Rent', 'Utilities', 'Credit Given', 'Other Expense'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Credit'];

const QUICK_IN = [
  { label: '₹500', category: 'Repair Payment', amount: 500 },
  { label: '₹1000', category: 'Repair Payment', amount: 1000 },
  { label: '₹1500', category: 'Repair Payment', amount: 1500 },
  { label: '₹2000', category: 'Repair Payment', amount: 2000 },
  { label: 'Part', category: 'Part Sale', amount: 0 },
];

const QUICK_OUT = [
  { label: 'Tea ₹20', category: 'Food/Drink', amount: 20 },
  { label: 'Wadapao ₹30', category: 'Food/Drink', amount: 30 },
  { label: 'Lunch ₹80', category: 'Food/Drink', amount: 80 },
  { label: 'Auto ₹100', category: 'Transport', amount: 100 },
  { label: 'Part', category: 'Part Purchase', amount: 0 },
];

const NO_CUSTOMER_CATEGORIES = ['Food/Drink', 'Transport', 'Utilities'];

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
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [showProductSuggest, setShowProductSuggest] = useState(false);
  const amountRef = useRef(null);
  const customerRef = useRef(null);
  const productRef = useRef(null);
  const descRef = useRef(null);
  const customerTimerRef = useRef(null);
  const productTimerRef = useRef(null);

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const targetDate = tab === 'today' ? today : yesterday;
  const isToday = tab === 'today';

  const load = useCallback(() => {
    if (tab === 'history') return;
    setLoading(true);
    endpoints.register(targetDate).then(({ data }) => { setData(data); setEntries(Array.isArray(data?.entries) ? data.entries : []); }).catch(() => addToast('Failed to load', 'error')).finally(() => setLoading(false));
  }, [targetDate, tab]);
  useEffect(() => { load(); }, [load]);

  const loadSummary = useCallback(() => {
    setLoading(true);
    endpoints.registerSummary({}).then(({ data }) => setSummary(Array.isArray(data) ? data : [])).catch(() => addToast('Failed to load history', 'error')).finally(() => setLoading(false));
  }, []);
  useEffect(() => { if (tab === 'history') loadSummary(); }, [tab]);

  async function viewDayDetails(date) {
    try { const { data } = await endpoints.register(date); setViewDay(date); setViewEntries(Array.isArray(data?.entries) ? data.entries : []); }
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
    setTimeout(() => { if (amt) customerRef.current?.focus(); else amountRef.current?.focus(); }, 100);
  }

  function openEditModal(entry) {
    setEditingEntry(entry);
    setForm({ type: entry.type, category: entry.category || 'Other', amount: String(entry.amount || ''), description: entry.description || '', paymentMode: entry.paymentMode || 'Cash', customerName: entry.customerName || '', customerMobile: entry.customerMobile || '', productName: entry.productName || '', quantity: entry.quantity ? String(entry.quantity) : '', isReturn: entry.isReturn || false });
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
        try { const { data } = await endpoints.searchCustomers(val); setCustomerSuggestions(data || []); setShowCustomerSuggest((data || []).length > 0); }
        catch { setCustomerSuggestions([]); setShowCustomerSuggest(false); }
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

  function handleProductSearch(val) {
    setForm({ ...form, productName: val });
    if (productTimerRef.current) clearTimeout(productTimerRef.current);
    if (val.length >= 2) {
      productTimerRef.current = setTimeout(async () => {
        try { const { data } = await endpoints.searchProblems(val); setProductSuggestions(data || []); setShowProductSuggest((data || []).length > 0); }
        catch { setProductSuggestions([]); setShowProductSuggest(false); }
      }, 300);
    } else { setProductSuggestions([]); setShowProductSuggest(false); }
  }

  function selectProduct(p) {
    setForm({ ...form, productName: p.problem || p.name || p });
    setShowProductSuggest(false);
    setProductSuggestions([]);
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
      
      // Skip customer creation for food/transport/utilities categories
      const skipCustomer = form.type === 'out' && NO_CUSTOMER_CATEGORIES.includes(form.category);
      
      if (skipCustomer) {
        // Move customer name to description if it's a food/transport item
        if (customerName && !form.description) {
          form.description = customerName;
        }
        customerName = '';
        customerMobile = '';
      } else if (customerName && !selectedCustomer) {
        try {
          const { data: existing } = await endpoints.searchCustomers(customerName);
          const match = existing?.find(c => c.name.toLowerCase() === customerName.toLowerCase());
          if (match) { customerName = match.name; customerMobile = match.mobile; }
          else if (customerName.length >= 2 && form.type === 'in') { 
            const { data: newCust } = await endpoints.createCustomer({ name: customerName, mobile: customerMobile || '' }); 
            customerMobile = newCust.mobile || customerMobile; 
          }
        } catch { }
      }
      
      const payload = { ...form, amount: Number(form.amount), quantity: form.quantity ? Number(form.quantity) : undefined, customerName, customerMobile };
      if (editingEntry) { await endpoints.updateRegisterEntry(editingEntry._id, payload); addToast('Updated', 'success'); }
      else { await endpoints.createRegisterEntry(payload); addToast('Added', 'success'); }
      setModalOpen(false);
      load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) { if (!confirm('Delete?')) return; try { await endpoints.deleteRegisterEntry(id); addToast('Deleted', 'success'); load(); } catch { addToast('Failed', 'error'); } }

  async function handleFinalize() {
    if (!confirm('Finalize today? Email will be sent.')) return;
    try { const { data } = await endpoints.finalizeRegister(); addToast(data.emailSent ? 'Finalized & emailed!' : 'Finalized!', 'success'); load(); }
    catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
  }

  async function handleReopen() {
    if (!confirm('Reopen today? This will allow editing entries again.')) return;
    try { await endpoints.reopenRegister(); addToast('Reopened for editing', 'success'); load(); }
    catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
  }

  function handlePrint() {
    const dateStr = new Date(targetDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const inEntries = entries.filter(e => e.type === 'in');
    const outEntries = entries.filter(e => e.type === 'out');
    
    const html = `<!DOCTYPE html><html><head><title>Register ${targetDate}</title><style>
      @page{size:A4;margin:10mm}body{font-family:system-ui,sans-serif;color:#1a1a2e;font-size:11px;line-height:1.5}
      .head{background:linear-gradient(135deg,#0f0c29,#302b63);color:#fff;padding:16px 20px;border-radius:6px 6px 0 0;display:flex;justify-content:space-between;align-items:center}
      .head h1{font-size:16px;font-weight:700}.head .date{font-size:12px;opacity:.8}
      .summary{display:flex;gap:12px;padding:14px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0}
      .summary .item{flex:1;text-align:center}.summary .label{font-size:9px;color:#64748b;text-transform:uppercase;font-weight:700}.summary .value{font-size:18px;font-weight:700;margin-top:4px}
      .in{color:#059669}.out{color:#dc2626}.balance{color:#1a1a2e}
      .section{padding:10px 20px}.section-title{font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:8px;display:flex;align-items:center;gap:6px}
      .dot{width:8px;height:8px;border-radius:50%}.dot-green{background:#059669}.dot-red{background:#dc2626}
      table{width:100%;border-collapse:collapse;font-size:10px}th{padding:6px 8px;text-align:left;font-size:9px;text-transform:uppercase;color:#94a3b8;border-bottom:2px solid #e2e8f0;font-weight:700}
      td{padding:5px 8px;border-bottom:1px solid #f1f5f9}.amt-in{color:#059669;font-weight:700}.amt-out{color:#dc2626;font-weight:700}
      .badge{display:inline-block;padding:1px 6px;border-radius:4px;font-size:8px;font-weight:600}.badge-cash{background:#dbeafe;color:#1d4ed8}.badge-upi{background:#fce7f3;color:#be185d}
      .footer{padding:10px 20px;text-align:center;font-size:9px;color:#94a3b8;border-top:1px solid #e2e8f0;margin-top:10px}
    </style></head><body>
      <div class="head"><div><h1>Sai Laptop & Computer Gallery</h1><div style="font-size:9px;opacity:.7">Daily Register Report</div></div><div class="date">${dateStr}</div></div>
      <div class="summary">
        <div class="item"><div class="label">Opening</div><div class="value">₹${openingBalance.toLocaleString('en-IN')}</div></div>
        <div class="item"><div class="label">Income</div><div class="value in">+₹${totalIn.toLocaleString('en-IN')}</div></div>
        <div class="item"><div class="label">Expense</div><div class="value out">-₹${totalOut.toLocaleString('en-IN')}</div></div>
        <div class="item"><div class="label">Closing</div><div class="value balance">₹${closingBalance.toLocaleString('en-IN')}</div></div>
      </div>
      ${inEntries.length > 0 ? `<div class="section"><div class="section-title"><div class="dot dot-green"></div>Income (${inEntries.length})</div><table><thead><tr><th>Category</th><th>Customer</th><th>Product</th><th>Note</th><th>Mode</th><th style="text-align:right">Amount</th></tr></thead><tbody>${inEntries.map(e => `<tr><td style="font-weight:600">${e.category}</td><td>${e.customerName || '—'}</td><td>${e.productName || '—'}${e.quantity > 1 ? ' ×' + e.quantity : ''}</td><td style="color:#64748b">${e.description || '—'}</td><td><span class="badge badge-${(e.paymentMode || 'cash').toLowerCase()}">${e.paymentMode}</span></td><td class="amt-in" style="text-align:right">+₹${e.amount.toLocaleString('en-IN')}</td></tr>`).join('')}</tbody></table></div>` : ''}
      ${outEntries.length > 0 ? `<div class="section"><div class="section-title"><div class="dot dot-red"></div>Expenses (${outEntries.length})</div><table><thead><tr><th>Category</th><th>Paid For/To</th><th>Note</th><th>Mode</th><th style="text-align:right">Amount</th></tr></thead><tbody>${outEntries.map(e => `<tr><td style="font-weight:600">${e.category}${e.isReturn ? ' <span style="color:#d97706">(Return)</span>' : ''}</td><td>${e.customerName || '—'}</td><td style="color:#64748b">${e.description || '—'}</td><td><span class="badge badge-${(e.paymentMode || 'cash').toLowerCase()}">${e.paymentMode}</span></td><td class="amt-out" style="text-align:right">-₹${e.amount.toLocaleString('en-IN')}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <div class="footer">Sai Laptop & Computer Gallery · Virani Complex, Wani, Yavatmal · +91-9823687568<br>Generated ${new Date().toLocaleString('en-IN')}</div>
    </body></html>`;
    
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 400); }
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
            <div><div style={{ fontSize: 20, fontWeight: 700 }}>Register History</div></div>
          </div>
        </div>
      </div>
      {summary.length === 0 ? <LoadingSpinner /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {summary.map(d => (
            <div key={d.date} className="card" style={{ padding: '10px 14px', cursor: 'pointer' }} onClick={() => viewDayDetails(d.date)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--c-green)', fontSize: 12 }}>+{d.totalIn.toLocaleString('en-IN')}</span>
                  <span style={{ fontWeight: 700, color: 'var(--c-red)', fontSize: 12 }}>-{d.totalOut.toLocaleString('en-IN')}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, color: (d.totalIn - d.totalOut) >= 0 ? 'var(--c-green)' : 'var(--c-red)' }}>{(d.totalIn - d.totalOut).toLocaleString('en-IN')}</span>
                  <span className={`badge ${d.finalized ? 'badge-cyan' : 'badge-amber'}`} style={{ fontSize: 8 }}>{d.finalized ? 'Done' : 'Open'}</span>
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
            <div style={{ fontSize: 18, fontWeight: 700 }}>{new Date(viewDay + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div className="card" style={{ padding: 10, textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--c-text3)' }}>IN</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-green)' }}>₹{viewEntries.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}</div></div>
        <div className="card" style={{ padding: 10, textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--c-text3)' }}>OUT</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-red)' }}>₹{viewEntries.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}</div></div>
        <div className="card" style={{ padding: 10, textAlign: 'center' }}><div style={{ fontSize: 10, color: 'var(--c-text3)' }}>BALANCE</div><div style={{ fontSize: 16, fontWeight: 700 }}>₹{viewEntries.reduce((s, e) => s + (e.type === 'in' ? e.amount : -e.amount), 0).toLocaleString('en-IN')}</div></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {viewEntries.map(e => <EntryRow key={e._id} entry={e} />)}
      </div>
    </div>
  );

  return (
    <div style={{ animation: 'pageIn .2s ease', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
        {[['today', 'Today'], ['yesterday', 'Yesterday'], ['history', 'History']].map(([key, label]) => (
          <button key={key} className={`btn ${tab === key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setTab(key); setEditingEntry(null); setViewDay(null); }} style={{ fontSize: 10, padding: '4px 10px' }}>{label}</button>
        ))}
        {entries.length > 0 && (
          <button onClick={handlePrint} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--c-border)', background: 'transparent', color: 'var(--c-text2)', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', marginLeft: 'auto' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>print</span> Print
          </button>
        )}
        {isFinalized && <span className="badge badge-cyan" style={{ fontSize: 9 }}>Finalized</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div className="card" style={{ padding: '8px 10px' }}><div style={{ fontSize: 9, color: 'var(--c-text3)', fontWeight: 600, textTransform: 'uppercase' }}>Opening</div><div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>₹{openingBalance.toLocaleString('en-IN')}</div></div>
        <div className="card" style={{ padding: '8px 10px', borderLeft: '3px solid var(--c-green)' }}><div style={{ fontSize: 9, color: 'var(--c-text3)', fontWeight: 600, textTransform: 'uppercase' }}>Income</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-green)', marginTop: 2 }}>+₹{totalIn.toLocaleString('en-IN')}</div></div>
        <div className="card" style={{ padding: '8px 10px', borderLeft: '3px solid var(--c-red)' }}><div style={{ fontSize: 9, color: 'var(--c-text3)', fontWeight: 600, textTransform: 'uppercase' }}>Expense</div><div style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-red)', marginTop: 2 }}>-₹{totalOut.toLocaleString('en-IN')}</div></div>
        <div className="card" style={{ padding: '8px 10px', background: 'linear-gradient(135deg, #0f0c29, #302b63)', color: '#fff' }}><div style={{ fontSize: 9, opacity: 0.7, fontWeight: 600, textTransform: 'uppercase' }}>Closing</div><div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>₹{closingBalance.toLocaleString('en-IN')}</div></div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 120 }}>
        {entries.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--c-text3)', fontSize: 12 }}>No entries — press I or O to add</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {entries.map(e => <EntryRow key={e._id} entry={e} onEdit={() => openEditModal(e)} onDelete={() => handleDelete(e._id)} canEdit={isToday && !e.finalized && !isFinalized} />)}
          </div>
        )}
      </div>

      {isToday && !isFinalized && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', padding: '8px 16px', boxShadow: '0 -4px 20px rgba(0,0,0,.15)' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {QUICK_IN.map((q, i) => <button key={i} onClick={() => openNewModal('in', q)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--c-border)', background: 'var(--c-surface2)', color: 'var(--c-green)', fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>+{q.label}</button>)}
            <div style={{ width: 1, background: 'var(--c-border)', flexShrink: 0 }} />
            {QUICK_OUT.map((q, i) => <button key={i} onClick={() => openNewModal('out', q)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--c-border)', background: 'var(--c-surface2)', color: 'var(--c-red)', fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>-{q.label}</button>)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button onClick={() => openNewModal('in')} style={{ padding: '10px 28px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none', background: 'var(--c-green)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>add</span> In <span style={{ fontSize: 9, opacity: 0.7 }}>I</span></button>
            <button onClick={() => openNewModal('out')} style={{ padding: '10px 28px', fontSize: 13, fontWeight: 700, borderRadius: 10, border: 'none', background: 'var(--c-red)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}><span className="material-symbols-rounded" style={{ fontSize: 16 }}>remove</span> Out <span style={{ fontSize: 9, opacity: 0.7 }}>O</span></button>
            {entries.length > 0 && <button onClick={handleFinalize} style={{ padding: '10px 20px', fontSize: 12, fontWeight: 700, borderRadius: 10, border: '2px solid var(--c-accent)', background: 'transparent', color: 'var(--c-accent)', cursor: 'pointer', fontFamily: 'inherit' }}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>lock</span> Finalize</button>}
          </div>
        </div>
      )}

      {isToday && isFinalized && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', padding: '8px 16px', boxShadow: '0 -4px 20px rgba(0,0,0,.15)', textAlign: 'center' }}>
          <button onClick={handleReopen} style={{ padding: '10px 24px', fontSize: 12, fontWeight: 700, borderRadius: 10, border: '2px solid var(--c-amber)', background: 'transparent', color: 'var(--c-amber)', cursor: 'pointer', fontFamily: 'inherit' }}><span className="material-symbols-rounded" style={{ fontSize: 14, verticalAlign: 'middle' }}>lock_open</span> Reopen for Editing</button>
        </div>
      )}

      {!isToday && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', padding: '8px 16px', textAlign: 'center' }}>
          <span className="badge badge-ghost" style={{ fontSize: 10 }}>Read Only — Previous day</span>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingEntry ? 'Edit Entry' : (form.type === 'in' ? 'Add Income' : 'Add Expense')}>
        <div onKeyDown={handleFormKeyDown}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button onClick={() => setForm({ ...form, type: 'in' })} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${form.type === 'in' ? 'var(--c-green)' : 'var(--c-border)'}`, background: form.type === 'in' ? 'rgba(16,185,129,.08)' : 'transparent', color: form.type === 'in' ? 'var(--c-green)' : 'var(--c-text3)', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>+ IN</button>
            <button onClick={() => setForm({ ...form, type: 'out' })} style={{ flex: 1, padding: '8px', borderRadius: 8, border: `2px solid ${form.type === 'out' ? 'var(--c-red)' : 'var(--c-border)'}`, background: form.type === 'out' ? 'rgba(239,68,68,.08)' : 'transparent', color: form.type === 'out' ? 'var(--c-red)' : 'var(--c-text3)', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>- OUT</button>
          </div>

          <div className="form-group"><label className="form-label">Amount *</label><input ref={amountRef} type="number" className="form-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" autoFocus style={{ fontSize: 22, fontWeight: 700, padding: '10px 14px', textAlign: 'center' }} /></div>

          <div className="form-group"><label className="form-label">Category</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(form.type === 'in' ? CATEGORIES_IN : CATEGORIES_OUT).map(cat => <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${form.category === cat ? 'var(--c-accent)' : 'var(--c-border2)'}`, background: form.category === cat ? 'rgba(205,0,99,.08)' : 'transparent', color: form.category === cat ? 'var(--c-accent)' : 'var(--c-text2)', fontWeight: 600, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>{cat}</button>)}
            </div>
          </div>

          {!NO_CUSTOMER_CATEGORIES.includes(form.category) && (
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">{form.type === 'in' ? 'Customer' : 'Paid To'}</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input ref={customerRef} className="form-input" value={form.customerName} onChange={(e) => handleCustomerSearch(e.target.value)} onFocus={() => customerSuggestions.length > 0 && setShowCustomerSuggest(true)} onBlur={() => setTimeout(() => setShowCustomerSuggest(false), 200)} placeholder="Search or type..." style={{ flex: 1 }} />
                {form.type === 'in' && <input className="form-input" value={form.customerMobile} onChange={(e) => setForm({ ...form, customerMobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) })} placeholder="Mobile" maxLength={10} style={{ width: 110, fontSize: 12 }} />}
              </div>
              {showCustomerSuggest && customerSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--c-surface3)', border: '1px solid var(--c-border2)', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: 160, overflow: 'auto', marginTop: 4 }}>
                  {customerSuggestions.map(c => <button key={c._id} type="button" onMouseDown={(e) => { e.preventDefault(); selectCustomer(c); }} style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid var(--c-border)', color: 'var(--c-text)', cursor: 'pointer', fontSize: 12, textAlign: 'left', fontFamily: 'inherit' }}><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 10, color: 'var(--c-text3)' }}>{c.mobile}</div></button>)}
                </div>
              )}
              {selectedCustomer && <div style={{ marginTop: 4, fontSize: 10, color: 'var(--c-green)' }}>✓ {selectedCustomer.name}</div>}
              {!selectedCustomer && form.customerName.length >= 2 && !showCustomerSuggest && form.type === 'in' && <div style={{ marginTop: 4, fontSize: 10, color: 'var(--c-amber)' }}>+ New: "{form.customerName}"</div>}
            </div>
          )}

          {NO_CUSTOMER_CATEGORIES.includes(form.category) && (
            <div className="form-group">
              <label className="form-label">Title</label>
              <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Tea, Wadapao, Auto fare..." />
            </div>
          )}

          {(form.category === 'Part Sale' || form.category === 'Part Purchase' || form.productName) && (
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Product</label>
                <input ref={productRef} className="form-input" value={form.productName} onChange={(e) => handleProductSearch(e.target.value)} onFocus={() => productSuggestions.length > 0 && setShowProductSuggest(true)} onBlur={() => setTimeout(() => setShowProductSuggest(false), 200)} placeholder="Search product..." />
                {showProductSuggest && productSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--c-surface3)', border: '1px solid var(--c-border2)', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,.4)', maxHeight: 160, overflow: 'auto', marginTop: 4 }}>
                    {productSuggestions.map((p, i) => <button key={i} type="button" onMouseDown={(e) => { e.preventDefault(); selectProduct(p); }} style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid var(--c-border)', color: 'var(--c-text)', cursor: 'pointer', fontSize: 12, textAlign: 'left', fontFamily: 'inherit' }}>{p.problem || p.name || p}</button>)}
                  </div>
                )}
              </div>
              <div className="form-group"><label className="form-label">Qty</label><input type="number" className="form-input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="1" min="1" /></div>
            </div>
          )}

          {!NO_CUSTOMER_CATEGORIES.includes(form.category) && (
            <div className="form-group"><label className="form-label">Note</label><input ref={descRef} className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description..." /></div>
          )}

          <div className="form-group"><label className="form-label">Payment</label>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {PAYMENT_MODES.map(mode => <button key={mode} type="button" onClick={() => setForm({ ...form, paymentMode: mode })} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${form.paymentMode === mode ? (mode === 'Credit' ? 'var(--c-amber)' : 'var(--c-accent)') : 'var(--c-border2)'}`, background: form.paymentMode === mode ? (mode === 'Credit' ? 'rgba(245,158,11,.1)' : 'rgba(205,0,99,.08)') : 'transparent', color: form.paymentMode === mode ? (mode === 'Credit' ? 'var(--c-amber)' : 'var(--c-accent)') : 'var(--c-text2)', fontWeight: 600, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>{mode}</button>)}
            </div>
          </div>

          {form.type === 'out' && <div className="form-group"><label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={form.isReturn} onChange={(e) => setForm({ ...form, isReturn: e.target.checked })} style={{ width: 14, height: 14, accentColor: 'var(--c-accent)' }} /><span style={{ fontSize: 12 }}>Return / Refund</span></label></div>}

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)} style={{ flex: 1, padding: '10px', fontSize: 12 }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.amount} style={{ flex: 2, padding: '10px', fontSize: 13, fontWeight: 700 }}>{saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : (editingEntry ? 'Update' : 'Save')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function EntryRow({ entry, onEdit, onDelete, canEdit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--c-surface)', borderRadius: 8, borderLeft: `3px solid ${entry.type === 'in' ? 'var(--c-green)' : 'var(--c-red)'}`, opacity: entry.finalized ? 0.6 : 1 }}>
      <div style={{ width: 20, textAlign: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: entry.type === 'in' ? 'var(--c-green)' : 'var(--c-red)' }}>{entry.type === 'in' ? 'IN' : 'OUT'}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-text)' }}>{entry.category}</span>
          {entry.isReturn && <span className="badge badge-amber" style={{ fontSize: 7, padding: '1px 4px' }}>Return</span>}
          {entry.paymentMode === 'Credit' && <span className="badge" style={{ fontSize: 7, padding: '1px 4px', background: 'rgba(245,158,11,.12)', color: 'var(--c-amber)' }}>Credit</span>}
          {entry.productName && <span style={{ fontSize: 11, color: 'var(--c-text3)' }}>{entry.productName}{entry.quantity > 1 ? ` ×${entry.quantity}` : ''}</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--c-text3)', marginTop: 1 }}>
          {entry.customerName && <span>{entry.customerName}{entry.customerMobile ? ` · ${entry.customerMobile}` : ''}</span>}
          {entry.description && <span style={{ marginLeft: entry.customerName ? 8 : 0 }}>{entry.description}</span>}
          {!entry.customerName && !entry.description && <span>—</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: entry.type === 'in' ? 'var(--c-green)' : 'var(--c-red)' }}>{entry.type === 'in' ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}</div>
        <div style={{ fontSize: 9, color: 'var(--c-text3)' }}>{entry.paymentMode}</div>
      </div>
      {canEdit && (
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button className="btn-icon" onClick={onEdit} style={{ width: 20, height: 20 }}><span className="material-symbols-rounded" style={{ fontSize: 12 }}>edit</span></button>
          <button className="btn-icon" onClick={onDelete} style={{ width: 20, height: 20, color: 'var(--c-red)' }}><span className="material-symbols-rounded" style={{ fontSize: 12 }}>delete</span></button>
        </div>
      )}
    </div>
  );
}
