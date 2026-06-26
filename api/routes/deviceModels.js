import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const models = await req.db.collection('device_models').find().sort({ modelName: 1 }).toArray();
    res.json(models);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', adminOnly, async (req, res) => {
  try {
    const { brand, deviceType, modelName } = req.body;
    if (!brand || !modelName) return res.status(400).json({ message: 'Brand and modelName are required' });
    const result = await req.db.collection('device_models').insertOne({ brand, deviceType: deviceType || 'Laptop', modelName });
    res.status(201).json({ _id: result.insertedId, brand, deviceType, modelName });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/import', adminOnly, async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: 'CSV rows required' });
    const models = rows.map((r) => ({ brand: r.brand || r[0] || '', deviceType: r.deviceType || r.type || r[1] || 'Laptop', modelName: r.modelName || r.model || r[2] || '' }));
    const valid = models.filter((m) => m.brand && m.modelName);
    const result = await req.db.collection('device_models').insertMany(valid);
    res.status(201).json({ inserted: result.insertedCount, skipped: models.length - valid.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await req.db.collection('device_models').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Model deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
