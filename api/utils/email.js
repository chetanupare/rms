import nodemailer from 'nodemailer';

const SMTP_CONFIG = {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'rms@bestgps.in',
    pass: '$ZiHa*1SM6',
  },
};

const RECIPIENT = 'kunalwasekar@gmail.com';
const CC = 'chetan.upare1234@gmail.com';

export async function sendRegisterEmail(date, entries, totalIn, totalOut, balance, openingBalance) {
  try {
    const transporter = nodemailer.createTransport(SMTP_CONFIG);

    const inEntries = entries.filter(e => e.type === 'in');
    const outEntries = entries.filter(e => e.type === 'out');
    const closingBalance = openingBalance + totalIn - totalOut;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; margin: 0; padding: 16px; background: #f1f5f9; }
        .container { max-width: 700px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
        
        .header { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); color: #fff; padding: 28px 32px; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -.3px; }
        .header .sub { font-size: 11px; opacity: .7; margin-top: 4px; }
        .header .date { font-size: 14px; font-weight: 600; margin-top: 10px; }
        .header .day { font-size: 11px; opacity: .7; margin-top: 2px; }
        
        .stats { display: table; width: 100%; table-layout: fixed; border-collapse: collapse; }
        .stat { display: table-cell; text-align: center; padding: 20px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
        .stat:not(:last-child) { border-right: 1px solid #e2e8f0; }
        .stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; margin-bottom: 6px; }
        .stat-value { font-size: 24px; font-weight: 700; font-family: 'Segoe UI', monospace; }
        .stat-value.in { color: #059669; }
        .stat-value.out { color: #dc2626; }
        
        .balance { background: linear-gradient(135deg, #0f0c29, #302b63); color: #fff; padding: 24px 32px; }
        .balance-inner { display: table; width: 100%; table-layout: fixed; }
        .balance-left, .balance-right { display: table-cell; vertical-align: middle; }
        .balance-right { text-align: right; }
        .balance-label { font-size: 11px; opacity: .7; font-weight: 500; }
        .balance-value { font-size: 32px; font-weight: 700; margin-top: 4px; font-family: 'Segoe UI', monospace; }
        .balance-meta { font-size: 13px; font-weight: 600; }
        .balance-detail { font-size: 11px; opacity: .7; margin-top: 2px; }
        
        .section { padding: 20px 32px; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .section-title .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .section-title .dot-green { background: #059669; }
        .section-title .dot-red { background: #dc2626; }
        
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; font-weight: 700; letter-spacing: .04em; }
        td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
        tr:last-child td { border-bottom: none; }
        tr:hover { background: #f8fafc; }
        
        .amount-in { color: #059669; font-weight: 700; font-size: 14px; white-space: nowrap; }
        .amount-out { color: #dc2626; font-weight: 700; font-size: 14px; white-space: nowrap; }
        
        .badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; }
        .badge-cash { background: #dbeafe; color: #1d4ed8; }
        .badge-upi { background: #fce7f3; color: #be185d; }
        .badge-card { background: #d1fae5; color: #065f46; }
        .badge-bank { background: #e0e7ff; color: #4338ca; }
        .badge-credit { background: #fef3c7; color: #92400e; }
        
        .product { font-weight: 600; color: #1a1a2e; font-size: 13px; }
        .customer { color: #64748b; font-size: 12px; margin-top: 2px; }
        .desc { color: #94a3b8; font-size: 11px; margin-top: 2px; }
        .return { color: #d97706; font-size: 10px; font-weight: 600; }
        
        .footer { padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; background: #f8fafc; }
        .footer .brand { font-weight: 700; color: #64748b; font-size: 12px; }
        .footer .addr { margin-top: 4px; }
        .footer .generated { font-size: 10px; color: #cbd5e1; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sai Laptop & Computer Gallery</h1>
          <div class="sub">Virani Complex, Wani, Yavatmal · +91-9823687568</div>
          <div class="date">${new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          <div class="day">${new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })}</div>
        </div>
        
        <div class="stats">
          <div class="stat">
            <div class="stat-label">Opening</div>
            <div class="stat-value">₹${openingBalance.toLocaleString('en-IN')}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Income</div>
            <div class="stat-value in">+₹${totalIn.toLocaleString('en-IN')}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Expenses</div>
            <div class="stat-value out">-₹${totalOut.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div class="balance">
          <div class="balance-inner">
            <div class="balance-left">
              <div class="balance-label">Closing Balance</div>
              <div class="balance-value">₹${closingBalance.toLocaleString('en-IN')}</div>
            </div>
            <div class="balance-right">
              <div class="balance-meta">${entries.length} entries</div>
              <div class="balance-detail">${inEntries.length} in · ${outEntries.length} out</div>
            </div>
          </div>
        </div>

        ${inEntries.length > 0 ? `
        <div class="section">
          <div class="section-title"><div class="dot dot-green"></div> Income (${inEntries.length})</div>
          <table>
            <thead><tr><th style="width:110px">Category</th><th>Details</th><th style="width:80px">Mode</th><th style="text-align:right;width:100px">Amount</th></tr></thead>
            <tbody>${inEntries.map(e => {
              const details = [];
              if (e.productName) details.push(`<div class="product">${e.productName}${e.quantity > 1 ? ' ×' + e.quantity : ''}</div>`);
              if (e.customerName) details.push(`<div class="customer">${e.customerName}</div>`);
              if (e.description) details.push(`<div class="desc">${e.description}</div>`);
              const detailHtml = details.length > 0 ? details.join('') : '<span style="color:#cbd5e1">—</span>';
              return `<tr>
                <td style="font-weight:600">${e.category}${e.isReturn ? '<br><span class="return">Return</span>' : ''}</td>
                <td>${detailHtml}</td>
                <td><span class="badge badge-${(e.paymentMode || 'cash').toLowerCase()}">${e.paymentMode}</span></td>
                <td class="amount-in" style="text-align:right">+₹${e.amount.toLocaleString('en-IN')}</td>
              </tr>`;
            }).join('')}
            </tbody>
          </table>
        </div>` : ''}

        ${outEntries.length > 0 ? `
        <div class="section">
          <div class="section-title"><div class="dot dot-red"></div> Expenses (${outEntries.length})</div>
          <table>
            <thead><tr><th style="width:110px">Category</th><th>Details</th><th style="width:80px">Mode</th><th style="text-align:right;width:100px">Amount</th></tr></thead>
            <tbody>${outEntries.map(e => {
              const details = [];
              if (e.productName) details.push(`<div class="product">${e.productName}${e.quantity > 1 ? ' ×' + e.quantity : ''}</div>`);
              if (e.customerName) details.push(`<div class="customer">${e.customerName}</div>`);
              if (e.description) details.push(`<div class="desc">${e.description}</div>`);
              const detailHtml = details.length > 0 ? details.join('') : '<span style="color:#cbd5e1">—</span>';
              return `<tr>
                <td style="font-weight:600">${e.category}${e.isReturn ? '<br><span class="return">Return</span>' : ''}</td>
                <td>${detailHtml}</td>
                <td><span class="badge badge-${(e.paymentMode || 'cash').toLowerCase()}">${e.paymentMode}</span></td>
                <td class="amount-out" style="text-align:right">-₹${e.amount.toLocaleString('en-IN')}</td>
              </tr>`;
            }).join('')}
            </tbody>
          </table>
        </div>` : ''}

        <div class="footer">
          <div class="brand">Sai Laptop & Computer Gallery</div>
          <div class="addr">Virani Complex, 1st Floor, Wani, Yavatmal, Maharashtra</div>
          <div class="addr">+91-9823687568 · +91-9049687568 · +91-9067687568</div>
          <div class="generated">Generated by Sai Laptop RMS · ${new Date().toLocaleString('en-IN')}</div>
        </div>
      </div>
    </body>
    </html>`;

    await transporter.sendMail({
      from: '"Sai Laptop RMS" <rms@bestgps.in>',
      to: RECIPIENT,
      cc: CC,
      subject: `Daily Register — ${new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — ₹${closingBalance.toLocaleString('en-IN')}`,
      html,
    });

    return true;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
}
