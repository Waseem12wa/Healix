/**
 * DDI Client - HTTP client for Drug-Drug Interaction Python service
 */

import axios from 'axios';

const DDI_SERVICE_URL = process.env.DDI_SERVICE_URL || 'http://localhost:5001';
const TIMEOUT = 120000; // 120 seconds (LLM generation can take time)

/**
 * Check interaction between two drugs
 * @param {string} drug1 - First drug name
 * @param {string} drug2 - Second drug name
 * @returns {Promise<Object>} Interaction prediction result
 */
async function checkInteraction(drug1, drug2) {
    try {
        const response = await fetch(`${DDI_SERVICE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ drug1, drug2 }),
            signal: AbortSignal.timeout(TIMEOUT), // 90 second timeout for LLM
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        return data;
    } catch (error) {
        // Handle specific error types
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
            throw new Error('DDI service request timeout - the service may be processing a complex request');
        }

        if (error.code === 'ECONNREFUSED') {
            throw new Error('DDI service is not running. Please start the Python microservice.');
        }

        throw error;
    }
}

/**
 * Check health status of DDI service
 * @returns {Promise<Object>} Health status
 */
async function checkHealth() {
    try {
        const response = await fetch(`${DDI_SERVICE_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        return await response.json();
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message,
        };
    }
}

export { checkInteraction, checkHealth };
