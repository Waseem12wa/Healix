import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const localUri = process.env.LOCAL_MONGODB_URI || 'mongodb://127.0.0.1:27017/healix';
const atlasUri = process.env.ATLAS_MONGODB_URI || process.env.MONGODB_URI;

if (!atlasUri) {
  console.error('ATLAS_MONGODB_URI or MONGODB_URI is required.');
  process.exit(1);
}

const syntheticQuery = {
  $or: [
    { medicineName: /\s\d{7}$/ },
    { imageUrl: /images\.healix\.local\/medicines/i },
  ],
};

async function cleanup(uri, label) {
  const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 10000 }).asPromise();
  try {
    const col = conn.db.collection('medicineinventories');
    const totalBefore = await col.countDocuments();
    const syntheticCount = await col.countDocuments(syntheticQuery);

    console.log(`${label}: total=${totalBefore}, synthetic=${syntheticCount}`);

    if (syntheticCount > 0) {
      const result = await col.deleteMany(syntheticQuery);
      console.log(`${label}: deleted synthetic=${result.deletedCount}`);
    }

    const totalAfter = await col.countDocuments();
    console.log(`${label}: totalAfter=${totalAfter}`);
  } finally {
    await conn.close();
  }
}

await cleanup(localUri, 'LOCAL');
await cleanup(atlasUri, 'ATLAS');
