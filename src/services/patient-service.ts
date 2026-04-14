import {
  Admission,
  AdmissionListResponse,
  AdmissionPayload,
  AdmissionQueryParams,
  Patient,
  PatientListResponse,
  PatientPayload,
  PatientQueryParams,
  DischargeInitiateData,
  DischargePayload,
  PharmacyPaymentPayload
} from '@/types/patient';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://hms-srv-dev.genify.live/api/v1';

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

  // Admissions
  getAdmissions: async (params?: AdmissionQueryParams): Promise<AdmissionListResponse> => {
    const response = await api.get<AdmissionListResponse>('/patients/admissions', { params });
    console.log('GET /patients/admissions response:', response.data);
    return response.data;
  },

  getAdmission: async (id: string): Promise<{ success: boolean; data: { patientAdmission: Admission; sale?: any } }> => {
    const response = await api.get<{ success: boolean; data: { patientAdmission: Admission; sale?: any } }>(`/patients/admissions/${id}`);
    console.log('GET /patients/admissions/:id response:', response.data);
    return response.data;
  },

  createAdmission: async (data: AdmissionPayload): Promise<{ success: boolean; message: string; data: Admission }> => {
    const response = await api.post<{ success: boolean; message: string; data: Admission }>('/patients/admissions', data);
    console.log('POST /patients/admissions response:', response.data);
    return response.data;
  },

  updateAdmission: async (id: string, data: Partial<AdmissionPayload>): Promise<{ success: boolean; message: string; data: Admission }> => {
    const response = await api.patch<{ success: boolean; message: string; data: Admission }>(`/patients/admissions/${id}`, data);
    console.log('PATCH /patients/admissions response:', response.data);
    return response.data;
  },

  deleteAdmission: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/patients/admissions/${id}`);
    console.log('DELETE /patients/admissions response:', response.data);
    return response.data;
  },

  dischargeInitiate: async (patientId: string): Promise<{ success: boolean; message: string; data: DischargeInitiateData }> => {
    const response = await api.get<{ success: boolean; message: string; data: DischargeInitiateData }>(`/patients/discharge-initiate/${patientId}`);
    return response.data;
  },

  completeDischarge: async (data: DischargePayload): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await api.post<{ success: boolean; message: string; data: any }>('/patients/discharge-payment', data);
    return response.data;
  },

  payPharmacyDues: async (data: PharmacyPaymentPayload): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await api.post<{ success: boolean; message: string; data: any }>('/patients/pharmacy-payment', data);
    return response.data;
  },
};

