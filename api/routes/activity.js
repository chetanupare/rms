import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { jobId, limit } = req.query;
    const filter = jobId ? { jobId: jobId.toUpperCase() } : {};
    const logs = await req.db.collection('activity_logs')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) || 50)
      .toArray();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { jobId, action, details, user } = req.body;
    if (!jobId || !action) return res.status(400).json({ message: 'jobId and action are required' });
    const doc = {
      jobId: jobId.toUpperCase(),
      action,
      details: details || '',
      user: user || 'system',
      createdAt: new Date(),
    };
    await req.db.collection('activity_logs').insertOne(doc);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
