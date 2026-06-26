import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.use(adminOnly);

router.get('/', async (req, res) => {
  try {
    const db = req.db;
    const { type, format, branch } = req.query;
    const branchFilter = branch ? { branch: branch.toUpperCase() } : {};
    let dateFilter = {};

    if (type === 'daily') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: today } };
    } else if (type === 'monthly') {
      const start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: start } };
    }

    let jobs;
    if (type === 'pending') {
      jobs = await db.collection('job_cards').find({ ...branchFilter, status: { $in: ['Pending', 'In Progress'] } }).sort({ createdAt: -1 }).toArray();
    } else {
      jobs = await db.collection('job_cards').find({ ...branchFilter, ...dateFilter }).sort({ createdAt: -1 }).toArray();
    }

    const customerIds = jobs.map((j) => j.customerId).filter(Boolean);
    const customers = await db.collection('customers')
      .find({ _id: { $in: customerIds.map((id) => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean) } })
      .toArray();
    const customerMap = {};
    customers.forEach((c) => { customerMap[c._id.toString()] = c; });

    const jobIds = jobs.map((j) => j.jobId).filter(Boolean);
    const bills = await db.collection('billing').find({ jobId: { $in: jobIds } }).toArray();
    const billMap = {};
    bills.forEach((b) => { billMap[b.jobId] = b; });

    const totalJobs = jobs.length;
    const completed = jobs.filter((j) => j.status === 'Completed' || j.status === 'Billed' || j.status === 'Delivered').length;
    const pending = jobs.filter((j) => j.status === 'Pending' || j.status === 'In Progress').length;
    const revenue = bills.reduce((sum, b) => sum + (b.amount || 0), 0);

    const enrichedJobs = jobs.map((j) => ({
      ...j,
      customer: customerMap[j.customerId] || null,
      amount: billMap[j.jobId]?.amount || null,
    }));

    if (format === 'csv') {
      const header = 'Job ID,Customer Name,Mobile,Device,Brand,Model,Problem,Status,Branch,Amount,Date';
      const rows = enrichedJobs.map((j) => {
        const c = j.customer || {};
        return [
          j.jobId, c.name, c.mobile, c.device, c.brand, c.model,
          `"${(c.problem || '').replace(/"/g, '""')}"`,
          j.status, j.branch, j.amount || '', j.createdAt ? new Date(j.createdAt).toISOString().slice(0, 10) : '',
        ].join(',');
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report-${type || 'all'}-${branch || 'all'}.csv"`);
      return res.send([header, ...rows].join('\n'));
    }

    res.json({ totalJobs, completed, pending, revenue, jobs: enrichedJobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
