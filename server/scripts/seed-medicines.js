#!/usr/bin/env node

/**
 * Medicine Inventory Seeding Script
 * 
 * Loads medicines into MongoDB from multiple sources:
 * 1. Default comprehensive medicine list
 * 2. CSV files (Kaggle datasets)
 * 3. JSON fixtures
 * 
 * Usage:
 *   node scripts/seed-medicines.js              - Seed from defaults
 *   node scripts/seed-medicines.js --csv FILE  - Seed from CSV
 *   node scripts/seed-medicines.js --clear     - Clear inventory first
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import MedicineInventory from '../models/MedicineInventory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healix';

// ============================================
// COMPREHENSIVE MEDICINE DATABASE
// ============================================

const DEFAULT_MEDICINES = [
    // Pain Relief
    { medicineName: 'Aspirin', genericName: 'Acetylsalicylic acid', category: 'Analgesic', sellingPrice: 50, costPrice: 20, quantity: 1000, activeIngredients: ['acetylsalicylic acid'], therapeuticUse: 'Pain relief, anti-inflammatory' },
    { medicineName: 'Ibuprofen', genericName: 'Ibuprofen', category: 'NSAID', sellingPrice: 60, costPrice: 25, quantity: 1000, activeIngredients: ['ibuprofen'], therapeuticUse: 'Pain relief, fever reduction' },
    { medicineName: 'Paracetamol', genericName: 'Acetaminophen', category: 'Analgesic', sellingPrice: 45, costPrice: 18, quantity: 1500, activeIngredients: ['paracetamol'], therapeuticUse: 'Pain relief, fever reduction' },
    { medicineName: 'Naproxen', genericName: 'Naproxen', category: 'NSAID', sellingPrice: 75, costPrice: 30, quantity: 800, activeIngredients: ['naproxen'], therapeuticUse: 'Pain relief, anti-inflammatory' },
    { medicineName: 'Ketorolac', genericName: 'Ketorolac', category: 'NSAID', sellingPrice: 100, costPrice: 40, quantity: 500, activeIngredients: ['ketorolac'], therapeuticUse: 'Strong pain relief' },
    
    // Diabetes Management
    { medicineName: 'Metformin', genericName: 'Metformin HCl', category: 'Antidiabetic', sellingPrice: 150, costPrice: 60, quantity: 2000, activeIngredients: ['metformin'], therapeuticUse: 'Type 2 diabetes' },
    { medicineName: 'Glipizide', genericName: 'Glipizide', category: 'Antidiabetic', sellingPrice: 120, costPrice: 50, quantity: 1000, activeIngredients: ['glipizide'], therapeuticUse: 'Type 2 diabetes' },
    { medicineName: 'Sitagliptin', genericName: 'Sitagliptin', category: 'Antidiabetic', sellingPrice: 250, costPrice: 100, quantity: 500, activeIngredients: ['sitagliptin'], therapeuticUse: 'Type 2 diabetes' },
    { medicineName: 'Linagliptin', genericName: 'Linagliptin', category: 'Antidiabetic', sellingPrice: 280, costPrice: 110, quantity: 600, activeIngredients: ['linagliptin'], therapeuticUse: 'Type 2 diabetes' },
    { medicineName: 'Insulin Glargine', genericName: 'Insulin glargine', category: 'Antidiabetic', sellingPrice: 500, costPrice: 200, quantity: 300, activeIngredients: ['insulin glargine'], therapeuticUse: 'Type 1 and Type 2 diabetes' },
    
    // Hypertension Management
    { medicineName: 'Lisinopril', genericName: 'Lisinopril', category: 'ACE Inhibitor', sellingPrice: 100, costPrice: 40, quantity: 1500, activeIngredients: ['lisinopril'], therapeuticUse: 'Hypertension, heart failure' },
    { medicineName: 'Amlodipine', genericName: 'Amlodipine besylate', category: 'Calcium Channel Blocker', sellingPrice: 120, costPrice: 48, quantity: 1200, activeIngredients: ['amlodipine'], therapeuticUse: 'Hypertension, angina' },
    { medicineName: 'Enalapril', genericName: 'Enalapril maleate', category: 'ACE Inhibitor', sellingPrice: 110, costPrice: 44, quantity: 900, activeIngredients: ['enalapril'], therapeuticUse: 'Hypertension' },
    { medicineName: 'Metoprolol', genericName: 'Metoprolol tartrate', category: 'Beta Blocker', sellingPrice: 90, costPrice: 36, quantity: 1000, activeIngredients: ['metoprolol'], therapeuticUse: 'Hypertension, angina' },
    { medicineName: 'Losartan', genericName: 'Losartan potassium', category: 'ARB', sellingPrice: 130, costPrice: 52, quantity: 800, activeIngredients: ['losartan'], therapeuticUse: 'Hypertension' },
    
    // Cholesterol Management
    { medicineName: 'Atorvastatin', genericName: 'Atorvastatin calcium', category: 'Statin', sellingPrice: 140, costPrice: 56, quantity: 1500, activeIngredients: ['atorvastatin'], therapeuticUse: 'High cholesterol' },
    { medicineName: 'Simvastatin', genericName: 'Simvastatin', category: 'Statin', sellingPrice: 110, costPrice: 44, quantity: 1200, activeIngredients: ['simvastatin'], therapeuticUse: 'High cholesterol' },
    { medicineName: 'Rosuvastatin', genericName: 'Rosuvastatin calcium', category: 'Statin', sellingPrice: 180, costPrice: 72, quantity: 800, activeIngredients: ['rosuvastatin'], therapeuticUse: 'High cholesterol' },
    
    // Antibiotics
    { medicineName: 'Amoxicillin', genericName: 'Amoxicillin trihydrate', category: 'Antibiotic', sellingPrice: 80, costPrice: 32, quantity: 2000, activeIngredients: ['amoxicillin'], therapeuticUse: 'Bacterial infections' },
    { medicineName: 'Azithromycin', genericName: 'Azithromycin', category: 'Antibiotic', sellingPrice: 120, costPrice: 48, quantity: 1000, activeIngredients: ['azithromycin'], therapeuticUse: 'Bacterial infections' },
    { medicineName: 'Ciprofloxacin', genericName: 'Ciprofloxacin HCl', category: 'Antibiotic', sellingPrice: 100, costPrice: 40, quantity: 1200, activeIngredients: ['ciprofloxacin'], therapeuticUse: 'Bacterial infections' },
    { medicineName: 'Cephalexin', genericName: 'Cephalexin', category: 'Antibiotic', sellingPrice: 90, costPrice: 36, quantity: 1000, activeIngredients: ['cephalexin'], therapeuticUse: 'Bacterial infections' },
    
    // Gastrointestinal
    { medicineName: 'Omeprazole', genericName: 'Omeprazole', category: 'PPI', sellingPrice: 110, costPrice: 44, quantity: 1500, activeIngredients: ['omeprazole'], therapeuticUse: 'GERD, ulcer prevention' },
    { medicineName: 'Ranitidine', genericName: 'Ranitidine HCl', category: 'H2 Blocker', sellingPrice: 80, costPrice: 32, quantity: 1000, activeIngredients: ['ranitidine'], therapeuticUse: 'GERD, acid reflux' },
    { medicineName: 'Metoclopramide', genericName: 'Metoclopramide HCl', category: 'Antiemetic', sellingPrice: 70, costPrice: 28, quantity: 800, activeIngredients: ['metoclopramide'], therapeuticUse: 'Nausea, vomiting' },
    
    // Thyroid
    { medicineName: 'Levothyroxine', genericName: 'Levothyroxine sodium', category: 'Thyroid', sellingPrice: 95, costPrice: 38, quantity: 1200, activeIngredients: ['levothyroxine'], therapeuticUse: 'Hypothyroidism' },
    { medicineName: 'Propylthiouracil', genericName: 'Propylthiouracil', category: 'Thyroid', sellingPrice: 120, costPrice: 48, quantity: 600, activeIngredients: ['propylthiouracil'], therapeuticUse: 'Hyperthyroidism' },
    
    // Vitamins & Supplements
    { medicineName: 'Vitamin C', genericName: 'Ascorbic acid', category: 'Vitamin', sellingPrice: 40, costPrice: 16, quantity: 3000, activeIngredients: ['ascorbic acid'], therapeuticUse: 'Immune support' },
    { medicineName: 'Vitamin D3', genericName: 'Cholecalciferol', category: 'Vitamin', sellingPrice: 60, costPrice: 24, quantity: 2000, activeIngredients: ['cholecalciferol'], therapeuticUse: 'Bone health' },
    { medicineName: 'Calcium Carbonate', genericName: 'Calcium carbonate', category: 'Supplement', sellingPrice: 70, costPrice: 28, quantity: 2000, activeIngredients: ['calcium carbonate'], therapeuticUse: 'Bone health, acid relief' },
    { medicineName: 'Iron Sulfate', genericName: 'Ferrous sulfate', category: 'Supplement', sellingPrice: 50, costPrice: 20, quantity: 1500, activeIngredients: ['ferrous sulfate'], therapeuticUse: 'Iron deficiency anemia' },
    
    // Antihistamines
    { medicineName: 'Cetirizine', genericName: 'Cetirizine HCl', category: 'Antihistamine', sellingPrice: 75, costPrice: 30, quantity: 1500, activeIngredients: ['cetirizine'], therapeuticUse: 'Allergies, urticaria' },
    { medicineName: 'Loratadine', genericName: 'Loratadine', category: 'Antihistamine', sellingPrice: 80, costPrice: 32, quantity: 1200, activeIngredients: ['loratadine'], therapeuticUse: 'Allergies' },
    { medicineName: 'Fexofenadine', genericName: 'Fexofenadine HCl', category: 'Antihistamine', sellingPrice: 100, costPrice: 40, quantity: 1000, activeIngredients: ['fexofenadine'], therapeuticUse: 'Allergies' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

async function connectDB() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
}

async function disconnectDB() {
    try {
        await mongoose.disconnect();
        console.log('✅ MongoDB disconnected');
    } catch (error) {
        console.error('❌ Disconnection error:', error);
    }
}

async function clearMedicines() {
    try {
        const result = await MedicineInventory.deleteMany({});
        console.log(`🗑️  Cleared ${result.deletedCount} medicines from inventory`);
    } catch (error) {
        console.error('❌ Clear error:', error);
    }
}

function toDocument(raw, idx = 0) {
    const medicineName = String(raw.medicineName || raw.name || raw.brand_name || `medicine-${idx + 1}`).trim();
    const category = String(raw.category || 'General').trim();
    const genericName = String(raw.genericName || raw.generic_name || '').trim();
    const sellingPrice = Number.parseFloat(raw.sellingPrice ?? raw.price ?? 100);
    const costPrice = Number.parseFloat(raw.costPrice ?? raw.cost ?? Math.max(1, sellingPrice * 0.6));
    const quantity = Number.parseInt(raw.quantity ?? 1000, 10);
    const activeIngredients = Array.isArray(raw.activeIngredients)
        ? raw.activeIngredients
        : String(raw.activeIngredients || raw.active_ingredients || '')
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean);
    const therapeuticUse = String(raw.therapeuticUse || raw.use || '').trim();
    const commonDosage = String(raw.commonDosage || raw.dosage || 'As prescribed').trim();

    const years = 2 + (idx % 4);
    const expiryDate = new Date(Date.now() + years * 365 * 24 * 60 * 60 * 1000);

    return {
        medicineName,
        genericName,
        category,
        sellingPrice: Number.isFinite(sellingPrice) ? sellingPrice : 100,
        costPrice: Number.isFinite(costPrice) ? costPrice : 60,
        quantity: Number.isFinite(quantity) ? quantity : 1000,
        activeIngredients,
        therapeuticUse,
        commonDosage,
        expiryDate,
        imageUrl: raw.imageUrl || raw.image_url || ''
    };
}

async function seedDefaultMedicines() {
    try {
        console.log(`📦 Seeding ${DEFAULT_MEDICINES.length} default medicines...`);
        
        const docs = DEFAULT_MEDICINES.map((m, i) => toDocument(m, i));
        const result = await MedicineInventory.insertMany(docs, { ordered: false });
        
        console.log(`✅ Successfully seeded ${result.length} medicines`);
        
        // Print summary
        const counts = await MedicineInventory.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        console.log('\n📊 Medicines by category:');
        counts.forEach(cat => console.log(`   ${cat._id}: ${cat.count}`));
        
    } catch (error) {
        if (error.code === 11000) {
            console.warn('⚠️  Some medicines already exist (duplicate key error)');
        } else {
            console.error('❌ Seeding error:', error);
        }
    }
}

async function seedFromCSV(filePath) {
    const absolute = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);

    console.log(`📥 Loading medicines from CSV: ${absolute}`);

    if (!fs.existsSync(absolute)) {
        throw new Error(`CSV file not found: ${absolute}`);
    }

    return new Promise((resolve, reject) => {
        const batch = [];
        let seen = 0;
        let inserted = 0;
        let parserRef = null;

        const flush = async () => {
            if (batch.length === 0) return;
            const docs = batch.splice(0, batch.length);
            try {
                const result = await MedicineInventory.insertMany(docs, { ordered: false });
                inserted += result.length;
            } catch (e) {
                if (e?.writeErrors?.length) {
                    inserted += docs.length - e.writeErrors.length;
                    console.warn(`⚠️ Skipped ${e.writeErrors.length} duplicate/invalid rows in a batch`);
                } else {
                    throw e;
                }
            }
        };

        fs.createReadStream(absolute)
            .pipe((parserRef = csv()))
            .on('data', async (row) => {
                seen += 1;
                batch.push(toDocument(row, seen));
                if (batch.length >= 5000) {
                    parserRef.pause();
                    flush().then(() => parserRef.resume()).catch(reject);
                }
            })
            .on('end', async () => {
                try {
                    await flush();
                    console.log(`✅ CSV load complete. Read=${seen}, Inserted=${inserted}`);
                    resolve({ seen, inserted });
                } catch (e) {
                    reject(e);
                }
            })
            .on('error', reject);
    });
}

function makeSyntheticMedicine(base, index) {
    const suffix = String(index).padStart(7, '0');
    const factor = 1 + ((index % 15) / 100);
    const price = Number((base.sellingPrice * factor).toFixed(2));
    const cost = Number((price * 0.62).toFixed(2));
    const qty = 500 + (index % 2500);

    return toDocument({
        ...base,
        medicineName: `${base.medicineName} ${suffix}`,
        genericName: base.genericName,
        category: base.category,
        sellingPrice: price,
        costPrice: cost,
        quantity: qty,
        imageUrl: `https://images.healix.local/medicines/${encodeURIComponent(base.medicineName.toLowerCase())}.jpg`
    }, index);
}

async function seedSynthetic(targetCount) {
    if (!Number.isInteger(targetCount) || targetCount <= 0) {
        throw new Error('Target count must be a positive integer.');
    }

    console.log(`🏭 Generating synthetic catalog for target=${targetCount.toLocaleString()} medicines...`);
    const batchSize = 10000;
    let inserted = 0;

    while (inserted < targetCount) {
        const batch = [];
        const remaining = targetCount - inserted;
        const currentSize = Math.min(batchSize, remaining);

        for (let i = 0; i < currentSize; i += 1) {
            const n = inserted + i;
            const base = DEFAULT_MEDICINES[n % DEFAULT_MEDICINES.length];
            batch.push(makeSyntheticMedicine(base, n + 1));
        }

        const result = await MedicineInventory.insertMany(batch, { ordered: false });
        inserted += result.length;
        process.stdout.write(`\r✅ Inserted ${inserted.toLocaleString()} / ${targetCount.toLocaleString()}`);
    }

    process.stdout.write('\n');
    console.log('🎉 Synthetic million-scale seeding complete.');
}

// ============================================
// MAIN
// ============================================

async function main() {
    const args = process.argv.slice(2);
    const has = (flag) => args.includes(flag);
    const val = (flag) => {
        const idx = args.indexOf(flag);
        return idx >= 0 ? args[idx + 1] : undefined;
    };
    
    await connectDB();
    
    try {
        if (has('--clear')) {
            await clearMedicines();
        }

        if (has('--generate')) {
            const target = Number.parseInt(val('--generate') || '1000000', 10);
            await seedSynthetic(target);
        } else if (has('--csv')) {
            const csvFile = val('--csv');
            if (!csvFile) {
                throw new Error('Missing CSV path. Usage: --csv <filePath>');
            }
            await seedFromCSV(csvFile);
        } else {
            await seedDefaultMedicines();
        }

        const total = await MedicineInventory.countDocuments({});
        console.log(`📦 Total medicines in inventory: ${total.toLocaleString()}`);
        
    } finally {
        await disconnectDB();
    }
}

main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
