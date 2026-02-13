import axios from 'axios';

const ALTERNATIVE_SERVICE_URL = process.env.ALTERNATIVE_SERVICE_URL || 'http://localhost:5003';

/**
 * Client for Medicine Alternative Recommendation Service
 */
class AlternativeClient {
    /**
     * Check if the alternative service is healthy
     */
    async healthCheck() {
        try {
            const response = await axios.get(`${ALTERNATIVE_SERVICE_URL}/health`, {
                timeout: 5000
            });
            return response.data;
        } catch (error) {
            console.error('Alternative service health check failed:', error.message);
            throw new Error('Alternative service is not available');
        }
    }

    /**
     * Get alternative medicine recommendations
     * @param {string} medicine - Medicine name to find alternatives for
     * @param {number} topN - Number of alternatives to return (default: 5)
     * @returns {Promise<Object>} Alternative recommendations
     */
    async getAlternatives(medicine, topN = 5) {
        try {
            const response = await axios.post(
                `${ALTERNATIVE_SERVICE_URL}/recommend`,
                {
                    medicine,
                    top_n: topN
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 120000 // 120 seconds to match other services
                }
            );

            return response.data;
        } catch (error) {
            if (error.response) {
                // Service returned an error
                throw new Error(error.response.data.error || 'Failed to get alternatives');
            } else if (error.request) {
                // No response from service
                throw new Error('Alternative service is not responding');
            } else {
                // Request setup error
                throw new Error(error.message);
            }
        }
    }
}

export default new AlternativeClient();
