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
import { api } from '@/lib/api';

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
   
    return response.data;
  },

  getAdmission: async (id: string): Promise<{ success: boolean; data: { patientAdmission: Admission; sale?: any; allSales?: any[]; pharmacy?: any; hospital?: any; grandTotal?: any; } }> => {
    const response = await api.get<{ success: boolean; data: { patientAdmission: Admission; sale?: any; allSales?: any[]; pharmacy?: any; hospital?: any; grandTotal?: any; } }>(`/patients/admissions/${id}`);
   
    return response.data;
  },

  createAdmission: async (data: AdmissionPayload): Promise<{ success: boolean; message: string; data: Admission }> => {
    const response = await api.post<{ success: boolean; message: string; data: Admission }>('/patients/admissions', data);
    
    return response.data;
  },

  updateAdmission: async (id: string, data: Partial<AdmissionPayload>): Promise<{ success: boolean; message: string; data: Admission }> => {
    const response = await api.patch<{ success: boolean; message: string; data: Admission }>(`/patients/admissions/${id}`, data);
    
    return response.data;
  },

  deleteAdmission: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/patients/admissions/${id}`);
    
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

