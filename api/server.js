import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env') });
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import http from 'http';

import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import jobCardRoutes from './routes/jobCards.js';
import repairRoutes from './routes/repairs.js';
import billingRoutes from './routes/billing.js';
import brandRoutes from './routes/brands.js';
import deviceModelRoutes from './routes/deviceModels.js';
import dashboardRoutes from './routes/dashboard.js';
import reportRoutes from './routes/reports.js';
import searchRoutes from './routes/search.js';
import trackRoutes from './routes/track.js';
import activityRoutes from './routes/activity.js';
import { authenticate } from './middleware/auth.js';
import registerRoutes from './routes/register.js';
import inventoryRoutes from './routes/inventory.js';
import warrantyRoutes from './routes/warranty.js';
import { seedAdmin, seedDeviceData, seedIndexes, seedInventory } from './seed.js';
import { logger } from './logger.js';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')));

const client = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017/slcg_rms');

async function checkNet() {
  return new Promise((resolve) => {
    const req = http.get('http://clients3.google.com/generate_204', { timeout: 5000 }, (res) => {
      resolve(res.statusCode === 204);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function start() {
  try {
    await client.connect();
    logger.info('Connected to MongoDB');

    const db = client.db();

    await seedAdmin(db);
    await seedDeviceData(db);
    await seedIndexes(db);
    await seedInventory(db);

    app.get('/api/tags', authenticate, async (req, res) => {
      try {
        const tags = await db.collection('job_tags').find().sort({ name: 1 }).toArray();
        res.json(tags);
      } catch (err) { res.status(500).json({ message: err.message }); }
    });
    app.post('/api/tags', authenticate, async (req, res) => {
      try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Name required' });
        const existing = await db.collection('job_tags').findOne({ name: name.toUpperCase() });
        if (existing) return res.json(existing);
        const doc = { name: name.toUpperCase(), createdAt: new Date() };
        const result = await db.collection('job_tags').insertOne(doc);
        res.status(201).json({ ...doc, _id: result.insertedId });
      } catch (err) { res.status(500).json({ message: err.message }); }
    });

    app.use((req, res, next) => {
      req.db = db;
      next();
    });

    app.get('/api/health', async (req, res) => {
      try {
        await db.command({ ping: 1 });
        const net = await checkNet();
        res.json({ db: true, net });
      } catch {
        res.json({ db: false, net: false });
      }
    });

    app.get('/api/backup', async (req, res) => {
      try {
        const collections = ['users', 'customers', 'job_cards', 'repairs', 'billing', 'brands', 'device_models', 'sequences', 'activity_logs'];
        const data = {};
        for (const name of collections) {
          data[name] = await db.collection(name).find().toArray();
        }
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="slcg-backup-${new Date().toISOString().slice(0, 10)}.json"`);
        res.json(data);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });

    app.use('/api/auth', authRoutes);
    app.use('/api/customers', customerRoutes);
    app.use('/api/job-cards', jobCardRoutes);
    app.use('/api/repairs', repairRoutes);
    app.use('/api/billing', billingRoutes);
    app.use('/api/brands', brandRoutes);
    app.use('/api/device-models', deviceModelRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/search', searchRoutes);
    app.use('/api/activity', activityRoutes);
    app.use('/api/register', registerRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/warranty', warrantyRoutes);
    app.use('/track', trackRoutes);

    app.use((err, req, res, next) => {
      logger.error(err.message || 'Internal server error');
      res.status(500).json({ message: err.message || 'Internal server error' });
    });

    app.listen(PORT, () => {
      logger.info(`RMS API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
}

start();
