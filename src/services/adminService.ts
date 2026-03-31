import axios from 'axios';

const api = axios.create({
  baseURL: '/api/admin',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AdminAnalytics {
  generatedAt: string;
  totals: {
    totalUsers: number;
    totalAppointments: number;
    totalPayments: number;
    totalOrders: number;
    totalSuccessfulPayments: number;
    totalRevenue: number;
  };
  usersByRole: {
    patient: number;
    doctor: number;
    provider: number;
    admin: number;
  };
  appointmentsByStatus: {
    pending: number;
    approved: number;
    completed: number;
    rejected: number;
    cancelled: number;
  };
  trend7d: {
    newUsers: number;
    newAppointments: number;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'provider' | 'admin';
  status: 'active';
  joinedDate: string;
  updatedAt: string;
}

export interface AdminAppointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorId: string;
  doctorName: string;
  doctorEmail: string;
  specialization: string;
  date: string;
  time: string;
  consultationType: 'in-person' | 'online';
  fee: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface AdminPayment {
  id: string;
  transactionId: string;
  gateway: string;
  gatewayTransactionId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  orderId: string | null;
  orderNumber: string;
  userId: string | null;
  userName: string;
  userEmail: string;
  userRole: string;
  createdAt: string;
  completedAt?: string;
}

export interface AdminMedicine {
  id: string;
  medicineName: string;
  genericName: string;
  category: string;
  therapeuticUse: string;
  commonDosage: string;
  sellingPrice: number;
  quantity: number;
  currency: 'PKR' | 'USD' | string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSystemSettings {
  platformName: string;
  supportEmail: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  enableEmailNotifications: boolean;
  appointmentReminderLeadMinutes: number;
  defaultThemeMode: 'light' | 'dark';
  defaultBlackAndWhiteMode: boolean;
}

export const getAdminAnalytics = async (): Promise<AdminAnalytics> => {
  const response = await api.get('/analytics');
  return response.data.data;
};

export const getAdminUsers = async (params?: { role?: string; search?: string }): Promise<AdminUser[]> => {
  const response = await api.get('/users', { params });
  return response.data.data || [];
};

export const deleteAdminUser = async (userId: string): Promise<void> => {
  await api.delete(`/users/${userId}`);
};

export const getAdminAppointments = async (): Promise<AdminAppointment[]> => {
  const response = await api.get('/appointments');
  return response.data.data || [];
};

export const deleteAdminAppointment = async (appointmentId: string): Promise<void> => {
  await api.delete(`/appointments/${appointmentId}`);
};

export const getAdminPayments = async (): Promise<AdminPayment[]> => {
  const response = await api.get('/payments');
  return response.data.data || [];
};

export const getAdminMedicines = async (): Promise<AdminMedicine[]> => {
  const response = await api.get('/medicines');
  return response.data.data || [];
};

export const deleteAdminMedicine = async (medicineId: string): Promise<void> => {
  await api.delete(`/medicines/${medicineId}`);
};

export const getAdminSystemSettings = async (): Promise<AdminSystemSettings> => {
  const response = await api.get('/settings');
  return response.data.data;
};

export const updateAdminSystemSettings = async (
  payload: AdminSystemSettings
): Promise<AdminSystemSettings> => {
  const response = await api.put('/settings', payload);
  return response.data.data;
};
