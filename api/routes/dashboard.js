import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const db = req.db;
    const { branch } = req.query;
    const branchFilter = branch ? { branch: { $regex: `^${branch}$`, $options: 'i' } } : {};

    const totalJobs = await db.collection('job_cards').countDocuments(branchFilter);
    const pendingJobs = await db.collection('job_cards').countDocuments({ ...branchFilter, status: 'Pending' });
    const inProgressJobs = await db.collection('job_cards').countDocuments({ ...branchFilter, status: 'In Progress' });
    const completedJobs = await db.collection('job_cards').countDocuments({ ...branchFilter, status: { $in: ['Completed', 'Billed', 'Delivered'] } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayBills = await db.collection('billing').find({ createdAt: { $gte: today } }).toArray();
    const todayRevenue = todayBills.reduce((sum, b) => sum + (b.amount || 0), 0);

    const recentJobs = await db.collection('job_cards')
      .find(branchFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    const phoneNumbers = recentJobs.map((j) => j.customerPhone).filter(Boolean);
    const customers = phoneNumbers.length > 0
      ? await db.collection('customers').find({ mobile: { $in: phoneNumbers } }).toArray()
      : [];
    const customerMap = {};
    customers.forEach((c) => { customerMap[c.mobile] = c; });

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      const dayBills = await db.collection('billing').find({ createdAt: { $gte: d, $lte: end } }).toArray();
      const dayJobs = await db.collection('job_cards').countDocuments({ ...branchFilter, createdAt: { $gte: d, $lte: end } });
      chartData.push({
        date: d.toISOString().slice(0, 10),
        revenue: dayBills.reduce((sum, b) => sum + (b.amount || 0), 0),
        jobs: dayJobs,
      });
    }

    res.json({
      totalJobs,
      pendingJobs,
      inProgressJobs,
      completedJobs,
      todayRevenue,
      chartData,
      recentJobs: recentJobs.map((j) => ({ ...j, customer: customerMap[j.customerPhone] || null })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
