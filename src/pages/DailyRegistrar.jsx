import { useState, useEffect, useRef, useCallback } from 'react';
import { endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = ['Repair Payment', 'Part Sale', 'Expense', 'Petty Cash', 'Other'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Other'];

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '1px', background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1 }}>
    {t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
  </div>;
}

export default function DailyRegistrar() {
  const { addToast } = useToast();
  const [tab, setTab] = useState('today');
  const [dateMode, setDateMode] = useState('today');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ type: 'in', category: 'Repair Payment', amount: '', description: '', paymentMode: 'Cash' });
  const [summary, setSummary] = useState([]);
  const [viewDay, setViewDay] = useState(null);
  const [viewEntries, setViewEntries] = useState([]);
  const amountRef = useRef(null);

  const targetDate = dateMode === 'today' ? new Date().toISOString().slice(0, 10) : new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const isToday = dateMode === 'today';

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
      if (e.key === 'Escape') { setEditingId(null); setForm({ type: 'in', category: 'Repair Payment', amount: '', description: '', paymentMode: 'Cash' }); setViewDay(null); }
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && isToday && !editingId && !data?.finalized) { e.preventDefault(); setEditingId('new'); setForm({ type: 'in', category: 'Repair Payment', amount: '', description: '', paymentMode: 'Cash' }); setTimeout(() => amountRef.current?.focus(), 100); }
      if (e.key === 'Enter' && editingId && form.amount && tab !== 'history') { e.preventDefault(); handleSave(); }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [editingId, form, isToday, data, tab]);

  function startNew(type) { setEditingId('new'); setForm({ type, category: type === 'in' ? 'Repair Payment' : 'Expense', amount: '', description: '', paymentMode: 'Cash' }); setTimeout(() => amountRef.current?.focus(), 100); }
  function startEdit(entry) { setEditingId(entry._id); setForm({ type: entry.type, category: entry.category, amount: String(entry.amount), description: entry.description || '', paymentMode: entry.paymentMode }); setTimeout(() => amountRef.current?.focus(), 100); }

  async function handleSave() {
    if (!form.amount || Number(form.amount) <= 0) return addToast('Enter amount', 'warning');
    try {
      if (editingId === 'new') { await endpoints.createRegisterEntry({ ...form, amount: Number(form.amount) }); addToast('Entry added', 'success'); }
      else { await endpoints.updateRegisterEntry(editingId, { ...form, amount: Number(form.amount) }); addToast('Entry updated', 'success'); }
      setEditingId(null); setForm({ type: 'in', category: 'Repair Payment', amount: '', description: '', paymentMode: 'Cash' }); load();
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
  }

  async function handleDelete(id) { try { await endpoints.deleteRegisterEntry(id); addToast('Deleted', 'success'); load(); } catch { addToast('Failed', 'error'); } }

  async function handleFinalize() {
    if (!confirm('Finalize today? This cannot be undone.')) return;
    try {
      const { data } = await endpoints.finalizeRegister();
      addToast('Day finalized!', 'success'); load();
      setTimeout(() => { const w = window.open('', '_blank'); if (w) { w.document.write(`<pre style="font-family:monospace;font-size:13px;padding:20px">${data.summary}</pre>`); w.document.close(); } }, 300);
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
  }

  const totalIn = data?.totalIn || 0;
  const totalOut = data?.totalOut || 0;
  const balance = data?.balance || 0;
  const openingBalance = data?.openingBalance || 0;
  const closingBalance = data?.closingBalance || 0;
  const isFinalized = data?.finalized;

  if (loading && tab !== 'history') return <LoadingSpinner text="Loading register..." />;

  if (tab === 'history' && !viewDay) return (
    <div style={{ animation: 'pageIn .2s ease' }}>
      <div className="flex items-center gap-2 mb-3">
        <button className={`btn ${tab === 'today' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setTab('today'); setDateMode('today'); }} style={{ fontSize: 10, padding: '3px 8px' }}>Today</button>
        <button className={`btn ${tab === 'yesterday' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setTab('yesterday'); setDateMode('yesterday'); }} style={{ fontSize: 10, padding: '3px 8px' }}>Yesterday</button>
        <button className={`btn btn-primary`} style={{ fontSize: 10, padding: '3px 8px' }}>History</button>
      </div>
      {summary.length === 0 ? <LoadingSpinner text="Loading history..." /> : (
        <div className="card" style={{ padding: 0 }}>
          <table className="tbl"><thead><tr><th>Date</th><th style={{textAlign:'right'}}>In</th><th style={{textAlign:'right'}}>Out</th><th style={{textAlign:'right'}}>Balance</th><th>Status</th><th></th></tr></thead>
            <tbody>{summary.map((d) => (
              <tr key={d.date}>
                <td className="fw-600 t-sm">{new Date(d.date+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td>
                <td style={{textAlign:'right',color:'var(--c-green)',fontWeight:600}}>{formatCurrency(d.totalIn)}</td>
                <td style={{textAlign:'right',color:'var(--c-red)',fontWeight:600}}>{formatCurrency(d.totalOut)}</td>
                <td style={{textAlign:'right',fontWeight:700,color:(d.totalIn-d.totalOut)>=0?'var(--c-green)':'var(--c-red)'}}>{formatCurrency(d.totalIn-d.totalOut)}</td>
                <td>{d.finalized ? <span className="badge badge-cyan">Done</span> : <span className="badge badge-amber">Open</span>}</td>
                <td><button className="btn btn-ghost" onClick={() => viewDayDetails(d.date)} style={{fontSize:9,padding:'2px 6px'}}>View</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (tab === 'history' && viewDay) return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button className="btn btn-ghost" onClick={() => setViewDay(null)} style={{fontSize:10,padding:'3px 8px'}}><span className="material-symbols-rounded" style={{fontSize:12}}>arrow_back</span> Back</button>
        <span className="fw-600">{new Date(viewDay+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</span>
        <span className="badge badge-ghost t-xs">Read-only</span>
      </div>
      <div className="kpi-grid" style={{marginBottom:8}}>
        <div className="kpi-card"><div className="kpi-label">In</div><div className="kpi-value" style={{color:'var(--c-green)',fontSize:16}}>{formatCurrency(viewEntries.filter(e=>e.type==='in').reduce((s,e)=>s+e.amount,0))}</div></div>
        <div className="kpi-card"><div className="kpi-label">Out</div><div className="kpi-value" style={{color:'var(--c-red)',fontSize:16}}>{formatCurrency(viewEntries.filter(e=>e.type==='out').reduce((s,e)=>s+e.amount,0))}</div></div>
        <div className="kpi-card" style={{gridColumn:'span 2'}}><div className="kpi-label">Balance</div><div className="kpi-value" style={{fontSize:16}}>{formatCurrency(viewEntries.reduce((s,e)=>s+(e.type==='in'?e.amount:-e.amount),0))}</div></div>
      </div>
      <div className="card" style={{padding:0}}>
        {viewEntries.length===0 ? <div className="t-sm muted text-center" style={{padding:16}}>No entries</div> : (
          <table className="tbl"><thead><tr><th>Type</th><th>Category</th><th style={{textAlign:'right'}}>Amount</th><th>Note</th><th>Pay</th></tr></thead>
            <tbody>{viewEntries.map(e=><tr key={e._id}>
              <td><span className={`badge ${e.type==='in'?'badge-green':'badge-red'}`}>{e.type==='in'?'IN':'OUT'}</span></td>
              <td className="t-sm">{e.category}</td>
              <td style={{textAlign:'right',fontWeight:600,color:e.type==='in'?'var(--c-green)':'var(--c-red)'}}>₹{e.amount.toLocaleString('en-IN')}</td>
              <td className="t-sm muted truncate" style={{maxWidth:200}}>{e.description||'—'}</td>
              <td><span className="badge badge-ghost">{e.paymentMode}</span></td>
            </tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', minHeight: '100%', display: 'flex', flexDirection: 'column', animation: 'pageIn .2s ease' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button className={`btn ${tab === 'today' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setTab('today'); setDateMode('today'); setEditingId(null); }} style={{ fontSize: 10, padding: '3px 8px' }}>Today</button>
          <button className={`btn ${tab === 'yesterday' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setTab('yesterday'); setDateMode('yesterday'); setEditingId(null); }} style={{ fontSize: 10, padding: '3px 8px' }}>Yesterday</button>
          <button className={`btn ${tab === 'history' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('history')} style={{ fontSize: 10, padding: '3px 8px' }}>History</button>
          {isFinalized && <span className="badge badge-cyan">Finalized</span>}
        </div>
        <Clock />
      </div>

      <div className="flex items-center justify-between mb-3" style={{ flexShrink: 0 }}>
        <div>
          <div className="t-2xl" style={{ fontSize: 22 }}>{formatCurrency(closingBalance)}</div>
          <div className="t-xs dim">{targetDate} · {entries.length} entries</div>
          <div className="t-xs dim" style={{ color: 'var(--c-text3)' }}>Opening: {formatCurrency(openingBalance)}</div>
        </div>
        <div className="flex gap-3" style={{ textAlign: 'right' }}>
          <div><div className="t-xs dim">In</div><div className="t-lg fw-700" style={{ color: 'var(--c-green)' }}>{formatCurrency(totalIn)}</div></div>
          <div><div className="t-xs dim">Out</div><div className="t-lg fw-700" style={{ color: 'var(--c-red)' }}>{formatCurrency(totalOut)}</div></div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', marginBottom: editingId ? 120 : 70 }}>
        {entries.length === 0 ? (
          <div className="t-sm muted text-center" style={{ padding: 32 }}>No entries yet — tap Add In or Add Out below</div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table className="tbl">
              <thead><tr><th style={{width:36}}>T</th><th style={{width:90}}>Category</th><th style={{width:70,textAlign:'right'}}>Amount</th><th>Note</th><th style={{width:50}}>Pay</th><th style={{width:42}}></th></tr></thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry._id} style={{ opacity: entry.finalized ? 0.55 : 1 }}>
                    <td><span className={`badge ${entry.type === 'in' ? 'badge-green' : 'badge-red'}`} style={{fontSize:7}}>{entry.type === 'in' ? 'IN' : 'OUT'}</span></td>
                    <td className="t-xs">{entry.category}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, color: entry.type === 'in' ? 'var(--c-green)' : 'var(--c-red)' }}>₹{entry.amount.toLocaleString('en-IN')}</td>
                    <td className="t-xs muted truncate" style={{ maxWidth: 140 }}>{entry.description || '—'}</td>
                    <td><span className="badge badge-ghost" style={{fontSize:7}}>{entry.paymentMode}</span></td>
                    <td>{isToday && !entry.finalized && <button className="btn-icon" onClick={() => startEdit(entry)} title="Edit"><span className="material-symbols-rounded" style={{fontSize:13}}>edit</span></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isToday && !isFinalized && (
        <div style={{ position: 'sticky', bottom: 0, left: 0, right: 0, zIndex: 10, background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', padding: '8px 16px', boxShadow: '0 -4px 20px rgba(0,0,0,.2)' }}>
          {editingId ? (
            <div className="flex items-center gap-1" style={{ flexWrap: 'wrap' }}>
              <select className="form-input" value={form.type} onChange={(e) => setForm({...form,type:e.target.value})} style={{width:60,fontSize:12,padding:'6px 4px'}}>
                <option value="in">+IN</option><option value="out">-OUT</option>
              </select>
              <select className="form-input" value={form.category} onChange={(e) => setForm({...form,category:e.target.value})} style={{width:110,fontSize:11,padding:'6px 4px'}}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input ref={amountRef} className="form-input" type="number" value={form.amount} onChange={(e) => setForm({...form,amount:e.target.value})} placeholder="Amount" style={{width:100,fontSize:14,fontWeight:700,padding:'6px 6px'}} autoFocus />
              <input className="form-input" value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} placeholder="Note" style={{flex:1,minWidth:80,fontSize:11,padding:'6px 6px'}} />
              <select className="form-input" value={form.paymentMode} onChange={(e) => setForm({...form,paymentMode:e.target.value})} style={{width:70,fontSize:11,padding:'6px 4px'}}>
                {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
              <button className="btn btn-primary" onClick={handleSave} style={{padding:'7px 16px',fontSize:12,fontWeight:700}}>Save</button>
              <button className="btn btn-ghost" onClick={() => { setEditingId(null); setForm({type:'in',category:'Repair Payment',amount:'',description:'',paymentMode:'Cash'}); }} style={{padding:'7px 12px',fontSize:12}}>Cancel</button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => startNew('in')} className="btn btn-primary" style={{padding:'12px 28px',fontSize:14,fontWeight:700,flex:1,maxWidth:200,borderRadius:10}}>
                <span className="material-symbols-rounded" style={{fontSize:20}}>add</span> Add In
              </button>
              <button onClick={() => startNew('out')} className="btn btn-danger" style={{padding:'12px 28px',fontSize:14,fontWeight:700,flex:1,maxWidth:200,borderRadius:10}}>
                <span className="material-symbols-rounded" style={{fontSize:20}}>remove</span> Add Out
              </button>
              {entries.length > 0 && (
                <button onClick={handleFinalize} className="btn btn-ghost" style={{padding:'12px 20px',fontSize:13,fontWeight:700,borderRadius:10,border:'1.5px solid var(--c-green)',color:'var(--c-green)'}}>
                  <span className="material-symbols-rounded" style={{fontSize:18}}>lock</span> Finalize
                </button>
              )}
              <div className="t-xs dim" style={{textAlign:'center'}}><b>N</b> new<br/><b>Enter</b> save</div>
            </div>
          )}
        </div>
      )}

      {(!isToday || isFinalized) && (
        <div style={{ position: 'sticky', bottom: 0, left: 0, right: 0, zIndex: 10, background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)', padding: '8px 16px', textAlign: 'center' }}>
          <span className="badge badge-cyan">Read Only — Previous day data cannot be modified</span>
        </div>
      )}
    </div>
  );
}
