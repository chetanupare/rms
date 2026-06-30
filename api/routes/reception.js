import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate, role } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, role('admin', 'receptionist'));

function toId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : id;
}

const AUTO_ASSIGN_MINUTES = 5;

// Auto-assign: find jobs pending > N mins, assign to least loaded online tech
async function autoAssignPending(db) {
  const cutoff = new Date(Date.now() - AUTO_ASSIGN_MINUTES * 60000);
  const pendingJobs = await db.collection('job_cards').find({
    status: 'Pending',
    pendingAssignmentSince: { $lte: cutoff },
    technicianId: { $exists: false },
  }).toArray();

  if (!pendingJobs.length) return;

  const onlineTechs = await db.collection('technician_status').find({
    status: 'on_duty',
  }).toArray();

  if (!onlineTechs.length) return;

  const userIds = onlineTechs.map(t => t.userId);
  const users = await db.collection('users').find({
    _id: { $in: userIds.map(id => toId(id)).filter(Boolean) },
    role: { $regex: /^technician$/i },
  }).project({ _id: 1 }).toArray();

  if (!users.length) return;

  const validIds = new Set(users.map(u => u._id.toString()));
  const activeTechs = onlineTechs.filter(t => validIds.has(t.userId));

  if (!activeTechs.length) return;

  const workloads = await db.collection('job_offers').aggregate([
    { $match: { technicianId: { $in: activeTechs.map(t => t.userId) }, status: { $ne: 'rejected' } } },
    { $group: { _id: '$technicianId', count: { $sum: 1 } } },
  ]).toArray();

  const workloadMap = {};
  workloads.forEach(w => { workloadMap[w._id] = w.count; });

  for (const job of pendingJobs) {
    const sorted = [...activeTechs].sort((a, b) => (workloadMap[a.userId] || 0) - (workloadMap[b.userId] || 0));
    const target = sorted[0];
    if (!target) break;

    const now = new Date();
    const offerDoc = {
      jobId: job.jobId,
      technicianId: target.userId,
      status: 'offered',
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 30 * 60000),
      autoAssigned: true,
    };
    await db.collection('job_offers').insertOne(offerDoc);
    await db.collection('job_cards').updateOne(
      { jobId: job.jobId },
      { $set: { technicianId: target.userId, autoAssigned: true, assignedAt: now } }
    );

    await db.collection('activity_logs').insertOne({
      jobId: job.jobId,
      action: `Auto-assigned to technician after ${AUTO_ASSIGN_MINUTES} minutes`,
      createdAt: now,
    });

    workloadMap[target.userId] = (workloadMap[target.userId] || 0) + 1;
    activeTechs.splice(activeTechs.indexOf(target), 1);
    if (!activeTechs.length) break;
  }
}

// GET /api/reception/unassigned
router.get('/unassigned', async (req, res) => {
  try {
    const { branch } = req.query;
    const branchFilter = branch ? { branch: { $regex: `^${branch}$`, $options: 'i' } } : {};

    await autoAssignPending(req.db);

    const unassigned = await req.db.collection('job_cards').find({
      ...branchFilter,
      status: 'Pending',
      technicianId: { $exists: false },
      pendingAssignmentSince: { $exists: true },
    }).sort({ pendingAssignmentSince: 1 }).toArray();

    const now = Date.now();
    const result = unassigned.map(job => {
      const elapsed = job.pendingAssignmentSince ? (now - new Date(job.pendingAssignmentSince).getTime()) : 0;
      const remaining = Math.max(0, AUTO_ASSIGN_MINUTES * 60000 - elapsed);
      return {
        ...job,
        elapsed,
        remaining,
        autoAssignIn: Math.ceil(remaining / 1000),
      };
    });

    res.json({ jobs: result, autoAssignMinutes: AUTO_ASSIGN_MINUTES });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reception/technicians
router.get('/technicians', async (req, res) => {
  try {
    const techUsers = await req.db.collection('users').find(
      { role: { $regex: /^technician$/i } },
      { projection: { password: 0 } }
    ).toArray();

    const statuses = await req.db.collection('technician_status').find({
      userId: { $in: techUsers.map(u => u._id.toString()) },
    }).toArray();

    const statusMap = {};
    statuses.forEach(s => { statusMap[s.userId] = s; });

    const workloads = await req.db.collection('job_offers').aggregate([
      { $match: { technicianId: { $in: techUsers.map(u => u._id.toString()) }, status: { $nin: ['rejected', 'completed'] } } },
      { $group: { _id: '$technicianId', count: { $sum: 1 } } },
    ]).toArray();

    const workloadMap = {};
    workloads.forEach(w => { workloadMap[w._id] = w.count; });

    const result = techUsers.map(u => {
      const uid = u._id.toString();
      const s = statusMap[uid] || {};
      return {
        _id: uid,
        name: u.name || u.username,
        phone: u.phone || '',
        status: s.status || 'off_duty',
        location: s.location || null,
        lastSeen: s.updatedAt || null,
        activeJobs: workloadMap[uid] || 0,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/reception/jobs/:id/assign
router.post('/jobs/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;
    if (!technicianId) return res.status(400).json({ message: 'technicianId required' });

    const job = await req.db.collection('job_cards').findOne({ jobId: id });
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const tech = await req.db.collection('users').findOne({ _id: toId(technicianId), role: { $regex: /^technician$/i } });
    if (!tech) return res.status(404).json({ message: 'Technician not found' });

    const now = new Date();
    const offerDoc = {
      jobId: job.jobId,
      technicianId,
      status: 'offered',
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 30 * 60000),
      assignedBy: req.user.id.toString(),
    };
    await req.db.collection('job_offers').insertOne(offerDoc);
    await req.db.collection('job_cards').updateOne(
      { jobId: job.jobId },
      { $set: { technicianId, assignedBy: req.user.id.toString(), assignedAt: now } }
    );

    await req.db.collection('activity_logs').insertOne({
      jobId: job.jobId,
      action: `Assigned to ${tech.name || tech.username} by ${req.user.name || req.user.username}`,
      createdAt: now,
    });

    res.json({ message: `Assigned to ${tech.name || tech.username}`, jobId: job.jobId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
