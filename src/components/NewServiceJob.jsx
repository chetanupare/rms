import { useState, useEffect, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from './LoadingSpinner';

const BRANCHES = ['WANI', 'NAGPUR', 'PANDHARKAWDA'];
const LEAD_SOURCES = [
  { value: 'In Store Visit', icon: 'storefront', desc: 'Customer walked in' },
  { value: 'Customer Location Visit', icon: 'local_shipping', desc: 'On-site service' },
  { value: 'Telephone', icon: 'phone_in_talk', desc: 'Called for service' },
  { value: 'WhatsApp / Social Media', icon: 'chat', desc: 'Online inquiry' },
  { value: 'Reference / Walk-in', icon: 'groups', desc: 'Referred by someone' },
];
const ACCESSORY_ITEMS = ['Charger', 'Bag', 'Original Box', 'Cable', 'Mouse', 'Warranty Card', 'Bill', 'Stylus'];
const CONDITION_ITEMS = ['Screen Scratches', 'Dents', 'Cracked Screen', 'Broken Hinge', 'Keyboard Missing Key', 'Scratches on Body', 'Liquid Damage', 'Burning Smell'];

function Clock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  return <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '1px', lineHeight: 1.1, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
    {t.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
  </div>;
}

function StepIndicator({ step, total }) {
  return (
    <div className="flex items-center gap-3" style={{ marginBottom: 24 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: step > i + 1 ? 'var(--c-green)' : step === i + 1 ? 'var(--gradient-brand)' : 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', boxShadow: step === i + 1 ? '0 0 20px rgba(205,0,99,.4)' : 'none', transition: 'all .3s' }}>
            {step > i + 1 ? '✓' : i + 1}
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: step >= i + 1 ? 'var(--c-text)' : 'var(--c-text3)' }}>{['Device & Intake', 'Customer', 'Confirm'][i]}</span>
          {i < total - 1 && <div style={{ width: 32, height: 2, background: step > i + 1 ? 'var(--c-green)' : 'var(--c-border)', borderRadius: 1 }} />}
        </div>
      ))}
    </div>
  );
}

function Card({ children, style, ...props }) {
  return <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 12, padding: 20, ...style }} {...props}>{children}</div>;
}

function ToggleBtn({ label, active, onClick, size }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: size === 'sm' ? '3px 6px' : '4px 10px', borderRadius: 6, fontSize: size === 'sm' ? 9 : 11, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', border: `1.5px solid ${active ? 'var(--c-accent)' : 'var(--c-border2)'}`, background: active ? 'rgba(205,0,99,.12)' : 'var(--c-surface2)', color: active ? 'var(--c-accent)' : 'var(--c-text2)', transition: 'all .12s', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

export default function NewServiceJob({ open, onClose, onDone }) {
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deviceType, setDeviceType] = useState('Laptop');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [problem, setProblem] = useState('');
  const [leadSource, setLeadSource] = useState('In Store Visit');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [branch, setBranch] = useState(() => localStorage.getItem('slcg_branch') || 'WANI');
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [accessories, setAccessories] = useState([]);
  const [condition, setCondition] = useState([]);
  const [quickWalkin, setQuickWalkin] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const searchTimerRef = useRef(null);
  const problemTimerRef = useRef(null);
  const problemRef = useRef(null);
  const problemSuggestRef = useRef(null);
  const mobileRef = useRef(null);
  const [problemSuggestions, setProblemSuggestions] = useState([]);
  const [showProblemSuggest, setShowProblemSuggest] = useState(false);
  const [searchingProblems, setSearchingProblems] = useState(false);
  const [jobTags, setJobTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');

  function toggleAccessory(item) { setAccessories((prev) => prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]); }
  function toggleCondition(item) { setCondition((prev) => prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]); }
  function toggleTag(tag) { setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]); }

  async function handleCreateTag() {
    const val = newTagInput.trim().toUpperCase();
    if (!val || selectedTags.includes(val)) return;
    try {
      const { data } = await endpoints.createTag({ name: val });
      setJobTags((prev) => {
        if (prev.find((t) => t.name === data.name)) return prev;
        return [...prev, data];
      });
      setSelectedTags((prev) => [...prev, data.name]);
      setNewTagInput('');
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
  }

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') { if (step > 1) { setStep((s) => s - 1); return; } reset(); }
      if (e.key === 'Enter' && !e.shiftKey && !saving) {
        if (step === 1 && canGoNext()) { setStep(2); return; }
        if (step === 2 && canGoNext()) { setStep(3); return; }
        if (step === 3 && canGoNext()) { handleSubmit(); return; }
      }
      if (step === 1 && !e.ctrlKey && !e.metaKey) {
        const n = parseInt(e.key);
        if (n >= 1 && n <= 5) { e.preventDefault(); setLeadSource(LEAD_SOURCES[n - 1].value); }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, step, saving, deviceType, brand, model, problem, leadSource, name, mobile, quickWalkin]);

  function handleProblemChange(val) {
    setProblem(val);
    if (problemTimerRef.current) clearTimeout(problemTimerRef.current);
    if (val.length >= 2) {
      setSearchingProblems(true);
      problemTimerRef.current = setTimeout(async () => {
        try { const { data } = await endpoints.searchProblems(val); setProblemSuggestions(data || []); setShowProblemSuggest(data.length > 0); }
        catch { setProblemSuggestions([]); } finally { setSearchingProblems(false); }
      }, 400);
    } else { setProblemSuggestions([]); setShowProblemSuggest(false); setSearchingProblems(false); }
  }

  useEffect(() => { if (step === 1) setTimeout(() => problemRef.current?.focus(), 100); if (step === 2) setTimeout(() => mobileRef.current?.focus(), 100); }, [step]);

  const deviceTypes = [...new Set(brands.map((b) => b.deviceType))];
  const filteredBrands = brands.filter((b) => b.deviceType === deviceType);
  const filteredModels = models.filter((m) => m.brand === brand && m.deviceType === deviceType);

  useEffect(() => {
    if (!open) return;
    setStep(1); setDeviceType('Laptop'); setBrand(''); setModel(''); setProblem(''); setLeadSource('In Store Visit');
    setName(''); setMobile(''); setAddress(''); setExistingCustomer(null); setSearchResults([]); setSaving(false);
    setAccessories([]); setCondition([]); setQuickWalkin(false);
    setLoading(true);
    Promise.all([endpoints.brands(), endpoints.deviceModels(), endpoints.tags()]).then(([bRes, mRes, tRes]) => { setBrands(bRes.data); setModels(mRes.data); setJobTags(tRes.data || []); }).catch(() => addToast('Failed to load device data', 'error')).finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
      if (problemSuggestRef.current && !problemSuggestRef.current.contains(e.target)) setShowProblemSuggest(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMobileChange = useCallback((val) => {
    const digits = val.replace(/[^0-9]/g, ''); setMobile(digits); setExistingCustomer(null);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (digits.length >= 2) {
      setSearching(true); setShowDropdown(true);
      searchTimerRef.current = setTimeout(async () => {
        try { const { data } = await endpoints.searchCustomers(digits); setSearchResults(data || []); if (data.length === 0) setShowDropdown(false); }
        catch { setSearchResults([]); } finally { setSearching(false); }
      }, 300);
    } else { setSearchResults([]); setShowDropdown(false); setSearching(false); }
  }, []);

  function selectCustomer(c) { setExistingCustomer(c); setName(c.name); setMobile(c.mobile); setAddress(c.address || ''); setShowDropdown(false); setSearchResults([]); addToast(`Found ${c.name}`, 'success'); }

  function canGoNext() {
    if (step === 1) return deviceType && brand && model && problem.trim() && leadSource;
    if (step === 2) return quickWalkin ? mobile.length >= 10 : name.trim() && mobile.length >= 10;
    return true;
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      let customerId, jobCardId;
      const jobPayload = { device: deviceType, brand, model, problem, branch, leadSource, accessories, condition, tags: selectedTags };
      if (existingCustomer) {
        customerId = existingCustomer._id;
        if (name !== existingCustomer.name || address !== (existingCustomer.address || '')) await endpoints.updateCustomer(customerId, { name, mobile, address });
        const { data } = await endpoints.createJobCard({ _id: nanoid(), customerId, ...jobPayload });
        jobCardId = data._id;
      } else {
        const custId = nanoid();
        const { data } = await endpoints.createCustomer({ _id: custId, name: name || 'Guest', mobile, address: address || '', device: deviceType, brand, model, problem });
        jobCardId = data.jobCardId;
      }
      addToast('Service job created', 'success');
      onDone(jobCardId); onClose();
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  }

  function reset() { setStep(1); onClose(); }

  if (!open) return null;
  if (loading) return <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--c-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner text="Loading..." /></div>;

  const inputStyle = { width: '100%', padding: '10px 12px', background: 'var(--c-surface2)', border: '1px solid var(--c-border2)', borderRadius: 8, color: 'var(--c-text)', fontSize: 14, fontFamily: 'inherit', outline: 'none', transition: 'border-color .15s' };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--c-bg)', display: 'flex', flexDirection: 'column', animation: 'pageIn .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--c-border)', background: 'var(--c-surface)', flexShrink: 0, gap: 16 }}>
        <div className="flex items-center gap-3">
          <button onClick={reset} style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--c-surface2)', border: '1px solid var(--c-border2)', cursor: 'pointer', color: 'var(--c-text2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
          </button>
          <div><div style={{ fontSize: 16, fontWeight: 700 }}>New Service Job</div><div style={{ fontSize: 11, color: 'var(--c-text3)' }}>Reception Desk</div></div>
        </div>
        <Clock />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <StepIndicator step={step} total={3} />

          {step === 1 && (
            <div style={{ animation: 'pageIn .25s ease' }}>
              <div className="grid-2" style={{ gap: 16, gridTemplateColumns: '1.2fr 1fr 0.8fr' }}>
                <Card>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 6 }}>Device Information</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div><div className="t-xs dim" style={{ marginBottom: 4 }}>Device Type</div>
                      <select style={selectStyle} value={deviceType} onChange={(e) => { setDeviceType(e.target.value); setBrand(''); setModel(''); }}>{deviceTypes.map((d) => <option key={d}>{d}</option>)}</select></div>
                    <div><div className="t-xs dim" style={{ marginBottom: 4 }}>Brand</div>
                      <select style={selectStyle} value={brand} onChange={(e) => { setBrand(e.target.value); setModel(''); }}><option value="">— Select —</option>{filteredBrands.map((b) => <option key={b._id} value={b.name}>{b.name}</option>)}</select></div>
                    <div><div className="t-xs dim" style={{ marginBottom: 4 }}>Model</div>
                      <select style={selectStyle} value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand}><option value="">— Select —</option>{filteredModels.map((m) => <option key={m._id} value={m.modelName}>{m.modelName}</option>)}</select></div>
                    <div ref={problemSuggestRef} style={{ position: 'relative' }}>
                      <div className="t-xs dim" style={{ marginBottom: 4 }}>Problem Reported</div>
                      <textarea ref={problemRef} style={{ ...inputStyle, resize: 'vertical', minHeight: 50 }} rows={2} value={problem} onChange={(e) => handleProblemChange(e.target.value)} placeholder="Describe the issue..." />
                      {searchingProblems && <div className="spinner" style={{ position: 'absolute', right: 8, top: 32, width: 14, height: 14 }} />}
                      {showProblemSuggest && problemSuggestions.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--c-surface3)', border: '1px solid var(--c-border2)', borderRadius: 8, boxShadow: '0 12px 48px rgba(0,0,0,.5)', maxHeight: 200, overflow: 'auto', marginTop: 2 }}>
                          {problemSuggestions.map((p, i) => (
                            <button key={i} type="button" onClick={() => { setProblem(p.problem); setShowProblemSuggest(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid var(--c-border)', color: 'var(--c-text)', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', textAlign: 'left' }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-surface2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                              <span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--c-text3)' }}>history</span>
                              <div><div className="t-xs">{p.problem}</div><div className="t-xs dim">{p.device} — {p.brand} {p.model}</div></div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                <Card>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 8 }}>Lead Source <span className="t-xs dim" style={{ fontWeight: 400, textTransform: 'none' }}>— press 1-5</span></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {LEAD_SOURCES.map((ls, i) => (
                      <button key={ls.value} type="button" onClick={() => setLeadSource(ls.value)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: leadSource === ls.value ? 'rgba(205,0,99,.12)' : 'var(--c-surface2)', border: `1.5px solid ${leadSource === ls.value ? 'var(--c-accent)' : 'var(--c-border2)'}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .15s' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 6, background: leadSource === ls.value ? 'var(--gradient-brand)' : 'var(--c-surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: 15, color: leadSource === ls.value ? '#fff' : 'var(--c-text3)' }}>{ls.icon}</span>
                          <span style={{ position: 'absolute', top: -3, right: -3, width: 13, height: 13, borderRadius: '50%', background: 'var(--c-accent)', fontSize: 7, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                        </div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: leadSource === ls.value ? 'var(--c-accent)' : 'var(--c-text)' }}>{ls.value}</div><div style={{ fontSize: 9, color: 'var(--c-text3)' }}>{ls.desc}</div></div>
                        {leadSource === ls.value && <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--c-accent)' }}>check_circle</span>}
                      </button>
                    ))}
                  </div>
                </Card>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Card>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 8 }}>Accessories Received</div>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                      {ACCESSORY_ITEMS.map((item) => <ToggleBtn key={item} label={item} active={accessories.includes(item)} onClick={() => toggleAccessory(item)} size="sm" />)}
                    </div>
                  </Card>
                  <Card>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 8 }}>Device Condition</div>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                      {CONDITION_ITEMS.map((item) => <ToggleBtn key={item} label={item} active={condition.includes(item)} onClick={() => toggleCondition(item)} size="sm" />)}
                    </div>
                  </Card>
                  <Card>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 8 }}>Tags</div>
                    <div className="flex gap-1" style={{ flexWrap: 'wrap', marginBottom: 6 }}>
                      {jobTags.map((tag) => <ToggleBtn key={tag._id} label={tag.name} active={selectedTags.includes(tag.name)} onClick={() => toggleTag(tag.name)} size="sm" />)}
                    </div>
                    <div className="flex gap-1">
                      <input className="form-input" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTag(); } }} placeholder="New tag..." style={{ flex: 1, fontSize: 10, padding: '4px 6px' }} />
                      <button className="btn btn-primary" onClick={handleCreateTag} disabled={!newTagInput.trim()} style={{ fontSize: 9, padding: '3px 6px' }}>Add</button>
                    </div>
                    <div className="t-xs dim mt-1">Type + Enter to create new</div>
                  </Card>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button className="btn btn-ghost" onClick={reset} style={{ padding: '8px 16px', fontSize: 12 }}>Cancel</button>
                <button className="btn btn-primary" disabled={!canGoNext()} onClick={() => setStep(2)} style={{ padding: '8px 24px', fontSize: 12 }}>Continue → Customer</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: 'pageIn .25s ease' }}>
              <Card>
                <div className="flex items-center justify-between mb-2">
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)' }}>Customer Information</div>
                  <label className="flex items-center gap-1" style={{ cursor: 'pointer', fontSize: 10, color: 'var(--c-text2)' }}>
                    <input type="checkbox" checked={quickWalkin} onChange={() => setQuickWalkin(!quickWalkin)} style={{ accentColor: 'var(--c-accent)' }} />
                    Quick Walk-in (mobile only)
                  </label>
                </div>
                <div ref={searchRef} style={{ position: 'relative', marginBottom: 10 }}>
                  <div className="t-xs dim" style={{ marginBottom: 4 }}>Mobile Number *</div>
                  <div className="flex gap-2 items-center">
                    <input ref={mobileRef} style={{ ...inputStyle, fontSize: 16 }} value={mobile} onChange={(e) => handleMobileChange(e.target.value)} placeholder="Enter mobile number" />
                    {searching && <div className="spinner" style={{ width: 18, height: 18, flexShrink: 0 }} />}
                  </div>
                  {showDropdown && searchResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--c-surface3)', border: '1px solid var(--c-border2)', borderRadius: 8, boxShadow: '0 12px 48px rgba(0,0,0,.5)', maxHeight: 200, overflow: 'auto', marginTop: 2 }}>
                      {searchResults.map((c) => (
                        <button key={c._id} type="button" onClick={() => selectCustomer(c)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid var(--c-border)', color: 'var(--c-text)', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', textAlign: 'left' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-surface2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                          <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--c-accent)' }}>person</span>
                          <div><div className="fw-600">{c.name}</div><div className="t-xs dim">{c.mobile}</div></div>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="t-xs muted mt-1">Existing customers auto-fill when found</div>
                </div>

                {!quickWalkin && (
                  <>
                    <div className="grid-2" style={{ gap: 12 }}>
                      <div><div className="t-xs dim" style={{ marginBottom: 4 }}>Customer Name *</div><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /></div>
                      <div><div className="t-xs dim" style={{ marginBottom: 4 }}>Branch</div>
                        <select style={selectStyle} value={branch} onChange={(e) => setBranch(e.target.value)}>{BRANCHES.map((b) => <option key={b}>{b}</option>)}</select></div>
                    </div>
                    <div style={{ marginTop: 10 }}><div className="t-xs dim" style={{ marginBottom: 4 }}>Address</div><input style={inputStyle} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address (optional)" /></div>
                  </>
                )}
                {quickWalkin && (
                  <div style={{ marginTop: 8 }}><div className="t-xs dim" style={{ marginBottom: 4 }}>Name (optional)</div><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Guest" /></div>
                )}
                {existingCustomer && (
                  <div style={{ marginTop: 10, background: 'rgba(6,182,212,.08)', border: '1px solid rgba(6,182,212,.2)', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: 'var(--c-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 14 }}>info</span>
                    Existing customer — details will update if changed
                  </div>
                )}
              </Card>
              <div className="flex justify-end gap-2 mt-4">
                <button className="btn btn-ghost" onClick={() => setStep(1)} style={{ padding: '8px 16px', fontSize: 12 }}>← Back</button>
                <button className="btn btn-primary" disabled={!canGoNext()} onClick={() => setStep(3)} style={{ padding: '8px 24px', fontSize: 12 }}>Review & Confirm</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ animation: 'pageIn .25s ease' }}>
              <div className="grid-2" style={{ gap: 16 }}>
                <Card><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 8 }}>Service Details</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[['devices', 'Device', deviceType], ['local_offer', 'Brand', brand], ['phone_android', 'Model', model], ['share', 'Lead', leadSource], ['location_on', 'Branch', branch]].map(([icon, label, val]) => (
                      <div key={label} className="flex items-center gap-3" style={{ padding: '4px 0', borderBottom: '1px solid var(--c-border)' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: 15, color: 'var(--c-accent)' }}>{icon}</span>
                        <div><div className="t-xs dim">{label}</div><div className="t-sm fw-600">{val}</div></div>
                      </div>
                    ))}
                    {accessories.length > 0 && <div style={{ padding: '4px 0' }}><span className="material-symbols-rounded" style={{ fontSize: 15, color: 'var(--c-accent)', marginRight: 8 }}>inventory_2</span><span className="t-xs dim">Accessories:</span><div className="flex gap-1 mt-1" style={{ flexWrap: 'wrap' }}>{accessories.map((a) => <span key={a} className="badge badge-ghost" style={{ fontSize: 9 }}>{a}</span>)}</div></div>}
                    {condition.length > 0 && <div style={{ padding: '4px 0' }}><span className="material-symbols-rounded" style={{ fontSize: 15, color: 'var(--c-accent)', marginRight: 8 }}>warning</span><span className="t-xs dim">Condition:</span><div className="flex gap-1 mt-1" style={{ flexWrap: 'wrap' }}>{condition.map((c) => <span key={c} className="badge badge-amber" style={{ fontSize: 9 }}>{c}</span>)}</div></div>}
                    {selectedTags.length > 0 && <div style={{ padding: '4px 0' }}><span className="material-symbols-rounded" style={{ fontSize: 15, color: 'var(--c-accent)', marginRight: 8 }}>sell</span><span className="t-xs dim">Tags:</span><div className="flex gap-1 mt-1" style={{ flexWrap: 'wrap' }}>{selectedTags.map((t) => <span key={t} className="badge badge-purple" style={{ fontSize: 9 }}>{t}</span>)}</div></div>}
                    <div style={{ padding: '4px 0' }}><span className="material-symbols-rounded" style={{ fontSize: 15, color: 'var(--c-accent)', marginRight: 8 }}>description</span><span className="t-xs dim">Problem</span><div className="t-sm" style={{ background: 'var(--c-surface2)', padding: '6px 8px', borderRadius: 6, marginTop: 2 }}>{problem}</div></div>
                  </div>
                </Card>
                <Card><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 8 }}>Customer</div>
                  <div><div className="t-xs dim">Name</div><div className="t-sm fw-600">{name || 'Guest'}</div></div>
                  <div style={{ marginTop: 6 }}><div className="t-xs dim">Mobile</div><div className="t-sm fw-600">{mobile}</div></div>
                  {address && <div style={{ marginTop: 6 }}><div className="t-xs dim">Address</div><div className="t-sm">{address}</div></div>}
                  {existingCustomer ? <div className="t-xs" style={{ color: 'var(--c-green)', marginTop: 8 }}>Existing customer — new job card</div> : <div className="t-xs" style={{ color: 'var(--c-accent)', marginTop: 8 }}>New customer — will be created with job</div>}
                  {quickWalkin && <div className="t-xs" style={{ color: 'var(--c-cyan)', marginTop: 4 }}>Quick Walk-in — minimal details collected</div>}
                </Card>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button className="btn btn-ghost" onClick={() => setStep(2)} style={{ padding: '8px 16px', fontSize: 12 }}>← Back</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} style={{ padding: '8px 28px', fontSize: 13 }}>
                  {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : 'Create Service Job'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
