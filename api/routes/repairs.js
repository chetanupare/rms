import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { branch } = req.query;
    let filter = {};
    if (branch) {
      const jobs = await req.db.collection('job_cards').find({ branch: branch.toUpperCase() }, { projection: { jobId: 1 } }).toArray();
      filter = { jobId: { $in: jobs.map((j) => j.jobId) } };
    }
    const repairs = await req.db.collection('repairs')
      .find(filter)
      .sort({ updatedAt: -1 })
      .toArray();
    res.json(repairs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { jobId, technician, diagnosis, estimateCost } = req.body;
    if (!jobId || !diagnosis) {
      return res.status(400).json({ message: 'jobId and diagnosis are required' });
    }
    const doc = {
      jobId,
      technician: technician || 'Unknown',
      diagnosis,
      estimateCost: Number(estimateCost) || 0,
      status: 'In Progress',
      updatedAt: new Date(),
    };
    const result = await req.db.collection('repairs').insertOne(doc);

    await req.db.collection('job_cards').updateOne(
      { jobId },
      { $set: { technician: technician || 'Unknown' } }
    );

    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, diagnosis, estimateCost } = req.body;
    const update = {};
    if (status) update.status = status;
    if (diagnosis) update.diagnosis = diagnosis;
    if (estimateCost) update.estimateCost = Number(estimateCost);
    update.updatedAt = new Date();

    await req.db.collection('repairs').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: update }
    );
    res.json({ message: 'Repair updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
