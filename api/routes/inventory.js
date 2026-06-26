import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { authenticate, adminOnly } from '../middleware/auth.js';
import { logger } from '../logger.js';

const router = Router();
router.use(authenticate);

// ─── Parts ─────────────────────────────────────

router.get('/parts', async (req, res) => {
  try {
    const { category, lowStock, search } = req.query;
    let filter = {};
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const parts = await req.db.collection('inventory_parts').find(filter).sort({ name: 1 }).toArray();
    if (lowStock === 'true') return res.json(parts.filter((p) => p.stock <= p.threshold));
    res.json(parts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/parts', adminOnly, async (req, res) => {
  try {
    const { name, sku, category, unit, stock, threshold, price } = req.body;
    if (!name || !sku) return res.status(400).json({ message: 'Name and SKU required' });
    const exists = await req.db.collection('inventory_parts').findOne({ sku: sku.toUpperCase() });
    if (exists) return res.status(400).json({ message: 'SKU already exists' });
    const doc = {
      name, sku: sku.toUpperCase(), category: category || 'General',
      unit: unit || 'pcs', stock: Number(stock) || 0,
      threshold: Number(threshold) || 5, price: Number(price) || 0,
      createdAt: new Date(), updatedAt: new Date(),
    };
    const result = await req.db.collection('inventory_parts').insertOne(doc);
    logger.info(`Part created: ${doc.name} (${doc.sku})`);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/parts/:id', adminOnly, async (req, res) => {
  try {
    const { name, sku, category, unit, stock, threshold, price } = req.body;
    const update = { updatedAt: new Date() };
    if (name !== undefined) update.name = name;
    if (sku) update.sku = sku.toUpperCase();
    if (category) update.category = category;
    if (unit) update.unit = unit;
    if (stock !== undefined) update.stock = Number(stock);
    if (threshold !== undefined) update.threshold = Number(threshold);
    if (price !== undefined) update.price = Number(price);
    await req.db.collection('inventory_parts').updateOne({ _id: new ObjectId(req.params.id) }, { $set: update });
    res.json({ message: 'Part updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/parts/:id', adminOnly, async (req, res) => {
  try {
    await req.db.collection('inventory_parts').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Part deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/low-stock', async (req, res) => {
  try {
    const parts = await req.db.collection('inventory_parts').find({ $expr: { $lte: ['$stock', '$threshold'] } }).sort({ stock: 1 }).toArray();
    res.json(parts);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Allocate Parts to Job ─────────────────────

router.post('/allocate', async (req, res) => {
  try {
    const { jobId, partId, quantity, notes } = req.body;
    if (!jobId || !partId || !quantity) return res.status(400).json({ message: 'jobId, partId, quantity required' });
    const qty = Number(quantity);
    if (qty <= 0) return res.status(400).json({ message: 'Invalid quantity' });

    const part = await req.db.collection('inventory_parts').findOne({ _id: new ObjectId(partId) });
    if (!part) return res.status(404).json({ message: 'Part not found' });
    if (part.stock < qty) return res.status(400).json({ message: `Insufficient stock: ${part.stock} available` });

    await req.db.collection('inventory_parts').updateOne({ _id: new ObjectId(partId) }, { $inc: { stock: -qty }, $set: { updatedAt: new Date() } });
    const alloc = { jobId: jobId.toUpperCase(), partId: partId.toString(), partName: part.name, sku: part.sku, quantity: qty, unit: part.unit, price: part.price, notes: notes || '', allocatedAt: new Date() };
    await req.db.collection('job_card_parts').insertOne(alloc);
    await req.db.collection('inventory_transactions').insertOne({ type: 'out', partId: partId.toString(), partName: part.name, sku: part.sku, quantity: qty, reference: jobId.toUpperCase(), notes: `Allocated to job ${jobId}`, createdAt: new Date() });
    logger.info(`Allocated ${qty}x ${part.name} to job ${jobId}`);
    res.status(201).json(alloc);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/allocations/:jobId', async (req, res) => {
  try {
    const allocs = await req.db.collection('job_card_parts').find({ jobId: req.params.jobId.toUpperCase() }).sort({ allocatedAt: -1 }).toArray();
    res.json(allocs);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/allocations/:id', async (req, res) => {
  try {
    const alloc = await req.db.collection('job_card_parts').findOne({ _id: new ObjectId(req.params.id) });
    if (!alloc) return res.status(404).json({ message: 'Allocation not found' });
    await req.db.collection('inventory_parts').updateOne({ _id: new ObjectId(alloc.partId) }, { $inc: { stock: alloc.quantity } });
    await req.db.collection('job_card_parts').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Allocation removed, stock returned' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Transactions ──────────────────────────────

router.get('/transactions', async (req, res) => {
  try {
    const { partId, limit: lmt } = req.query;
    const filter = partId ? { partId } : {};
    const txns = await req.db.collection('inventory_transactions').find(filter).sort({ createdAt: -1 }).limit(parseInt(lmt) || 100).toArray();
    res.json(txns);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Suppliers ─────────────────────────────────

router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await req.db.collection('suppliers').find().sort({ name: 1 }).toArray();
    res.json(suppliers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/suppliers', adminOnly, async (req, res) => {
  try {
    const { name, contact, phone, email, address, gst } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const doc = { name, contact: contact || '', phone: phone || '', email: email || '', address: address || '', gst: gst || '', createdAt: new Date() };
    const result = await req.db.collection('suppliers').insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/suppliers/:id', adminOnly, async (req, res) => {
  try {
    const { name, contact, phone, email, address, gst } = req.body;
    await req.db.collection('suppliers').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { name, contact, phone, email, address, gst } });
    res.json({ message: 'Supplier updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/suppliers/:id', adminOnly, async (req, res) => {
  try {
    await req.db.collection('suppliers').deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Supplier deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── Purchase Orders ───────────────────────────

router.get('/purchase-orders', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const pos = await req.db.collection('purchase_orders').find(filter).sort({ createdAt: -1 }).toArray();
    res.json(pos);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/purchase-orders', adminOnly, async (req, res) => {
  try {
    const { supplierId, supplierName, items, notes } = req.body;
    if (!supplierId || !items?.length) return res.status(400).json({ message: 'Supplier and items required' });
    const doc = {
      supplierId, supplierName: supplierName || '',
      items: items.map((it) => ({ ...it, received: 0 })),
      status: 'Pending', notes: notes || '',
      createdAt: new Date(), updatedAt: new Date(),
    };
    const result = await req.db.collection('purchase_orders').insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/purchase-orders/:id/receive', adminOnly, async (req, res) => {
  try {
    const po = await req.db.collection('purchase_orders').findOne({ _id: new ObjectId(req.params.id) });
    if (!po) return res.status(404).json({ message: 'PO not found' });
    const { items } = req.body;
    for (const item of items) {
      await req.db.collection('inventory_parts').updateOne({ _id: new ObjectId(item.partId) }, { $inc: { stock: item.qty } });
      await req.db.collection('inventory_transactions').insertOne({ type: 'in', partId: item.partId, partName: item.partName, sku: item.sku, quantity: item.qty, reference: `PO-${po._id}`, notes: `Purchase order received`, createdAt: new Date() });
    }
    await req.db.collection('purchase_orders').updateOne({ _id: new ObjectId(req.params.id) }, { $set: { status: 'Received', updatedAt: new Date() } });
    logger.info(`PO ${req.params.id} received with ${items.length} items`);
    res.json({ message: 'PO received, stock updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
