import QRCode from 'qrcode';
import { getTrackingUrl } from '../services/api';

export async function generateQRDataUrl(text) {
  return QRCode.toDataURL(text, { width: 200, margin: 2, color: { dark: '#1a1a2e', light: '#ffffff' } });
}

export async function generateJobCardImage(job, customer, baseUrl) {
  const trackingUrl = getTrackingUrl(job.trackingCode || job.jobId);
  const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  
  let qrSrc = '';
  try { qrSrc = await generateQRDataUrl(trackingUrl); } catch {}

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 400);

  // Header
  const gradient = ctx.createLinearGradient(0, 0, 600, 0);
  gradient.addColorStop(0, '#0f0c29');
  gradient.addColorStop(0.5, '#302b63');
  gradient.addColorStop(1, '#24243e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 70);

  // Header text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('Sai Laptop & Computer Gallery', 20, 30);
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('Virani Complex, 1st Floor, Wani, Yavatmal, Maharashtra', 20, 48);
  ctx.fillText('+91-9823687568 · +91-9049687568 · +91-9067687568', 20, 62);

  // Job ID badge
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.roundRect(480, 20, 100, 30, 5);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(job.jobId, 490, 40);

  // Content area
  ctx.fillStyle = '#1a1a2e';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('Service Job Card', 20, 100);

  // Details
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#64748b';
  const details = [
    ['Date', now],
    ['Status', job.status || 'Pending'],
    ['Branch', job.branch || '—'],
    ['Customer', customer?.name || '—'],
    ['Mobile', customer?.mobile || '—'],
    ['Device', `${job.device || '—'} ${job.brand || ''} ${job.model || ''}`.trim()],
    ['Problem', job.problem || '—'],
    ['Tracking Code', job.trackingCode || '—'],
  ];

  let y = 130;
  details.forEach(([label, value]) => {
    ctx.fillStyle = '#64748b';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(label + ':', 20, y);
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(value, 120, y);
    y += 22;
  });

  // QR Code
  if (qrSrc) {
    const qrImg = new Image();
    qrImg.src = qrSrc;
    await new Promise((resolve) => { qrImg.onload = resolve; });
    ctx.drawImage(qrImg, 470, 90, 100, 100);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan to track repair', 520, 200);
    ctx.textAlign = 'left';
  }

  // Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px system-ui, sans-serif';
  ctx.fillText('Track your repair: ' + trackingUrl, 20, 380);

  return canvas.toDataURL('image/png');
}

export async function printA4Receipt(job, customer, repair, bill, baseUrl) {
  const w = window.open('', '_blank');
  if (!w) return;
  const trackingUrl = getTrackingUrl(job.trackingCode || job.jobId);
  const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  let qrSrc = '';
  try { qrSrc = await generateQRDataUrl(trackingUrl); } catch {}

  const totalDeposits = job.deposits?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
  const advancePaid = totalDeposits > 0 ? totalDeposits : (bill?.totalDeposits || 0);

  w.document.write(`<!DOCTYPE html><html><head>
    <title>Receipt ${job.jobId}</title>
    <style>
      @page{size:A4;margin:10mm}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1a1a2e;font-size:11px;line-height:1.5}
      .head{background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);color:#fff;padding:24px 28px;text-align:center;border-radius:6px 6px 0 0}
      .head img{width:56px;height:56px;border-radius:10px;background:#fff;padding:4px;margin-bottom:10px}
      .head h1{font-size:20px;font-weight:700;letter-spacing:-.3px;margin-bottom:4px}
      .head .sub{font-size:10px;opacity:.7;line-height:1.4}
      .head .id-row{margin-top:12px;display:flex;justify-content:center;gap:16px;align-items:center}
      .head .id{background:rgba(255,255,255,.15);padding:6px 16px;border-radius:6px;font-size:13px;font-weight:700;letter-spacing:.05em;font-family:monospace}
      .head .date{font-size:10px;opacity:.7}
      .body{padding:20px 28px}
      .grid{display:flex;gap:16px;margin-bottom:14px}
      .grid>div{flex:1;background:#f8fafc;border-radius:6px;padding:14px 16px;border:1px solid #eef2f6}
      .grid h3{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:8px}
      .grid td{padding:3px 0;font-size:11px;vertical-align:top}
      .grid td:first-child{color:#64748b;padding-right:10px;white-space:nowrap;font-weight:500}
      .grid td:last-child{font-weight:600;color:#1a1a2e}
      h2{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin:14px 0 8px;border-bottom:1.5px solid #eef2f6;padding-bottom:5px}
      .tbl{width:100%;border-collapse:collapse}
      .tbl th{padding:8px 10px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em;border-bottom:2px solid #eef2f6;text-align:left}
      .tbl td{padding:8px 10px;font-size:11px;border-bottom:1px solid #f1f5f9}
      .tbl tr:last-child td{border-bottom:none}
      .total{font-size:14px;font-weight:700;color:#cd0063}
      .advance-box{background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:6px;padding:12px 16px;margin:10px 0;display:flex;justify-content:space-between;align-items:center}
      .advance-box .label{font-size:11px;color:#059669;font-weight:600}
      .advance-box .amount{font-size:16px;font-weight:700;color:#059669}
      .rem{background:#f8fafc;border-radius:6px;padding:12px 14px;font-size:11px;border:1px solid #eef2f6;margin-top:6px}
      .rem strong{color:#1a1a2e}
      .rem .m{color:#64748b}
      .ft{display:flex;justify-content:space-between;align-items:flex-start;margin-top:14px;padding-top:14px;border-top:1px solid #eef2f6}
      .terms{font-size:9px;color:#94a3b8;line-height:1.6;max-width:65%}
      .terms b{color:#64748b}
      .qr{text-align:center}
      .qr img{width:80px;height:80px;border-radius:4px;display:block;margin:0 auto}
      .qr .l{font-size:8px;color:#94a3b8;margin-top:4px}
      .sign{display:flex;align-items:center;gap:8px;margin-top:14px;padding-top:12px;border-top:1px dashed #ddd}
      .sign .s{font-size:9px;color:#94a3b8}
      .sign .s b{color:#555}
      .gen{text-align:center;font-size:8px;color:#cbd5e1;margin-top:10px}
      .watermark{text-align:center;font-size:8px;color:#e2e8f0;margin-top:6px}
    </style></head><body>
    <div class="head">
      <img src="${origin}/logo.png" alt="Logo" onerror="this.style.display='none'" />
      <h1>Sai Laptop &amp; Computer Gallery</h1>
      <div class="sub">Virani Complex, 1st Floor (near Virani Function Hall/Talkies), Wani, Yavatmal, Maharashtra</div>
      <div class="sub">+91-9823687568 · +91-9049687568 · +91-9067687568</div>
      <div class="id-row">
        <div class="id">${job.jobId}</div>
        <div class="date">${now}</div>
      </div>
    </div>
    <div class="body">
      <div class="grid">
        <div><h3>Receipt Information</h3>
          <table><tr><td>Date</td><td>${now}</td></tr><tr><td>Status</td><td>${job.status}</td></tr><tr><td>Branch</td><td>${job.branch}</td></tr><tr><td>Job ID</td><td>${job.jobId}</td></tr>${bill ? `<tr><td>Invoice</td><td>${bill.invoiceNo}</td></tr>` : ''}<tr><td>Source</td><td>${job.leadSource || '—'}</td></tr>${job.trackingCode ? `<tr><td>Track Code</td><td style="font-family:monospace;font-size:10px">${job.trackingCode}</td></tr>` : ''}</table></div>
        <div><h3>Customer &amp; Device</h3>
          <table><tr><td>Name</td><td>${customer?.name || '—'}</td></tr><tr><td>Mobile</td><td>${customer?.mobile || '—'}</td></tr>${customer?.address ? `<tr><td>Address</td><td style="font-size:9px">${customer.address}</td></tr>` : ''}<tr><td>Device</td><td>${job.device}</td></tr><tr><td>Brand</td><td>${job.brand || '—'}</td></tr><tr><td>Model</td><td>${job.model || '—'}</td></tr></table></div>
      </div>
      <h2>Service Summary</h2>
      <table class="tbl">
        <tr><th style="width:28px">#</th><th>Description</th><th style="width:80px;text-align:right">Amount</th></tr>
        <tr><td>1</td><td>${job.device} Service${job.brand ? ' — '+job.brand : ''}${job.model ? ' '+job.model : ''}<br><span style="color:#94a3b8;font-size:9px">${job.problem || ''}</span></td><td style="text-align:right">${bill ? '₹'+bill.amount.toLocaleString('en-IN') : '—'}</td></tr>
      </table>
      ${advancePaid > 0 ? `
      <div class="advance-box">
        <div>
          <div class="label">Advance Paid</div>
          <div style="font-size:9px;color:#64748b;margin-top:2px">Deposited amount</div>
        </div>
        <div class="amount">₹${advancePaid.toLocaleString('en-IN')}</div>
      </div>` : ''}
      ${bill ? `
      <h2>Payment Details</h2>
      <div style="display:flex;gap:12px;font-size:10px;flex-wrap:wrap">
        <span><span style="color:#64748b">Mode:</span> <strong>${bill.paymentMode}</strong></span>
        <span><span style="color:#64748b">Type:</span> <strong>${bill.billType}${bill.taxType ? ' / '+bill.taxType : ''}</strong></span>
        <span><span style="color:#64748b">Invoice:</span> <strong>${bill.invoiceNo}</strong></span>
        ${bill.remaining > 0 ? `<span><span style="color:#64748b">Balance Due:</span> <strong style="color:#dc2626">₹${bill.remaining.toLocaleString('en-IN')}</strong></span>` : ''}
      </div>` : ''}
      ${repair ? `<h2>Technician Report</h2>
        <div class="rem"><strong>${repair.technician}</strong> <span class="m">· Estimate: ₹${repair.estimateCost.toLocaleString('en-IN')}</span><br><span class="m">${repair.diagnosis}</span></div>` : ''}
      <div class="ft">
        <div class="terms">
          <b>Terms &amp; Conditions</b><br>
          1. 30-day warranty on parts and labor.<br>
          2. Warranty covers manufacturing defects only.<br>
          3. Present this receipt for device collection.<br>
          4. Reference: ${job.jobId}
        </div>
        ${qrSrc ? `<div class="qr"><img src="${qrSrc}" alt="QR"/><div class="l">Scan to track repair</div></div>` : ''}
      </div>
      <div class="sign">
        <div class="s"><b>Digitally Signed</b> · ${now}<br>Verified by Sai Laptop RMS</div>
      </div>
      <div class="gen">Generated by Sai Laptop Service Management System</div>
      <div class="watermark">${trackingUrl}</div>
    </div>
    <script>setTimeout(function(){window.focus();window.print()},600)<\/script>
  </body></html>`);
  w.document.close();
}

export async function printThermalLabel(job, customer, baseUrl, type = 'full') {
  const w = window.open('', '_blank');
  if (!w) return;
  const trackingUrl = getTrackingUrl(job.trackingCode || job.jobId);

  let qrSrc = '';
  try { qrSrc = await generateQRDataUrl(trackingUrl); } catch {}

  const now = new Date();
  const collectedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const collectedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const showQr = type === 'full' || type === 'qr';
  const showBarcode = type === 'full' || type === 'barcode';

  w.document.write(`<!DOCTYPE html><html><head>
    <title>Label ${job.jobId}</title>
    <style>
      @page{size:38mm 25mm;margin:0}
      @media print{@page{margin:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,sans-serif;color:#000;width:38mm;height:25mm;overflow:hidden;padding:0.5mm 1mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .row{display:flex;gap:1mm;height:100%;align-items:center;justify-content:flex-start}
      .left{flex-shrink:0;width:12mm;display:flex;flex-direction:column;align-items:center;justify-content:center}
      .left .qr img{width:12mm;height:12mm;display:block;image-rendering:pixelated}
      .left .ql{font-size:4.5pt;font-weight:bold;text-align:center;margin-top:0.5mm;line-height:1}
      .right{flex:1;display:flex;flex-direction:column;justify-content:center;overflow:hidden;padding-left:1mm}
      .right .cname{font-size:6.5pt;font-weight:900;line-height:1;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:0.5mm;word-break:break-word}
      .right .cdate{font-size:5pt;font-weight:bold;line-height:1;margin-bottom:1mm;white-space:nowrap;overflow:hidden}
      .right .tc{font-size:4.5pt;text-transform:uppercase;line-height:1;margin-bottom:0.2mm}
      .right .tv{font-size:7pt;font-weight:900;font-family:monospace;line-height:1;margin-bottom:0.5mm}
      .right .bc{text-align:center;margin:0.2mm 0}
      .right .bc svg{display:block;width:100%;height:4mm}
      .right .jid{font-size:4.5pt;font-weight:bold;line-height:1;font-family:monospace;text-align:right;margin-top:0.2mm}
    </style></head><body>
    <div class="row">
      ${showQr ? `<div class="left">
        <div class="qr">${qrSrc ? `<img src="${qrSrc}" alt="QR"/>` : '<div style="width:14mm;height:14mm;display:flex;align-items:center;justify-content:center;font-size:6pt;border:1px solid #000">QR</div>'}</div>
        <div class="ql">TRACK</div>
      </div>` : ''}
      <div class="right" style="${!showQr ? 'padding-left:1mm' : ''}">
        <div class="cname">${customer?.name || 'Customer'}</div>
        <div class="cdate">${collectedDate}</div>
        <div class="tc">Track Code:</div>
        <div class="tv">${job.trackingCode || '—'}</div>
        ${showBarcode ? `<div class="bc"><svg id="bcode"></svg></div>` : ''}
        <div class="jid">${job.jobId}</div>
      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js"><\/script>
    <script>
    try{
      JsBarcode("#bcode","${job.jobId}",{format:"CODE128",width:1,height:8,displayValue:false,margin:0});
    }catch(e){
      var bcEl = document.querySelector('.right .bc');
      if(bcEl) bcEl.innerHTML='<div style="font-size:7pt;font-weight:900;font-family:monospace;word-break:break-all;line-height:1">${job.jobId}</div>';
    }
    setTimeout(function(){window.focus();window.print()},500);
    <\/script>
  </body></html>`);
  w.document.close();
}
