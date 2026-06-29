const { MongoClient } = require('./rms-api/node_modules/mongodb');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://chetanupare1234:kavNQ8eFhCM3SOw0@cluster0.cfqelhy.mongodb.net/slcg_rms?retryWrites=true&w=majority&appName=Cluster0';

async function migrate() {
  const client = new MongoClient(MONGO_URI, { connectTimeoutMS: 10000, serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const admin = client.db().admin();

  const dbs = await admin.listDatabases();
  console.log('Databases:', dbs.databases.map(d => d.name));

  const sourceDb = client.db('slcg');
  const targetDb = client.db('slcg_rms');

  const sourceCols = await sourceDb.listCollections().toArray();
  const targetCols = await targetDb.listCollections().toArray();

  const sourceNames = sourceCols.map(c => c.name);
  const targetNames = targetCols.map(c => c.name);

  console.log('\nslcg collections:', sourceNames);
  console.log('slcg_rms collections:', targetNames);

  for (const name of sourceNames) {
    if (!targetNames.includes(name)) {
      const docs = await sourceDb.collection(name).find().toArray();
      if (docs.length > 0) {
        await targetDb.collection(name).insertMany(docs);
        console.log(`Copied ${docs.length} docs from slcg.${name} -> slcg_rms.${name}`);
      } else {
        console.log(`Skipped slcg.${name} (empty)`);
      }
    } else {
      const sourceCount = await sourceDb.collection(name).countDocuments();
      const targetCount = await targetDb.collection(name).countDocuments();
      console.log(`slcg.${name}: ${sourceCount} docs (exists in target with ${targetCount} docs - skipping, already present)`);
    }
  }

  console.log('\nDropping slcg database...');
  await sourceDb.dropDatabase();
  console.log('slcg database dropped successfully');

  await client.close();
  console.log('\nMigration complete. Only slcg_rms remains.');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
