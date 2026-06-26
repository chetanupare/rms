import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { logger } from '../logger.js';

const router = Router();
router.use(authenticate);
router.use(adminOnly);

router.get('/', async (req, res) => {
  try {
    const { branch } = req.query;
    let filter = {};
    if (branch) {
      const jobs = await req.db.collection('job_cards').find({ branch: branch.toUpperCase() }, { projection: { jobId: 1 } }).toArray();
      filter = { jobId: { $in: jobs.map((j) => j.jobId) } };
    }
    const bills = await req.db.collection('billing').find(filter).sort({ createdAt: -1 }).toArray();
    res.json(bills);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { jobId, billType, taxType, amount, paymentMode, payments, warrantyDays } = req.body;
    if (!jobId || !amount) return res.status(400).json({ message: 'jobId and amount are required' });

    const existing = await req.db.collection('billing').findOne({ jobId });
    if (existing) return res.status(400).json({ message: 'A bill already exists for this Job ID' });

    const job = await req.db.collection('job_cards').findOne({ jobId });
    if (!job || (job.status !== 'Completed' && job.status !== 'Billed')) return res.status(400).json({ message: 'Job must be completed before billing' });

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = await req.db.collection('sequences').findOneAndUpdate({ _id: 'invoiceNo' }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });
    const invoiceNo = `INV-${dateStr}-${String(seq.seq).padStart(4, '0')}`;

    const wDays = warrantyDays || { Service: 30, Parts: 90, Full: 180 }[billType] || 30;
    const warrantyEnd = new Date(now.getTime() + wDays * 86400000);

    const totalDeposits = (job.deposits || []).reduce((s, d) => s + d.amount, 0);
    const remaining = Number(amount) - totalDeposits;

    const doc = {
      invoiceNo, jobId, billType: billType || 'Service', taxType: taxType || 'Normal Bill',
      amount: Number(amount), totalDeposits, remaining,
      paymentMode: paymentMode || (payments?.length ? payments.map((p) => p.mode).join('+') : 'Cash'),
      payments: payments || [],
      warrantyDays: wDays, warrantyEnd, createdAt: now,
    };
    const result = await req.db.collection('billing').insertOne(doc);

    await req.db.collection('register_entries').insertOne({
      date: dateStr, type: 'in', category: 'Repair Payment', amount: Number(amount) - remaining + totalDeposits,
      description: `Invoice ${invoiceNo} for ${jobId}`, paymentMode: doc.paymentMode,
      createdBy: req.user?.username || 'system', createdAt: now, updatedAt: now, finalized: false,
    });

    logger.info(`Invoice ${invoiceNo} created for ${jobId} — ₹${amount}`);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Deposits / Advances ───

router.post('/deposits', async (req, res) => {
  try {
    const { jobId, amount, paymentMode, notes } = req.body;
    if (!jobId || !amount) return res.status(400).json({ message: 'jobId and amount required' });
    const deposit = { amount: Number(amount), paymentMode: paymentMode || 'Cash', notes: notes || '', date: new Date(), by: req.user?.username || 'system' };
    await req.db.collection('job_cards').updateOne({ jobId: jobId.toUpperCase() }, { $push: { deposits: deposit } });
    const job = await req.db.collection('job_cards').findOne({ jobId: jobId.toUpperCase() });
    const totalDeposits = (job.deposits || []).reduce((s, d) => s + d.amount, 0);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    await req.db.collection('register_entries').insertOne({
      date: dateStr, type: 'in', category: 'Repair Payment', amount: Number(amount),
      description: `Deposit for ${jobId} — ${notes || ''}`, paymentMode: paymentMode || 'Cash',
      createdBy: req.user?.username || 'system', createdAt: now, updatedAt: now, finalized: false,
    });

    logger.info(`Deposit ₹${amount} recorded for ${jobId}`);
    res.json({ deposits: job.deposits, totalDeposits });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/deposits/:jobId', async (req, res) => {
  try {
    const job = await req.db.collection('job_cards').findOne({ jobId: req.params.jobId.toUpperCase() });
    const deposits = job?.deposits || [];
    res.json({ deposits, totalDeposits: deposits.reduce((s, d) => s + d.amount, 0) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
