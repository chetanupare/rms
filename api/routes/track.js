import { Router } from 'express';
import { ObjectId } from 'mongodb';
import QRCode from 'qrcode';

const toId = (id) => /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : id;

const router = Router();

const STATUS_ORDER = ['Pending', 'In Progress', 'Completed', 'Delivered'];
const STEPS = ['Registered & Queued', 'In Diagnosis / Repair', 'Repair Completed', 'Delivered & Closed'];

async function getTrackData(db, jobId) {
  const job = await db.collection('job_cards').findOne({ jobId });
  if (!job) return null;
  const customer = job.customerId ? await db.collection('customers').findOne({ _id: toId(job.customerId) }) : null;
  const repair = await db.collection('repairs').findOne({ jobId: job.jobId });
  const bill = await db.collection('billing').findOne({ jobId: job.jobId });
  const activities = await db.collection('activity_logs').find({ jobId: job.jobId }).sort({ createdAt: -1 }).limit(10).toArray();

  const idx = STATUS_ORDER.indexOf(job.status);
  return { job, customer, repair, bill, activities, stepIndex: idx >= 0 ? idx : 0, statusOrder: STATUS_ORDER, steps: STEPS };
}

function renderPage(data, baseUrl) {
  const { job, customer, repair, bill, activities, stepIndex, steps } = data || {};
  const error = !data ? 'No job found with this ID.' : '';
  const qrUrl = data && job ? `${baseUrl}/track/${job.trackingCode || job.jobId}` : '';

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Track Repair — Sai Laptop</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:#f5f7fa;color:#1a1a2e;min-height:100vh;display:flex;flex-direction:column}
.header{background:linear-gradient(135deg,#1310a4,#5e0792,#cd0063,#ff4000);color:#fff;padding:24px 16px;text-align:center}
.header h1{font-size:20px;font-weight:800;letter-spacing:-.5px}
.header p{font-size:12px;opacity:.8;margin-top:4px}
.container{max-width:520px;margin:0 auto;padding:20px 16px;flex:1;width:100%}
.search-card{background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.search-card h2{font-size:15px;margin-bottom:12px}
.search-box{display:flex;gap:8px}
.search-box input{flex:1;padding:10px 14px;border:1.5px solid #e0e0e0;border-radius:8px;font-size:14px;font-family:inherit;outline:none}
.search-box input:focus{border-color:#cd0063}
.search-box button{padding:10px 20px;background:linear-gradient(135deg,#cd0063,#ff4000);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}
.search-box button:hover{opacity:.9}
.error{background:#fff0f0;border:1px solid #ffc0c0;border-radius:8px;padding:12px;margin-top:12px;font-size:13px;color:#c00;text-align:center}
.result{background:#fff;border-radius:12px;padding:20px;margin-top:16px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.result-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px}
.job-id{font-size:13px;font-weight:700;color:#cd0063;font-family:monospace}
.status-badge{font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px}
.sr{background:#fef3c7;color:#92400e}.sd{background:#dbeafe;color:#1e40af}.sc{background:#d1fae5;color:#065f46}.sb{background:#e0e7ff;color:#3730a3}.sl{background:#e0e7ff;color:#3730a3}
.device-info{background:#f8fafc;border-radius:8px;padding:12px;margin-bottom:12px;font-size:13px}
.device-info strong{display:block;margin-bottom:4px}
.device-info span{color:#64748b}
.stepper{display:flex;margin-top:12px;gap:0;position:relative}
.step{flex:1;text-align:center;position:relative}
.step-dot{width:26px;height:26px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;margin:0 auto 4px;font-size:11px;font-weight:700;color:#94a3b8}
.step.active .step-dot{background:#cd0063;color:#fff;box-shadow:0 2px 8px rgba(205,0,99,.3)}
.step.done .step-dot{background:#10b981;color:#fff}
.step-label{font-size:9px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.03em}
.step.active .step-label{color:#cd0063}.step.done .step-label{color:#10b981}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;font-size:12px}
.info-grid .lbl{color:#64748b}.info-grid .val{font-weight:600;color:#1a1a2e}
.activities{margin-top:12px;border-top:1px solid #e2e8f0;padding-top:10px}
.activities .title{font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:6px}
.activity-item{font-size:11px;display:flex;gap:6px;padding:3px 0;border-bottom:1px solid #f1f5f9}
.activity-item .time{color:#94a3b8;white-space:nowrap}
.activity-item .action{color:#1a1a2e}
.qr-section{text-align:center;margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0}
.qr-section img{width:100px;height:100px;border-radius:6px}
.qr-section .hint{font-size:10px;color:#94a3b8;margin-top:4px}
.footer{text-align:center;padding:16px;font-size:11px;color:#94a3b8}
</style></head><body>
<div class="header"><div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:4px"><img src="${baseUrl}/logo.png" alt="" style="width:28px;height:28px;border-radius:4px;object-fit:contain"/><h1 style="font-size:18px;margin:0">Sai Laptop & Computer Gallery</h1></div><p>Wani, Maharashtra — Repair Status Portal</p></div>
<div class="container">
  <div class="search-card">
    <h2>Track Your Repair</h2>
    <form method="GET" action="/track" class="search-box">
      <input type="text" name="jobId" placeholder="Job ID or tracking code" value="${data?.job?.jobId || ''}" />
      <button type="submit">Search</button>
    </form>
    ${error ? `<div class="error">${error}</div>` : ''}
    ${data ? `
    <div class="result">
      <div class="result-top">
        <div class="job-id">${job.jobId}</div>
        <div class="status-badge ${['sr','sd','sc','sb','sl'][stepIndex]}">${job.status}</div>
      </div>
      <div class="device-info">
        <strong>${job.device || 'Device'}${job.model ? ' — ' + job.model : ''}</strong>
        <span>${customer?.name || ''} · ${customer?.mobile || ''}</span>
        ${job.problem ? `<br><span style="font-size:11px;color:#94a3b8;margin-top:4px;display:block">Issue: ${job.problem}</span>` : ''}
      </div>
      <div class="stepper">${steps.map((label, i) => {
        const cls = i < stepIndex ? 'done' : i === stepIndex ? 'active' : '';
        return `<div class="step ${cls}"><div class="step-dot">${i < stepIndex ? '✓' : i + 1}</div><div class="step-label">${label}</div></div>`;
      }).join('')}</div>
      ${repair ? `<div class="info-grid"><div><div class="lbl">Technician</div><div class="val">${repair.technician}</div></div><div><div class="lbl">Diagnosis</div><div class="val">${repair.diagnosis}</div></div></div>` : ''}
      ${activities?.length > 0 ? `<div class="activities"><div class="title">Activity History</div>${activities.map(a => `<div class="activity-item"><span class="time">${new Date(a.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span><span class="action">${a.action}</span></div>`).join('')}</div>` : ''}
      ${qrUrl ? `<div class="qr-section"><img src="/track/qr?url=${encodeURIComponent(qrUrl)}" alt="QR Code" /><div class="hint">Scan to track this repair</div></div>` : ''}
    </div>` : ''}
  </div>
</div>
<div class="footer">Sai Laptop & Computer Gallery — Service Management System</div>
</body></html>`;
}

router.get('/', async (req, res) => {
  try {
    const { jobId } = req.query;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    let data = null;

    if (jobId) {
      const byJobId = await req.db.collection('job_cards').findOne({ jobId: jobId.toUpperCase() });
      const byTracking = await req.db.collection('job_cards').findOne({ trackingCode: jobId });
      const job = byJobId || byTracking;
      if (job) data = await getTrackData(req.db, job.jobId);
    }

    res.setHeader('Content-Type', 'text/html');
    res.send(renderPage(data, baseUrl));
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.get('/qr', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send('Missing url');
    const qr = await QRCode.toBuffer(url, { width: 200, margin: 2, color: { dark: '#1a1a2e', light: '#ffffff' } });
    res.setHeader('Content-Type', 'image/png');
    res.send(qr);
  } catch (err) {
    res.status(500).send('QR error');
  }
});

export default router;
