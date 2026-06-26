import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const brands = await req.db.collection('brands').find().sort({ name: 1 }).toArray();
    res.json(brands);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', adminOnly, async (req, res) => {
  try {
    const { name, deviceType } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const result = await req.db.collection('brands').insertOne({ name, deviceType: deviceType || 'Laptop' });
    res.status(201).json({ _id: result.insertedId, name, deviceType });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/import', adminOnly, async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: 'CSV rows required' });
    const brands = rows.map((r) => ({ name: r.name || r.brand || r[0], deviceType: r.deviceType || r.type || r[1] || 'Laptop' }));
    const result = await req.db.collection('brands').insertMany(brands);
    res.status(201).json({ inserted: result.insertedCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await req.db.collection('brands').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Brand deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
