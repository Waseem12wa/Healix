#!/usr/bin/env node

/**
 * Comprehensive Feature Test Script
 * Tests all major features after fixes
 * 
 * Features tested:
 * 1. Medicines API with proper parameters
 * 2. DFI predictions
 * 3. DDI predictions
 * 4. Alternative recommendations
 * 5. Side effects prediction
 * 6. Health Assistant
 * 7. Medical Record Summarization
 */

import axios from 'axios';
import chalk from 'chalk';

const BASE_URL = 'http://localhost:5000';
const delays = [];

// ============================================
// UTILITY FUNCTIONS
// ============================================

async function testEndpoint(name, method, url, data = null, expectedStatus = 200) {
    try {
        const startTime = Date.now();
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            timeout: 30000,
            validateStatus: () => true, // Don't throw on any status
        };

        if (data) {
            config.data = data;
            config.headers = { 'Content-Type': 'application/json' };
        }

        const response = await axios(config);
        const latency = Date.now() - startTime;
        delays.push({ name, latency });

        const success = response.status === expectedStatus;
        const status = success ? chalk.green('✅') : chalk.red('❌');

        console.log(`${status} ${name} (${response.status}) - ${latency}ms`);

        if (!success && response.data?.error) {
            console.log(`   Error: ${response.data.error}`);
        }

        return { success, latency, status: response.status, data: response.data };
    } catch (error) {
        console.log(chalk.red(`❌ ${name} - Connection Error: ${error.message}`));
        return { success: false, latency: -1, error: error.message };
    }
}

// ============================================
// TEST SUITE
// ============================================

async function runTests() {
    console.log(chalk.bold.cyan('\n🧪 HEALIX FEATURE TEST SUITE\n'));

    const results = {};

    // ========== MEDICINES API ==========
    console.log(chalk.bold.yellow('1️⃣  MEDICINES API'));
    results.medicines = await testEndpoint(
        'Get medicines page 1',
        'GET',
        '/api/payments/medicines?search=&limit=20&page=1',
        null,
        200
    );

    if (results.medicines.success && results.medicines.data?.medicines) {
        console.log(`   📦 Retrieved ${results.medicines.data.medicines.length} medicines`);
        const med = results.medicines.data.medicines[0];
        if (med) {
            console.log(`   Example: ${med.medicineName} - Rs ${med.sellingPrice}`);
        }
    }

    results.medicinesSearch = await testEndpoint(
        'Search aspirn',
        'GET',
        '/api/payments/medicines?search=aspirin&limit=20&page=1',
        null,
        200
    );

    // ========== DFI PREDICTIONS ==========
    console.log(chalk.bold.yellow('\n2️⃣  DRUG-FOOD INTERACTION (DFI)'));
    results.dfi = await testEndpoint(
        'Predict warfarin + grapefruit',
        'POST',
        '/api/dfi/predict',
        { medicine: 'warfarin', food: 'grapefruit' },
        200
    );

    if (results.dfi.success && results.dfi.data?.percentage !== undefined) {
        console.log(`   Risk: ${results.dfi.data.severity_label} (${results.dfi.data.percentage}%)`);
    }

    // ========== DDI PREDICTIONS ==========
    console.log(chalk.bold.yellow('\n3️⃣  DRUG-DRUG INTERACTION (DDI)'));
    results.ddi = await testEndpoint(
        'Predict warfarin + aspirin',
        'POST',
        '/api/ddi/predict',
        { medicine1: 'warfarin', medicine2: 'aspirin' },
        200
    );

    if (results.ddi.success && results.ddi.data?.severity !== undefined) {
        console.log(`   Severity: ${results.ddi.data.severity_label}`);
    }

    // ========== ALTERNATIVES ==========
    console.log(chalk.bold.yellow('\n4️⃣  DRUG ALTERNATIVES'));
    results.alternatives = await testEndpoint(
        'Get alternatives for aspirin',
        'POST',
        '/api/alternative/recommend',
        { medicine: 'aspirin', top_n: 5 },
        200
    );

    if (results.alternatives.success && results.alternatives.data?.alternatives) {
        console.log(`   🔧 Found ${results.alternatives.data.alternatives.length} alternatives`);
        const alt = results.alternatives.data.alternatives[0];
        if (alt) {
            console.log(`   Example: ${alt.name} (${alt.similarity.toFixed(1)}% similarity)`);
            if (alt.inStock) {
                console.log(`   ✅ In Stock: ${alt.inventoryQuantity} units @ Rs ${alt.actualSellingPrice}`);
            } else {
                console.log(`   ❌ Not in inventory`);
            }
        }
    }

    // ========== SIDE EFFECTS ==========
    console.log(chalk.bold.yellow('\n5️⃣  SIDE EFFECTS'));
    results.sideEffects = await testEndpoint(
        'Predict side effects for aspirin',
        'POST',
        '/api/side-effects/predict',
        { medicine: 'aspirin' },
        200
    );

    if (results.sideEffects.success && results.sideEffects.data?.side_effects) {
        console.log(`   ⚠️  Found ${results.sideEffects.data.side_effects.length} possible side effects`);
        if (results.sideEffects.data.side_effects.length > 0) {
            console.log(`   Example: ${results.sideEffects.data.side_effects[0]}`);
        }
    }

    // ========== HEALTH ASSISTANT ==========
    console.log(chalk.bold.yellow('\n6️⃣  HEALTH ASSISTANT (AI CHATBOT)'));
    results.healthAssistant = await testEndpoint(
        'Chat: "What is diabetes?"',
        'POST',
        '/api/health-assistant/chat',
        { message: 'What is diabetes?' },
        200
    );

    if (results.healthAssistant.success && results.healthAssistant.data?.response) {
        const preview = results.healthAssistant.data.response.substring(0, 60);
        console.log(`   💬 Response: "${preview}..."`);
    }

    // ========== MEDICAL RECORD SUMMARIZATION ==========
    console.log(chalk.bold.yellow('\n7️⃣  MEDICAL RECORD SUMMARIZATION'));
    results.medicalRecord = await testEndpoint(
        'Summarize records: "fever and cough for 3 days"',
        'POST',
        '/api/medical-record/summarize',
        { records: 'Patient reports fever and cough for 3 days, mild headache, no shortness of breath' },
        200
    );

    if (results.medicalRecord.success && results.medicalRecord.data?.summary) {
        const preview = results.medicalRecord.data.summary.substring(0, 60);
        console.log(`   📝 Summary: "${preview}..."`);
    }

    // ========== SUMMARY ==========
    console.log(chalk.bold.yellow('\n\n📊 TEST SUMMARY'));
    const totalTests = Object.keys(results).length;
    const passed = Object.values(results).filter(r => r.success).length;
    const failed = totalTests - passed;

    console.log(`✅ Passed: ${passed}/${totalTests}`);
    if (failed > 0) {
        console.log(chalk.red(`❌ Failed: ${failed}/${totalTests}`));
    }

    console.log(chalk.bold.yellow('\n⏱️  LATENCY REPORT'));
    delays
        .filter(d => d.latency > 0)
        .sort((a, b) => b.latency - a.latency)
        .forEach(d => {
            const color = d.latency > 5000 ? chalk.yellow : chalk.green;
            console.log(`   ${color(d.latency.toString().padStart(6))}ms - ${d.name}`);
        });

    const avgLatency = delays
        .filter(d => d.latency > 0)
        .reduce((sum, d) => sum + d.latency, 0) / delays.filter(d => d.latency > 0).length;
    console.log(chalk.cyan(`   Average: ${avgLatency.toFixed(0)}ms`));

    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
});
