/**
 * DFI Routes - Drug-Food Interaction API endpoints
 */

import express from 'express';
import dfiClient from '../utils/dfiClient.js';

const router = express.Router();

/**
 * POST /api/dfi/predict
 * Predict drug-food interaction
 * 
 * Body: {
 *   medicine: string,
 *   food: string
 * }
 */
router.post('/predict', async (req, res) => {
    try {
        const { medicine, food } = req.body;

        if (!medicine || !food) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: medicine and food'
            });
        }

        const result = await dfiClient.predictFoodInteraction(medicine, food);
        res.json(result);

    } catch (error) {
        console.error('[DFI Route] Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/dfi/health
 * Check DFI service health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await dfiClient.checkHealth();
        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

export default router;
