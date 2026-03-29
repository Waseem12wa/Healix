import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const sourceUri = process.env.SOURCE_MONGODB_URI || 'mongodb://127.0.0.1:27017/healix';
const targetUri = process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI;

if (!targetUri) {
  console.error('TARGET_MONGODB_URI or MONGODB_URI is required.');
  process.exit(1);
}

const sourceConn = mongoose.createConnection(sourceUri, { serverSelectionTimeoutMS: 10000 });
const targetConn = mongoose.createConnection(targetUri, { serverSelectionTimeoutMS: 10000 });

try {
  await Promise.all([sourceConn.asPromise(), targetConn.asPromise()]);

  const sourceCollections = await sourceConn.db.listCollections({}, { nameOnly: true }).toArray();
  const targetCollections = await targetConn.db.listCollections({}, { nameOnly: true }).toArray();

  const names = [...new Set([
    ...sourceCollections.map((c) => c.name),
    ...targetCollections.map((c) => c.name),
  ])]
    .filter((name) => !name.startsWith('system.'))
    .sort();

  console.log(`Source DB: ${sourceConn.name}`);
  console.log(`Target DB: ${targetConn.name}`);
  console.log('');

  for (const name of names) {
    const [sourceCount, targetCount] = await Promise.all([
      sourceConn.db.collection(name).countDocuments(),
      targetConn.db.collection(name).countDocuments(),
    ]);
    console.log(`${name}: local=${sourceCount}, atlas=${targetCount}`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await Promise.allSettled([sourceConn.close(), targetConn.close()]);
}
