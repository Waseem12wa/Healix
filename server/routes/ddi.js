/**
 * DDI (Drug-Drug Interaction) API Routes
 */

import express from 'express';
import { checkInteraction, checkHealth } from '../utils/ddiClient.js';

const router = express.Router();

/**
 * POST /api/ddi/check-interactions
 * Check interactions between multiple drugs
 * 
 * Body: { drugs: ["Aspirin", "Warfarin", "Metformin"] }
 * Returns: Array of pairwise interaction predictions
 */
router.post('/check-interactions', async (req, res) => {
    try {
        const { drugs } = req.body;

        // Validate input
        if (!drugs || !Array.isArray(drugs)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: "drugs" must be an array of medicine names',
            });
        }

        if (drugs.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'At least 2 medicines are required to check interactions',
            });
        }

        // Sanitize drug names
        const sanitizedDrugs = drugs.map(d => d.trim()).filter(d => d.length > 0);

        if (sanitizedDrugs.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'At least 2 valid medicine names are required',
            });
        }

        // Generate all pairwise combinations
        const interactions = [];
        const errors = [];

        for (let i = 0; i < sanitizedDrugs.length; i++) {
            for (let j = i + 1; j < sanitizedDrugs.length; j++) {
                const drug1 = sanitizedDrugs[i];
                const drug2 = sanitizedDrugs[j];

                try {
                    const result = await checkInteraction(drug1, drug2);

                    if (result.success) {
                        interactions.push({
                            drug1: result.drug1,
                            drug2: result.drug2,
                            probability: result.probability,
                            percentage: result.percentage,
                            severity: result.severity,
                            severityLabel: result.severity_label,
                        });
                    } else {
                        errors.push({
                            drug1,
                            drug2,
                            error: result.error,
                        });
                    }
                } catch (error) {
                    errors.push({
                        drug1,
                        drug2,
                        error: error.message,
                    });
                }
            }
        }

        // Return results
        return res.json({
            success: true,
            interactions,
            errors: errors.length > 0 ? errors : undefined,
            totalPairs: interactions.length + errors.length,
            successfulPredictions: interactions.length,
            failedPredictions: errors.length,
        });

    } catch (error) {
        console.error('DDI check-interactions error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error while checking interactions',
        });
    }
});

/**
 * GET /api/ddi/health
 * Check health status of DDI service
 */
router.get('/health', async (req, res) => {
    try {
        const health = await checkHealth();
        return res.json(health);
    } catch (error) {
        return res.status(503).json({
            status: 'unhealthy',
            error: error.message,
        });
    }
});

export default router;
