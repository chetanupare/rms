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
    const { status, subStatus, diagnosis, estimateCost } = req.body;
    const update = {};
    if (status) update.status = status;
    if (subStatus !== undefined) update.subStatus = subStatus;
    if (diagnosis) update.diagnosis = diagnosis;
    if (estimateCost) update.estimateCost = Number(estimateCost);
    update.updatedAt = new Date();

    const repair = await req.db.collection('repairs').findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: update },
      { returnDocument: 'after' }
    );
    
    if (!repair || !repair.value) {
      return res.status(404).json({ message: 'Repair not found' });
    }

    // Sync status back to master job card
    if (status || subStatus !== undefined) {
      const syncObj = {};
      if (status) syncObj.status = status;
      if (subStatus !== undefined) syncObj.subStatus = subStatus;
      await req.db.collection('job_cards').updateOne(
        { jobId: repair.value.jobId },
        { $set: syncObj }
      );
    }

    res.json({ message: 'Repair updated', repair: repair.value });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
