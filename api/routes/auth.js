import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'slcg-jwt-secret-2026';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }
    const user = await req.db.collection('users').findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role, branch: user.branch },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ token, user: { username: user.username, role: user.role, branch: user.branch } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await req.db.collection('users').findOne(
      { _id: req.user.id },
      { projection: { password: 0 } }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: { username: user.username, role: user.role, branch: user.branch } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
