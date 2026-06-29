import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { q, branch } = req.query;
    if (!q) return res.json({ customers: [], jobs: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const branchFilter = branch ? { branch: { $regex: `^${branch}$`, $options: 'i' } } : {};

    const allCustomers = await req.db.collection('customers')
      .find({ $or: [{ name: regex }, { mobile: regex }] })
      .limit(20)
      .toArray();

    const jobs = await req.db.collection('job_cards')
      .find({ ...branchFilter, jobId: regex })
      .limit(10)
      .toArray();

    const jobPhones = new Set(jobs.map((j) => j.customerPhone).filter(Boolean));
    const customers = allCustomers.filter((c) => !branch || jobPhones.has(c.mobile));

    const allPhones = [...new Set([...customers.map((c) => c.mobile), ...jobPhones])].filter(Boolean);
    const custMap = {};
    if (allPhones.length) {
      const custs = await req.db.collection('customers')
        .find({ mobile: { $in: allPhones } })
        .toArray();
      custs.forEach((c) => { custMap[c.mobile] = c; });
    }

    res.json({
      customers: customers.map((c) => ({ ...c, _type: 'customer' })),
      jobs: jobs.map((j) => ({ ...j, customer: custMap[j.customerPhone] || null, _type: 'job' })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/problems', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const problems = await req.db.collection('job_cards')
      .find({ problem: regex })
      .project({ problem: 1, device: 1, brand: 1, model: 1 })
      .limit(8)
      .toArray();
    const seen = new Set();
    const unique = problems.filter((p) => {
      if (seen.has(p.problem)) return false;
      seen.add(p.problem);
      return true;
    });
    res.json(unique);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
