import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const providerEmail = (process.argv[2] || 'provider5@healix.com').trim().toLowerCase();
const targetCount = Number.parseInt(process.argv[3] || '20', 10);

async function run() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing in environment');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const provider = await db.collection('users').findOne({
    email: providerEmail,
    role: 'provider',
  });

  if (!provider) {
    throw new Error(`Provider not found: ${providerEmail}`);
  }

  const providerName = provider.userName || provider.email || 'Provider';

  const unassignedMedicines = await db.collection('medicineinventories')
    .find({
      $or: [
        { providerId: { $exists: false } },
        { providerId: null },
      ],
      isActive: { $ne: false },
    })
    .sort({ createdAt: 1 })
    .limit(targetCount)
    .project({ _id: 1 })
    .toArray();

  if (unassignedMedicines.length === 0) {
    console.log('No unassigned medicines found.');
    return;
  }

  const ids = unassignedMedicines.map((m) => m._id);

  const updateResult = await db.collection('medicineinventories').updateMany(
    { _id: { $in: ids } },
    {
      $set: {
        providerId: provider._id,
        providerName,
        updatedAt: new Date(),
      },
    }
  );

  const providerTotal = await db.collection('medicineinventories').countDocuments({
    providerId: provider._id,
    isActive: { $ne: false },
  });

  console.log(`Assigned medicines: ${updateResult.modifiedCount}`);
  console.log(`Provider: ${provider.email} (${providerName})`);
  console.log(`Provider total active medicines: ${providerTotal}`);
}

run()
  .catch((err) => {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
