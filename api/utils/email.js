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
        .header { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); color: #fff; padding: 28px 32px; display: flex; justify-content: space-between; align-items: center; }
        .header-left h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -.3px; }
        .header-left .sub { font-size: 11px; opacity: .7; margin-top: 4px; }
        .header-right { text-align: right; }
        .header-right .date { font-size: 14px; font-weight: 600; }
        .header-right .day { font-size: 11px; opacity: .7; margin-top: 2px; }
        
        .summary { display: flex; padding: 0; margin: 0; }
        .summary .item { flex: 1; text-align: center; padding: 20px 16px; border-bottom: 1px solid #e2e8f0; }
        .summary .item:not(:last-child) { border-right: 1px solid #e2e8f0; }
        .summary .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: .06em; font-weight: 700; }
        .summary .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
        .summary .in { color: #059669; }
        .summary .out { color: #dc2626; }
        
        .balance-box { background: linear-gradient(135deg, #0f0c29, #302b63); color: #fff; padding: 20px 32px; display: flex; justify-content: space-between; align-items: center; }
        .balance-box .label { font-size: 12px; opacity: .8; }
        .balance-box .value { font-size: 28px; font-weight: 700; }
        .balance-box .meta { text-align: right; }
        .balance-box .meta .count { font-size: 14px; font-weight: 600; }
        .balance-box .meta .detail { font-size: 11px; opacity: .7; margin-top: 2px; }
        
        .section { padding: 20px 32px; }
        .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #94a3b8; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .section-title .dot { width: 8px; height: 8px; border-radius: 50%; }
        .section-title .dot-green { background: #059669; }
        .section-title .dot-red { background: #dc2626; }
        
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { padding: 10px 12px; text-align: left; font-size: 10px; text-transform: uppercase; color: #94a3b8; border-bottom: 2px solid #e2e8f0; font-weight: 700; letter-spacing: .04em; }
        td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
        tr:last-child td { border-bottom: none; }
        
        .amount-in { color: #059669; font-weight: 700; font-size: 14px; }
        .amount-out { color: #dc2626; font-weight: 700; font-size: 14px; }
        
        .badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; }
        .badge-cash { background: #dbeafe; color: #1d4ed8; }
        .badge-upi { background: #fce7f3; color: #be185d; }
        .badge-card { background: #d1fae5; color: #065f46; }
        .badge-bank { background: #e0e7ff; color: #4338ca; }
        .badge-credit { background: #fef3c7; color: #92400e; }
        
        .product { font-weight: 600; color: #1a1a2e; }
        .customer { color: #64748b; font-size: 12px; }
        .desc { color: #94a3b8; font-size: 11px; }
        
        .footer { padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; background: #f8fafc; }
        .footer .brand { font-weight: 600; color: #64748b; }
        .footer .generated { font-size: 10px; color: #cbd5e1; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="header-left">
            <h1>Sai Laptop & Computer Gallery</h1>
            <div class="sub">Virani Complex, Wani, Yavatmal · +91-9823687568</div>
          </div>
          <div class="header-right">
            <div class="date">${new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            <div class="day">${new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })}</div>
          </div>
        </div>
        
        <div class="summary">
          <div class="item">
            <div class="label">Opening</div>
            <div class="value">₹${openingBalance.toLocaleString('en-IN')}</div>
          </div>
          <div class="item">
            <div class="label">Income</div>
            <div class="value in">+₹${totalIn.toLocaleString('en-IN')}</div>
          </div>
          <div class="item">
            <div class="label">Expenses</div>
            <div class="value out">-₹${totalOut.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div class="balance-box">
          <div>
            <div class="label">Closing Balance</div>
            <div class="value">₹${closingBalance.toLocaleString('en-IN')}</div>
          </div>
          <div class="meta">
            <div class="count">${entries.length} entries</div>
            <div class="detail">${inEntries.length} in · ${outEntries.length} out</div>
          </div>
        </div>

        ${inEntries.length > 0 ? `
        <div class="section">
          <div class="section-title"><div class="dot dot-green"></div> Income (${inEntries.length})</div>
          <table>
            <thead><tr><th style="width:100px">Category</th><th>Details</th><th style="width:70px">Mode</th><th style="text-align:right;width:90px">Amount</th></tr></thead>
            <tbody>${inEntries.map(e => {
              const details = [];
              if (e.productName) details.push(`<div class="product">${e.productName}${e.quantity > 1 ? ' ×' + e.quantity : ''}</div>`);
              if (e.customerName) details.push(`<div class="customer">${e.customerName}</div>`);
              if (e.description) details.push(`<div class="desc">${e.description}</div>`);
              const detailHtml = details.length > 0 ? details.join('') : '<span style="color:#cbd5e1">—</span>';
              return `<tr>
                <td style="font-weight:600">${e.category}${e.isReturn ? '<br><span style="color:#d97706;font-size:10px">Return</span>' : ''}</td>
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
            <thead><tr><th style="width:100px">Category</th><th>Details</th><th style="width:70px">Mode</th><th style="text-align:right;width:90px">Amount</th></tr></thead>
            <tbody>${outEntries.map(e => {
              const details = [];
              if (e.productName) details.push(`<div class="product">${e.productName}${e.quantity > 1 ? ' ×' + e.quantity : ''}</div>`);
              if (e.customerName) details.push(`<div class="customer">${e.customerName}</div>`);
              if (e.description) details.push(`<div class="desc">${e.description}</div>`);
              const detailHtml = details.length > 0 ? details.join('') : '<span style="color:#cbd5e1">—</span>';
              return `<tr>
                <td style="font-weight:600">${e.category}${e.isReturn ? '<br><span style="color:#d97706;font-size:10px">Return</span>' : ''}</td>
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
          <div>Virani Complex, 1st Floor, Wani, Yavatmal, Maharashtra</div>
          <div>+91-9823687568 · +91-9049687568 · +91-9067687568</div>
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
