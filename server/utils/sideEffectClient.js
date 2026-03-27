/**
 * Side Effect Predictor Client
 * 
 * This is a Node.js/Express wrapper that communicates with the
 * Python side effect predictor microservice.
 * 
 * Usage:
 *   import { predictSideEffects, batchPredictSideEffects } from './sideEffectClient.js';
 *   
 *   const result = await predictSideEffects('Aspirin', { age: 45 });
 *   console.log(result);
 */

import axios from 'axios';

const SIDE_EFFECT_SERVICE_URL = process.env.SIDE_EFFECT_SERVICE_URL || 'http://localhost:5004';

// ============================================
// CONFIGURATION
// ============================================

const axiosInstance = axios.create({
    baseURL: SIDE_EFFECT_SERVICE_URL,
    timeout: 30000, // 30 second timeout
    headers: {
        'Content-Type': 'application/json'
    }
});

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check if the side effect predictor service is available
 */
export async function checkSideEffectServiceHealth() {
    try {
        const response = await axiosInstance.get('/health');
        console.log('✅ Side Effect Service is healthy:', response.data);
        return response.data.status === 'healthy';
    } catch (error) {
        console.error('❌ Side Effect Service is not available:', error.message);
        return false;
    }
}

// ============================================
// SINGLE PREDICTION
// ============================================

/**
 * Predict side effects for a single medicine
 * 
 * @param {string} medicineName - Name of the medicine (e.g., "Aspirin")
 * @param {object} options - Additional context
 *   - age {number}: Patient age
 *   - conditions {array}: Patient medical conditions
 *   - dosage {string}: Dosage information
 * 
 * @returns {object} Prediction result with side effects and confidence scores
 */
export async function predictSideEffects(medicineName, options = {}) {
    try {
        if (!medicineName || typeof medicineName !== 'string') {
            throw new Error('Medicine name must be a non-empty string');
        }

        const payload = {
            medicine: medicineName.trim(),
            age: options.age || null,
            conditions: options.conditions || [],
            dosage: options.dosage || null
        };

        console.log(`🔍 Predicting side effects for: ${medicineName}`);
        const response = await axiosInstance.post('/predict', payload);

        if (response.data.success) {
            console.log(`✅ Successfully predicted side effects for ${medicineName}`);
            return {
                success: true,
                data: response.data
            };
        } else {
            console.error(`❌ Prediction failed: ${response.data.error}`);
            return {
                success: false,
                error: response.data.error,
                medicine: medicineName
            };
        }
    } catch (error) {
        console.error(`❌ Error predicting side effects: ${error.message}`);
        return {
            success: false,
            error: error.message,
            medicine: medicineName,
            statusCode: error.response?.status
        };
    }
}

// ============================================
// BATCH PREDICTION
// ============================================

/**
 * Predict side effects for multiple medicines in one request
 * 
 * @param {array} medicines - Array of medicine names
 * @param {object} options - Additional context
 *   - age {number}: Patient age
 *   - conditions {array}: Patient medical conditions
 * 
 * @returns {object} Prediction results for all medicines
 */
export async function batchPredictSideEffects(medicines, options = {}) {
    try {
        if (!Array.isArray(medicines) || medicines.length === 0) {
            throw new Error('Medicines must be a non-empty array');
        }

        const payload = {
            medicines: medicines.map(m => m.trim()),
            age: options.age || null,
            conditions: options.conditions || []
        };

        console.log(`🔍 Batch predicting side effects for ${medicines.length} medicines`);
        const response = await axiosInstance.post('/batch', payload);

        if (response.data.success) {
            console.log(`✅ Successfully predicted side effects for ${medicines.length} medicines`);
            return {
                success: true,
                data: response.data
            };
        } else {
            console.error(`❌ Batch prediction failed: ${response.data.error}`);
            return {
                success: false,
                error: response.data.error
            };
        }
    } catch (error) {
        console.error(`❌ Error in batch prediction: ${error.message}`);
        return {
            success: false,
            error: error.message,
            statusCode: error.response?.status
        };
    }
}

// ============================================
// PERFORMANCE METRICS
// ============================================

/**
 * Get model performance metrics
 * 
 * Returns statistics about prediction latency, confidence scores, etc.
 */
export async function getPerformanceMetrics() {
    try {
        console.log('📊 Fetching performance metrics...');
        const response = await axiosInstance.get('/metrics');
        
        console.log('✅ Retrieved performance metrics');
        return {
            success: true,
            metrics: response.data
        };
    } catch (error) {
        console.error(`❌ Error fetching metrics: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Reset performance metrics (useful for benchmarking)
 */
export async function resetPerformanceMetrics() {
    try {
        console.log('🔄 Resetting performance metrics...');
        const response = await axiosInstance.post('/reset-metrics');
        
        console.log('✅ Metrics reset successfully');
        return {
            success: true,
            message: response.data.message
        };
    } catch (error) {
        console.error(`❌ Error resetting metrics: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse and score side effects for display
 * 
 * Converts raw predictions into user-friendly format
 */
export function formatSideEffectsForDisplay(prediction) {
    if (!prediction.success || !prediction.data.side_effects) {
        return null;
    }

    const sideEffects = prediction.data.side_effects;
    
    // Group by severity
    const byIncidence = {
        critical: [],
        high: [],
        moderate: [],
        low: []
    };

    sideEffects.forEach(se => {
        if (se.probability > 0.8) byIncidence.critical.push(se);
        else if (se.probability > 0.6) byIncidence.high.push(se);
        else if (se.probability > 0.4) byIncidence.moderate.push(se);
        else byIncidence.low.push(se);
    });

    return {
        medicine: prediction.data.medicine,
        totalSideEffects: sideEffects.length,
        bySeverity: byIncidence,
        topSideEffects: sideEffects.slice(0, 5),
        modelInfo: prediction.data.model_info
    };
}

export default {
    checkSideEffectServiceHealth,
    predictSideEffects,
    batchPredictSideEffects,
    getPerformanceMetrics,
    resetPerformanceMetrics,
    formatSideEffectsForDisplay,
};
