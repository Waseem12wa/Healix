#!/usr/bin/env node

import mongoose from 'mongoose';
import MedicineInventory from '../models/MedicineInventory.js';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required. Set it to your Atlas cluster URI in server/.env.');
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  await MedicineInventory.collection.createIndex({ medicineName: 1, isActive: 1 }, { background: true });
  await MedicineInventory.collection.createIndex({ genericName: 1, isActive: 1 }, { background: true });
  await MedicineInventory.collection.createIndex({ category: 1, isActive: 1 }, { background: true });
  await MedicineInventory.collection.createIndex({ quantity: 1, isActive: 1 }, { background: true });
  await MedicineInventory.collection.createIndex({ expiryDate: 1, isActive: 1 }, { background: true });
  await MedicineInventory.collection.createIndex(
    { medicineName: 'text', genericName: 'text', activeIngredients: 'text' },
    { name: 'medicine_text_idx', background: true }
  );

  console.log('✅ Medicine indexes created/updated successfully');

  const indexes = await MedicineInventory.collection.indexes();
  console.log('📚 Current indexes:');
  indexes.forEach((idx) => console.log(` - ${idx.name}`));

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('❌ Failed to create indexes:', err.message);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
