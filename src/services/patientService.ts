import axios from 'axios';
import type { CartData } from './cartService';

const api = axios.create({
  baseURL: '/api/auth',
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

export type PatientProfilePayload = {
  userName?: string;
  email?: string;
  patientProfile?: {
    profileImage?: string;
    assignedDoctorId?: string | null;
    age?: number;
    gender?: string;
    mobileNumber?: string;
    bio?: string;
  };
};

export type AvailableDoctor = {
  id: string;
  name: string;
  email: string;
  specialization?: string;
  city?: string;
};

export const getMyProfile = async () => {
  const response = await api.get('/me');
  return response.data?.data;
};

export const getAvailableDoctors = async (): Promise<AvailableDoctor[]> => {
  const response = await api.get('/doctors/available');
  return response.data?.data || [];
};

export const updateMyProfile = async (payload: PatientProfilePayload) => {
  const response = await api.put('/me/profile', payload);
  return response.data?.data;
};

export const uploadMyProfileImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  const token = localStorage.getItem('token');
  const response = await axios.post('/api/auth/me/profile-image', formData, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  return response.data?.data?.profileImage || '';
};

export const getMyCart = async (): Promise<CartData> => {
  const response = await api.get('/me/cart');
  return response.data?.cart || {};
};

export const saveMyCart = async (cart: CartData): Promise<void> => {
  await api.put('/me/cart', { cart });
};

export const logPatientActivity = async (payload: {
  category: 'purchase' | 'ai-assistant' | 'drug-interaction' | 'food-interaction' | 'profile-update' | 'cart-update' | 'other';
  title: string;
  details?: string;
  metadata?: Record<string, unknown>;
}) => {
  await api.post('/activity', payload);
};

export const getPatientActivities = async (category?: string, limit = 50) => {
  const response = await api.get('/activity', { params: { category, limit } });
  return response.data?.activities || [];
};

export const deleteMyAccount = async (password: string, confirmText: string) => {
  const response = await api.delete('/me', {
    data: {
      password,
      confirmText,
    },
  });
  return response.data;
};
