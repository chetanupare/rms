import QRCode from 'qrcode';

export async function generateQRDataUrl(text) {
  return QRCode.toDataURL(text, { width: 200, margin: 2, color: { dark: '#1a1a2e', light: '#ffffff' } });
}

export async function printA4Receipt(job, customer, repair, bill, baseUrl) {
  const w = window.open('', '_blank');
  if (!w) return;
  const origin = baseUrl || window.location.origin;
  const trackingUrl = `${origin}/track/${job.trackingCode || job.jobId}`;
  const now = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  w.document.write('<html><head><title>Loading...</title></head><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#666">Generating receipt...</body></html>');

  let qrSrc = '';
  try { qrSrc = await generateQRDataUrl(trackingUrl); } catch {}

  w.document.write(`<!DOCTYPE html><html><head>
    <title>Receipt ${job.jobId}</title>
    <style>
      @page{size:A4;margin:10mm}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#1a1a2e;font-size:11px;line-height:1.5}
      .head{background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);color:#fff;padding:16px 22px;display:flex;justify-content:space-between;align-items:center;border-radius:4px 4px 0 0}
      .head h1{font-size:15px;font-weight:700;letter-spacing:-.3px}
      .head .sub{font-size:9px;opacity:.65;margin-top:2px}
      .head .id{background:rgba(255,255,255,.12);padding:3px 10px;border-radius:4px;font-size:9px;font-weight:600;letter-spacing:.03em;font-family:monospace}
      .body{padding:14px 22px}
      .grid{display:flex;gap:14px;margin-bottom:10px}
      .grid>div{flex:1;background:#f8fafc;border-radius:6px;padding:10px 12px;border:1px solid #eef2f6}
      .grid h3{font-size:7.5px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:5px}
      .grid td{padding:1.5px 0;font-size:10.5px;vertical-align:top}
      .grid td:first-child{color:#64748b;padding-right:6px;white-space:nowrap}
      .grid td:last-child{font-weight:600;color:#1a1a2e}
      h2{font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin:10px 0 5px;border-bottom:1.5px solid #eef2f6;padding-bottom:4px}
      .tbl{width:100%;border-collapse:collapse}
      .tbl th{padding:5px 8px;font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em;border-bottom:1.5px solid #eef2f6;text-align:left}
      .tbl td{padding:6px 8px;font-size:10.5px;border-bottom:1px solid #f1f5f9}
      .tbl tr:last-child td{border-bottom:none}
      .total{font-size:12px;font-weight:700;color:#cd0063}
      .rem{background:#f8fafc;border-radius:6px;padding:10px 12px;font-size:10.5px;border:1px solid #eef2f6;margin-top:4px}
      .rem strong{color:#1a1a2e}
      .rem .m{color:#64748b}
      .ft{display:flex;justify-content:space-between;align-items:flex-start;margin-top:10px;padding-top:10px;border-top:1px solid #eef2f6}
      .terms{font-size:8.5px;color:#94a3b8;line-height:1.6;max-width:65%}
      .terms b{color:#64748b}
      .qr{text-align:center}
      .qr img{width:64px;height:64px;border-radius:3px;display:block;margin:0 auto}
      .qr .l{font-size:6.5px;color:#94a3b8;margin-top:2px}
      .sign{display:flex;align-items:center;gap:8px;margin-top:10px;padding-top:8px;border-top:1px dashed #ddd}
      .sign svg{flex-shrink:0}
      .sign .s{font-size:8px;color:#94a3b8}
      .sign .s b{color:#555}
      .gen{text-align:center;font-size:7px;color:#cbd5e1;margin-top:6px}
    </style></head><body>
    <div class="head">
      <div style="display:flex;align-items:center;gap:10px">
        <div><h1>Sai Laptop &amp; Computer Gallery</h1><div class="sub">Virani Complex, 1st Floor (near Virani Function Hall/Talkies), Wani, Yavatmal, Maharashtra</div><div class="sub">+91-9823687568 · +91-9049687568 · +91-9067687568</div></div>
      </div>
      <div class="id">${job.jobId}</div>
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
      ${bill ? `
      <h2>Payment Details</h2>
      <div style="display:flex;gap:12px;font-size:10px">
        <span><span style="color:#64748b">Mode:</span> <strong>${bill.paymentMode}</strong></span>
        <span><span style="color:#64748b">Type:</span> <strong>${bill.billType}${bill.taxType ? ' / '+bill.taxType : ''}</strong></span>
        <span><span style="color:#64748b">Invoice:</span> <strong>${bill.invoiceNo}</strong></span>
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
    </div>
    <script>setTimeout(function(){window.focus();window.print()},600)<\/script>
  </body></html>`);
  w.document.close();
}

export async function printThermalLabel(job, customer, baseUrl) {
  const w = window.open('', '_blank');
  if (!w) return;
  const trackingUrl = `${baseUrl || window.location.origin}/track/${job.trackingCode || job.jobId}`;

  w.document.write('<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;color:#666;font-size:12px">Generating label...</body></html>');

  let qrSrc = '';
  try { qrSrc = await generateQRDataUrl(trackingUrl); } catch {}

  const now = new Date();
  const collectedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const collectedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  w.document.write(`<!DOCTYPE html><html><head>
    <title>Label ${job.jobId}</title>
    <style>
      @page{size:58mm 36mm;margin:0}
      @media print{@page{margin:0}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,sans-serif;color:#000;width:57mm;height:35mm;overflow:hidden;padding:1mm 1.2mm;font-size:5.5px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .row{display:flex;gap:1mm;height:100%}
      .left{flex-shrink:0;width:19mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.5mm}
      .left .qr img{width:19mm;height:19mm;display:block}
      .left .ql{font-size:4px;color:#888;text-align:center;line-height:1}
      .right{flex:1;display:flex;flex-direction:column;overflow:hidden;padding-left:0.5mm;padding-top:2mm;padding-bottom:0.5mm}
      .right .cname{font-size:7px;font-weight:700;color:#1a1a2e;line-height:1.2}
      .right .cdate{font-size:5px;color:#666;line-height:1.2;margin-bottom:1mm}
      .right .tc{font-size:5px;color:#888;text-transform:uppercase;letter-spacing:.05em;line-height:1.2}
      .right .tv{font-size:8px;font-weight:700;color:#cd0063;font-family:monospace;line-height:1.1;margin-bottom:1mm;letter-spacing:.3px}
      .right .bc{text-align:center;margin:0.3mm 0}
      .right .bc svg{display:block;width:100%;height:7mm}
      .right .jid{font-size:5px;color:#666;line-height:1.1;font-family:monospace}
    </style></head><body>
    <div class="row">
      <div class="left">
        <div class="qr">${qrSrc ? `<img src="${qrSrc}" alt="QR"/>` : '<div style="width:19mm;height:19mm;display:flex;align-items:center;justify-content:center;font-size:5px;color:#999;background:#f5f5f5;border-radius:1mm">QR</div>'}</div>
        <div class="ql">Scan to track</div>
      </div>
      <div class="right">
        <div class="cname">${customer?.name || 'Customer'}</div>
        <div class="cdate">Collected on ${collectedDate} ${collectedTime}</div>
        <div class="tc">Tracking Code</div>
        <div class="tv">${job.trackingCode || '—'}</div>
        <div class="bc"><svg id="bcode"></svg></div>
        <div class="jid">${job.jobId}</div>
      </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3/dist/JsBarcode.all.min.js"><\/script>
    <script>
    try{
      JsBarcode("#bcode","${job.jobId}",{format:"CODE128",width:0.6,height:7,displayValue:false,margin:0});
    }catch(e){
      document.querySelector('.right .bc').innerHTML='<div style="font-size:6px;font-weight:700;font-family:monospace;word-break:break-all;line-height:1;color:#333">${job.jobId}</div>';
    }
    setTimeout(function(){window.focus();window.print()},500);
    <\/script>
  </body></html>`);
  w.document.close();
}
