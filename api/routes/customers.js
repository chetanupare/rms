import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { nanoid } from 'nanoid';

const toId = (id) => /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : id;

const router = Router();
router.use(authenticate);

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const regex = new RegExp(q.replace(/[^0-9]/g, ''), 'i');
    const customers = await req.db.collection('customers')
      .find({ mobile: { $regex: regex } })
      .limit(10)
      .toArray();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/by-mobile/:mobile', async (req, res) => {
  try {
    const customer = await req.db.collection('customers').findOne({ mobile: req.params.mobile });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { branch } = req.query;
    const branchFilter = branch ? { branch: { $regex: `^${branch}$`, $options: 'i' } } : {};
    const customers = await req.db.collection('customers')
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    if (branchFilter.branch) {
      const jobPhones = await req.db.collection('job_cards')
        .find(branchFilter)
        .project({ customerPhone: 1 })
        .toArray();
      const phones = new Set(jobPhones.map((j) => j.customerPhone).filter(Boolean));
      const filtered = customers.filter((c) => phones.has(c.mobile));
      return res.json(filtered);
    }
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id/history', async (req, res) => {
  try {
    const customer = await req.db.collection('customers').findOne({ _id: toId(req.params.id) });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const jobCards = await req.db.collection('job_cards')
      .find({ customerPhone: customer.mobile })
      .sort({ createdAt: -1 })
      .toArray();

    const jobIds = jobCards.map((j) => j.jobId);
    const repairs = await req.db.collection('repairs')
      .find({ jobId: { $in: jobIds } })
      .sort({ updatedAt: -1 })
      .toArray();
    const billing = await req.db.collection('billing')
      .find({ jobId: { $in: jobIds } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ customer, jobCards, repairs, billing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { _id: clientId, name, mobile, address, device, brand, model, problem } = req.body;
    if (!name || !mobile) {
      return res.status(400).json({ message: 'Name and mobile are required' });
    }

    const seq = await req.db.collection('sequences').findOneAndUpdate(
      { _id: 'customerId' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    const customerId = seq.seq;

    const doc = {
      ...(clientId ? { _id: clientId } : {}),
      customerId,
      name, mobile, address: address || '',
      createdAt: new Date(),
    };
    const result = await req.db.collection('customers').insertOne(doc);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const jobSeq = await req.db.collection('sequences').findOneAndUpdate(
      { _id: 'jobId' },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    const seqVal = jobSeq?.value?.seq || 1;
    const jobId = `RM-${dateStr}-${String(seqVal).padStart(6, '0')}`;
    const trackingCode = nanoid(8);

    const jobResult = await req.db.collection('job_cards').insertOne({
      jobId,
      trackingCode,
      customerId: result.insertedId.toString(),
      customerName: doc.name || '',
      customerPhone: doc.mobile || '',
      branch: (req.user.branch || 'WANI').toUpperCase(),
      status: 'Pending',
      device: device || 'Laptop',
      brand: brand || '',
      model: model || '',
      problem: problem || '',
      leadSource: 'In Store Visit',
      pendingAssignmentSince: now,
      createdAt: now,
    });

    res.status(201).json({ ...doc, _id: result.insertedId, jobId, device, brand, model, problem, jobCardId: jobResult.insertedId.toString() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, mobile, address } = req.body;
    
    // Fetch existing to check if mobile changed
    const customer = await req.db.collection('customers').findOne({ _id: toId(req.params.id) });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    await req.db.collection('customers').updateOne(
      { _id: toId(req.params.id) },
      { $set: { name, mobile, address } }
    );

    // If mobile number changed, migrate all old job_cards to the new number
    if (customer.mobile !== mobile) {
      await req.db.collection('job_cards').updateMany(
        { customerPhone: customer.mobile },
        { $set: { customerPhone: mobile } }
      );
    }

    res.json({ message: 'Customer updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/merge', adminOnly, async (req, res) => {
  try {
    const { sourceId, targetId } = req.body;
    if (!sourceId || !targetId) return res.status(400).json({ message: 'sourceId and targetId required' });
    if (sourceId === targetId) return res.status(400).json({ message: 'Cannot merge customer into themselves' });

    const source = await req.db.collection('customers').findOne({ _id: new ObjectId(sourceId) });
    const target = await req.db.collection('customers').findOne({ _id: new ObjectId(targetId) });
    if (!source || !target) return res.status(404).json({ message: 'Customer not found' });

    const jobCards = await req.db.collection('job_cards').find({ customerPhone: source.mobile }).toArray();
    const jobIds = jobCards.map((j) => j.jobId);

    // Move job cards, repairs, billing to target
    await req.db.collection('job_cards').updateMany({ customerPhone: source.mobile }, { $set: { customerPhone: target.mobile, customerName: target.name } });
    if (jobIds.length > 0) {
      await req.db.collection('activity_logs').updateMany({ jobId: { $in: jobIds } }, { $set: { mergedFrom: source._id.toString() } });
    }
    await req.db.collection('customers').deleteOne({ _id: new ObjectId(sourceId) });

    res.json({ message: `Merged into ${target.name}`, movedJobs: jobCards.length, targetName: target.name });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const customer = await req.db.collection('customers').findOne({ _id: toId(req.params.id) });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const jobCards = await req.db.collection('job_cards').find({ customerPhone: customer.mobile }).toArray();
    const jobIds = jobCards.map((j) => j.jobId);

    if (jobIds.length > 0) {
      await req.db.collection('billing').deleteMany({ jobId: { $in: jobIds } });
      await req.db.collection('repairs').deleteMany({ jobId: { $in: jobIds } });
      await req.db.collection('job_cards').deleteMany({ customerPhone: customer.mobile });
    }
    await req.db.collection('customers').deleteOne({ _id: toId(req.params.id) });
    res.json({ message: 'Customer and related records deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
