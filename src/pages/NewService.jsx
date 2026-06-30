import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useBranch } from '../context/BranchContext';
import LoadingSpinner from '../components/LoadingSpinner';

const LEAD_SOURCES = [
  { value: 'In Store Visit', icon: 'storefront', desc: 'Customer walked in', key: '1' },
  { value: 'Customer Location Visit', icon: 'local_shipping', desc: 'On-site service', key: '2' },
  { value: 'Telephone', icon: 'phone_in_talk', desc: 'Called for service', key: '3' },
  { value: 'WhatsApp / Social Media', icon: 'chat', desc: 'Online inquiry', key: '4' },
  { value: 'Reference / Walk-in', icon: 'groups', desc: 'Referred by someone', key: '5' },
];
const ACCESSORY_ITEMS = ['Charger', 'Bag', 'Original Box', 'Cable', 'Mouse', 'Warranty Card', 'Bill', 'Stylus'];
const CONDITION_ITEMS = ['Screen Scratches', 'Dents', 'Cracked Screen', 'Broken Hinge', 'Keyboard Missing Key', 'Scratches on Body', 'Liquid Damage', 'Burning Smell'];

function FieldLabel({ children, hint }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--c-text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
      {children} {hint && <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--c-text3)', letterSpacing: 0 }}>{hint}</span>}
    </label>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
      border: `1.5px solid ${active ? 'var(--c-accent)' : 'var(--c-border2)'}`,
      background: active ? 'rgba(205,0,99,.12)' : 'var(--c-surface2)',
      color: active ? 'var(--c-accent)' : 'var(--c-text2)',
      transition: 'all .12s', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

export default function NewService() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { branch } = useBranch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [jobTags, setJobTags] = useState([]);

  // Step 1: Device
  const [deviceType, setDeviceType] = useState('Laptop');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [problem, setProblem] = useState('');
  const [leadSource, setLeadSource] = useState('In Store Visit');
  const [accessories, setAccessories] = useState([]);
  const [condition, setCondition] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Step 2: Customer
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Problem suggestions
  const [problemSuggestions, setProblemSuggestions] = useState([]);
  const [showProblemSuggest, setShowProblemSuggest] = useState(false);
  const [searchingProblems, setSearchingProblems] = useState(false);

  // Refs
  const problemRef = useRef(null);
  const mobileRef = useRef(null);
  const nameRef = useRef(null);
  const searchRef = useRef(null);
  const problemSuggestRef = useRef(null);
  const searchTimerRef = useRef(null);
  const problemTimerRef = useRef(null);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') { navigate(-1); return; }
      // Lead source shortcuts 1-5
      if (!e.ctrlKey && !e.metaKey && !e.shiftKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        const n = parseInt(e.key);
        if (n >= 1 && n <= 5) { e.preventDefault(); setLeadSource(LEAD_SOURCES[n - 1].value); }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [navigate]);

  // Load data
  useEffect(() => {
    setLoading(true);
    Promise.all([endpoints.brands(), endpoints.deviceModels(), endpoints.tags()])
      .then(([bRes, mRes, tRes]) => { setBrands(bRes.data); setModels(mRes.data); setJobTags(tRes.data || []); })
      .catch(() => addToast('Failed to load device data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  // Click outside handlers
  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
      if (problemSuggestRef.current && !problemSuggestRef.current.contains(e.target)) setShowProblemSuggest(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus problem on load
  useEffect(() => { if (!loading) setTimeout(() => problemRef.current?.focus(), 200); }, [loading]);

  const deviceTypes = [...new Set(brands.map(b => b.deviceType))];
  const filteredBrands = brands.filter(b => b.deviceType === deviceType);
  const filteredModels = models.filter(m => m.brand === brand && m.deviceType === deviceType);

  function toggle(item, list, setList) {
    setList(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
  }

  async function handleCreateTag() {
    const val = newTagInput.trim().toUpperCase();
    if (!val || selectedTags.includes(val)) return;
    try {
      const { data } = await endpoints.createTag({ name: val });
      setJobTags(prev => prev.find(t => t.name === data.name) ? prev : [...prev, data]);
      setSelectedTags(prev => [...prev, data.name]);
      setNewTagInput('');
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
  }

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

  const handleMobileChange = useCallback((val) => {
    const digits = val.replace(/[^0-9]/g, '');
    setMobile(digits);
    setExistingCustomer(null);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (digits.length >= 2) {
      setSearching(true); setShowDropdown(true);
      searchTimerRef.current = setTimeout(async () => {
        try { const { data } = await endpoints.searchCustomers(digits); setSearchResults(data || []); if (data.length === 0) setShowDropdown(false); }
        catch { setSearchResults([]); } finally { setSearching(false); }
      }, 300);
    } else { setSearchResults([]); setShowDropdown(false); setSearching(false); }
  }, []);

  function selectCustomer(c) {
    setExistingCustomer(c); setName(c.name); setMobile(c.mobile); setAddress(c.address || '');
    setShowDropdown(false); setSearchResults([]);
    addToast(`Found ${c.name}`, 'success');
  }

  function canSubmit() {
    return deviceType && brand && model && problem.trim() && leadSource && mobile.length >= 10;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit()) return;
    setSaving(true);
    try {
      const jobPayload = { device: deviceType, brand, model, problem, branch, leadSource, accessories, condition, tags: selectedTags };
      if (existingCustomer) {
        const customerId = existingCustomer._id;
        if (name !== existingCustomer.name || address !== (existingCustomer.address || '')) {
          await endpoints.updateCustomer(customerId, { name, mobile, address });
        }
        const { data } = await endpoints.createJobCard({ _id: nanoid(), customerId, ...jobPayload });
        addToast('Service job created', 'success');
        navigate(`/job/${data._id}`);
      } else {
        const custId = nanoid();
        const { data } = await endpoints.createCustomer({ _id: custId, name: name || 'Guest', mobile, address: address || '', device: deviceType, brand, model, problem });
        addToast('Service job created', 'success');
        navigate(`/job/${data.jobCardId}`);
      }
    } catch (err) { addToast(err.response?.data?.message || 'Failed to create job', 'error'); }
    finally { setSaving(false); }
  }

  if (loading) return <LoadingSpinner text="Loading..." />;

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: 'var(--c-surface)', border: '1.5px solid var(--c-border2)',
    borderRadius: 10, color: 'var(--c-text)', fontSize: 14, fontFamily: 'inherit', outline: 'none',
    transition: 'border-color .15s, box-shadow .15s',
  };
  const inputFocusStyle = { onFocus: (e) => { e.target.style.borderColor = 'var(--c-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(205,0,99,.15)'; }, onBlur: (e) => { e.target.style.borderColor = 'var(--c-border2)'; e.target.style.boxShadow = 'none'; } };

  return (
    <div style={{ animation: 'pageIn .25s ease' }}>
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 24 }}>
          <div className="page-title">
            <div className="flex items-center gap-3">
              <button type="button" className="btn-icon" onClick={() => navigate(-1)} title="Back"><span className="material-symbols-rounded">arrow_back</span></button>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>New Service Job</div>
                <div style={{ fontSize: 12, color: 'var(--c-text3)' }}>Create a new repair ticket</div>
              </div>
            </div>
          </div>
          <div className="page-actions">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)} style={{ padding: '10px 20px' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit() || saving} style={{ padding: '10px 28px', fontSize: 14, fontWeight: 600 }}>
              {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><span className="material-symbols-rounded" style={{ fontSize: 18 }}>add_task</span> Create Job</>}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          {/* Left Column - Main Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Device Card */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--c-accent)' }}>devices</span> Device Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <FieldLabel>Device Type</FieldLabel>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={deviceType} onChange={(e) => { setDeviceType(e.target.value); setBrand(''); setModel(''); }}>
                    {deviceTypes.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Brand</FieldLabel>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={brand} onChange={(e) => { setBrand(e.target.value); setModel(''); }}>
                    <option value="">Select brand...</option>
                    {filteredBrands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <FieldLabel>Model</FieldLabel>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={model} onChange={(e) => setModel(e.target.value)} disabled={!brand}>
                    <option value="">Select model...</option>
                    {filteredModels.map(m => <option key={m._id} value={m.modelName}>{m.modelName}</option>)}
                  </select>
                </div>
              </div>
              <div ref={problemSuggestRef} style={{ position: 'relative' }}>
                <FieldLabel>Problem Reported</FieldLabel>
                <textarea ref={problemRef} style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} rows={3} value={problem} onChange={(e) => handleProblemChange(e.target.value)} placeholder="Describe the issue reported by the customer..." {...inputFocusStyle} />
                {searchingProblems && <div className="spinner" style={{ position: 'absolute', right: 12, top: 38, width: 16, height: 16 }} />}
                {showProblemSuggest && problemSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--c-surface3)', border: '1px solid var(--c-border2)', borderRadius: 10, boxShadow: '0 12px 48px rgba(0,0,0,.5)', maxHeight: 200, overflow: 'auto', marginTop: 4 }}>
                    {problemSuggestions.map((p, i) => (
                      <button key={i} type="button" onClick={() => { setProblem(p.problem); setShowProblemSuggest(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--c-border)', color: 'var(--c-text)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textAlign: 'left' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-surface2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                        <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--c-text3)' }}>history</span>
                        <div><div>{p.problem}</div><div style={{ fontSize: 11, color: 'var(--c-text3)' }}>{p.device} — {p.brand} {p.model}</div></div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Card */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--c-accent)' }}>person</span> Customer Information
              </div>
              <div ref={searchRef} style={{ position: 'relative', marginBottom: 16 }}>
                <FieldLabel>Mobile Number</FieldLabel>
                <div className="flex gap-2 items-center">
                  <input ref={mobileRef} style={{ ...inputStyle, fontSize: 16, letterSpacing: '1px' }} value={mobile} onChange={(e) => handleMobileChange(e.target.value)} placeholder="Enter 10-digit mobile" maxLength={10} {...inputFocusStyle} />
                  {searching && <div className="spinner" style={{ width: 18, height: 18, flexShrink: 0 }} />}
                </div>
                {showDropdown && searchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--c-surface3)', border: '1px solid var(--c-border2)', borderRadius: 10, boxShadow: '0 12px 48px rgba(0,0,0,.5)', maxHeight: 200, overflow: 'auto', marginTop: 4 }}>
                    {searchResults.map((c) => (
                      <button key={c._id} type="button" onClick={() => selectCustomer(c)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--c-border)', color: 'var(--c-text)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textAlign: 'left' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-surface2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                        <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--c-accent)' }}>person</span>
                        <div><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 11, color: 'var(--c-text3)' }}>{c.mobile}</div></div>
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--c-text3)', marginTop: 4 }}>Existing customers auto-fill when found</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <FieldLabel>Customer Name</FieldLabel>
                  <input ref={nameRef} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" {...inputFocusStyle} />
                </div>
                <div>
                  <FieldLabel>Branch</FieldLabel>
                  <input style={{ ...inputStyle, background: 'var(--c-surface2)', color: 'var(--c-text2)' }} value={branch} readOnly />
                </div>
              </div>
              <div>
                <FieldLabel hint="(optional)">Address</FieldLabel>
                <input style={inputStyle} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Customer address" {...inputFocusStyle} />
              </div>
              {existingCustomer && (
                <div style={{ marginTop: 12, background: 'rgba(6,182,212,.08)', border: '1px solid rgba(6,182,212,.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--c-cyan)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>info</span>
                  Existing customer — details will update if changed
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 64 }}>
            {/* Lead Source */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--c-accent)' }}>share</span> Lead Source <span style={{ fontWeight: 400, textTransform: 'none' }}>— press 1-5</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {LEAD_SOURCES.map((ls) => (
                  <button key={ls.value} type="button" onClick={() => setLeadSource(ls.value)} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    background: leadSource === ls.value ? 'rgba(205,0,99,.12)' : 'var(--c-surface2)',
                    border: `1.5px solid ${leadSource === ls.value ? 'var(--c-accent)' : 'var(--c-border2)'}`,
                    borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .15s',
                  }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: leadSource === ls.value ? 'var(--gradient-brand)' : 'var(--c-surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 16, color: leadSource === ls.value ? '#fff' : 'var(--c-text3)' }}>{ls.icon}</span>
                      <span style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, borderRadius: '50%', background: 'var(--c-accent)', fontSize: 8, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ls.key}</span>
                    </div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: leadSource === ls.value ? 'var(--c-accent)' : 'var(--c-text)' }}>{ls.value}</div><div style={{ fontSize: 10, color: 'var(--c-text3)' }}>{ls.desc}</div></div>
                    {leadSource === ls.value && <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--c-accent)' }}>check_circle</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessories */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--c-accent)' }}>inventory_2</span> Accessories
              </div>
              <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                {ACCESSORY_ITEMS.map(item => <Chip key={item} label={item} active={accessories.includes(item)} onClick={() => toggle(item, accessories, setAccessories)} />)}
              </div>
            </div>

            {/* Condition */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--c-amber)' }}>warning</span> Condition
              </div>
              <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
                {CONDITION_ITEMS.map(item => <Chip key={item} label={item} active={condition.includes(item)} onClick={() => toggle(item, condition, setCondition)} />)}
              </div>
            </div>

            {/* Tags */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--c-accent)' }}>sell</span> Tags
              </div>
              <div className="flex gap-1" style={{ flexWrap: 'wrap', marginBottom: 8 }}>
                {jobTags.map(tag => <Chip key={tag._id} label={tag.name} active={selectedTags.includes(tag.name)} onClick={() => toggle(tag.name, selectedTags, setSelectedTags)} />)}
              </div>
              <div className="flex gap-2">
                <input style={{ ...inputStyle, padding: '8px 10px', fontSize: 12 }} value={newTagInput} onChange={(e) => setNewTagInput(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTag(); } }} placeholder="New tag + Enter" />
                <button type="button" className="btn btn-primary" onClick={handleCreateTag} disabled={!newTagInput.trim()} style={{ padding: '8px 14px', fontSize: 12, whiteSpace: 'nowrap' }}>Add</button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Submit Bar */}
        <div style={{ marginTop: 24, padding: '16px 0', borderTop: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: 'var(--c-text3)' }}>
            {canSubmit() ? <span style={{ color: 'var(--c-green)' }}>Ready to create</span> : <span>Fill all required fields to continue</span>}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)} style={{ padding: '10px 20px' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit() || saving} style={{ padding: '10px 28px', fontSize: 14, fontWeight: 600 }}>
              {saving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><span className="material-symbols-rounded" style={{ fontSize: 18 }}>add_task</span> Create Job</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
