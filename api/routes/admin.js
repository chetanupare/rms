import { Router } from 'express';
import { authenticate, adminOnly } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();
router.use(authenticate);
router.use(adminOnly);

// POST /api/admin/clear-jobs - Clear all job cards, offers, repairs, billing, activity logs
router.post('/clear-jobs', async (req, res) => {
  try {
    const jobs = await req.db.collection('job_cards').deleteMany({});
    const offers = await req.db.collection('job_offers').deleteMany({});
    const repairs = await req.db.collection('repairs').deleteMany({});
    const billing = await req.db.collection('billing').deleteMany({});
    const activity = await req.db.collection('activity_logs').deleteMany({});
    res.json({
      message: 'All job data cleared',
      deleted: {
        job_cards: jobs.deletedCount,
        job_offers: offers.deletedCount,
        repairs: repairs.deletedCount,
        billing: billing.deletedCount,
        activity_logs: activity.deletedCount,
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/admin/clear-customers - Clear all customers
router.post('/clear-customers', async (req, res) => {
  try {
    const customers = await req.db.collection('customers').deleteMany({});
    res.json({ message: 'All customers cleared', deleted: { customers: customers.deletedCount } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/admin/clear-all - Clear jobs + customers + device registrations
router.post('/clear-all', async (req, res) => {
  try {
    const jobs = await req.db.collection('job_cards').deleteMany({});
    const offers = await req.db.collection('job_offers').deleteMany({});
    const repairs = await req.db.collection('repairs').deleteMany({});
    const billing = await req.db.collection('billing').deleteMany({});
    const activity = await req.db.collection('activity_logs').deleteMany({});
    const customers = await req.db.collection('customers').deleteMany({});
    const devices = await req.db.collection('device_registrations').deleteMany({});
    const ratings = await req.db.collection('ratings').deleteMany({});
    const contracts = await req.db.collection('contracts').deleteMany({});
    const quotes = await req.db.collection('quotes').deleteMany({});
    res.json({
      message: 'All data cleared',
      deleted: {
        job_cards: jobs.deletedCount,
        job_offers: offers.deletedCount,
        repairs: repairs.deletedCount,
        billing: billing.deletedCount,
        activity_logs: activity.deletedCount,
        customers: customers.deletedCount,
        device_registrations: devices.deletedCount,
        ratings: ratings.deletedCount,
        contracts: contracts.deletedCount,
        quotes: quotes.deletedCount,
      }
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/admin/create-user - Create user with password and return credentials
router.post('/create-user', async (req, res) => {
  try {
    const { name, phone, role, password } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'Name and phone required' });

    const existing = await req.db.collection('users').findOne({ phone });
    if (existing) return res.status(409).json({ message: 'User already exists with this phone' });

    const userPassword = password || phone.slice(-6);
    const hashed = await bcrypt.hash(userPassword, 10);
    const userRole = (role || 'customer').charAt(0).toUpperCase() + (role || 'customer').slice(1);
    const username = `user_${phone.slice(-4)}`;

    const doc = {
      name, phone, username,
      email: '',
      password: hashed,
      role: userRole,
      branch: req.user?.branch || process.env.DEFAULT_BRANCH || 'Wani',
      createdAt: new Date(),
    };
    const result = await req.db.collection('users').insertOne(doc);

    // Also create customer record if role is customer
    if (userRole.toLowerCase() === 'customer') {
      await req.db.collection('customers').updateOne(
        { mobile: phone },
        { $setOnInsert: { name, mobile: phone, email: '', address: '', createdAt: new Date() } },
        { upsert: true }
      );
    }

    res.status(201).json({
      user: { _id: result.insertedId, name, phone, username, role: userRole },
      credentials: { phone, password: userPassword },
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/admin/save-device - Save custom device type/brand/model
router.post('/save-device', async (req, res) => {
  try {
    const { deviceType, brand, model } = req.body;
    if (!deviceType) return res.status(400).json({ message: 'deviceType required' });

    // Save brand if custom
    if (brand) {
      const existingBrand = await req.db.collection('brands').findOne({ name: brand, deviceType });
      if (!existingBrand) {
        await req.db.collection('brands').insertOne({ name: brand, deviceType, createdAt: new Date() });
      }
    }

    // Save model if custom
    if (model && brand) {
      const existingModel = await req.db.collection('device_models').findOne({ brand, deviceType, modelName: model });
      if (!existingModel) {
        await req.db.collection('device_models').insertOne({ brand, deviceType, modelName: model, createdAt: new Date() });
      }
    }

    res.json({ message: 'Device data saved' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
