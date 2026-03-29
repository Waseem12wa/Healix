import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const SOURCE_URI = process.env.SOURCE_MONGODB_URI || 'mongodb://127.0.0.1:27018/healix';
const TARGET_URI = process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI;

if (!TARGET_URI) {
  console.error('TARGET_MONGODB_URI or MONGODB_URI is required.');
  process.exit(1);
}

const sourceConn = mongoose.createConnection(SOURCE_URI, { serverSelectionTimeoutMS: 10000 });
const targetConn = mongoose.createConnection(TARGET_URI, { serverSelectionTimeoutMS: 10000 });

const EXCLUDED = new Set(['medicineinventories']);
const BATCH_SIZE = 1000;

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function migrateCollection(name) {
  const source = sourceConn.db.collection(name);
  const target = targetConn.db.collection(name);

  const docs = await source.find({}).toArray();
  if (!docs.length) {
    console.log(`- ${name}: 0 docs (skipped)`);
    return;
  }

  let upserted = 0;
  let matchedOrUpdated = 0;
  for (const batch of chunkArray(docs, BATCH_SIZE)) {
    const operations = batch.map((doc) => ({
      replaceOne: {
        filter: { _id: doc._id },
        replacement: doc,
        upsert: true,
      },
    }));

    const result = await target.bulkWrite(operations, { ordered: false });
    upserted += result.upsertedCount || 0;
    matchedOrUpdated += (result.matchedCount || 0) + (result.modifiedCount || 0);
  }

  console.log(`- ${name}: source=${docs.length}, upserted=${upserted}, matched/updated=${matchedOrUpdated}`);
}

async function run() {
  try {
    await Promise.all([sourceConn.asPromise(), targetConn.asPromise()]);

    const collections = await sourceConn.db.listCollections({}, { nameOnly: true }).toArray();
    const names = collections
      .map((c) => c.name)
      .filter((name) => !name.startsWith('system.'))
      .filter((name) => !EXCLUDED.has(name))
      .sort();

    console.log(`Migrating non-medicine collections (${names.length})...`);
    for (const name of names) {
      await migrateCollection(name);
    }
  } finally {
    await Promise.allSettled([sourceConn.close(), targetConn.close()]);
  }
}

run().catch((error) => {
  console.error('Non-medicine migration failed:', error.message);
  process.exit(1);
});
