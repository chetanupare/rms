import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { endpoints, api, assetUrl } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatDateTime, formatCurrency, statusBadgeClass, openWhatsApp } from '../utils/helpers';
import { printA4Receipt, printThermalLabel } from '../utils/printService';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

const LEAD_ICONS = {
  'In Store Visit': 'storefront', 'Customer Location Visit': 'local_shipping',
  'Telephone': 'phone_in_talk', 'WhatsApp / Social Media': 'chat', 'Reference / Walk-in': 'groups',
};

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [techModalOpen, setTechModalOpen] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [assigning, setAssigning] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    setLoading(true);
    endpoints.jobCardById(id).then(({ data }) => setData(data)).catch(() => addToast('Failed to load job', 'error')).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (data && document.getElementById('detail-barcode')) {
      try { JsBarcode('#detail-barcode', data.jobId, { format: 'CODE128', width: 2, height: 50, displayValue: true, fontSize: 12, margin: 4 }); } catch {}
    }
    if (data) {
      const trackUrl = `${window.location.origin}/track/${data.trackingCode || data.jobId}`;
      QRCode.toDataURL(trackUrl, { width: 200, margin: 2, color: { dark: '#1a1a2e', light: '#ffffff' } })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    }
  }, [data]);

  async function handleComplete() {
    try {
      await endpoints.updateJobCard(data._id, { status: 'Completed' });
      await api.post('/activity', { jobId: data.jobId, action: 'Repair completed', user: user?.username });
      addToast('Marked as Completed', 'success');
      const res = await endpoints.jobCardById(id); setData(res.data);
    } catch { addToast('Failed', 'error'); }
  }

  async function handleDeliver() {
    if (!confirm('Confirm device delivery?')) return;
    try {
      await endpoints.updateJobCard(data._id, { status: 'Delivered' });
      await api.post('/activity', { jobId: data.jobId, action: 'Device delivered', details: 'Device handed over', user: user?.username });
      addToast('Delivered', 'success');
      const res = await endpoints.jobCardById(id); setData(res.data);
    } catch { addToast('Failed', 'error'); }
  }

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files).slice(0, 4);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const photos = [];
      for (const file of files) {
        const base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
        photos.push(base64);
      }
      const { data: d } = await endpoints.uploadPhotos(id, { photos });
      addToast('Photos uploaded', 'success');
      setData({ ...data, photos: d.photos });
    } catch { addToast('Upload failed', 'error'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  async function handleDeletePhoto(index) {
    try {
      const { data: d } = await endpoints.deletePhoto(id, index);
      setData({ ...data, photos: d.photos });
    } catch { addToast('Failed', 'error'); }
  }

  async function openTechModal() {
    setTechModalOpen(true);
    setLoadingTechs(true);
    try {
      const { data: techs } = await endpoints.receptionTechnicians();
      setTechnicians(techs);
    } catch { addToast('Failed to load technicians', 'error'); }
    finally { setLoadingTechs(false); }
  }

  async function handleAssign(techId, techName) {
    setAssigning(techId);
    try {
      await endpoints.assignJob(data.jobId, techId);
      addToast(`Assigned to ${techName}`, 'success');
      setTechModalOpen(false);
      const res = await endpoints.jobCardById(id); setData(res.data);
    } catch { addToast('Assignment failed', 'error'); }
    finally { setAssigning(null); }
  }

  if (loading) return <LoadingSpinner text="Loading job details..." />;
  if (!data) return <div className="t-lg muted text-center" style={{ padding: 48 }}>Job not found</div>;

  const job = data;
  const c = job.customer || {};
  const r = job.repair;
  const b = job.bill;

  return (
    <div style={{ animation: 'pageIn .25s ease' }}>
      <div className="page-header">
        <div className="page-title">
          <div className="flex items-center gap-2">
            <button className="btn-icon" onClick={() => navigate(-1)} title="Back"><span className="material-symbols-rounded">arrow_back</span></button>
            <span className="t-2xl" style={{ fontSize: 18 }}>{job.jobId}</span>
          </div>
          <div className="muted flex items-center gap-2 mt-1" style={{ flexWrap: 'wrap' }}>
            <span className={`badge ${statusBadgeClass(job.status)}`}>{job.status}</span>
            <span className="dim">·</span><span className="t-xs dim">{job.branch}</span>
            <span className="dim">·</span><span className="t-xs dim">{formatDate(job.createdAt)}</span>
            {job.leadSource && <><span className="dim">·</span><span className="t-xs dim flex items-center gap-1"><span className="material-symbols-rounded" style={{ fontSize: 11 }}>{LEAD_ICONS[job.leadSource] || 'source'}</span>{job.leadSource}</span></>}
            {job.trackingCode && <><span className="dim">·</span><span className="mono t-xs dim">{job.trackingCode}</span></>}
          </div>
        </div>
        <div className="page-actions">
          {job.status === 'Pending' && !job.technicianId && <button className="btn btn-primary" onClick={openTechModal}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>play_arrow</span> Start & Assign</button>}
          {job.status === 'Pending' && job.technicianId && job.technician?.offerStatus === 'offered' && <span className="badge" style={{ background: 'rgba(245,158,11,.12)', color: 'var(--c-amber)', fontSize: 11 }}>Awaiting technician acceptance</span>}
          {job.status === 'In Progress' && <button className="btn btn-primary" onClick={handleComplete}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>check</span> Complete</button>}
          {job.status === 'Billed' && <button className="btn btn-primary" onClick={handleDeliver}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>handshake</span> Deliver</button>}
          {c.mobile && <button className="btn btn-ghost" onClick={() => openWhatsApp(c.mobile, `Hi ${c.name}, job ${job.jobId} (${job.device} ${job.model}) is: ${job.status}.`)}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>chat</span> WhatsApp</button>}
          <button className="btn btn-ghost" onClick={() => printA4Receipt(job, c, r, b, window.location.origin)}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>receipt</span> A4</button>
          <button className="btn btn-ghost" onClick={() => printThermalLabel(job, c, window.location.origin)}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>label</span> Label</button>
        </div>
      </div>

      {job.technician && (
        <div className="card" style={{
          marginBottom: 16, padding: '14px 18px',
          background: job.technician.status === 'on_duty' ? 'rgba(16,185,129,.06)' : 'var(--c-surface)',
          border: `1px solid ${job.technician.status === 'on_duty' ? 'rgba(16,185,129,.25)' : 'var(--c-border)'}`,
        }}>
          <div className="flex items-center gap-4">
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: job.technician.status === 'on_duty' ? 'var(--c-green)' : 'var(--c-surface3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#fff' }}>person</span>
            </div>
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2">
                <span className="t-base fw-700">{job.technician.name}</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                  background: job.technician.status === 'on_duty' ? 'rgba(16,185,129,.15)' : 'rgba(139,146,168,.15)',
                  color: job.technician.status === 'on_duty' ? 'var(--c-green)' : 'var(--c-text3)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: job.technician.status === 'on_duty' ? 'var(--c-green)' : 'var(--c-text3)' }} />
                  {job.technician.status === 'on_duty' ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="t-xs dim" style={{ marginTop: 2 }}>
                {job.technician.phone && <span>{job.technician.phone}</span>}
                {job.technician.offerStatus && <span> · <span className="badge" style={{ fontSize: 9 }}>{job.technician.offerStatus}</span></span>}
                {job.technician.assignedAt && <span> · Assigned {formatDate(job.technician.assignedAt)}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2" style={{ gap: 12 }}>
        <div className="card">
          <div className="t-sm fw-700 mb-2" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '.07em', color: 'var(--c-text3)' }}>Device</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[['devices', 'Type', job.device], ['local_offer', 'Brand', job.brand], ['phone_android', 'Model', job.model]].map(([icon, label, val]) => (
              <div key={label} className="flex items-center gap-3" style={{ padding: '4px 0', borderBottom: '1px solid var(--c-border)' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--c-accent)' }}>{icon}</span>
                <div><div className="t-xs dim">{label}</div><div className="t-sm fw-600">{val || '—'}</div></div>
              </div>
            ))}
            <div style={{ padding: '4px 0' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--c-accent)', marginRight: 12 }}>description</span>
              <div className="t-xs dim">Problem</div><div className="t-sm" style={{ background: 'var(--c-surface2)', padding: '6px 8px', borderRadius: 6, marginTop: 2 }}>{job.problem || '—'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="t-sm fw-700 mb-2" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '.07em', color: 'var(--c-text3)' }}>Customer</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[['person', 'Name', c.name], ['call', 'Mobile', c.mobile], ['home', 'Address', c.address || '—']].map(([icon, label, val]) => (
              <div key={label} className="flex items-center gap-3" style={{ padding: '4px 0', borderBottom: '1px solid var(--c-border)' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: 'var(--c-accent)' }}>{icon}</span>
                <div><div className="t-xs dim">{label}</div><div className="t-sm fw-600">{val || '—'}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(job.accessories?.length > 0 || job.condition?.length > 0) && (
        <div className="card mt-3">
          <div className="t-sm fw-700 mb-2" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '.07em', color: 'var(--c-text3)' }}>Intake Checklist</div>
          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
            {job.accessories?.length > 0 && (
              <div><div className="t-xs dim mb-1">Accessories Received</div><div className="flex gap-1" style={{ flexWrap: 'wrap' }}>{job.accessories.map((a) => <span key={a} className="badge badge-green" style={{ fontSize: 9 }}>{a}</span>)}</div></div>
            )}
            {job.condition?.length > 0 && (
              <div><div className="t-xs dim mb-1">Device Condition</div><div className="flex gap-1" style={{ flexWrap: 'wrap' }}>{job.condition.map((c) => <span key={c} className="badge badge-amber" style={{ fontSize: 9 }}>{c}</span>)}</div></div>
            )}
          </div>
        </div>
      )}

      {r && (
        <div className="card mt-3">
          <div className="t-sm fw-700 mb-2" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '.07em', color: 'var(--c-text3)' }}>Repair</div>
          <div className="grid-2" style={{ gap: 6 }}>
            <div><span className="dim t-xs">Technician</span><div className="t-sm fw-600">{r.technician}</div></div>
            <div><span className="dim t-xs">Estimate</span><div className="t-sm fw-600">{formatCurrency(r.estimateCost)}</div></div>
            <div style={{ gridColumn: '1/-1' }}><span className="dim t-xs">Diagnosis</span><div className="t-sm" style={{ background: 'var(--c-surface2)', padding: '6px 8px', borderRadius: 6, marginTop: 2 }}>{r.diagnosis}</div></div>
          </div>
        </div>
      )}

      {b && (
        <div className="card mt-3">
          <div className="t-sm fw-700 mb-2" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '.07em', color: 'var(--c-text3)' }}>Billing</div>
          <div className="grid-2" style={{ gap: 6 }}>
            <div><span className="dim t-xs">Invoice</span><div className="mono fw-600">{b.invoiceNo}</div></div>
            <div><span className="dim t-xs">Amount</span><div className="t-sm fw-600">{formatCurrency(b.amount)}</div></div>
            <div><span className="dim t-xs">Type</span><div className="t-sm">{b.billType} / {b.taxType || 'Normal'}</div></div>
            <div><span className="dim t-xs">Payment</span><div className="t-sm">{b.paymentMode}</div></div>
            {b.warrantyEnd && <div><span className="dim t-xs">Warranty Until</span><div className="t-sm">{formatDate(b.warrantyEnd)}</div></div>}
          </div>
        </div>
      )}

      <div className="card mt-3">
        <div className="t-sm fw-700 mb-2" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '.07em', color: 'var(--c-text3)' }}>Photos</div>
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          {(job.photos || []).map((photo, i) => (
            <div key={i} style={{ position: 'relative', width: 100, height: 100, borderRadius: 6, overflow: 'hidden', background: 'var(--c-surface2)' }}>
              <img src={photo} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button onClick={() => handleDeletePhoto(i)} style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✕</button>
            </div>
          ))}
          {(job.photos || []).length < 4 && (
            <label style={{ width: 100, height: 100, borderRadius: 6, border: '1.5px dashed var(--c-border2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--c-text3)', fontSize: 10, gap: 2 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22 }}>add_photo_alternate</span>
              <span>Upload</span>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
              {uploading && <div className="spinner" style={{ width: 12, height: 12 }} />}
            </label>
          )}
        </div>
      </div>

      {job.activity?.length > 0 && (
        <div className="card mt-3">
          <div className="t-sm fw-700 mb-2" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '.07em', color: 'var(--c-text3)' }}>Activity Log</div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {job.activity.map((a, i) => (
              <div key={a._id || i} className="flex items-start gap-2" style={{ padding: '4px 0', borderBottom: '1px solid var(--c-border)', fontSize: 11 }}>
                <span className="dim" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{formatDateTime(a.createdAt)}</span>
                <span style={{ color: 'var(--c-text2)' }}>{a.action}</span>
                {a.details && <span className="dim">— {a.details}</span>}
                <span className="dim" style={{ marginLeft: 'auto' }}>{a.user}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mt-3">
        <div className="t-sm fw-700 mb-2" style={{ textTransform: 'uppercase', fontSize: 10, letterSpacing: '.07em', color: 'var(--c-text3)' }}>QR & Barcode</div>
        <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR" style={{ width: 100, height: 100, borderRadius: 6, background: '#fff' }} />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: 6, background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-rounded dim" style={{ fontSize: 32 }}>qr_code_2</span>
              </div>
            )}
            <div className="t-xs dim mt-1">Scan to track</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div className="t-xs dim mb-1">Tracking Code</div>
            <div className="mono t-lg fw-700" style={{ color: 'var(--c-accent)' }}>{job.trackingCode || '—'}</div>
            <div className="t-xs dim mt-2">Barcode (CODE 128)</div>
            <svg id="detail-barcode" style={{ width: '100%', maxWidth: 300 }}></svg>
            <div className="t-xs dim mt-1">{job.jobId}</div>
          </div>
        </div>
      </div>

      <Modal open={techModalOpen} onClose={() => setTechModalOpen(false)} title="Assign Technician" wide>
        {loadingTechs ? (
          <div style={{ textAlign: 'center', padding: 24 }}><LoadingSpinner text="Loading technicians..." /></div>
        ) : technicians.length === 0 ? (
          <div className="dim" style={{ textAlign: 'center', padding: 24 }}>No technicians found</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {technicians
              .sort((a, b) => {
                if (a.status === 'on_duty' && b.status !== 'on_duty') return -1;
                if (a.status !== 'on_duty' && b.status === 'on_duty') return 1;
                return a.activeJobs - b.activeJobs;
              })
              .map(tech => {
                const isOnline = tech.status === 'on_duty';
                const busy = tech.activeJobs >= 5;
                return (
                  <div key={tech._id} className="card" style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    border: busy ? '1px solid var(--c-amber)' : '1px solid var(--c-border)',
                    opacity: isOnline ? 1 : 0.6,
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: isOnline ? 'var(--c-green)' : 'var(--c-text3)',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="t-sm fw-600">{tech.name}</div>
                      <div className="t-xs dim">{tech.phone || 'No phone'}</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: 70 }}>
                      <div className="t-xs dim">Active Jobs</div>
                      <div className="t-lg fw-700" style={{ color: busy ? 'var(--c-amber)' : 'var(--c-text)' }}>
                        {tech.activeJobs}
                      </div>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={assigning === tech._id || !isOnline}
                      onClick={() => handleAssign(tech._id, tech.name)}
                      style={{ minWidth: 72 }}
                    >
                      {assigning === tech._id ? (
                        <span className="spinner" style={{ width: 14, height: 14 }} />
                      ) : (
                        'Assign'
                      )}
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </Modal>
    </div>
  );
}
