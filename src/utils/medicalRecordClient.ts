import axios from 'axios'

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '/api/medical-record'
  : 'http://localhost:5005'

export interface SummarizationResult {
  success: boolean
  summary?: string
  entities?: {
    medications: string[]
    conditions: string[]
    procedures: string[]
    vitals: string[]
  }
  confidence?: number
  processing_time?: number
  error?: string
}

export interface TextSummarizationResult {
  success: boolean
  summary?: string
  error?: string
}

/**
 * Upload and summarize a medical record file
 */
export const summarizeMedicalRecord = async (file: File): Promise<SummarizationResult> => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post(`${API_BASE_URL}/summarize`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes timeout for large files
    })

    return response.data
  } catch (error: any) {
    console.error('Medical record summarization error:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to summarize medical record'
    }
  }
}

/**
 * Summarize plain text medical content
 */
export const summarizeMedicalText = async (
  text: string,
  maxLength: number = 150,
  minLength: number = 50
): Promise<TextSummarizationResult> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/summarize-text`, {
      text,
      max_length: maxLength,
      min_length: minLength
    }, {
      timeout: 60000, // 1 minute timeout
    })

    return response.data
  } catch (error: any) {
    console.error('Medical text summarization error:', error)
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to summarize medical text'
    }
  }
}

/**
 * Check service health
 */
export const checkMedicalRecordServiceHealth = async () => {
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