import { Patient, PatientListResponse, PatientPayload, PatientQueryParams } from '@/types/pharmacy';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hms-srv.hamoodtech.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token header to every request
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const patientService = {
  getPatients: async (params?: PatientQueryParams): Promise<PatientListResponse> => {
    const response = await api.get<PatientListResponse>('/patients', { params });
    return response.data;
  },

  createPatient: async (data: PatientPayload): Promise<{ success: boolean; message: string; data: Patient }> => {
    const response = await api.post<{ success: boolean; message: string; data: Patient }>('/patients', data);
    return response.data;
  },

  getPatient: async (id: string): Promise<{ success: boolean; message: string; data: Patient }> => {
    const response = await api.get<{ success: boolean; message: string; data: Patient }>(`/patients/${id}`);
    return response.data;
  },

  updatePatient: async (id: string, data: PatientPayload): Promise<{ success: boolean; message: string; data: Patient }> => {
    const response = await api.patch<{ success: boolean; message: string; data: Patient }>(`/patients/${id}`, data);
    return response.data;
  },

  deletePatient: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/patients/${id}`);
    return response.data;
  },
};
