/**
 * DFI Client - HTTP client for Drug-Food Interaction Python service
 */

import axios from 'axios';

const DFI_SERVICE_URL = process.env.DFI_SERVICE_URL || 'http://127.0.0.1:5002';
const TIMEOUT = 120000; // 120 seconds (LLM generation can take time)

/**
 * Predict drug-food interaction
 * @param {string} medicine - Medicine name
 * @param {string} food - Food name
 * @returns {Promise<Object>} Prediction result with LLM details
 */
async function predictFoodInteraction(medicine, food) {
    try {
        console.log(`[DFI Client] Predicting interaction: ${medicine} + ${food}`);

        const response = await axios.post(
            `${DFI_SERVICE_URL}/predict`,
            { medicine, food },
            { timeout: TIMEOUT }
        );

        console.log(`[DFI Client] Prediction successful: ${response.data.percentage}%`);
        return response.data;

    } catch (error) {
        console.error('[DFI Client] Error:', error.message);

        if (error.response) {
            // Server responded with error
            throw new Error(error.response.data.error || 'DFI service error');
        } else if (error.code === 'ECONNREFUSED') {
            throw new Error('DFI service is not running. Please start it with: py server/services/dfi_service.py');
        } else if (error.code === 'ETIMEDOUT') {
            throw new Error('DFI service timeout - LLM may be slow on first request');
        } else {
            throw error;
        }
    }
}

/**
 * Check DFI service health
 * @returns {Promise<Object>} Health status
 */
async function checkHealth() {
    try {
        const response = await axios.get(`${DFI_SERVICE_URL}/health`, { timeout: 5000 });
        return response.data;
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
}

export default {
    predictFoodInteraction,
    checkHealth
};
