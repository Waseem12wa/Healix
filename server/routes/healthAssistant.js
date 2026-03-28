/**
 * AI Health Assistant Routes
 * 
 * Central chatbot endpoint that routes to all health features
 * Integrated with React UI for persistent bottom-left chat button
 */

import express from 'express';
import axios from 'axios';
import { requireAuth } from '../middleware/auth.js';
import PatientActivity from '../models/PatientActivity.js';

const router = express.Router();

const HEALTH_ASSISTANT_SERVICE_URL = process.env.HEALTH_ASSISTANT_SERVICE_URL || 'http://localhost:5006';

// ============================================
// MIDDLEWARE
// ============================================

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/assistant/health
 * Check if health assistant service is available
 */
router.get('/health', asyncHandler(async (req, res) => {
    try {
        const response = await axios.get(`${HEALTH_ASSISTANT_SERVICE_URL}/health`, { timeout: 5000 });
        res.json({
            success: true,
            status: 'healthy',
            service: response.data
        });
    } catch (error) {
        console.error('Health Assistant Service unavailable:', error.message);
        res.status(503).json({
            success: false,
            error: 'Health Assistant Service is not available',
            details: error.message
        });
    }
}));

/**
 * POST /api/assistant/chat
 * Main chat endpoint - routes query to appropriate service
 * 
 * Body:
 * {
 *   "query": "What are side effects of Aspirin?",
 *   "user_id": "user123" (optional)
 * }
 */
router.post('/chat', requireAuth, asyncHandler(async (req, res) => {
    try {
        const { query, user_id } = req.body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Query is required and must be a non-empty string'
            });
        }

        console.log(`🤖 Processing query: ${query.substring(0, 50)}...`);

        const response = await axios.post(
            `${HEALTH_ASSISTANT_SERVICE_URL}/chat`,
            {
                query: query.trim(),
                user_id: user_id || req.user?.id || 'anonymous'
            },
            { timeout: 120000 }
        );

        console.log(`✅ Query processed successfully`);

        // Activity logging must never break chat delivery.
        try {
            await PatientActivity.create({
                userId: req.user.id,
                category: 'ai-assistant',
                title: 'AI assistant chat',
                details: query.trim(),
                metadata: {
                    intent: response.data?.intent,
                    source: response.data?.source,
                    response: response.data?.response,
                }
            });
        } catch (activityError) {
            console.warn('AI activity log failed:', activityError.message);
        }
        
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Error in chat endpoint:', error.message);
        
        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                error: error.response.data?.error || 'Error processing query',
                details: error.response.data
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error processing your query',
            details: error.message
        });
    }
}));

/**
 * GET /api/assistant/quick-queries
 * Get predefined quick query suggestions
 */
router.get('/quick-queries', asyncHandler(async (req, res) => {
    try {
        console.log('📋 Fetching quick queries...');
        
        const response = await axios.get(
            `${HEALTH_ASSISTANT_SERVICE_URL}/quick-queries`,
            { timeout: 5000 }
        );

        res.json({
            success: true,
            queries: response.data.queries
        });
    } catch (error) {
        console.error('Error fetching quick queries:', error.message);
        
        // Return default quick queries as fallback
        res.json({
            success: true,
            queries: [
                {
                    title: 'Check Side Effects',
                    query: 'What are the side effects of Aspirin?',
                    category: 'side-effects'
                },
                {
                    title: 'Drug Interactions',
                    query: 'What are the interactions between Metformin and Lisinopril?',
                    category: 'drug-interaction'
                },
                {
                    title: 'My Symptoms',
                    query: 'I have a fever and cough',
                    category: 'symptoms'
                },
                {
                    title: 'Set Reminder',
                    query: 'Set a reminder for my Aspirin at 8 AM',
                    category: 'reminder'
                },
                {
                    title: 'Find Doctor',
                    query: 'Find me a cardiologist near me',
                    category: 'doctor-search'
                },
                {
                    title: 'Summarize Medical Record',
                    query: 'Summarize my medical record',
                    category: 'medical-summary'
                }
            ]
        });
    }
}));

/**
 * GET /api/assistant/metrics
 * Get performance metrics for the health assistant
 */
router.get('/metrics', asyncHandler(async (req, res) => {
    try {
        const response = await axios.get(
            `${HEALTH_ASSISTANT_SERVICE_URL}/metrics`,
            { timeout: 5000 }
        );

        res.json({
            success: true,
            metrics: response.data.metrics
        });
    } catch (error) {
        console.error('Error fetching metrics:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error fetching metrics'
        });
    }
}));

/**
 * POST /api/assistant/reset-metrics
 * Reset performance metrics
 */
router.post('/reset-metrics', asyncHandler(async (req, res) => {
    try {
        const response = await axios.post(
            `${HEALTH_ASSISTANT_SERVICE_URL}/reset-metrics`,
            {},
            { timeout: 5000 }
        );

        res.json({
            success: true,
            message: response.data.message
        });
    } catch (error) {
        console.error('Error resetting metrics:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error resetting metrics'
        });
    }
}));

/**
 * GET /api/assistant/conversation-history
 * Get user's conversation history
 */
router.get('/conversation-history', requireAuth, asyncHandler(async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(100, Number.parseInt(String(req.query.limit || '50'), 10)));
        const history = await PatientActivity.find({
            userId: req.user.id,
            category: 'ai-assistant'
        })
            .sort({ createdAt: -1 })
            .limit(limit);

        res.json({
            success: true,
            history,
            total_queries: history.length
        });
    } catch (error) {
        console.error('Error fetching conversation history:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error fetching conversation history'
        });
    }
}));

/**
 * POST /api/assistant/batch-queries
 * Process multiple queries in batch
 * 
 * Body:
 * {
 *   "queries": ["Query 1", "Query 2"],
 *   "user_id": "user123"
 * }
 */
router.post('/batch-queries', requireAuth, asyncHandler(async (req, res) => {
    try {
        const { queries, user_id } = req.body;

        if (!Array.isArray(queries) || queries.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Queries must be a non-empty array'
            });
        }

        console.log(`🤖 Processing batch of ${queries.length} queries...`);

        const promises = queries.map(query =>
            axios.post(
                `${HEALTH_ASSISTANT_SERVICE_URL}/chat`,
                {
                    query: query.trim(),
                    user_id: user_id || 'anonymous'
                },
                { timeout: 120000 }
            ).catch(error => ({
                success: false,
                error: error.message
            }))
        );

        const results = await Promise.all(promises);

        res.json({
            success: true,
            total_queries: queries.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results: results.map(r => ({
                success: r.success,
                data: r.data || r.error
            }))
        });
    } catch (error) {
        console.error('Error in batch queries:', error.message);
        res.status(500).json({
            success: false,
            error: 'Error processing batch queries'
        });
    }
}));

export default router;
