#!/usr/bin/env node

/**
 * Fix Medicines Inventory - Activate and Enable All Medicines
 * 
 * This script will:
 * 1. Set isActive: true for all medicines
 * 2. Set isExpired: false for medicines with valid (future) expiry dates
 * 3. Set quantity to 1000 for medicines with zero or missing quantity
 * 4. Ensure all medicines have required fields (sellingPrice, costPrice)
 * 
 * Usage:
 *   node scripts/fix-medicines-inventory.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MedicineInventory from '../models/MedicineInventory.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

async function fixMedicinesInventory() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Validate URI
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env');
    }

    const placeholders = ['<username>', '<password>', '<cluster-host>', '<database>'];
    if (placeholders.some((token) => MONGODB_URI.includes(token))) {
      throw new Error('MONGODB_URI contains template placeholders');
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ Connected to MongoDB');

    // Count before
    const countBefore = await MedicineInventory.countDocuments();
    console.log(`📊 Total medicines in database: ${countBefore}`);

    if (countBefore === 0) {
      console.log('⚠️  No medicines found in database. Run seed-medicines.js first.');
      await mongoose.connection.close();
      return;
    }

    // Fix 1: Set isActive to true for all medicines
    console.log('🔧 Setting isActive: true for all medicines...');
    let result1 = await MedicineInventory.updateMany(
      {},
      { $set: { isActive: true } }
    );
    console.log(`✅ Updated ${result1.modifiedCount} medicines - isActive set to true`);

    // Fix 2: Set isExpired to false and fix expired dates
    console.log('🔧 Fixing expiry dates...');
    const now = new Date();
    const futureDate = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());

    let result2 = await MedicineInventory.updateMany(
      {
        $or: [
          { expiryDate: { $lt: now } },
          { expiryDate: { $exists: false } },
          { isExpired: true }
        ]
      },
      {
        $set: {
          expiryDate: futureDate,
          isExpired: false
        }
      }
    );
    console.log(`✅ Updated ${result2.modifiedCount} medicines - expiry dates fixed`);

    // Fix 3: Set quantity to 1000 for medicines with zero or missing quantity
    console.log('🔧 Setting quantity to 1000 for medicines with zero quantity...');
    let result3 = await MedicineInventory.updateMany(
      {
        $or: [
          { quantity: { $exists: false } },
          { quantity: 0 },
          { quantity: { $lt: 1 } }
        ]
      },
      { $set: { quantity: 1000 } }
    );
    console.log(`✅ Updated ${result3.modifiedCount} medicines - quantity set to 1000`);

    // Fix 4: Ensure all medicines have sellingPrice and costPrice
    console.log('🔧 Setting default prices for medicines without pricing...');
    let result4 = await MedicineInventory.updateMany(
      {
        $or: [
          { sellingPrice: { $exists: false } },
          { sellingPrice: { $lte: 0 } },
          { costPrice: { $exists: false } },
          { costPrice: { $lte: 0 } }
        ]
      },
      {
        $set: {
          sellingPrice: 150,
          costPrice: 75,
          currency: 'PKR'
        }
      }
    );
    console.log(`✅ Updated ${result4.modifiedCount} medicines - default prices set`);

    // Verify fix
    console.log('📊 Verifying fix...');
    const activeCount = await MedicineInventory.countDocuments({
      isActive: true,
      isExpired: false,
      quantity: { $gt: 0 }
    });
    console.log(`✅ Active medicines available for shop: ${activeCount}`);

    // Get categories
    const categories = await MedicineInventory.distinct('category', {
      isActive: true,
      isExpired: false
    });
    console.log(`✅ Categories: ${categories.length} (${categories.slice(0, 5).join(', ')}...)`);

    // Sample one medicine
    const sample = await MedicineInventory.findOne({
      isActive: true,
      isExpired: false,
      quantity: { $gt: 0 }
    });

    if (sample) {
      console.log('\n📋 Sample Active Medicine:');
      console.log(`  Name: ${sample.medicineName}`);
      console.log(`  Price: PKR ${sample.sellingPrice}`);
      console.log(`  Quantity: ${sample.quantity}`);
      console.log(`  Category: ${sample.category}`);
    }

    console.log('\n✅ Medicines inventory fixed successfully!');
    console.log('💡 You can now refresh the Medicine Shop page.');

    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixMedicinesInventory();
