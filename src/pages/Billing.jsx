import { useState, useEffect, useCallback } from 'react';
import { endpoints } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useBranch } from '../context/BranchContext';
import { formatDate, formatCurrency, statusBadgeClass } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

const BILL_TYPES = ['Service', 'Parts', 'Full'];
const TAX_TYPES = ['GST Invoice', 'Normal Bill'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Other'];

export default function Billing() {
  const { addToast } = useToast();
  const { branch } = useBranch();
  const [completedJobs, setCompletedJobs] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState(null);
  const [form, setForm] = useState({ billType: 'Service', taxType: 'GST Invoice', amount: '', paymentMode: 'Cash' });
  const [splitPayments, setSplitPayments] = useState([{ mode: 'Cash', amount: '' }]);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([endpoints.jobCards(), endpoints.billing()])
      .then(([jobsRes, billsRes]) => {
        const allJobs = jobsRes.data;
        const allBills = billsRes.data;
        setCompletedJobs(allJobs.filter((j) => j.status === 'Completed' || j.status === 'Billed'));
        setBills(allBills);
      }).catch(() => addToast('Failed to load data', 'error')).finally(() => setLoading(false));
  }, [branch]);

  useEffect(() => { load(); }, [load]);

  function openBill(job) {
    const existingBill = bills.find((b) => b.jobId === job.jobId);
    if (existingBill) return addToast('A bill already exists for this Job ID', 'warning');
    setSelectedJob(job);
    setForm({ billType: 'Service', taxType: 'GST Invoice', amount: '', paymentMode: 'Cash' });
    setSplitPayments([{ mode: 'Cash', amount: '' }]);
    setInvoicePreview(null);
    setModalOpen(true);
  }

  async function handleGenerateInvoice(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return addToast('Enter a valid amount', 'warning');
    const amount = Number(form.amount);
    const isGst = form.taxType === 'GST Invoice';
    const gstRate = isGst ? 0.18 : 0;
    const tax = amount * gstRate;
    const total = amount + tax;
    const totalDeposits = selectedJob?.deposits?.reduce((s, d) => s + d.amount, 0) || 0;
    setInvoicePreview({ amount, tax, total, isGst, cgst: isGst ? tax / 2 : 0, sgst: isGst ? tax / 2 : 0, totalDeposits, remaining: total - totalDeposits });
  }

  async function handleSaveBill() {
    if (!invoicePreview) return;
    const payments = splitPayments.filter((p) => p.amount && Number(p.amount) > 0);
    try {
      await endpoints.createBill({
        jobId: selectedJob.jobId,
        billType: form.billType,
        taxType: form.taxType,
        amount: invoicePreview.total,
        paymentMode: payments.length === 1 ? payments[0].mode : payments.map((p) => p.mode).join('+'),
        payments,
        warrantyDays: form.warrantyDays,
      });
      await endpoints.updateJobCard(selectedJob._id, { status: 'Billed' });
      addToast('Invoice created successfully', 'success');
      setModalOpen(false);
      load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create bill', 'error');
    }
  }

  async function handleDeposit(job) {
    const amt = prompt('Enter deposit amount (₹):');
    if (!amt || isNaN(amt) || Number(amt) <= 0) return;
    const mode = prompt('Payment mode (Cash/UPI/Card/Other):') || 'Cash';
    const notes = prompt('Notes (optional):') || '';
    try {
      await api.post('/billing/deposits', { jobId: job.jobId, amount: Number(amt), paymentMode: mode, notes });
      addToast(`Deposit of ₹${amt} recorded`, 'success');
      load();
    } catch (err) { addToast('Failed to record deposit', 'error'); }
  }

  function printInvoice(bill) {
    const w = window.open('', '_blank');
    if (!w) return addToast('Please allow popups to print invoices', 'warning');
    const isGst = (bill.taxType || bill.billType) === 'GST Invoice';
    const gstAmt = isGst ? Math.round(bill.amount * 0.18 / 1.18) : 0;
    const subTotal = isGst ? bill.amount - gstAmt : bill.amount;
    w.document.write(`
      <html><head><title>Invoice ${bill.invoiceNo}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:40px;color:#333;max-width:700px;margin:auto}
        .header{text-align:center;border-bottom:2px solid #333;padding-bottom:15px;margin-bottom:20px}
        .header h1{margin:0;font-size:22px}
        .header p{margin:3px 0;font-size:13px;color:#666}
        .info{display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px}
        .table{width:100%;border-collapse:collapse;margin:15px 0}
        .table th,.table td{padding:8px 10px;text-align:left;border:1px solid #ddd;font-size:13px}
        .table th{background:#f5f5f5;font-weight:700}
        .total{text-align:right;font-size:16px;font-weight:700;margin-top:10px}
        .terms{margin-top:30px;font-size:11px;color:#888;border-top:1px solid #ddd;padding-top:10px}
        @media print{body{padding:20px}}
      </style></head><body>
      <div class="header">
        <h1>Sai Laptop & Computer Gallery</h1>
        <p>Wani, Maharashtra - 445304</p>
        <p style="font-size:18px;margin-top:8px;font-weight:700">TAX INVOICE</p>
      </div>
      <div class="info">
        <div><strong>Invoice No:</strong> ${bill.invoiceNo}<br><strong>Date:</strong> ${formatDate(bill.createdAt)}</div>
        <div><strong>Job ID:</strong> ${bill.jobId}<br><strong>Payment:</strong> ${bill.paymentMode}<br><strong>Type:</strong> ${bill.billType} / ${bill.taxType || 'Normal'}</div>
      </div>
      <table class="table">
        <tr><th>#</th><th>Description</th><th>Amount</th></tr>
        <tr><td>1</td><td>${bill.billType} Service - ${bill.jobId}</td><td>₹${subTotal.toLocaleString('en-IN')}</td></tr>
        ${isGst ? `<tr><td></td><td>CGST @ 9%</td><td>₹${(gstAmt / 2).toLocaleString('en-IN')}</td></tr>
        <tr><td></td><td>SGST @ 9%</td><td>₹${(gstAmt / 2).toLocaleString('en-IN')}</td></tr>` : ''}
      </table>
      <div class="total">Total: ₹${bill.amount.toLocaleString('en-IN')}</div>
      <div class="terms"><strong>Terms & Conditions:</strong><br>1. All repairs carry a 30-day warranty on parts and labor.<br>2. This is a system-generated invoice.<br>3. Thank you for your business!</div>
      <script>window.print();window.close();<\/script>
      </body></html>
    `);
    w.document.close();
  }

  if (loading) return <LoadingSpinner text="Loading billing..." />;

  const unbilledJobs = completedJobs.filter((j) => j.status === 'Completed' && !bills.find((b) => b.jobId === j.jobId));

  return (
    <div style={{ animation: 'pageIn .25s ease' }}>
      <div className="page-header">
        <div className="page-title">
          <div className="t-2xl">Billing</div>
          <div className="muted">{bills.length} invoices generated</div>
        </div>
      </div>

      <div className="sec-head mt-4">
        <span className="t-sm">Ready for Billing</span>
        <span className="badge badge-amber">{unbilledJobs.length} pending</span>
      </div>

      {unbilledJobs.length === 0 ? (
        <div className="card">
          <EmptyState icon="receipt_long" title="No pending bills" description="Complete all repairs to generate invoices" />
        </div>
      ) : (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Job ID</th><th>Customer</th><th>Device</th><th>Deposits</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {unbilledJobs.map((job) => {
                const customer = job.customer || {};
                const totalDep = (job.deposits || []).reduce((s, d) => s + d.amount, 0);
                return (
                  <tr key={job._id}>
                    <td className="mono" style={{ fontSize: 11 }}>{job.jobId}</td>
                    <td><span className="fw-600">{customer.name}</span><div className="t-xs muted">{customer.mobile}</div></td>
                    <td>{job.device || customer.device || '—'} — {job.model || customer.model || '—'}</td>
                    <td>{totalDep > 0 ? <span className="badge badge-cyan">₹{totalDep.toLocaleString('en-IN')}</span> : <span className="t-xs dim">—</span>}</td>
                    <td><span className={`badge ${statusBadgeClass(job.status)}`}>{job.status}</span></td>
                    <td><div className="flex gap-1"><button className="btn btn-primary" onClick={() => openBill(job)}>Invoice</button><button className="btn btn-ghost" onClick={() => handleDeposit(job)} style={{ fontSize: 10 }}>Deposit</button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="sec-head mt-4">
        <span className="t-sm">Invoice History</span>
        <span className="badge badge-ghost">{bills.length} total</span>
      </div>

      {bills.length > 0 && (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Invoice No</th><th>Job ID</th><th>Type</th><th>Tax</th><th>Amount</th><th>Payment</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b._id}>
                  <td className="mono fw-600">{b.invoiceNo}</td>
                  <td className="mono dim" style={{ fontSize: 11 }}>{b.jobId}</td>
                  <td>{b.billType}</td>
                  <td><span className="badge badge-ghost">{b.taxType || 'Normal'}</span></td>
                  <td className="fw-600">{formatCurrency(b.amount)}</td>
                  <td><span className={`badge ${b.paymentMode === 'Cash' ? 'badge-green' : b.paymentMode === 'UPI' ? 'badge-blue' : 'badge-purple'}`}>{b.paymentMode}</span></td>
                  <td className="muted">{formatDate(b.createdAt)}</td>
                  <td><button className="btn btn-ghost" onClick={() => printInvoice(b)}><span className="material-symbols-rounded" style={{ fontSize: 14 }}>print</span> Print</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`New Invoice — ${selectedJob?.jobId}`} wide>
        {!invoicePreview ? (
          <form onSubmit={handleGenerateInvoice}>
            <div className="form-group">
              <label className="form-label">Customer</label>
              <div className="t-base">{selectedJob?.customer?.name}</div>
              <div className="t-sm muted">{selectedJob?.customer?.device} {selectedJob?.customer?.model}</div>
            </div>
            {selectedJob?.deposits?.length > 0 && (
              <div className="card mb-2" style={{ background: 'rgba(6,182,212,.08)', padding: '8px 10px' }}>
                <div className="t-xs fw-600" style={{ color: 'var(--c-cyan)' }}>Deposits Received</div>
                {selectedJob.deposits.map((d, i) => (
                  <div key={i} className="t-xs">₹{d.amount.toLocaleString('en-IN')} via {d.paymentMode}{d.notes ? ` — ${d.notes}` : ''}</div>
                ))}
                <div className="t-xs fw-600" style={{ color: 'var(--c-cyan)', marginTop: 2 }}>Total Deposits: ₹{selectedJob.deposits.reduce((s, d) => s + d.amount, 0).toLocaleString('en-IN')}</div>
              </div>
            )}
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Bill Type</label>
                <select className="form-input" value={form.billType} onChange={(e) => setForm({ ...form, billType: e.target.value })}>
                  {BILL_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tax Type</label>
                <select className="form-input" value={form.taxType} onChange={(e) => setForm({ ...form, taxType: e.target.value })}>
                  {TAX_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Total Amount (₹)</label>
              <input className="form-input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Enter total amount" min="0" step="0.01" required />
            </div>
            <div className="form-group">
              <label className="form-label">Split Payments</label>
              {splitPayments.map((sp, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <select className="form-input" value={sp.mode} onChange={(e) => { const p = [...splitPayments]; p[i].mode = e.target.value; setSplitPayments(p); }} style={{ width: 80, fontSize: 11, padding: '5px 6px' }}>
                    {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <input className="form-input" type="number" value={sp.amount} onChange={(e) => { const p = [...splitPayments]; p[i].amount = e.target.value; setSplitPayments(p); }} placeholder="Amount" style={{ flex: 1, fontSize: 11, padding: '5px 6px' }} min="0" />
                  {splitPayments.length > 1 && <button type="button" className="btn-icon" onClick={() => setSplitPayments(splitPayments.filter((_, j) => j !== i))}><span className="material-symbols-rounded" style={{ fontSize: 14, color: 'var(--c-red)' }}>remove_circle</span></button>}
                </div>
              ))}
              <button type="button" className="btn btn-ghost" onClick={() => setSplitPayments([...splitPayments, { mode: 'Cash', amount: '' }])} style={{ fontSize: 10, padding: '3px 8px' }}><span className="material-symbols-rounded" style={{ fontSize: 12 }}>add</span> Add Payment Method</button>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Preview Invoice</button>
            </div>
          </form>
        ) : (
          <div>
            <div className="card" style={{ background: 'var(--c-surface2)', marginBottom: 12 }}>
              <div className="t-sm fw-700 mb-2">Invoice Preview</div>
              <div className="grid-2">
                <div><span className="dim">Subtotal:</span> <span className="fw-600">{formatCurrency(invoicePreview.amount)}</span></div>
                {invoicePreview.isGst && (
                  <><div><span className="dim">CGST (9%):</span> <span className="fw-600">{formatCurrency(invoicePreview.cgst)}</span></div><div><span className="dim">SGST (9%):</span> <span className="fw-600">{formatCurrency(invoicePreview.sgst)}</span></div></>
                )}
                <div><span className="dim">Total:</span> <span className="t-lg accent">{formatCurrency(invoicePreview.total)}</span></div>
                {invoicePreview.totalDeposits > 0 && (
                  <><div><span className="dim">Deposits Paid:</span> <span className="fw-600" style={{ color: 'var(--c-cyan)' }}>{formatCurrency(invoicePreview.totalDeposits)}</span></div><div><span className="dim">Remaining:</span> <span className="fw-600" style={{ color: invoicePreview.remaining > 0 ? 'var(--c-accent)' : 'var(--c-green)' }}>{formatCurrency(invoicePreview.remaining)}</span></div></>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setInvoicePreview(null)}>Back</button>
              <button className="btn btn-primary" onClick={handleSaveBill}>Save & Print Invoice</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
