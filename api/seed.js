import bcrypt from 'bcryptjs';

export async function seedAdmin(db) {
  const users = db.collection('users');

  const adminHashed = await bcrypt.hash('admin@123', 10);
  const existing = await users.findOne({ username: 'admin' });
  if (existing) {
    await users.updateOne({ username: 'admin' }, { $set: { password: adminHashed } });
  } else {
    await users.insertOne({
      username: 'admin', password: adminHashed, role: 'Admin', branch: 'Wani', createdAt: new Date(),
    });
  }

  const techHashed = await bcrypt.hash('tech123', 10);
  const tech = await users.findOne({ username: 'tech' });
  if (!tech) {
    await users.insertOne({
      username: 'tech', password: techHashed, role: 'Technician', branch: 'Wani', createdAt: new Date(),
    });
  }
}

export async function seedIndexes(db) {
  await db.collection('job_cards').createIndex({ jobId: 1 }, { unique: true });
  await db.collection('job_cards').createIndex({ customerId: 1 });
  await db.collection('job_cards').createIndex({ createdAt: -1 });
  await db.collection('billing').createIndex({ invoiceNo: 1 }, { unique: true });
  await db.collection('billing').createIndex({ jobId: 1 }, { unique: true });
  await db.collection('customers').createIndex({ customerId: 1 });
  await db.collection('customers').createIndex({ mobile: 1 });
  await db.collection('customers').createIndex({ name: 1 });
  try { await db.collection('customers').createIndex({ name: 'text', mobile: 'text' }); } catch {}
  await db.collection('repairs').createIndex({ jobId: 1 });
  await db.collection('repairs').createIndex({ updatedAt: -1 });
}

export async function seedInventory(db) {}
