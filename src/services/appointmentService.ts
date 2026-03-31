import axios from 'axios';

const API_BASE_URL = '/api/appointments';

const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('authToken');

export interface Appointment {
  _id: string;
  patientId: string;
  patientEmail: string;
  patientName: string;
  doctorId: string;
  doctorEmail: string;
  doctorName: string;
  specialization: string;
  date: string;
  time: string;
  location: string;
  consultationType: 'in-person' | 'online';
  fee: number;
  notes: string;
  doctorComments: string;
  meetingLink: string;
  appointmentLocationDetails: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';
  completedAt?: string | null;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionMedicine {
  name: string;
  dosage?: string;
  instructions?: string;
}

export interface Prescription {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  conditionDescription: string;
  medicines: PrescriptionMedicine[];
  createdAt: string;
  updatedAt: string;
}

// Get doctor's appointments
export const getDoctorAppointments = async (): Promise<Appointment[]> => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/doctor`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    throw error;
  }
};

// Get patient's appointments
export const getPatientAppointments = async (): Promise<Appointment[]> => {
  try {
    const token = getAuthToken();
    const response = await axios.get(`${API_BASE_URL}/patient`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    throw error;
  }
};

// Approve or reject appointment
export const updateAppointmentStatus = async (
  appointmentId: string,
  status: 'approved' | 'rejected',
  details?: {
    doctorComments?: string;
    meetingLink?: string;
    appointmentLocationDetails?: string;
  }
): Promise<Appointment> => {
  try {
    const token = getAuthToken();
    const response = await axios.put(
      `${API_BASE_URL}/${appointmentId}/status`,
      {
        status,
        ...(details || {}),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
};

// Update appointment details (doctor comments, meeting link, location)
export const updateAppointmentDetails = async (
  appointmentId: string,
  details: {
    doctorComments?: string;
    meetingLink?: string;
    appointmentLocationDetails?: string;
  }
): Promise<Appointment> => {
  try {
    const token = getAuthToken();
    const response = await axios.put(
      `${API_BASE_URL}/${appointmentId}/details`,
      details,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error updating appointment details:', error);
    throw error;
  }
};

// Cancel appointment
export const cancelAppointment = async (appointmentId: string): Promise<void> => {
  try {
    const token = getAuthToken();
    await axios.delete(`${API_BASE_URL}/${appointmentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw error;
  }
};

export const completeAppointment = async (appointmentId: string): Promise<Appointment> => {
  try {
    const token = getAuthToken();
    const response = await axios.put(
      `${API_BASE_URL}/${appointmentId}/complete`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error completing appointment:', error);
    throw error;
  }
};

export const addAppointmentPrescription = async (
  appointmentId: string,
  payload: {
    conditionDescription: string;
    medicines: PrescriptionMedicine[];
  }
): Promise<Prescription> => {
  try {
    const token = getAuthToken();
    const response = await axios.post(
      `${API_BASE_URL}/${appointmentId}/prescription`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error adding prescription:', error);
    throw error;
  }
};
