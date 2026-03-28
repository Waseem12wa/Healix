import axios from 'axios'

const api = axios.create({
  baseURL: '/api/doctors',
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

export type DoctorDashboardLiveData = {
  generatedAt: string
  doctor: {
    email: string
    name: string
    specialization?: string
  }
  appointments: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  monitoring: {
    assignedPatients: number
    trackedPatientActivities: number
    moduleUsage: {
      ddi: number
      dfi: number
      sideEffects: number
      medicationShop: number
      healthSummary: number
      aiAssistant: number
      appointments: number
      reminders: number
      profileUpdates: number
      total: number
    }
  }
  outcomes: {
    approvals: number
    rejections: number
    recommendationsGiven: number
    actionsTaken: number
  }
  reminders: {
    created: number
    upcomingNext7Days: number
  }
  trend7d: Array<{
    key: string
    day: string
    doctorActions: number
    patientRequests: number
    approvals: number
    rejections: number
  }>
  recentDoctorActions: Array<{
    id: string
    title?: string
    details?: string
    category?: string
    createdAt?: string
  }>
  recentPatientSignals: Array<{
    id: string
    title?: string
    details?: string
    category?: string
    createdAt?: string
  }>
}

export type AssignedPatientItem = {
  id: string
  patientName: string
  email: string
  age?: number | null
  gender?: string
  mobileNumber?: string
  bio?: string
}

export const getDoctorDashboardLive = async (): Promise<DoctorDashboardLiveData> => {
  const response = await api.get('/dashboard-live')
  return response.data?.data
}

export const getAssignedPatients = async (): Promise<AssignedPatientItem[]> => {
  const response = await api.get('/assigned-patients')
  return response.data?.data || []
}
