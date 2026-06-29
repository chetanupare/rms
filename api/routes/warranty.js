import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { logger } from '../logger.js';

const router = Router();
router.use(authenticate);

const WARRANTY_DAYS = { Service: 30, Parts: 90, Full: 180 };

// ─── Check warranty by customer mobile + device ───

router.get('/check', async (req, res) => {
  try {
    const { mobile, device } = req.query;
    if (!mobile) return res.status(400).json({ message: 'Mobile required' });

    const customer = await req.db.collection('customers').findOne({ mobile });
    if (!customer) return res.json({ active: false, message: 'Customer not found' });

    const jobCards = await req.db.collection('job_cards').find({ customerPhone: mobile }).toArray();
    const jobIds = jobCards.map((j) => j.jobId);
    const now = new Date();

    const bills = await req.db.collection('billing').find({
      jobId: { $in: jobIds },
      warrantyEnd: { $gte: now },
    }).sort({ createdAt: -1 }).toArray();

    if (bills.length === 0) return res.json({ active: false, message: 'No active warranty found' });

    const warranties = await Promise.all(bills.map(async (b) => {
      const job = jobCards.find((j) => j.jobId === b.jobId);
      const deviceMatch = !device || (job?.device || '').toLowerCase() === device.toLowerCase();
      return { ...b, job, deviceMatch, daysLeft: Math.ceil((new Date(b.warrantyEnd) - now) / 86400000) };
    }));

    const active = warranties.filter((w) => w.deviceMatch);
    res.json({ active: active.length > 0, warranties: active, message: active.length > 0 ? 'Active warranty found' : 'No warranty for this device' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Create RMA Claim ───

router.post('/rma', async (req, res) => {
  try {
    const { jobId, customerId, customerPhone, device, brand, model, problem, warrantyBillId } = req.body;
    if (!jobId) return res.status(400).json({ message: 'jobId required' });

    const bill = warrantyBillId ? await req.db.collection('billing').findOne({ _id: new ObjectId(warrantyBillId) }) : null;
    const warrantyEnd = bill?.warrantyEnd ? new Date(bill.warrantyEnd) : null;
    const now = new Date();

    if (warrantyEnd && warrantyEnd < now) return res.status(400).json({ message: 'Warranty has expired' });

    const job = await req.db.collection('job_cards').findOne({ jobId });
    const doc = {
      rmaId: `RMA-${Date.now().toString(36).toUpperCase()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      originalJobId: jobId,
      customerId: customerId || null, customerPhone: customerPhone || null, warrantyBillId: warrantyBillId || null,
      device: device || job?.device || '', brand: brand || job?.brand || '',
      model: model || job?.model || '', problem: problem || '',
      status: 'Open', createdAt: now, updatedAt: now,
    };
    const result = await req.db.collection('rma_claims').insertOne(doc);
    logger.info(`RMA created: ${doc.rmaId} for job ${jobId}`);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── List RMA Claims ───

router.get('/rma', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const claims = await req.db.collection('rma_claims').find(filter).sort({ createdAt: -1 }).toArray();
    const customerIds = [...new Set(claims.map((c) => c.customerId).filter(Boolean))];
    const customerPhones = [...new Set(claims.map((c) => c.customerPhone).filter(Boolean))];
    const allPhones = [...new Set([...customerPhones])];
    const custMap = {};
    if (customerIds.length) {
      const custs = await req.db.collection('customers').find({ _id: { $in: customerIds.map((id) => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean) } }).toArray();
      custs.forEach((c) => { custMap[c._id.toString()] = c; });
    }
    if (allPhones.length) {
      const custs = await req.db.collection('customers').find({ mobile: { $in: allPhones } }).toArray();
      custs.forEach((c) => { custMap[c.mobile] = c; });
    }
    res.json(claims.map((c) => ({ ...c, customer: custMap[c.customerId] || custMap[c.customerPhone] || null })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/rma/:id', adminOnly, async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const update = { updatedAt: new Date() };
    if (status) update.status = status;
    if (resolution !== undefined) update.resolution = resolution;
    await req.db.collection('rma_claims').updateOne({ _id: new ObjectId(req.params.id) }, { $set: update });
    res.json({ message: 'RMA updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Expiring warranties ───

router.get('/expiring', async (req, res) => {
  try {
    const { days } = req.query;
    const withinDays = parseInt(days) || 7;
    const now = new Date();
    const future = new Date(now.getTime() + withinDays * 86400000);
    const bills = await req.db.collection('billing').find({
      warrantyEnd: { $gte: now, $lte: future },
    }).sort({ warrantyEnd: 1 }).toArray();

    const jobIds = [...new Set(bills.map((b) => b.jobId))];
    const jobs = jobIds.length > 0 ? await req.db.collection('job_cards').find({ jobId: { $in: jobIds } }).toArray() : [];
    const jobMap = {};
    jobs.forEach((j) => { jobMap[j.jobId] = j; });

    res.json(bills.map((b) => ({
      ...b,
      job: jobMap[b.jobId] || null,
      daysLeft: Math.ceil((new Date(b.warrantyEnd) - now) / 86400000),
    })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Supplier returnable parts ───

router.get('/supplier-returnable', async (req, res) => {
  try {
    const now = new Date();
    const parts = await req.db.collection('inventory_parts').find({
      supplierWarrantyEnd: { $gte: now },
    }).sort({ supplierWarrantyEnd: 1 }).toArray();
    res.json(parts.map((p) => ({ ...p, returnDaysLeft: Math.ceil((new Date(p.supplierWarrantyEnd) - now) / 86400000) })));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
