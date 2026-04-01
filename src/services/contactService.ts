import axios from 'axios'

const contactApi = axios.create({
  baseURL: '/api/contact',
  headers: {
    'Content-Type': 'application/json',
  },
})

export type ContactMessagePayload = {
  firstName: string
  lastName: string
  email: string
  subject: string
  message: string
}

export const sendContactMessage = async (payload: ContactMessagePayload) => {
  const response = await contactApi.post('/', payload)
  return response.data
}
