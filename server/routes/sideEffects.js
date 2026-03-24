/**
 * Side Effect Checker API Routes
 * 
 * Endpoints:
 *   POST /api/side-effects/predict - Predict side effects for a medicine
 *   POST /api/side-effects/batch - Batch predict for multiple medicines
 *   GET /api/side-effects/metrics - Get model performance metrics
 *   POST /api/side-effects/check-combination - Check side effects for multiple medicines
 */

import express from 'express';
import {
    predictSideEffects,
    batchPredictSideEffects,
    getPerformanceMetrics,
    formatSideEffectsForDisplay,
    predictSideEffectsWithFallback,
    checkSideEffectServiceHealth
} from '../utils/sideEffectClient.js';

const router = express.Router();

// Check service health on startup
checkSideEffectServiceHealth().catch(e => console.error('Side Effect Service not available at startup'));

// ============================================
// PREDICT SIDE EFFECTS FOR SINGLE MEDICINE
// ============================================

/**
 * POST /api/side-effects/predict
 * 
 * Predict side effects for a single medicine
 * 
 * Request Body:
 * {
 *   "medicine": "Aspirin",
 *   "age": 45,
 *   "conditions": ["hypertension", "diabetes"],
 *   "dosage": "500mg twice daily"
 * }
 */
router.post('/predict', async (req, res) => {
    try {
        const { medicine, age, conditions, dosage } = req.body;

        // Validate input
        if (!medicine || typeof medicine !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: "medicine" must be a non-empty string'
            });
        }

        console.log(`📋 Side effect prediction request for: ${medicine}`);

        // Get prediction
        const result = await predictSideEffectsWithFallback(medicine, {
            age,
            conditions,
            dosage
        });

        if (result.success) {
            // Format for display
            const formatted = formatSideEffectsForDisplay(result);

            return res.status(200).json({
                success: true,
                medicine: medicine,
                sideEffects: result.data.side_effects || [],
                summary: formatted,
                modelInfo: result.data.model_info,
                isFallback: result.isFallbackData || false,
                timestamp: new Date().toISOString()
            });
        } else {
            return res.status(500).json({
                success: false,
                error: 'Failed to predict side effects',
                details: result.error
            });
        }
    } catch (error) {
        console.error('❌ Error in side effects prediction:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal error during side effect prediction',
            details: error.message
        });
    }
});

// ============================================
// BATCH PREDICT FOR MULTIPLE MEDICINES
// ============================================

/**
 * POST /api/side-effects/batch
 * 
 * Batch predict side effects for multiple medicines
 * 
 * Request Body:
 * {
 *   "medicines": ["Aspirin", "Metformin", "Lisinopril"],
 *   "age": 45,
 *   "conditions": ["hypertension"]
 * }
 */
router.post('/batch', async (req, res) => {
    try {
        const { medicines, age, conditions } = req.body;

        // Validate input
        if (!Array.isArray(medicines) || medicines.length === 0) {
            return res.status(400).json({
                success: false,
                error: '"medicines" must be a non-empty array'
            });
        }

        // Validate all items are strings
        if (!medicines.every(m => typeof m === 'string' && m.trim().length > 0)) {
            return res.status(400).json({
                success: false,
                error: 'All medicines must be non-empty strings'
            });
        }

        console.log(`📋 Batch side effect prediction for ${medicines.length} medicines`);

        // Get batch predictions
        const result = await batchPredictSideEffects(medicines, {
            age,
            conditions
        });

        if (result.success) {
            // Format all predictions
            const formatted = result.data.predictions.map(pred => ({
                medicine: pred.medicine,
                sideEffects: pred.side_effects || [],
                summary: formatSideEffectsForDisplay({ success: true, data: pred }),
                modelInfo: pred.model_info,
                isFallback: pred.isFallbackData || false
            }));

            return res.status(200).json({
                success: true,
                totalMedicines: medicines.length,
                predictions: formatted,
                timestamp: new Date().toISOString()
            });
        } else {
            return res.status(500).json({
                success: false,
                error: 'Failed to predict side effects for batch',
                details: result.error
            });
        }
    } catch (error) {
        console.error('❌ Error in batch side effects prediction:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal error during batch prediction',
            details: error.message
        });
    }
});

// ============================================
// CHECK SIDE EFFECTS FOR MEDICINE COMBINATION
// ============================================

/**
 * POST /api/side-effects/check-combination
 * 
 * Comprehensive check:
 * 1. Individual side effects for each medicine
 * 2. Combined risk assessment
 * 3. Warnings for medication interactions
 * 
 * Request Body:
 * {
 *   "medicines": ["Aspirin", "Warfarin"],
 *   "age": 65,
 *   "conditions": ["atrial-fibrillation"]
 * }
 */
router.post('/check-combination', async (req, res) => {
    try {
        const { medicines, age, conditions } = req.body;

        // Validate input
        if (!Array.isArray(medicines) || medicines.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'At least 2 medicines required for combination check'
            });
        }

        console.log(`🔄 Checking side effect combination for ${medicines.length} medicines`);

        // Get predictions for each medicine
        const predictions = await Promise.all(
            medicines.map(med => predictSideEffectsWithFallback(med, { age, conditions }))
        );

        // Extract all side effects
        const allSideEffects = [];
        const medicines_data = [];

        predictions.forEach((pred, idx) => {
            if (pred.success && pred.data.side_effects) {
                medicines_data.push({
                    medicine: pred.data.medicine,
                    sideEffects: pred.data.side_effects
                });

                pred.data.side_effects.forEach(se => {
                    allSideEffects.push({ ...se, medicine: pred.data.medicine });
                });
            }
        });

        // Identify common side effects (compound effects)
        const sideEffectCounts = {};
        allSideEffects.forEach(se => {
            const effect = se.side_effect.toLowerCase();
            if (!sideEffectCounts[effect]) {
                sideEffectCounts[effect] = {
                    effect,
                    count: 0,
                    medicines: [],
                    avgProbability: 0
                };
            }
            sideEffectCounts[effect].count++;
            sideEffectCounts[effect].medicines.push(se.medicine);
            sideEffectCounts[effect].avgProbability += se.probability;
        });

        // Calculate averages and sort
        const compoundSideEffects = Object.values(sideEffectCounts)
            .map(se => ({
                ...se,
                avgProbability: se.avgProbability / se.count,
                riskLevel: se.count > 1 ? 'high' : 'moderate'
            }))
            .sort((a, b) => b.avgProbability - a.avgProbability);

        return res.status(200).json({
            success: true,
            medicines: medicines,
            individualPredictions: medicines_data,
            combinedAnalysis: {
                totalUniqueEffects: Object.keys(sideEffectCounts).length,
                commonEffects: compoundSideEffects.filter(e => e.count > 1),
                allEffects: compoundSideEffects,
                warningLevel: compoundSideEffects.filter(e => e.count > 1).length > 0 ? 'elevated' : 'normal'
            },
            recommendation: generateCombinationRecommendation(compoundSideEffects),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error in combination check:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal error during combination check',
            details: error.message
        });
    }
});

// ============================================
// MODEL PERFORMANCE METRICS
// ============================================

/**
 * GET /api/side-effects/metrics
 * 
 * Get model performance statistics
 */
router.get('/metrics', async (req, res) => {
    try {
        const metricsResult = await getPerformanceMetrics();

        if (metricsResult.success) {
            return res.status(200).json({
                success: true,
                metrics: metricsResult.metrics,
                timestamp: new Date().toISOString()
            });
        } else {
            return res.status(500).json({
                success: false,
                error: 'Failed to retrieve metrics',
                details: metricsResult.error
            });
        }
    } catch (error) {
        console.error('❌ Error retrieving metrics:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal error retrieving metrics',
            details: error.message
        });
    }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateCombinationRecommendation(compoundSideEffects) {
    const commonEffects = compoundSideEffects.filter(e => e.count > 1);
    
    if (commonEffects.length === 0) {
        return "No significant common side effects detected between these medicines.";
    }
    
    const highRisk = commonEffects.filter(e => e.avgProbability > 0.7);
    
    if (highRisk.length > 0) {
        const effects = highRisk.map(e => e.effect).join(', ');
        return `⚠️ Elevated risk of: ${effects}. Please consult your healthcare provider before taking these medicines together.`;
    }
    
    return "Moderate combination risk detected. Monitor for common side effects and consult healthcare provider if needed.";
}

// ============================================
// HEALTH CHECK
// ============================================

/**
 * GET /api/side-effects/health
 * 
 * Check if side effect service is healthy
 */
router.get('/health', async (req, res) => {
    const isHealthy = await checkSideEffectServiceHealth();
    
    return res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        service: 'side-effect-predictor',
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString()
    });
});

export default router;
