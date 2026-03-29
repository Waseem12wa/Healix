import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const SOURCE_MONGODB_URI = process.env.SOURCE_MONGODB_URI || 'mongodb://127.0.0.1:27017/healix';
const TARGET_MONGODB_URI = process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI;
const BATCH_SIZE = Number.parseInt(process.env.MIGRATION_BATCH_SIZE || '500', 10);

if (!TARGET_MONGODB_URI) {
  console.error('TARGET_MONGODB_URI or MONGODB_URI is required.');
  process.exit(1);
}

const sourceConn = mongoose.createConnection(SOURCE_MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  autoIndex: false,
});

const targetConn = mongoose.createConnection(TARGET_MONGODB_URI, {
  serverSelectionTimeoutMS: 10000,
  autoIndex: false,
});

const report = {
  sourceDb: '',
  targetDb: '',
  collections: [],
  startedAt: new Date().toISOString(),
};

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function migrateCollection(collectionName) {
  const sourceCollection = sourceConn.db.collection(collectionName);
  const targetCollection = targetConn.db.collection(collectionName);

  const docs = await sourceCollection.find({}).toArray();
  const sourceCount = docs.length;

  if (sourceCount === 0) {
    report.collections.push({
      name: collectionName,
      sourceCount,
      upserted: 0,
      matchedOrUpdated: 0,
    });
    console.log(`- ${collectionName}: 0 docs (skipped)`);
    return;
  }

  let upserted = 0;
  let matchedOrUpdated = 0;

  const chunks = chunkArray(docs, BATCH_SIZE);
  for (const batch of chunks) {
    const operations = batch.map((doc) => ({
      replaceOne: {
        filter: { _id: doc._id },
        replacement: doc,
        upsert: true,
      },
    }));

    const result = await targetCollection.bulkWrite(operations, { ordered: false });
    upserted += result.upsertedCount || 0;
    matchedOrUpdated += (result.matchedCount || 0) + (result.modifiedCount || 0);
  }

  report.collections.push({
    name: collectionName,
    sourceCount,
    upserted,
    matchedOrUpdated,
  });

  console.log(`- ${collectionName}: ${sourceCount} docs, upserted=${upserted}, matched/updated=${matchedOrUpdated}`);
}

async function run() {
  try {
    await Promise.all([sourceConn.asPromise(), targetConn.asPromise()]);

    report.sourceDb = sourceConn.name;
    report.targetDb = targetConn.name;

    console.log(`Connected source DB: ${report.sourceDb}`);
    console.log(`Connected target DB: ${report.targetDb}`);

    const collections = await sourceConn.db.listCollections({}, { nameOnly: true }).toArray();
    const collectionNames = collections
      .map((c) => c.name)
      .filter((name) => !name.startsWith('system.'))
      .sort((a, b) => {
        if (a === 'medicineinventories') return 1;
        if (b === 'medicineinventories') return -1;
        return a.localeCompare(b);
      });

    if (!collectionNames.length) {
      console.log('No collections found in source DB. Nothing to migrate.');
      return;
    }

    console.log(`Migrating ${collectionNames.length} collections...`);
    for (const name of collectionNames) {
      await migrateCollection(name);
    }

    report.finishedAt = new Date().toISOString();

    const totalSource = report.collections.reduce((sum, c) => sum + c.sourceCount, 0);
    const totalUpserted = report.collections.reduce((sum, c) => sum + c.upserted, 0);

    console.log('\nMigration complete.');
    console.log(`Total source documents: ${totalSource}`);
    console.log(`Total newly inserted: ${totalUpserted}`);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await Promise.allSettled([sourceConn.close(), targetConn.close()]);
  }
}

run();
