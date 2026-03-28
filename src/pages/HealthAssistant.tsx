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
import { useNavigate } from 'react-router-dom';
import './HealthAssistant.css';
import { clearAuthData } from '../utils/auth';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api/assistant';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    actions?: AssistantAction[];
    intent?: string;
    source?: string;
    timestamp: Date;
    responseTime?: number;
}

interface AssistantAction {
    label: string;
    path: string;
}

interface QuickQuery {
    title: string;
    query: string;
    category: string;
}

const KNOWN_MEDICINES = [
    'aspirin', 'ibuprofen', 'metformin', 'lisinopril', 'atorvastatin',
    'amoxicillin', 'paracetamol', 'acetaminophen', 'omeprazole', 'sertraline'
];

const KNOWN_FOODS = ['grapefruit', 'alcohol', 'dairy', 'milk', 'cheese'];

const getKnownMatches = (query: string, vocabulary: string[]) => {
    const lower = query.toLowerCase();
    return vocabulary.filter((item) => lower.includes(item));
};

const getSpecializationFromQuery = (query: string) => {
    const lower = query.toLowerCase();
    const candidates = [
        'cardiologist', 'dermatologist', 'neurologist', 'orthopedic',
        'gynecologist', 'pediatrician', 'psychiatrist', 'general physician'
    ];
    return candidates.find((item) => lower.includes(item)) || '';
};

const toCsvParam = (items: string[]) => encodeURIComponent(items.join(','));

const HealthAssistant: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [quickQueries, setQuickQueries] = useState<QuickQuery[]>([]);
    const [showQuickQueries, setShowQuickQueries] = useState(true);
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const buildActions = (query: string, assistantPayload: any): AssistantAction[] => {
        const intent = String(assistantPayload?.intent || '');
        const source = String(assistantPayload?.source || '');
        const data = assistantPayload?.data || {};
        const medicineMatches = getKnownMatches(query, KNOWN_MEDICINES);
        const foodMatches = getKnownMatches(query, KNOWN_FOODS);
        const actions: AssistantAction[] = [];

        if (intent === 'side-effects' || source === 'side-effect-predictor') {
            const medicineFromData = typeof data?.medicine === 'string' ? data.medicine : '';
            const medicines = [medicineFromData, ...medicineMatches].filter(Boolean);
            const uniqueMeds = Array.from(new Set(medicines));
            const path = uniqueMeds.length > 0
                ? `/tools/side-effects?medicines=${toCsvParam(uniqueMeds)}`
                : '/tools/side-effects';
            actions.push({ label: 'Open Side Effects', path });
        }

        if (intent === 'drug-interaction' || source === 'drug-interaction-checker') {
            const interaction = Array.isArray(data?.interactions) ? data.interactions[0] : undefined;
            const fromData = [interaction?.drug1, interaction?.drug2].filter(Boolean);
            const drugs = Array.from(new Set([...fromData, ...medicineMatches]));
            const path = drugs.length >= 2
                ? `/tools/drug-interactions?drugs=${toCsvParam(drugs.slice(0, 4))}`
                : '/tools/drug-interactions';
            actions.push({ label: 'Open Drug Interactions', path });
        }

        if (intent === 'food-interaction' || source === 'food-interaction-checker') {
            const meds = Array.from(new Set(medicineMatches));
            const foods = Array.from(new Set(foodMatches));
            const params: string[] = [];
            if (meds.length > 0) params.push(`medicines=${toCsvParam(meds.slice(0, 3))}`);
            if (foods.length > 0) params.push(`foods=${toCsvParam(foods.slice(0, 3))}`);
            const path = params.length > 0
                ? `/tools/drug-food-interactions?${params.join('&')}`
                : '/tools/drug-food-interactions';
            actions.push({ label: 'Open Drug-Food Interactions', path });
        }

        if (intent === 'alternatives' || source === 'alternative-medicine') {
            const medicine = medicineMatches[0] || (typeof data?.medicine === 'string' ? data.medicine : '');
            const path = medicine
                ? `/tools/drug-alternatives?medicine=${encodeURIComponent(medicine)}`
                : '/tools/drug-alternatives';
            actions.push({ label: 'Open Alternatives', path });
        }

        if (intent === 'doctor-search' || query.toLowerCase().includes('doctor') || query.toLowerCase().includes('appointment')) {
            const specialization = getSpecializationFromQuery(query);
            const params = ['tab=0'];
            if (specialization) params.push(`specialization=${encodeURIComponent(specialization)}`);
            actions.push({ label: 'Find Doctors', path: `/tools/appointments?${params.join('&')}` });
            actions.push({ label: 'My Appointments', path: '/tools/appointments?tab=1' });
        }

        if (intent === 'medical-summary') {
            actions.push({ label: 'Open Health Summary', path: '/tools/health-summary' });
        }

        if (intent === 'reminder' || query.toLowerCase().includes('reminder')) {
            actions.push({ label: 'Open Medication Reminder', path: '/tools/medication-reminder' });
        }

        if (query.toLowerCase().includes('shop') || query.toLowerCase().includes('buy') || query.toLowerCase().includes('order') || query.toLowerCase().includes('mix')) {
            const medicine = medicineMatches[0] || '';
            const path = medicine
                ? `/shop/medicines?search=${encodeURIComponent(medicine)}`
                : '/shop/medicines';
            actions.push({ label: 'Open Medicine Shop', path });
        }

        const seen = new Set<string>();
        return actions.filter((item) => {
            if (seen.has(item.label)) return false;
            seen.add(item.label);
            return true;
        });
    };

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

    const fetchQuickQueries = async (attempt = 0) => {
        try {
            const response = await fetch(`${API_BASE_URL}/quick-queries`);
            const data = await parseJsonSafely(response);
            if (response.ok && data?.success) {
                setQuickQueries(data.queries);
            } else {
                console.warn('Quick query response was not successful:', response.status);
                if (attempt < 5) {
                    window.setTimeout(() => fetchQuickQueries(attempt + 1), 1500);
                }
            }
        } catch (err) {
            console.error('Error fetching quick queries:', err);
            if (attempt < 5) {
                window.setTimeout(() => fetchQuickQueries(attempt + 1), 1500);
            }
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
                const actions = buildActions(query, data.data);
                const assistantMessage: Message = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: data.data.response || 'Unable to process your query',
                    actions,
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
                                    {message.role === 'assistant' && message.actions && message.actions.length > 0 && (
                                        <div className="message-actions">
                                            {message.actions.map((action) => (
                                                <button
                                                    key={`${message.id}-${action.label}`}
                                                    className="message-action-btn"
                                                    onClick={() => navigate(action.path)}
                                                    type="button"
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
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
