import axios, { AxiosError } from 'axios'

const API_BASE = 'http://localhost:5000/api/payments'

// Create axios instance with auth
const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add JWT token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Types
export interface Medicine {
  _id: string
  medicineName: string
  quantity: number
  sellingPrice: number
  expiryDate: string
  batchNumber: string
  supplierName?: string
}

export interface PaymentGateway {
  name: 'stripe' | 'easypaisa' | 'jazzcash'
  label: string
  active: boolean
  region?: string
}

export interface CreatePaymentIntentRequest {
  amount: number
  currency: string
  paymentGateway: 'stripe' | 'easypaisa' | 'jazzcash'
  medicines: {
    medicineId: string
    quantity: number
    price: number
  }[]
  email: string
  phone?: string
}

export interface PaymentIntentResponse {
  success: boolean
  paymentId: string
  gateway: string
  amount: number
  currency: string
  clientSecret?: string
  redirectUrl?: string
  paymentData?: Record<string, unknown>
  status: string
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string
  paymentMethodId?: string
  gateway: string
  transactionData?: Record<string, unknown>
}

export interface Order {
  _id: string
  orderNumber: string
  userId: string
  medicines: {
    medicineId: string
    medicineName: string
    quantity: number
    unitPrice: number
  }[]
  totalAmount: number
  finalAmount: number
  paymentGateway: string
  paymentStatus: 'pending' | 'completed' | 'failed'
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface PaymentTransaction {
  _id: string
  transactionId: string
  orderId: string
  gateway: string
  amount: number
  currency: string
  status: 'initiated' | 'pending' | 'authorized' | 'captured' | 'succeeded' | 'failed' | 'refunded'
  cardDetails?: {
    last4: string
    brand: string
    expiryMonth: number
    expiryYear: number
  }
  walletDetails?: {
    accountNumber: string
    provider: string
  }
  errorDetails?: {
    code: string
    message: string
  }
  createdAt: string
  updatedAt: string
}

// Payment API calls

/**
 * Get available payment gateways
 */
export const getAvailableGateways = async (): Promise<PaymentGateway[]> => {
  try {
    const response = await apiClient.get<{ gateways: PaymentGateway[] }>('/gateways')
    return response.data.gateways
  } catch (error) {
    console.error('Error fetching gateways:', error)
    throw error
  }
}

/**
 * Create payment intent
 */
export const createPaymentIntent = async (
  data: CreatePaymentIntentRequest
): Promise<PaymentIntentResponse> => {
  try {
    const response = await apiClient.post<PaymentIntentResponse>('/create-intent', data)
    return response.data
  } catch (error) {
    const axiosError = error as AxiosError<{ error: string }>
    throw new Error(axiosError.response?.data?.error || 'Failed to create payment intent')
  }
}

/**
 * Confirm Stripe payment
 */
export const confirmStripePayment = async (
  data: ConfirmPaymentRequest
): Promise<{ success: boolean; message: string; orderId?: string }> => {
  try {
    const response = await apiClient.post<{
      success: boolean
      message: string
      orderId?: string
    }>('/stripe/confirm', data)
    return response.data
  } catch (error) {
    const axiosError = error as AxiosError<{ error: string }>
    throw new Error(axiosError.response?.data?.error || 'Payment confirmation failed')
  }
}

/**
 * Get user orders
 */
export const getUserOrders = async (
  userId: string,
  limit = 10,
  skip = 0
): Promise<{ orders: Order[]; total: number }> => {
  try {
    const response = await apiClient.get<{ orders: Order[]; total: number }>(
      `/orders/${userId}`,
      { params: { limit, skip } }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching orders:', error)
    throw error
  }
}

/**
 * Get order details
 */
export const getOrderDetails = async (orderId: string): Promise<Order> => {
  try {
    const response = await apiClient.get<Order>(`/order/${orderId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching order:', error)
    throw error
  }
}

/**
 * Get transaction details
 */
export const getTransactionDetails = async (
  transactionId: string
): Promise<PaymentTransaction> => {
  try {
    const response = await apiClient.get<PaymentTransaction>(`/transaction/${transactionId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching transaction:', error)
    throw error
  }
}

/**
 * Get medicines catalog
 */
export const getMedicines = async (
  query?: string,
  limit = 20,
  skip = 0
): Promise<{ medicines: Medicine[]; total: number }> => {
  try {
    const response = await apiClient.get<{ medicines: Medicine[]; total: number }>(
      '/medicines',
      { params: { query, limit, skip } }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching medicines:', error)
    throw error
  }
}

/**
 * Get single medicine details
 */
export const getMedicineDetails = async (medicineId: string): Promise<Medicine> => {
  try {
    const response = await apiClient.get<Medicine>(`/medicine/${medicineId}`)
    return response.data
  } catch (error) {
    console.error('Error fetching medicine:', error)
    throw error
  }
}

/**
 * Get payment statistics
 */
export const getPaymentStats = async (): Promise<{
  totalTransactions: number
  totalAmount: number
  completedCount: number
  failedCount: number
  byGateway: Record<string, unknown>
}> => {
  try {
    const response = await apiClient.get<{
      totalTransactions: number
      totalAmount: number
      completedCount: number
      failedCount: number
      byGateway: Record<string, unknown>
    }>('/stats')
    return response.data
  } catch (error) {
    console.error('Error fetching stats:', error)
    throw error
  }
}

/**
 * Process refund for an order
 */
export const processRefund = async (
  orderId: string,
  reason?: string
): Promise<{ success: boolean; refundId: string; amount: number }> => {
  try {
    const response = await apiClient.post<{
      success: boolean
      refundId: string
      amount: number
    }>('/refund', { orderId, reason })
    return response.data
  } catch (error) {
    const axiosError = error as AxiosError<{ error: string }>
    throw new Error(axiosError.response?.data?.error || 'Refund processing failed')
  }
}

export default apiClient
