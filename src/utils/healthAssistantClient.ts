import axios from 'axios'
import { clearAuthData } from './auth'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api/assistant'

export interface ChatMessage {
  success: boolean
  response?: string
  intent?: string
  source?: string
  data?: any
  error?: string
}

export interface QuickQuery {
  id: string
  text: string
  category: string
}

const normalizeChatMessage = (payload: any): ChatMessage => {
  if (!payload || typeof payload !== 'object') {
    return {
      success: false,
      error: 'Invalid response from AI assistant'
    }
  }

  const data = payload.data && typeof payload.data === 'object' ? payload.data : payload

  return {
    success: Boolean(payload.success),
    response: typeof data.response === 'string' ? data.response : undefined,
    intent: typeof data.intent === 'string' ? data.intent : undefined,
    source: typeof data.source === 'string' ? data.source : undefined,
    data: data.data ?? data,
    error: payload.error
  }
}

/**
 * Send a chat message to the AI health assistant
 */
export const sendChatMessage = async (
  query: string,
  userId?: string,
  context?: any
): Promise<ChatMessage> => {
  try {
    const token = localStorage.getItem('token')
    const resolvedUserId = userId || localStorage.getItem('userId') || undefined
    const response = await axios.post(`${API_BASE_URL}/chat`, {
      query,
      user_id: resolvedUserId,
      context
    }, {
      timeout: 30000, // 30 seconds timeout
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })

    return normalizeChatMessage(response.data)
  } catch (error: any) {
    console.error('Chat message error:', error)

    if (error?.response?.status === 401) {
      clearAuthData()
      return {
        success: false,
        error: 'Your session has expired. Please log in again.'
      }
    }

    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to get response from AI assistant'
    }
  }
}

/**
 * Get predefined quick queries for UI suggestions
 */
export const getQuickQueries = async (): Promise<{ success: boolean; queries?: QuickQuery[]; error?: string }> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/quick-queries`)
    const queries = Array.isArray(response.data?.queries)
      ? response.data.queries
      : []
    return {
      success: Boolean(response.data?.success),
      queries
    }
  } catch (error: any) {
    console.error('Quick queries error:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to load quick queries'
    }
  }
}

/**
 * Check service health
 */
export const checkHealthAssistantHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`)
    return response.data
  } catch (error: any) {
    console.error('Health check error:', error)
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}