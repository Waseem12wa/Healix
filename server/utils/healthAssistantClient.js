/**
 * Health Assistant Client
 * Node.js wrapper for AI Health Assistant service
 * 
 * Usage:
 *   import { chat, getQuickQueries } from './healthAssistantClient.js';
 *   const response = await chat('What are side effects of Aspirin?');
 *   console.log(response.data.response);
 */

import axios from 'axios';

const HEALTH_ASSISTANT_URL = process.env.HEALTH_ASSISTANT_URL || 'http://127.0.0.1:5006';

// ============================================
// CONFIGURATION
// ============================================

const axiosInstance = axios.create({
    baseURL: HEALTH_ASSISTANT_URL,
    timeout: 120000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// ============================================
// MAIN CHAT FUNCTION
// ============================================

/**
 * Send a query to the health assistant
 * 
 * @param {string} query - User's health question
 * @param {string} userId - Optional user ID for personalization
 * 
 * @returns {object} Assistant response with formatted message
 */
export async function chat(query, userId = null) {
    try {
        if (!query || typeof query !== 'string') {
            throw new Error('Query must be a non-empty string');
        }

        console.log(`💬 Sending query to health assistant: "${query.substring(0, 50)}..."`);

        const response = await axiosInstance.post('/chat', {
            query: query.trim(),
            user_id: userId || 'anonymous'
        });

        if (response.data.success) {
            console.log(`✅ Received response from health assistant`);
            return {
                success: true,
                data: response.data.data
            };
        } else {
            return {
                success: false,
                error: response.data.error || 'Unknown error'
            };
        }
    } catch (error) {
        console.error(`❌ Error in chat: ${error.message}`);
        return {
            success: false,
            error: error.message,
            statusCode: error.response?.status
        };
    }
}

// ============================================
// QUICK QUERIES
// ============================================

/**
 * Get predefined quick query suggestions
 * Shows users common health queries they can ask
 */
export async function getQuickQueries() {
    try {
        console.log('📋 Fetching quick query suggestions...');
        
        const response = await axiosInstance.get('/quick-queries');

        if (response.data.success) {
            console.log(`✅ Retrieved ${response.data.queries.length} quick queries`);
            return {
                success: true,
                queries: response.data.queries
            };
        } else {
            return {
                success: false,
                error: 'Failed to fetch quick queries'
            };
        }
    } catch (error) {
        console.error(`❌ Error fetching quick queries: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Process multiple health queries in batch
 * 
 * @param {array} queries - Array of query strings
 * @param {string} userId - Optional user ID
 * 
 * @returns {object} Results for all queries
 */
export async function batchChat(queries, userId = null) {
    try {
        if (!Array.isArray(queries) || queries.length === 0) {
            throw new Error('Queries must be a non-empty array');
        }

        console.log(`📦 Processing batch of ${queries.length} queries...`);

        const response = await axiosInstance.post('/batch-queries', {
            queries: queries.map(q => q.trim()),
            user_id: userId || 'anonymous'
        });

        if (response.data.success) {
            console.log(`✅ Batch processing complete: ${response.data.successful}/${response.data.total_queries} successful`);
            return {
                success: true,
                total: response.data.total_queries,
                successful: response.data.successful,
                failed: response.data.failed,
                results: response.data.results
            };
        } else {
            return {
                success: false,
                error: response.data.error
            };
        }
    } catch (error) {
        console.error(`❌ Error in batch chat: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// METRICS AND MONITORING
// ============================================

/**
 * Get performance metrics for health assistant
 */
export async function getMetrics() {
    try {
        console.log('📊 Fetching health assistant metrics...');
        
        const response = await axiosInstance.get('/metrics');

        if (response.data.success) {
            console.log('✅ Retrieved health assistant metrics');
            return {
                success: true,
                metrics: response.data.metrics
            };
        } else {
            return {
                success: false,
                error: 'Failed to fetch metrics'
            };
        }
    } catch (error) {
        console.error(`❌ Error fetching metrics: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Reset performance metrics
 */
export async function resetMetrics() {
    try {
        console.log('🔄 Resetting health assistant metrics...');
        
        const response = await axiosInstance.post('/reset-metrics');

        if (response.data.success) {
            console.log('✅ Metrics reset successfully');
            return {
                success: true,
                message: response.data.message
            };
        } else {
            return {
                success: false,
                error: 'Failed to reset metrics'
            };
        }
    } catch (error) {
        console.error(`❌ Error resetting metrics: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get conversation history
 */
export async function getConversationHistory() {
    try {
        console.log('📜 Fetching conversation history...');
        
        const response = await axiosInstance.get('/conversation-history');

        if (response.data.success) {
            console.log(`✅ Retrieved ${response.data.total_queries} queries from history`);
            return {
                success: true,
                history: response.data.history,
                total: response.data.total_queries
            };
        } else {
            return {
                success: false,
                error: 'Failed to fetch history'
            };
        }
    } catch (error) {
        console.error(`❌ Error fetching history: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// SERVICE HEALTH
// ============================================

/**
 * Check if health assistant service is available
 */
export async function checkHealthAssistantHealth() {
    try {
        const response = await axiosInstance.get('/health', { timeout: 5000 });
        console.log('✅ Health Assistant Service is healthy');
        return response.data.status === 'healthy';
    } catch (error) {
        console.error('❌ Health Assistant Service is not available:', error.message);
        return false;
    }
}

// ============================================
// QUERY PARSING AND ANALYSIS
// ============================================

/**
 * Format response for display in UI
 */
export function formatResponseForDisplay(response) {
    if (!response || !response.data) return null;

    return {
        message: response.data.response || '',
        intent: response.data.intent || 'unknown',
        source: response.data.source || 'health-assistant',
        responseTime: response.data.response_time_ms || 0,
        data: response.data.data || {}
    };
}

/**
 * Extract key information from assistant response
 */
export function extractKeyInfo(response) {
    if (!response?.data?.data) return null;

    const data = response.data.data;
    
    return {
        intent: response.data.intent,
        source: response.data.source,
        mainMessage: response.data.response,
        hasStructuredData: !!data.drugs || !!data.side_effects || !!data.interaction,
        processingTime: `${Math.round(response.data.response_time_ms)}ms`
    };
}

// ============================================
// SUGGESTION SYSTEM
// ============================================

/**
 * Get follow-up suggestions based on previous query
 */
export async function getSuggestions(previousQuery) {
    const suggestions = {
        'side-effects': [
            'Can I take it with other medications?',
            'What are the long-term side effects?',
            'Are there alternative medications?'
        ],
        'drug-interaction': [
            'What are the side effects of each drug?',
            'Can I take them at different times to reduce interaction?',
            'What alternatives are available?'
        ],
        'food-interaction': [
            'Can I take it with other foods?',
            'When is the best time to take this medication?',
            'What should I eat or avoid?'
        ],
        'symptoms': [
            'Should I see a doctor?',
            'What medications can help?',
            'What are home remedies for this?'
        ]
    };

    // Return suggestions based on query patterns
    for (const [key, msgs] of Object.entries(suggestions)) {
        if (previousQuery.toLowerCase().includes(key.replace('-', ' '))) {
            return msgs;
        }
    }

    return [
        'Check drug interactions',
        'Find a doctor',
        'View medication alternatives',
        'Set a medication reminder'
    ];
}

// ============================================
// CONVERSATION CONTEXT
// ============================================

/**
 * Build conversation context for multi-turn conversations
 */
export class ConversationManager {
    constructor(userId = null) {
        this.userId = userId || 'anonymous';
        this.messages = [];
    }

    async addUserMessage(query) {
        const msg = {
            role: 'user',
            content: query,
            timestamp: new Date().toISOString()
        };
        this.messages.push(msg);
        return msg;
    }

    async addAssistantMessage(response) {
        const msg = {
            role: 'assistant',
            content: response.data.response,
            intent: response.data.intent,
            source: response.data.source,
            timestamp: new Date().toISOString()
        };
        this.messages.push(msg);
        return msg;
    }

    async chat(query) {
        await this.addUserMessage(query);
        const response = await chat(query, this.userId);
        
        if (response.success) {
            await this.addAssistantMessage(response);
            return response;
        }
        return response;
    }

    getMessages() {
        return this.messages;
    }

    getContext() {
        return {
            userId: this.userId,
            messageCount: this.messages.length,
            lastMessage: this.messages[this.messages.length - 1] || null,
            recentQueries: this.messages
                .filter(m => m.role === 'user')
                .slice(-5)
                .map(m => m.content)
        };
    }

    clearHistory() {
        this.messages = [];
    }
}

export default {
    chat,
    getQuickQueries,
    batchChat,
    getMetrics,
    resetMetrics,
    getConversationHistory,
    checkHealthAssistantHealth,
    formatResponseForDisplay,
    extractKeyInfo,
    getSuggestions,
    ConversationManager
};
