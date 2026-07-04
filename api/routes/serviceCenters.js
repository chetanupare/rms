import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate, adminOnly } from '../middleware/auth.js';

const toId = (id) => /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : id;

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { brand, deviceType } = req.query;
    const filter = {};
    if (brand) filter.brand = { $regex: `^${brand}$`, $options: 'i' };
    if (deviceType) filter.deviceType = { $regex: `^${deviceType}$`, $options: 'i' };
    const centers = await req.db.collection('service_centers').find(filter).sort({ brand: 1, deviceType: 1 }).toArray();
    res.json(centers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/brands', async (req, res) => {
  try {
    const brands = await req.db.collection('service_centers').distinct('brand');
    res.json(brands.filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', adminOnly, async (req, res) => {
  try {
    const { brand, deviceType, location, city, contact } = req.body;
    if (!brand || !deviceType) return res.status(400).json({ message: 'Brand and device type required' });
    const doc = {
      brand: brand.trim(),
      deviceType: deviceType.trim(),
      location: location?.trim() || '',
      city: city?.trim() || '',
      contact: contact?.trim() || '',
      createdAt: new Date(),
    };
    const result = await req.db.collection('service_centers').insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { brand, deviceType, location, city, contact } = req.body;
    const update = {};
    if (brand !== undefined) update.brand = brand.trim();
    if (deviceType !== undefined) update.deviceType = deviceType.trim();
    if (location !== undefined) update.location = location.trim();
    if (city !== undefined) update.city = city.trim();
    if (contact !== undefined) update.contact = contact.trim();
    await req.db.collection('service_centers').updateOne({ _id: toId(req.params.id) }, { $set: update });
    res.json({ message: 'Service center updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await req.db.collection('service_centers').deleteOne({ _id: toId(req.params.id) });
    res.json({ message: 'Service center deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
