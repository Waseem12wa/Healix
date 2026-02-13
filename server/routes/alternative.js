import express from 'express';
import alternativeClient from '../utils/alternativeClient.js';

const router = express.Router();

/**
 * @route   GET /api/alternative/health
 * @desc    Check alternative service health
 * @access  Public
 */
router.get('/health', async (req, res) => {
    try {
        const health = await alternativeClient.healthCheck();
        res.json(health);
    } catch (error) {
        res.status(503).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/alternative/recommend
 * @desc    Get alternative medicine recommendations
 * @access  Public
 * @body    { medicine: string, top_n?: number }
 */
router.post('/recommend', async (req, res) => {
    try {
        const { medicine, top_n } = req.body;

        if (!medicine) {
            return res.status(400).json({
                success: false,
                error: 'Medicine name is required'
            });
        }

        const result = await alternativeClient.getAlternatives(medicine, top_n || 5);
        res.json(result);

    } catch (error) {
        console.error('Alternative recommendation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
