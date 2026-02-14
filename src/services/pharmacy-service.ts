import {
    Branch,
    BranchListResponse,
    BranchPayload,
    Medicine,
    MedicinePayload,
    PharmacyEntity,
    PharmacyEntityType,
    PharmacyPayload,
    PharmacyResponse,
    Purchase,
    PurchaseListResponse,
    PurchasePayload,
    PurchaseStatus,
    Stock,
    StockAdjustmentPayload,
    StockTransferPayload,
    Supplier,
    SupplierListResponse,
    SupplierPayload
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

  // Branch APIs
  getBranches: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
  }): Promise<BranchListResponse> => {
    const response = await api.get<BranchListResponse>('/branches', { params });
    return response.data;
  },

  getBranch: async (id: string): Promise<{ success: boolean, message: string, data: Branch }> => {
    const response = await api.get<{ success: boolean, message: string, data: Branch }>(`/branches/${id}`);
    return response.data;
  },

  createBranch: async (data: BranchPayload): Promise<{ success: boolean, message: string, data: Branch }> => {
    const response = await api.post<{ success: boolean, message: string, data: Branch }>('/branches', data);
    return response.data;
  },

  updateBranch: async (id: string, data: BranchPayload): Promise<{ success: boolean, message: string, data: Branch }> => {
    const response = await api.put<{ success: boolean, message: string, data: Branch }>(`/branches/${id}`, data);
    return response.data;
  },

  deleteBranch: async (id: string): Promise<{ success: boolean, message: string }> => {
    const response = await api.delete<{ success: boolean, message: string }>(`/branches/${id}`);
    return response.data;
  },

  // Supplier APIs
  getSuppliers: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
  }): Promise<SupplierListResponse> => {
    const response = await api.get<SupplierListResponse>('/pharmacy/suppliers', { params });
    return response.data;
  },

  getSupplier: async (id: string): Promise<{ success: boolean, message: string, data: Supplier }> => {
    const response = await api.get<{ success: boolean, message: string, data: Supplier }>(`/pharmacy/suppliers/${id}`);
    return response.data;
  },

  createSupplier: async (data: SupplierPayload): Promise<{ success: boolean, message: string, data: Supplier }> => {
    const response = await api.post<{ success: boolean, message: string, data: Supplier }>('/pharmacy/suppliers', data);
    return response.data;
  },

  updateSupplier: async (id: string, data: SupplierPayload): Promise<{ success: boolean, message: string, data: Supplier }> => {
    const response = await api.put<{ success: boolean, message: string, data: Supplier }>(`/pharmacy/suppliers/${id}`, data);
    return response.data;
  },

  deleteSupplier: async (id: string): Promise<{ success: boolean, message: string }> => {
    const response = await api.delete<{ success: boolean, message: string }>(`/pharmacy/suppliers/${id}`);
    return response.data;
  },

  // Purchase APIs
  getPurchases: async (params?: { 
    page?: number; 
    limit?: number; 
    branchId?: string;
    supplierId?: string;
    status?: PurchaseStatus;
  }): Promise<PurchaseListResponse> => {
    const response = await api.get<PurchaseListResponse>('/pharmacy/purchases', { params });
    return response.data;
  },

  getPurchase: async (id: string): Promise<{ success: boolean, message: string, data: Purchase }> => {
    const response = await api.get<{ success: boolean, message: string, data: Purchase }>(`/pharmacy/purchases/${id}`);
    return response.data;
  },

  createPurchase: async (data: PurchasePayload): Promise<{ success: boolean, message: string, data: Purchase }> => {
    const response = await api.post<{ success: boolean, message: string, data: Purchase }>('/pharmacy/purchases', data);
    return response.data;
  },

  updatePurchaseStatus: async (id: string, status: PurchaseStatus): Promise<{ success: boolean, message: string, data: Purchase }> => {
    const response = await api.patch<{ success: boolean, message: string, data: Purchase }>(`/pharmacy/purchases/${id}/status`, { status });
    return response.data;
  },
};

