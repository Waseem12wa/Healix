/**
 * DDI Client - HTTP client for Drug-Drug Interaction Python service
 */

import axios from 'axios';

const DDI_SERVICE_URL = process.env.DDI_SERVICE_URL || 'http://127.0.0.1:5001';
const TIMEOUT = 120000; // 120 seconds (model can take time)

// Create axios instance with default config
const ddiClient = axios.create({
    baseURL: DDI_SERVICE_URL,
    timeout: TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Check interaction between two drugs
 * @param {string} drug1 - First drug name
 * @param {string} drug2 - Second drug name
 * @returns {Promise<Object>} Interaction prediction result
 */
async function checkInteraction(drug1, drug2) {
    try {
        const response = await ddiClient.post('/predict', {
            drug1,
            drug2,
        });

        return response.data;
    } catch (error) {
        // Handle specific error types
        if (error.code === 'ECONNREFUSED') {
            throw new Error('DDI service is not running. Please start the Python microservice.');
        }

        if (error.code === 'ENOTFOUND') {
            throw new Error('DDI service host not found. Check your configuration.');
        }

        if (error.response) {
            // Server responded with error status
            throw new Error(error.response.data?.error || `HTTP ${error.response.status}: ${error.response.statusText}`);
        }

        if (error.message === 'timeout of ' + TIMEOUT + 'ms exceeded') {
            throw new Error(`DDI service request timeout (${TIMEOUT}ms) - the service may be busy or unresponsive`);
        }

        // Generic network error
        throw new Error(`Failed to connect to DDI service: ${error.message}`);
    }
}

/**
 * Check health status of DDI service
 * @returns {Promise<Object>} Health status
 */
async function checkHealth() {
    try {
        const response = await ddiClient.get('/health', {
            timeout: 5000, // 5 second timeout for health check
        });

        return response.data;
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message || 'Connection failed',
        };
    }
}

export { checkInteraction, checkHealth };
