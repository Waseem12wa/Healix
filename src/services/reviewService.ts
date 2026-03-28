import axios from 'axios'

const api = axios.create({
  baseURL: '/api/reviews',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export type ReviewFeature = 'ddi' | 'dfi' | 'alternatives' | 'side-effects' | 'ai-assistant' | 'medication-pharmacy' | 'health-summary'

export type DoctorReviewRequest = {
  id: string
  patientId: string
  patientName: string
  patientEmail: string
  doctorId: string
  doctorEmail: string
  feature: ReviewFeature
  featureLabel: string
  patientQuery: string
  aiResultText: string
  aiResultData?: unknown
  status: 'pending' | 'approved' | 'rejected' | 'modified'
  doctorActionMessage?: string
  modifiedResultText?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export const createReviewRequest = async (payload: {
  feature: ReviewFeature
  patientQuery: string
  aiResultText: string
  aiResultData?: unknown
}): Promise<DoctorReviewRequest> => {
  const response = await api.post('/', payload)
  return response.data?.data
}

export const getMyReviewRequests = async (params?: { status?: string; limit?: number; feature?: ReviewFeature }): Promise<DoctorReviewRequest[]> => {
  const response = await api.get('/mine', { params })
  return response.data?.data || []
}

export const getReviewRequestById = async (id: string): Promise<DoctorReviewRequest> => {
  const response = await api.get(`/${id}`)
  return response.data?.data
}

export const takeReviewAction = async (
  id: string,
  payload: { action: 'approved' | 'rejected' | 'modified'; doctorActionMessage?: string; modifiedResultText?: string }
): Promise<DoctorReviewRequest> => {
  const response = await api.put(`/${id}/action`, payload)
  return response.data?.data
}
