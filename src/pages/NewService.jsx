import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useBranch } from '../context/BranchContext';
import LoadingSpinner from '../components/LoadingSpinner';

const LEAD_SOURCES = [
  { value: 'In Store Visit', icon: 'storefront', desc: 'Walked in', key: '1' },
  { value: 'Customer Location Visit', icon: 'local_shipping', desc: 'On-site', key: '2' },
  { value: 'Telephone', icon: 'phone_in_talk', desc: 'Phone call', key: '3' },
  { value: 'WhatsApp / Social Media', icon: 'chat', desc: 'Online', key: '4' },
  { value: 'Reference / Walk-in', icon: 'groups', desc: 'Referred', key: '5' },
];
const ACCESSORY_ITEMS = ['Charger', 'Bag', 'Original Box', 'Cable', 'Mouse', 'Warranty Card', 'Bill', 'Stylus'];
const CONDITION_ITEMS = ['Screen Scratches', 'Dents', 'Cracked Screen', 'Broken Hinge', 'Keyboard Missing Key', 'Body Scratches', 'Liquid Damage', 'Burning Smell', 'Dead'];

const s = {
  input: { width: '100%', padding: '14px 16px', background: 'var(--c-surface)', border: '1.5px solid var(--c-border2)', borderRadius: 12, color: 'var(--c-text)', fontSize: 15, fontFamily: 'inherit', outline: 'none', transition: 'border-color .15s, box-shadow .15s' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--c-text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' },
  card: { background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 16, padding: 28 },
  sectionTitle: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-text3)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 },
};

function focusStyle(e) { e.target.style.borderColor = 'var(--c-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(205,0,99,.15)'; }
function blurStyle(e) { e.target.style.borderColor = 'var(--c-border2)'; e.target.style.boxShadow = 'none'; }

function Chip({ label, active, onClick, icon }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
      border: `1.5px solid ${active ? 'var(--c-accent)' : 'var(--c-border2)'}`,
      background: active ? 'rgba(205,0,99,.12)' : 'var(--c-surface2)',
      color: active ? 'var(--c-accent)' : 'var(--c-text2)',
      transition: 'all .12s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {icon && <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{icon}</span>}
      {label}
    </button>
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
  const [deviceType, setDeviceType] = useState('Laptop');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [deviceTypeIsOther, setDeviceTypeIsOther] = useState(false);
  const [brandIsOther, setBrandIsOther] = useState(false);
  const [modelIsOther, setModelIsOther] = useState(false);
  const [customDeviceType, setCustomDeviceType] = useState('');
  const [customBrand, setCustomBrand] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [problem, setProblem] = useState('');
  const [leadSource, setLeadSource] = useState('In Store Visit');
  const [accessories, setAccessories] = useState([]);
  const [condition, setCondition] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [inWarranty, setInWarranty] = useState(false);
  const [serialNo, setSerialNo] = useState('');
  const [serviceCenterAddress, setServiceCenterAddress] = useState('');
  const [docketDetail, setDocketDetail] = useState('');
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [existingCustomer, setExistingCustomer] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [problemSuggestions, setProblemSuggestions] = useState([]);
  const [showProblemSuggest, setShowProblemSuggest] = useState(false);
  const [searchingProblems, setSearchingProblems] = useState(false);
  const problemRef = useRef(null);
  const mobileRef = useRef(null);
  const searchRef = useRef(null);
  const problemSuggestRef = useRef(null);
  const searchTimerRef = useRef(null);
  const problemTimerRef = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') { navigate(-1); return; }
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const n = parseInt(e.key);
      if (n >= 1 && n <= 5) { e.preventDefault(); setLeadSource(LEAD_SOURCES[n - 1].value); }
      if (e.key === 'Enter' && canSubmit()) { e.preventDefault(); handleSubmit(); }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [navigate, deviceType, brand, model, problem, leadSource, mobile, name, address, saving]);

  useEffect(() => {
    setLoading(true);
    Promise.all([endpoints.brands(), endpoints.deviceModels(), endpoints.tags()])
      .then(([bRes, mRes, tRes]) => { setBrands(bRes.data); setModels(mRes.data); setJobTags(tRes.data || []); })
      .catch(() => addToast('Failed to load device data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false);
      if (problemSuggestRef.current && !problemSuggestRef.current.contains(e.target)) setShowProblemSuggest(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { if (!loading) setTimeout(() => problemRef.current?.focus(), 200); }, [loading]);

  const deviceTypes = [...new Set(brands.map(b => b.deviceType))];
  const filteredBrands = brands.filter(b => b.deviceType === deviceType);
  const filteredModels = models.filter(m => m.brand === brand && m.deviceType === deviceType);

  function toggle(item, list, setList) { setList(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]); }

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
    problemRef.current?.focus();
  }

  function canSubmit() {
    const dt = deviceTypeIsOther ? customDeviceType : deviceType;
    const b = brandIsOther ? customBrand : brand;
    const m = modelIsOther ? customModel : model;
    return dt && b && m && problem.trim() && leadSource && mobile.length >= 10;
  }

  async function handleSubmit() {
    if (!canSubmit() || saving) return;
    setSaving(true);
    try {
      const finalDeviceType = deviceTypeIsOther ? customDeviceType : deviceType;
      const finalBrand = brandIsOther ? customBrand : brand;
      const finalModel = modelIsOther ? customModel : model;

      // Save custom device type/brand/model to DB
      if (deviceTypeIsOther || brandIsOther || modelIsOther) {
        try { await endpoints.saveDevice({ deviceType: finalDeviceType, brand: finalBrand, model: finalModel }); } catch {}
      }

      const jobPayload = { device: finalDeviceType, brand: finalBrand, model: finalModel, problem, branch, leadSource, accessories, condition, tags: selectedTags, inWarranty, serialNo, serviceCenterAddress, docketDetail };
      if (existingCustomer) {
        const customerId = existingCustomer._id;
        if (name !== existingCustomer.name || address !== (existingCustomer.address || '')) {
          await endpoints.updateCustomer(customerId, { name, mobile, address });
        }
        const { data } = await endpoints.createJobCard({ _id: nanoid(), customerId, ...jobPayload });
        addToast('Service job created', 'success');
        navigate(`/job/${data._id}`);
      } else {
        // Create user account for the customer
        let customerPassword = '';
        try {
          const { data: userData } = await endpoints.createUser({ name: name || 'Guest', phone: mobile, role: 'customer' });
          customerPassword = userData.credentials?.password || '';
        } catch (err) {
          // User might already exist, continue with job creation
        }

        const custId = nanoid();
        const { data } = await endpoints.createCustomer({ _id: custId, name: name || 'Guest', mobile, address: address || '', device: finalDeviceType, brand: finalBrand, model: finalModel, problem });
        addToast('Service job created', 'success');

        // Open WhatsApp with credentials if new customer
        if (customerPassword) {
          const waMessage = encodeURIComponent(`Hello ${name || 'Customer'},\n\nYour service request has been created.\n\nLogin to track your repair:\nPhone: ${mobile}\nPassword: ${customerPassword}\n\nApp: ${window.location.origin}\n\n- Sai Laptop & Computer Gallery`);
          window.open(`https://wa.me/91${mobile}?text=${waMessage}`, '_blank');
        }

        navigate(`/job/${data.jobCardId}`);
      }
    } catch (err) { addToast(err.response?.data?.message || 'Failed to create job', 'error'); }
    finally { setSaving(false); }
  }

  if (loading) return <LoadingSpinner text="Loading..." />;

  return (
    <div style={{ animation: 'pageIn .25s ease', maxWidth: 900, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 28 }}>
        <div className="page-title">
          <div className="flex items-center gap-3">
            <button type="button" className="btn-icon" onClick={() => navigate(-1)}><span className="material-symbols-rounded">arrow_back</span></button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>New Service Job</div>
              <div style={{ fontSize: 12, color: 'var(--c-text3)' }}>Fill in the details below — Tab to navigate, Enter to submit</div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Section */}
      <div style={s.card}>
        <div style={s.sectionTitle}>
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--c-accent)' }}>devices</span> Device Information
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div>
            <label style={s.label}>Device Type</label>
            {deviceTypeIsOther ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...s.input, flex: 1 }} value={customDeviceType} onChange={(e) => setCustomDeviceType(e.target.value)} placeholder="Enter device type" onFocus={focusStyle} onBlur={blurStyle} autoFocus />
                <button type="button" style={{ padding: '0 12px', background: 'var(--c-surface2)', border: '1.5px solid var(--c-border2)', borderRadius: 12, cursor: 'pointer', color: 'var(--c-text2)' }} onClick={() => { setDeviceTypeIsOther(false); setCustomDeviceType(''); setDeviceType('Laptop'); }}>✕</button>
              </div>
            ) : (
              <select style={{ ...s.input, cursor: 'pointer', fontSize: 16, fontWeight: 600 }} value={deviceType}
                onChange={(e) => {
                  if (e.target.value === '__other__') { setDeviceTypeIsOther(true); setDeviceType(''); setBrand(''); setBrandIsOther(false); setCustomBrand(''); setModel(''); setModelIsOther(false); setCustomModel(''); }
                  else { setDeviceType(e.target.value); setBrand(''); setBrandIsOther(false); setCustomBrand(''); setModel(''); setModelIsOther(false); setCustomModel(''); }
                }}
                onFocus={focusStyle} onBlur={blurStyle}>
                {deviceTypes.map(d => <option key={d} value={d}>{d}</option>)}
                <option value="__other__">Other (type your own)</option>
              </select>
            )}
          </div>
          <div>
            <label style={s.label}>Brand</label>
            {brandIsOther ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...s.input, flex: 1 }} value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} placeholder="Enter brand name" onFocus={focusStyle} onBlur={blurStyle} autoFocus />
                <button type="button" style={{ padding: '0 12px', background: 'var(--c-surface2)', border: '1.5px solid var(--c-border2)', borderRadius: 12, cursor: 'pointer', color: 'var(--c-text2)' }} onClick={() => { setBrandIsOther(false); setCustomBrand(''); }}>✕</button>
              </div>
            ) : (
              <select style={{ ...s.input, cursor: 'pointer' }} value={brand}
                onChange={(e) => {
                  if (e.target.value === '__other__') { setBrandIsOther(true); setBrand(''); setModel(''); setModelIsOther(false); setCustomModel(''); }
                  else { setBrand(e.target.value); setModel(''); setModelIsOther(false); setCustomModel(''); }
                }}
                onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">Select brand...</option>
                {filteredBrands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                <option value="__other__">Other (type your own)</option>
              </select>
            )}
          </div>
          <div>
            <label style={s.label}>Model</label>
            {modelIsOther ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...s.input, flex: 1 }} value={customModel} onChange={(e) => setCustomModel(e.target.value)} placeholder="Enter model name" onFocus={focusStyle} onBlur={blurStyle} autoFocus />
                <button type="button" style={{ padding: '0 12px', background: 'var(--c-surface2)', border: '1.5px solid var(--c-border2)', borderRadius: 12, cursor: 'pointer', color: 'var(--c-text2)' }} onClick={() => { setModelIsOther(false); setCustomModel(''); }}>✕</button>
              </div>
            ) : (
              <select style={{ ...s.input, cursor: 'pointer' }} value={model}
                onChange={(e) => {
                  if (e.target.value === '__other__') { setModelIsOther(true); setModel(''); }
                  else setModel(e.target.value);
                }}
                disabled={!brand && !brandIsOther}
                onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">Select model...</option>
                {filteredModels.map(m => <option key={m._id} value={m.modelName}>{m.modelName}</option>)}
                <option value="__other__">Other (type your own)</option>
              </select>
            )}
          </div>
        </div>
        <div ref={problemSuggestRef} style={{ position: 'relative' }}>
          <label style={s.label}>Problem Reported</label>
          <textarea ref={problemRef} style={{ ...s.input, resize: 'vertical', minHeight: 100, fontSize: 15 }}
            rows={3} value={problem} onChange={(e) => handleProblemChange(e.target.value)}
            placeholder="Describe the issue reported by the customer..."
            onFocus={focusStyle} onBlur={blurStyle} />
          {searchingProblems && <div className="spinner" style={{ position: 'absolute', right: 14, top: 44, width: 18, height: 18 }} />}
          {showProblemSuggest && problemSuggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--c-surface3)', border: '1px solid var(--c-border2)', borderRadius: 12, boxShadow: '0 12px 48px rgba(0,0,0,.5)', maxHeight: 220, overflow: 'auto', marginTop: 4 }}>
              {problemSuggestions.map((p, i) => (
                <button key={i} type="button" onClick={() => { setProblem(p.problem); setShowProblemSuggest(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--c-border)', color: 'var(--c-text)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', textAlign: 'left' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-surface2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                  <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--c-text3)' }}>history</span>
                  <div><div>{p.problem}</div><div style={{ fontSize: 12, color: 'var(--c-text3)' }}>{p.device} — {p.brand} {p.model}</div></div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Customer Section */}
      <div style={{ ...s.card, marginTop: 20 }}>
        <div style={s.sectionTitle}>
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--c-accent)' }}>person</span> Customer Information
        </div>
        <div ref={searchRef} style={{ position: 'relative', marginBottom: 20 }}>
          <label style={s.label}>Mobile Number</label>
          <div className="flex gap-3 items-center">
            <input ref={mobileRef} style={{ ...s.input, fontSize: 18, letterSpacing: '2px', fontWeight: 600 }}
              value={mobile} onChange={(e) => handleMobileChange(e.target.value)}
              placeholder="Enter 10-digit mobile" maxLength={10}
              onFocus={focusStyle} onBlur={blurStyle} />
            {searching && <div className="spinner" style={{ width: 20, height: 20, flexShrink: 0 }} />}
          </div>
          {showDropdown && searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--c-surface3)', border: '1px solid var(--c-border2)', borderRadius: 12, boxShadow: '0 12px 48px rgba(0,0,0,.5)', maxHeight: 220, overflow: 'auto', marginTop: 4 }}>
              {searchResults.map((c) => (
                <button key={c._id} type="button" onClick={() => selectCustomer(c)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', borderBottom: '1px solid var(--c-border)', color: 'var(--c-text)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', textAlign: 'left' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--c-surface2)'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--c-accent)' }}>person</span>
                  <div><div style={{ fontWeight: 600 }}>{c.name}</div><div style={{ fontSize: 12, color: 'var(--c-text3)' }}>{c.mobile}</div></div>
                </button>
              ))}
            </div>
          )}
          {existingCustomer && (
            <div style={{ marginTop: 10, background: 'rgba(6,182,212,.08)', border: '1px solid rgba(6,182,212,.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--c-cyan)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16 }}>info</span>
              Existing customer found — details auto-filled
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          <div>
            <label style={s.label}>Customer Name</label>
            <input style={s.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
              onFocus={focusStyle} onBlur={blurStyle} />
          </div>
          <div>
            <label style={s.label}>Branch</label>
            <input style={{ ...s.input, background: 'var(--c-surface2)', color: 'var(--c-text2)' }} value={branch} readOnly />
          </div>
        </div>
        <div>
          <label style={s.label}>Address <span style={{ fontWeight: 400, color: 'var(--c-text3)' }}>(optional)</span></label>
          <input style={s.input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Customer address"
            onFocus={focusStyle} onBlur={blurStyle} />
        </div>
      </div>

      {/* Lead Source */}
      <div style={{ ...s.card, marginTop: 20 }}>
        <div style={s.sectionTitle}>
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--c-accent)' }}>share</span> Lead Source
          <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--c-text3)', marginLeft: 4 }}>— press 1–5</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {LEAD_SOURCES.map((ls) => (
            <button key={ls.value} type="button" onClick={() => setLeadSource(ls.value)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '18px 12px',
              background: leadSource === ls.value ? 'rgba(205,0,99,.12)' : 'var(--c-surface2)',
              border: `2px solid ${leadSource === ls.value ? 'var(--c-accent)' : 'var(--c-border2)'}`,
              borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', position: 'relative',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: leadSource === ls.value ? 'var(--gradient-brand)' : 'var(--c-surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 22, color: leadSource === ls.value ? '#fff' : 'var(--c-text3)' }}>{ls.icon}</span>
                <span style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', background: 'var(--c-accent)', fontSize: 10, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{ls.key}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: leadSource === ls.value ? 'var(--c-accent)' : 'var(--c-text)' }}>{ls.value}</div>
                <div style={{ fontSize: 10, color: 'var(--c-text3)', marginTop: 2 }}>{ls.desc}</div>
              </div>
              {leadSource === ls.value && <span className="material-symbols-rounded" style={{ position: 'absolute', top: 8, right: 8, fontSize: 18, color: 'var(--c-accent)' }}>check_circle</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Accessories & Condition */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
        <div style={s.card}>
          <div style={s.sectionTitle}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--c-accent)' }}>inventory_2</span> Accessories Received
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ACCESSORY_ITEMS.map(item => <Chip key={item} label={item} active={accessories.includes(item)} onClick={() => toggle(item, accessories, setAccessories)} />)}
          </div>
        </div>
        <div style={s.card}>
          <div style={s.sectionTitle}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--c-amber)' }}>warning</span> Device Condition
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CONDITION_ITEMS.map(item => <Chip key={item} label={item} active={condition.includes(item)} onClick={() => toggle(item, condition, setCondition)} />)}
          </div>
        </div>
      </div>

      {/* Warranty Details */}
      <div style={{ ...s.card, marginTop: 20 }}>
        <div style={{ ...s.sectionTitle, marginBottom: 12 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--c-accent)' }}>verified</span> Warranty Details
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: inWarranty ? 20 : 0 }}>
          <input type="checkbox" checked={inWarranty} onChange={(e) => setInWarranty(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--c-accent)' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Device is In Warranty (RMA)</span>
        </label>
        
        {inWarranty && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            <div>
              <label style={s.label}>Serial Number</label>
              <input style={s.input} value={serialNo} onChange={(e) => setSerialNo(e.target.value)} placeholder="Enter S/N" onFocus={focusStyle} onBlur={blurStyle} />
            </div>
            <div>
              <label style={s.label}>Service Center</label>
              <select style={s.input} value={serviceCenterAddress} onChange={(e) => setServiceCenterAddress(e.target.value)} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="">Select Service Center...</option>
                <option value="Local Authorized SC">Local Authorized SC</option>
                <option value="Main City SC">Main City SC</option>
                <option value="Direct to Manufacturer">Direct to Manufacturer</option>
                <option value="Third-party Partner">Third-party Partner</option>
              </select>
            </div>
            <div>
              <label style={s.label}>Docket Details</label>
              <input style={s.input} value={docketDetail} onChange={(e) => setDocketDetail(e.target.value)} placeholder="Tracking / Docket #" onFocus={focusStyle} onBlur={blurStyle} />
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      <div style={{ ...s.card, marginTop: 20 }}>
        <div style={s.sectionTitle}>
          <span className="material-symbols-rounded" style={{ fontSize: 18, color: 'var(--c-accent)' }}>sell</span> Tags
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {jobTags.map(tag => <Chip key={tag._id} label={tag.name} active={selectedTags.includes(tag.name)} onClick={() => toggle(tag.name, selectedTags, setSelectedTags)} />)}
        </div>
        <div className="flex gap-3">
          <input style={{ ...s.input, padding: '12px 14px' }} value={newTagInput} onChange={(e) => setNewTagInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTag(); } }}
            placeholder="Type tag name + Enter to create" onFocus={focusStyle} onBlur={blurStyle} />
          <button type="button" className="btn btn-primary" onClick={handleCreateTag} disabled={!newTagInput.trim()} style={{ padding: '12px 20px', fontSize: 14, whiteSpace: 'nowrap' }}>Add Tag</button>
        </div>
      </div>

      {/* Submit Bar */}
      <div style={{ marginTop: 28, padding: '20px 0', borderTop: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: 'var(--c-text3)' }}>
          {canSubmit()
            ? <span style={{ color: 'var(--c-green)', fontWeight: 600 }}>✓ Ready to create — press Enter or click Create</span>
            : <span>Fill device + problem + mobile to continue</span>}
        </div>
        <div className="flex gap-3">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)} style={{ padding: '12px 24px', fontSize: 14 }}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={!canSubmit() || saving} onClick={handleSubmit}
            style={{ padding: '14px 36px', fontSize: 15, fontWeight: 600 }}>
            {saving ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <><span className="material-symbols-rounded" style={{ fontSize: 20 }}>add_task</span> Create Job</>}
          </button>
        </div>
      </div>
    </div>
  );
}
