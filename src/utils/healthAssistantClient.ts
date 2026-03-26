import axios from 'axios'

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/api/health-assistant'
  : 'http://localhost:5006'

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

/**
 * Send a chat message to the AI health assistant
 */
export const sendChatMessage = async (
  query: string,
  userId?: string,
  context?: any
): Promise<ChatMessage> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/chat`, {
      query,
      user_id: userId,
      context
    }, {
      timeout: 30000, // 30 seconds timeout
    })

    return response.data
  } catch (error: any) {
    console.error('Chat message error:', error)
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
    return response.data
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