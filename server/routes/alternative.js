import express from 'express';
import alternativeClient from '../utils/alternativeClient.js';
import MedicineInventory from '../models/MedicineInventory.js';

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
 * @desc    Get alternative medicine recommendations with actual inventory data
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

        // Get recommendations from Python service
        const recommendations = await alternativeClient.getAlternatives(medicine, top_n || 5);

        if (!recommendations.success) {
            return res.json(recommendations);
        }

        // Enrich alternatives with actual inventory data
        const enrichedAlternatives = [];

        for (const alt of recommendations.alternatives) {
            try {
                // Try to find matching medicine in inventory by name
                let inventoryMedicine = await MedicineInventory.findOne({
                    $or: [
                        { medicineName: new RegExp(`^${alt.name}$`, 'i') },
                        { genericName: new RegExp(`^${alt.generic_name}$`, 'i') },
                        { medicineName: new RegExp(alt.name, 'i') }
                    ]
                }).select('_id medicineName genericName category sellingPrice costPrice quantity activeIngredients expiryDate');

                if (inventoryMedicine) {
                    // Enrich with actual inventory data
                    enrichedAlternatives.push({
                        ...alt,
                        medicineId: inventoryMedicine._id,
                        actualSellingPrice: inventoryMedicine.sellingPrice,
                        actualCostPrice: inventoryMedicine.costPrice,
                        inventoryQuantity: inventoryMedicine.quantity,
                        inStock: inventoryMedicine.quantity > 0,
                        expiryDate: inventoryMedicine.expiryDate
                    });
                } else {
                    // No inventory match - include anyway but mark as not in inventory
                    enrichedAlternatives.push({
                        ...alt,
                        medicineId: null,
                        inStock: false,
                        note: 'Alternative recommendation only - not in current inventory'
                    });
                }
            } catch (innerError) {
                console.error(`Error enriching alternative ${alt.name}:`, innerError);
                // Still include the alternative even if enrichment fails
                enrichedAlternatives.push({
                    ...alt,
                    medicineId: null,
                    inStock: false
                });
            }
        }

        // Return enriched recommendations
        res.json({
            ...recommendations,
            alternatives: enrichedAlternatives
        });

    } catch (error) {
        console.error('Alternative recommendation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
