import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { logger } from '../logger.js';
import { sendRegisterEmail } from '../utils/email.js';

const router = Router();
router.use(authenticate);

const CATEGORIES = ['Repair Payment', 'Part Sale', 'Expense', 'Petty Cash', 'Other'];

router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const entries = await req.db.collection('register_entries')
      .find({ date: targetDate })
      .sort({ createdAt: 1 })
      .toArray();

    const totalIn = entries.filter((e) => e.type === 'in').reduce((s, e) => s + e.amount, 0);
    const totalOut = entries.filter((e) => e.type === 'out').reduce((s, e) => s + e.amount, 0);

    // Calculate yesterday's closing balance as opening balance
    const yesterday = new Date(new Date(targetDate + 'T00:00:00').getTime() - 86400000).toISOString().slice(0, 10);
    const yestEntries = await req.db.collection('register_entries').find({ date: yesterday }).toArray();
    const openingBalance = yestEntries.reduce((s, e) => s + (e.type === 'in' ? e.amount : -e.amount), 0);

    res.json({
      date: targetDate, entries, totalIn, totalOut, balance: totalIn - totalOut,
      openingBalance,
      closingBalance: openingBalance + totalIn - totalOut,
      finalized: entries.some((e) => e.finalized),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, category, amount, description, paymentMode, customerName, customerMobile, productName, quantity, isReturn } = req.body;
    if (!type || !amount) return res.status(400).json({ message: 'type and amount are required' });

    const today = new Date().toISOString().slice(0, 10);
    const doc = {
      date: today,
      type: type === 'in' ? 'in' : 'out',
      category: category || 'Other',
      amount: Number(amount),
      description: description || '',
      paymentMode: paymentMode || 'Cash',
      customerName: customerName || '',
      customerMobile: customerMobile || '',
      productName: productName || '',
      quantity: quantity ? Number(quantity) : 0,
      isReturn: !!isReturn,
      createdBy: req.user?.username || 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      finalized: false,
    };
    const result = await req.db.collection('register_entries').insertOne(doc);
    logger.info(`Register entry ${type} ₹${amount} by ${doc.createdBy}`);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const entry = await req.db.collection('register_entries').findOne({ _id: new ObjectId(req.params.id) });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    if (entry.finalized) return res.status(400).json({ message: 'Cannot edit finalized entry' });

    const today = new Date().toISOString().slice(0, 10);
    if (entry.date !== today) return res.status(400).json({ message: 'Can only edit today\'s entries' });

    const { type, category, amount, description, paymentMode, customerName, customerMobile, productName, quantity, isReturn } = req.body;
    const update = { updatedAt: new Date() };
    if (type) update.type = type;
    if (category) update.category = category;
    if (amount) update.amount = Number(amount);
    if (description !== undefined) update.description = description;
    if (paymentMode) update.paymentMode = paymentMode;
    if (customerName !== undefined) update.customerName = customerName;
    if (customerMobile !== undefined) update.customerMobile = customerMobile;
    if (productName !== undefined) update.productName = productName;
    if (quantity !== undefined) update.quantity = quantity ? Number(quantity) : 0;
    if (isReturn !== undefined) update.isReturn = !!isReturn;

    await req.db.collection('register_entries').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: update }
    );
    res.json({ message: 'Entry updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const entry = await req.db.collection('register_entries').findOne({ _id: new ObjectId(req.params.id) });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    if (entry.finalized) return res.status(400).json({ message: 'Cannot delete finalized entry' });

    const today = new Date().toISOString().slice(0, 10);
    if (entry.date !== today) return res.status(400).json({ message: 'Can only delete today\'s entries' });

    await req.db.collection('register_entries').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/finalize', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const entries = await req.db.collection('register_entries').find({ date: today }).toArray();
    if (entries.length === 0) return res.status(400).json({ message: 'No entries to finalize' });

    const totalIn = entries.filter((e) => e.type === 'in').reduce((s, e) => s + e.amount, 0);
    const totalOut = entries.filter((e) => e.type === 'out').reduce((s, e) => s + e.amount, 0);

    // Get opening balance
    const yesterday = new Date(new Date(today + 'T00:00:00').getTime() - 86400000).toISOString().slice(0, 10);
    const yestEntries = await req.db.collection('register_entries').find({ date: yesterday }).toArray();
    const openingBalance = yestEntries.reduce((s, e) => s + (e.type === 'in' ? e.amount : -e.amount), 0);

    await req.db.collection('register_entries').updateMany(
      { date: today },
      { $set: { finalized: true } }
    );

    const summary = `Daily Register Summary - ${today}\n\nOpening: ₹${openingBalance}\nTotal In: ₹${totalIn}\nTotal Out: ₹${totalOut}\nBalance: ₹${openingBalance + totalIn - totalOut}\n\nEntries:\n${entries.map((e) => `[${e.type.toUpperCase()}] ${e.category}: ₹${e.amount} - ${e.description || ''} (${e.paymentMode})`).join('\n')}`;

    logger.info(`Register finalized for ${today}\n${summary}`);

    // Send email
    const emailSent = await sendRegisterEmail(today, entries, totalIn, totalOut, totalIn - totalOut, openingBalance);
    if (emailSent) logger.info('Register email sent successfully');
    else logger.warn('Failed to send register email');

    res.json({ message: 'Day finalized successfully', summary, totalIn, totalOut, balance: totalIn - totalOut, emailSent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/reopen', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const entries = await req.db.collection('register_entries').find({ date: today }).toArray();
    if (entries.length === 0) return res.status(400).json({ message: 'No entries found' });
    if (!entries.some(e => e.finalized)) return res.status(400).json({ message: 'Day is not finalized' });

    await req.db.collection('register_entries').updateMany(
      { date: today },
      { $set: { finalized: false } }
    );

    logger.info(`Register reopened for ${today} by ${req.user?.username || 'system'}`);
    res.json({ message: 'Day reopened for editing' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/summary', adminOnly, async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
    const entries = await req.db.collection('register_entries').find(filter).sort({ date: -1, createdAt: 1 }).toArray();

    const days = {};
    entries.forEach((e) => {
      if (!days[e.date]) days[e.date] = { date: e.date, totalIn: 0, totalOut: 0, count: 0, finalized: false };
      if (e.type === 'in') days[e.date].totalIn += e.amount;
      else days[e.date].totalOut += e.amount;
      days[e.date].count++;
      if (e.finalized) days[e.date].finalized = true;
    });

    res.json(Object.values(days).sort((a, b) => b.date.localeCompare(a.date)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
