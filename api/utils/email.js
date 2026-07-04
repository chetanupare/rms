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

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
        .header { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); color: #fff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 18px; font-weight: 700; }
        .header .date { font-size: 13px; opacity: 0.8; margin-top: 6px; }
        .summary { display: flex; justify-content: space-around; padding: 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .summary .item { text-align: center; }
        .summary .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
        .summary .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
        .summary .in { color: #059669; }
        .summary .out { color: #dc2626; }
        .summary .balance { color: #1a1a2e; }
        .section { padding: 16px 24px; }
        .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .section-title .dot { width: 8px; height: 8px; border-radius: 50%; }
        .section-title .dot-green { background: #059669; }
        .section-title .dot-red { background: #dc2626; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; color: #94a3b8; border-bottom: 2px solid #e2e8f0; font-weight: 700; }
        td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
        .amount-in { color: #059669; font-weight: 700; }
        .amount-out { color: #dc2626; font-weight: 700; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
        .badge-cash { background: #dbeafe; color: #1d4ed8; }
        .badge-upi { background: #fce7f3; color: #be185d; }
        .badge-card { background: #d1fae5; color: #065f46; }
        .badge-credit { background: #fef3c7; color: #92400e; }
        .footer { padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .balance-box { background: linear-gradient(135deg, #0f0c29, #302b63); color: #fff; padding: 16px; border-radius: 8px; margin: 16px 24px; display: flex; justify-content: space-between; align-items: center; }
        .balance-box .label { font-size: 12px; opacity: 0.8; }
        .balance-box .value { font-size: 24px; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sai Laptop & Computer Gallery</h1>
          <div class="date">Daily Register Report — ${new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
        
        <div class="summary">
          <div class="item">
            <div class="label">Opening</div>
            <div class="value">₹${openingBalance.toLocaleString('en-IN')}</div>
          </div>
          <div class="item">
            <div class="label">Total In</div>
            <div class="value in">₹${totalIn.toLocaleString('en-IN')}</div>
          </div>
          <div class="item">
            <div class="label">Total Out</div>
            <div class="value out">₹${totalOut.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div class="balance-box">
          <div>
            <div class="label">Closing Balance</div>
            <div class="value">₹${(openingBalance + totalIn - totalOut).toLocaleString('en-IN')}</div>
          </div>
          <div style="text-align:right">
            <div class="label">${entries.length} entries</div>
            <div style="font-size:11px;opacity:0.7">${inEntries.length} in · ${outEntries.length} out</div>
          </div>
        </div>

        ${inEntries.length > 0 ? `
        <div class="section">
          <div class="section-title"><div class="dot dot-green"></div> Income (${inEntries.length})</div>
          <table>
            <thead><tr><th>Category</th><th>Description</th><th>Mode</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>${inEntries.map(e => `
              <tr>
                <td style="font-weight:600">${e.category}</td>
                <td style="font-size:12px">${e.productName ? `<b>${e.productName}</b>${e.quantity > 1 ? ' ×' + e.quantity : ''}<br>` : ''}${e.customerName ? `<span style="color:#64748b">${e.customerName}</span><br>` : ''}<span style="color:#94a3b8">${e.description || '—'}</span></td>
                <td><span class="badge badge-${(e.paymentMode || 'cash').toLowerCase()}">${e.paymentMode}</span></td>
                <td class="amount-in" style="text-align:right">+₹${e.amount.toLocaleString('en-IN')}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}

        ${outEntries.length > 0 ? `
        <div class="section">
          <div class="section-title"><div class="dot dot-red"></div> Expenses (${outEntries.length})</div>
          <table>
            <thead><tr><th>Category</th><th>Description</th><th>Mode</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>${outEntries.map(e => `
              <tr>
                <td style="font-weight:600">${e.category}${e.isReturn ? ' <span style="color:#d97706;font-size:10px">(Return)</span>' : ''}</td>
                <td style="font-size:12px">${e.productName ? `<b>${e.productName}</b>${e.quantity > 1 ? ' ×' + e.quantity : ''}<br>` : ''}${e.customerName ? `<span style="color:#64748b">${e.customerName}</span><br>` : ''}<span style="color:#94a3b8">${e.description || '—'}</span></td>
                <td><span class="badge badge-${(e.paymentMode || 'cash').toLowerCase()}">${e.paymentMode}</span></td>
                <td class="amount-out" style="text-align:right">-₹${e.amount.toLocaleString('en-IN')}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : ''}

        <div class="footer">
          <div>Sai Laptop & Computer Gallery · Virani Complex, Wani, Yavatmal</div>
          <div style="margin-top:4px">+91-9823687568 · +91-9049687568</div>
          <div style="margin-top:8px;font-size:10px;color:#cbd5e1">Generated by Sai Laptop RMS · ${new Date().toLocaleString('en-IN')}</div>
        </div>
      </div>
    </body>
    </html>`;

    await transporter.sendMail({
      from: '"Sai Laptop RMS" <rms@bestgps.in>',
      to: RECIPIENT,
      cc: CC,
      subject: `Daily Register — ${new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — ₹${(openingBalance + totalIn - totalOut).toLocaleString('en-IN')}`,
      html,
    });

    return true;
  } catch (err) {
    console.error('Email send failed:', err.message);
    return false;
  }
}
