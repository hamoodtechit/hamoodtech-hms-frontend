import {
    Medicine,
    MedicinePayload,
    PharmacyEntity,
    PharmacyEntityType,
    PharmacyPayload,
    PharmacyResponse,
    Stock,
    StockAdjustmentPayload,
    StockTransferPayload
} from '@/types/pharmacy';
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

export const pharmacyService = {
  getEntities: async (
    type: PharmacyEntityType, 
    params?: { page?: number; limit?: number; search?: string }
  ): Promise<PharmacyResponse<PharmacyEntity>> => {
    const response = await api.get<PharmacyResponse<PharmacyEntity>>(`/pharmacy/${type}`, { params });
    return response.data;
  },

  createEntity: async (
    type: PharmacyEntityType, 
    data: PharmacyPayload
  ): Promise<PharmacyEntity> => {
    const response = await api.post(`/pharmacy/${type}`, data);
    return response.data;
  },

  updateEntity: async (
    type: PharmacyEntityType, 
    id: string, 
    data: PharmacyPayload
  ): Promise<PharmacyEntity> => {
    const response = await api.patch(`/pharmacy/${type}/${id}`, data);
    return response.data;
  },

  deleteEntity: async (
    type: PharmacyEntityType, 
    id: string
  ): Promise<void> => {
    await api.delete(`/pharmacy/${type}/${id}`);
  },

  // Medicine APIs
  getMedicines: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    categoryId?: string;
    brandId?: string;
  }): Promise<PharmacyResponse<Medicine>> => {
    const response = await api.get<PharmacyResponse<Medicine>>('/pharmacy/medicines', { params });
    return response.data;
  },

  getMedicine: async (id: string): Promise<{ data: Medicine }> => {
    const response = await api.get<{ data: Medicine }>(`/pharmacy/medicines/${id}`);
    return response.data;
  },

  createMedicine: async (data: MedicinePayload): Promise<Medicine> => {
    const response = await api.post('/pharmacy/medicines', data);
    return response.data;
  },

  updateMedicine: async (id: string, data: Partial<MedicinePayload>): Promise<Medicine> => {
    const response = await api.patch(`/pharmacy/medicines/${id}`, data);
    return response.data;
  },

  deleteMedicine: async (id: string): Promise<void> => {
    await api.delete(`/pharmacy/medicines/${id}`);
  },

  // Stock APIs
  getStocks: async (params?: { 
    medicineId?: string; 
    branchId?: string;
    page?: number; 
    limit?: number; 
  }): Promise<PharmacyResponse<Stock>> => {
    const response = await api.get<PharmacyResponse<Stock>>('/pharmacy/stocks', { params });
    return response.data;
  },

  adjustStock: async (data: StockAdjustmentPayload): Promise<void> => {
    await api.post('/pharmacy/stocks/adjust', data);
  },

  transferStock: async (data: StockTransferPayload): Promise<void> => {
    await api.post('/pharmacy/stocks/transfer', data);
  },
};

