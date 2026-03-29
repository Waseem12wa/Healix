import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const TARGET_COUNT = Number.parseInt(process.env.TARGET_MEDICINE_COUNT || '500000', 10);
const ATLAS_URI = process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI;

if (!ATLAS_URI) {
  console.error('TARGET_MONGODB_URI or MONGODB_URI is required.');
  process.exit(1);
}

if (!Number.isInteger(TARGET_COUNT) || TARGET_COUNT < 0) {
  console.error('TARGET_MEDICINE_COUNT must be a non-negative integer.');
  process.exit(1);
}

const BATCH_SIZE = 5000;

async function run() {
  const conn = await mongoose.createConnection(ATLAS_URI, { serverSelectionTimeoutMS: 10000 }).asPromise();

  try {
    const col = conn.db.collection('medicineinventories');
    const total = await col.countDocuments();

    console.log(`Current medicineinventories count: ${total}`);
    console.log(`Target count: ${TARGET_COUNT}`);

    if (total <= TARGET_COUNT) {
      console.log('No trim needed.');
      return;
    }

    let deletedTotal = 0;
    const cursor = col
      .find({}, { projection: { _id: 1 } })
      .sort({ _id: 1 })
      .skip(TARGET_COUNT);

    let buffer = [];

    for await (const doc of cursor) {
      buffer.push(doc._id);

      if (buffer.length >= BATCH_SIZE) {
        const result = await col.deleteMany({ _id: { $in: buffer } });
        deletedTotal += result.deletedCount || 0;
        process.stdout.write(`\rDeleted ${deletedTotal} records...`);
        buffer = [];
      }
    }

    if (buffer.length > 0) {
      const result = await col.deleteMany({ _id: { $in: buffer } });
      deletedTotal += result.deletedCount || 0;
      process.stdout.write(`\rDeleted ${deletedTotal} records...`);
    }

    process.stdout.write('\n');

    const after = await col.countDocuments();
    console.log(`Final medicineinventories count: ${after}`);
  } finally {
    await conn.close();
  }
}

run().catch((error) => {
  console.error('Trim failed:', error.message);
  process.exit(1);
});
