import axios, { AxiosError } from 'axios'

const API_BASE = '/api/payments'

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
  currency?: 'PKR' | 'USD'
  expiryDate: string
  batchNumber?: string
  category?: string
  genericName?: string
  therapeuticUse?: string
  commonDosage?: string
  imageUrl?: string
  supplierName?: string
}

export interface MedicineCatalogResponse {
  medicines: Medicine[]
  total?: number
  pagination?: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface MedicineQueryOptions {
  search?: string
  category?: string
  formula?: string
  medicineType?: string
  sortBy?: 'medicineName' | 'sellingPrice' | 'quantity' | 'category' | 'genericName'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  page?: number
}

export interface MedicineFilterOptions {
  categories: string[]
  medicineTypes: string[]
}

export interface PaymentGateway {
  name: 'stripe' | 'paypal' | 'nayapay'
  label?: string
  displayName?: string
  active?: boolean
  isActive?: boolean
  description?: string
  type?: string
  region?: string
}

export interface CreatePaymentIntentRequest {
  orderId?: string
  userId?: string
  userEmail?: string
  amount: number
  currency: string
  paymentGateway: 'stripe' | 'paypal' | 'nayapay'
  medicines: {
    medicineId: string
    quantity: number
    price: number
  }[]
  customerEmail: string
  customerPhone?: string
  description?: string
}

export interface SavedPaymentMethod {
  paymentToken: string
  type: 'card' | 'paypal' | 'nayapay'
  provider: string
  holderName?: string
  last4?: string
  expiryMonth?: number
  expiryYear?: number
  walletIdMasked?: string
  isDefault?: boolean
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
  gateway: 'stripe' | 'paypal' | 'nayapay'
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
    return (response.data.gateways || []).map((gateway) => ({
      ...gateway,
      label: gateway.label || gateway.displayName,
      active: gateway.active ?? gateway.isActive ?? true,
    }))
  } catch (error) {
    console.error('Error fetching gateways:', error)
    throw error
  }
}

export const getSavedPaymentMethods = async (userId: string): Promise<SavedPaymentMethod[]> => {
  try {
    const response = await apiClient.get<{ methods: SavedPaymentMethod[] }>(`/saved-methods/${userId}`)
    return response.data.methods || []
  } catch (error) {
    console.error('Error fetching saved payment methods:', error)
    throw error
  }
}

export const savePaymentMethod = async (
  data: Omit<SavedPaymentMethod, 'paymentToken'> & { userId?: string; userEmail?: string; setDefault?: boolean }
): Promise<SavedPaymentMethod> => {
  try {
    const response = await apiClient.post<{ method: SavedPaymentMethod }>('/saved-methods', data)
    return response.data.method
  } catch (error) {
    const axiosError = error as AxiosError<{ error: string }>
    throw new Error(axiosError.response?.data?.error || 'Failed to save payment method')
  }
}

/**
 * Create payment intent
 */
export const createPaymentIntent = async (
  data: CreatePaymentIntentRequest
): Promise<PaymentIntentResponse> => {
  try {
    const response = await apiClient.post<{ success?: boolean; data?: PaymentIntentResponse } | PaymentIntentResponse>(
      '/create-intent',
      data
    )
    const payload = (response.data as { data?: PaymentIntentResponse }).data
    return payload || (response.data as PaymentIntentResponse)
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
  userId?: string,
  limit = 10,
  skip = 0
): Promise<{ orders: Order[]; total: number }> => {
  try {
    const resolvedUserId = userId || localStorage.getItem('userId') || ''
    const response = await apiClient.get<{ orders: Order[]; total?: number; pagination?: { total?: number } }>(
      `/orders/${resolvedUserId}`,
      { params: { limit, page: Math.floor(skip / Math.max(1, limit)) + 1 } }
    )
    return {
      orders: response.data.orders || [],
      total: response.data.total || response.data.pagination?.total || 0,
    }
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
    const response = await apiClient.get<{ order: Order } | Order>(`/order/${orderId}`)
    return (response.data as { order?: Order }).order || (response.data as Order)
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
    const response = await apiClient.get<{ transaction: PaymentTransaction } | PaymentTransaction>(`/transaction/${transactionId}`)
    return (response.data as { transaction?: PaymentTransaction }).transaction || (response.data as PaymentTransaction)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    throw error
  }
}

/**
 * Get medicines catalog
 */
export const getMedicines = async (options: MedicineQueryOptions = {}): Promise<MedicineCatalogResponse> => {
  try {
    const {
      search,
      category,
      formula,
      medicineType,
      sortBy = 'medicineName',
      sortOrder = 'asc',
      limit = 20,
      page = 1,
    } = options

    const response = await apiClient.get<MedicineCatalogResponse>(
      '/medicines',
      {
        params: {
          search,
          category,
          formula,
          medicineType,
          sortBy,
          sortOrder,
          limit,
          page,
        }
      }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching medicines:', error)
    throw error
  }
}

export const getMedicineFilterOptions = async (): Promise<MedicineFilterOptions> => {
  try {
    const response = await apiClient.get<{ filters: MedicineFilterOptions }>('/medicines/filters')
    return response.data.filters || { categories: [], medicineTypes: [] }
  } catch (error) {
    console.error('Error fetching medicine filter options:', error)
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
