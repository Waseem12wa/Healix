import axios from 'axios'

const api = axios.create({
  baseURL: '/api/reminders',
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

export type DoctorReminder = {
  _id: string
  medicine: string
  dose: string
  frequency: number
  startDate: string
  duration: number
  doctorName: string
  doctorEmail: string
  reminderCount: number
  firstReminder: string
  lastReminder: string
}

export const savePatientReminderEmail = async (patientEmail: string, reminderEmail: string): Promise<{ reminderEmail: string }> => {
  const response = await api.post('/patient-email-preference', {
    patientEmail,
    reminderEmail,
  })
  return response.data?.data
}

export const getPatientReminderEmail = async (patientEmail: string): Promise<{ reminderEmail: string | null; isSet: boolean }> => {
  const response = await api.get('/patient-email-preference', {
    params: { patientEmail },
  })
  return response.data?.data || { reminderEmail: null, isSet: false }
}

export const getPatientReminders = async (patientEmail: string): Promise<DoctorReminder[]> => {
  const response = await api.get('/patient-reminders', {
    params: { patientEmail },
  })
  return response.data?.data || []
}

export const deletePatientReminderSet = async (payload: {
  medicineName: string
  dose: string
  doctorEmail: string
  startDate: string
  duration: number
  frequency: number
}): Promise<{ deletedCount: number }> => {
  const response = await api.delete('/patient-reminders', { data: payload })
  return response.data?.data || { deletedCount: 0 }
}

export const getApprovedPatients = async (doctorEmail: string): Promise<any[]> => {
  const response = await api.get('/approved-patients', {
    params: { doctorEmail },
  })
  return response.data?.data || []
}

export const createReminders = async (payload: {
  doctorEmail: string
  doctorName: string
  patientId: string
  patientEmail: string
  patientName: string
  medicineName: string
  dose: string
  frequency: number
  times: string[]
  startDate: string
  duration: number
}): Promise<{ count: number; reminders: any[] }> => {
  const response = await api.post('/create', payload)
  return response.data?.data || { count: 0, reminders: [] }
}

export const getPatientUpcomingReminders = async (): Promise<any[]> => {
  const response = await api.get('/upcoming')
  return response.data?.data || []
}

export const getDoctorAllReminders = async (doctorEmail: string): Promise<any[]> => {
  const response = await api.get('/all', {
    params: { doctorEmail },
  })
  return response.data?.data || []
}
