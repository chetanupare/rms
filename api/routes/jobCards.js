import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate } from '../middleware/auth.js';
import { nanoid } from 'nanoid';

const toId = (id) => /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : id;

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { branch } = req.query;
    const branchFilter = branch ? { branch: { $regex: `^${branch}$`, $options: 'i' } } : {};
    const jobs = await req.db.collection('job_cards')
      .find(branchFilter)
      .sort({ createdAt: -1 })
      .toArray();

    const phoneNumbers = jobs.map((j) => j.customerPhone).filter(Boolean);
    const customerIds = jobs.filter((j) => !j.customerPhone && j.customerId).map((j) => j.customerId);
    const customers = phoneNumbers.length > 0
      ? await req.db.collection('customers').find({ mobile: { $in: phoneNumbers } }).toArray()
      : [];
    const idCustomers = customerIds.length > 0
      ? await req.db.collection('customers').find({ _id: { $in: customerIds.map((id) => toId(id)).filter(Boolean) } }).toArray()
      : [];
    const customerMap = {};
    customers.forEach((c) => { customerMap[c.mobile] = c; });
    const idCustomerMap = {};
    idCustomers.forEach((c) => { idCustomerMap[c._id.toString()] = c; });

    const result = jobs.map((job) => ({
      ...job,
      customer: customerMap[job.customerPhone] || idCustomerMap[job.customerId] || (job.customerName ? { name: job.customerName, mobile: job.customerPhone } : null),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = /^[0-9a-fA-F]{24}$/.test(req.params.id) ? toId(req.params.id) : req.params.id;
    const job = await req.db.collection('job_cards').findOne({ _id: id });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    let customer = null;
    if (job.customerPhone) {
      customer = await req.db.collection('customers').findOne({ mobile: job.customerPhone });
    } else if (job.customerId) {
      customer = await req.db.collection('customers').findOne({ _id: toId(job.customerId) });
    }
    if (!customer && (job.customerName || job.customerPhone)) {
      customer = { name: job.customerName || '', mobile: job.customerPhone || '' };
    }
    const repair = await req.db.collection('repairs').findOne({ jobId: job.jobId });
    const bill = await req.db.collection('billing').findOne({ jobId: job.jobId });
    const activity = await req.db.collection('activity_logs').find({ jobId: job.jobId }).sort({ createdAt: -1 }).limit(20).toArray();

    res.json({ ...job, customer, repair, bill, activity });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { _id: clientId, customerId, customerPhone: bodyPhone, device, brand, model, problem, branch, leadSource, accessories, condition, tags } = req.body;
    if (!device) {
      return res.status(400).json({ message: 'device is required' });
    }
    const now = new Date();

    let customerName = '';
    let customerPhone = bodyPhone || '';
    if (customerPhone) {
      const cust = await req.db.collection('customers').findOne({ mobile: customerPhone }, { projection: { name: 1 } });
      if (cust) customerName = cust.name || '';
    } else if (customerId) {
      const cust = await req.db.collection('customers').findOne({ _id: toId(customerId) }, { projection: { name: 1, mobile: 1 } });
      if (cust) { customerName = cust.name || ''; customerPhone = cust.mobile || ''; }
    }

    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = await req.db.collection('sequences').findOneAndUpdate(
      { _id: 'jobId' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    const seqVal = seq?.value?.seq || 1;
    const jobId = `RM-${dateStr}-${String(seqVal).padStart(6, '0')}`;
    const trackingCode = nanoid(8);

    const doc = {
      ...(clientId ? { _id: clientId } : {}),
      jobId,
      trackingCode,
      customerId: customerId || null,
      customerName, customerPhone,
      branch: (branch || 'WANI').toUpperCase(),
      status: 'Pending',
      device: device || 'Laptop',
      brand: brand || '',
      model: model || '',
      problem: problem || '',
      leadSource: leadSource || 'In Store Visit',
      accessories: Array.isArray(accessories) ? accessories : [],
      condition: Array.isArray(condition) ? condition : [],
      tags: Array.isArray(tags) ? tags : [],
      photos: [],
      pendingAssignmentSince: now,
      createdAt: now,
    };
    const result = await req.db.collection('job_cards').insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/tracking-url', async (req, res) => {
  try {
    const { jobId } = req.body;
    const job = await req.db.collection('job_cards').findOne({ jobId });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.json({ trackingUrl: `${baseUrl}/track/${job.trackingCode}`, trackingCode: job.trackingCode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/photos', async (req, res) => {
  try {
    const { photos } = req.body;
    if (!Array.isArray(photos) || photos.length === 0) return res.status(400).json({ message: 'Photos array required' });
    if (photos.length > 4) return res.status(400).json({ message: 'Max 4 photos' });
    const job = await req.db.collection('job_cards').findOne({ _id: toId(req.params.id) });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const existing = job.photos || [];
    const updated = [...existing, ...photos].slice(-4);
    await req.db.collection('job_cards').updateOne({ _id: toId(req.params.id) }, { $set: { photos: updated } });
    res.json({ photos: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id/photos/:index', async (req, res) => {
  try {
    const job = await req.db.collection('job_cards').findOne({ _id: toId(req.params.id) });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const photos = (job.photos || []).filter((_, i) => i !== parseInt(req.params.index));
    await req.db.collection('job_cards').updateOne({ _id: toId(req.params.id) }, { $set: { photos } });
    res.json({ photos });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/:id/transfer', async (req, res) => {
  try {
    const { toBranch, notes } = req.body;
    if (!toBranch) return res.status(400).json({ message: 'toBranch required' });
    const job = await req.db.collection('job_cards').findOne({ _id: toId(req.params.id) });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const transfer = { fromBranch: job.branch, toBranch: toBranch.toUpperCase(), notes: notes || '', transferredAt: new Date(), by: req.user?.username || 'system' };
    await req.db.collection('job_cards').updateOne(
      { _id: toId(req.params.id) },
      { $set: { branch: toBranch.toUpperCase(), transferred: true }, $push: { transfers: transfer } }
    );
    res.json({ message: `Transferred to ${toBranch.toUpperCase()}`, transfer });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await req.db.collection('job_cards').updateOne(
      { _id: toId(req.params.id) },
      { $set: { status } }
    );
    res.json({ message: 'Job card updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
