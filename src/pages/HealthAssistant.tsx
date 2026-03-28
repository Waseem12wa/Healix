/**
 * AI Health Assistant Chatbot Component
 * 
 * Persistent chat interface in bottom-left corner
 * - Always accessible from any page
 * - Quick query suggestions
 * - Real-time responses from health assistant service
 * - Integration with all health features
 */

import React, { useState, useEffect, useRef } from 'react';
import './HealthAssistant.css';
import { clearAuthData } from '../utils/auth';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api/assistant';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    intent?: string;
    source?: string;
    timestamp: Date;
    responseTime?: number;
}

interface QuickQuery {
    title: string;
    query: string;
    category: string;
}

const HealthAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [quickQueries, setQuickQueries] = useState<QuickQuery[]>([]);
    const [showQuickQueries, setShowQuickQueries] = useState(true);
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const parseJsonSafely = async (response: Response) => {
        const raw = await response.text();
        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    };

    // ============================================
    // INITIALIZATION
    // ============================================

    useEffect(() => {
        fetchQuickQueries();
        
        // Add welcome message
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: '👋 Hello! I\'m your AI Health Assistant. I can help you with:\n\n• Side effects of medications\n• Drug interactions\n• Food-drug interactions\n• Medical record summaries\n• Finding doctors\n• Setting medication reminders\n\nWhat can I help you with today?',
                timestamp: new Date()
            }
        ]);
    }, []);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ============================================
    // API CALLS
    // ============================================

    const fetchQuickQueries = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/quick-queries`);
            const data = await parseJsonSafely(response);
            if (response.ok && data?.success) {
                setQuickQueries(data.queries);
            } else {
                console.warn('Quick query response was not successful:', response.status);
            }
        } catch (err) {
            console.error('Error fetching quick queries:', err);
        }
    };

    const sendMessage = async (query: string) => {
        if (!query.trim()) return;

        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token) {
            setError('Please log in to use the AI assistant.');
            return;
        }

        // Add user message
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: query,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setLoading(true);
        setError('');
        setShowQuickQueries(false);

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ query, user_id: userId })
            });

            const data = await parseJsonSafely(response);

            if (response.status === 401) {
                clearAuthData();
                throw new Error('Your session has expired. Please log in again.');
            }

            if (!response.ok) {
                throw new Error(data?.error || `Request failed with status ${response.status}`);
            }

            if (!data) {
                throw new Error('Assistant returned an empty or invalid response');
            }

            if (data.success && data.data) {
                const assistantMessage: Message = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: data.data.response || 'Unable to process your query',
                    intent: data.data.intent,
                    source: data.data.source,
                    responseTime: data.data.response_time_ms,
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                throw new Error(data.error || 'Error processing query');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error processing query';
            setError(errorMessage);

            const errorResponse: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: `❌ ${errorMessage}`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // HANDLERS
    // ============================================

    const handleQuickQuery = (query: string) => {
        sendMessage(query);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(inputValue);
        }
    };

    const handleClearChat = () => {
        setMessages([
            {
                id: 'welcome',
                role: 'assistant',
                content: '👋 Chat cleared. How can I help you today?',
                timestamp: new Date()
            }
        ]);
        setShowQuickQueries(true);
    };

    // ============================================
    // RENDER HELPERS
    // ============================================

    const renderMessageContent = (message: Message) => {
        return message.content.split('\n').map((line, idx) => (
            <div key={idx}>{line}</div>
        ));
    };

    const getSourceIcon = (source?: string) => {
        switch (source) {
            case 'side-effect-predictor':
                return '💊';
            case 'drug-interaction-checker':
                return '⚠️';
            case 'food-interaction-checker':
                return '🍎';
            case 'health-information':
                return 'ℹ️';
            case 'health-assistant':
                return '🤖';
            default:
                return '💬';
        }
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <>
            {/* Chat Button - Always visible in bottom-left */}
            <button
                className={`health-assistant-button ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Open AI Health Assistant"
                aria-label="Open AI Health Assistant"
            >
                <span className="button-icon">🏥</span>
                {!isOpen && messages.length > 1 && (
                    <span className="message-badge">{messages.length - 1}</span>
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="health-assistant-window">
                    {/* Header */}
                    <div className="chat-header">
                        <div className="header-content">
                            <h3>🏥 Health Assistant</h3>
                            <p className="header-subtitle">AI-Powered Health Guide</p>
                        </div>
                        <div className="header-actions">
                            <button
                                className="icon-btn"
                                onClick={handleClearChat}
                                title="Clear chat"
                                aria-label="Clear chat"
                            >
                                🔄
                            </button>
                            <button
                                className="close-btn"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close chat"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Messages Container */}
                    <div className="messages-container">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`message message-${message.role}`}
                            >
                                <div className="message-icon">
                                    {message.role === 'user' ? '👤' : getSourceIcon(message.source)}
                                </div>
                                <div className="message-content">
                                    <div className="message-text">
                                        {renderMessageContent(message)}
                                    </div>
                                    {message.responseTime && (
                                        <div className="message-meta">
                                            ⏱️ {Math.round(message.responseTime)}ms
                                            {message.intent && ` • Intent: ${message.intent}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {loading && (
                            <div className="message message-assistant">
                                <div className="message-icon">🤖</div>
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Queries Suggestions */}
                    {showQuickQueries && quickQueries.length > 0 && (
                        <div className="quick-queries">
                            <div className="quick-queries-label">💡 Try asking:</div>
                            <div className="quick-queries-grid">
                                {quickQueries.slice(0, 4).map((q, idx) => (
                                    <button
                                        key={idx}
                                        className="quick-query-btn"
                                        onClick={() => handleQuickQuery(q.query)}
                                        title={q.query}
                                    >
                                        {q.title}
                                    </button>
                                ))}
                            </div>
                            <div className="quick-queries-grid">
                                {quickQueries.slice(4, 8).map((q, idx) => (
                                    <button
                                        key={idx}
                                        className="quick-query-btn"
                                        onClick={() => handleQuickQuery(q.query)}
                                        title={q.query}
                                    >
                                        {q.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="input-container">
                        {error && (
                            <div className="error-message">
                                ⚠️ {error}
                            </div>
                        )}
                        <div className="input-wrapper">
                            <textarea
                                className="chat-input"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask your health question..."
                                disabled={loading}
                                rows={1}
                            />
                            <button
                                className="send-btn"
                                onClick={() => sendMessage(inputValue)}
                                disabled={loading || !inputValue.trim()}
                                title="Send message"
                                aria-label="Send message"
                            >
                                {loading ? '⏳' : '📤'}
                            </button>
                        </div>
                        <div className="input-hint">
                            💡 Tip: Ask about side effects, interactions, doctors, or set reminders
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HealthAssistant;
