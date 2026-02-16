import { api } from '@/lib/api';
import {
    Branch,
    BranchListResponse,
    BranchPayload,
    CashRegisterClosePayload,
    CashRegisterListResponse,
    CashRegisterOpenPayload,
    CashRegisterResponse,
    Medicine,
    MedicinePayload,
    PharmacyEntity,
    PharmacyEntityType,
    PharmacyGraphResponse,
    PharmacyPayload,
    PharmacyResponse,
    PharmacyStatsResponse,
    Purchase,
    PurchaseListResponse,
    PurchasePayload,
    PurchaseStatus,
    Sale,
    SaleListResponse,
    SalePayload,
    SaleReturnPayload,
    Stock,
    StockAdjustmentPayload,
    StockTransferPayload,
    Supplier,
    SupplierListResponse,
    SupplierPayload,
    UpdateSalePayload
} from '@/types/pharmacy';

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
    search?: string;
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

  // Sales APIs
  createSale: async (data: SalePayload): Promise<{ success: boolean, message: string, data: any }> => {
    const response = await api.post<{ success: boolean, message: string, data: any }>('/pharmacy/sales', data);
    return response.data;
  },

  getSales: async (params?: {
    page?: number;
    limit?: number;
    branchId?: string;
    patientId?: string;
    status?: string;
  }): Promise<SaleListResponse> => {
    const response = await api.get<SaleListResponse>('/pharmacy/sales', { params });
    return response.data;
  },

  getSale: async (id: string): Promise<{ success: boolean, message: string, data: Sale }> => {
    const response = await api.get<{ success: boolean, message: string, data: Sale }>(`/pharmacy/sales/${id}`);
    return response.data;
  },

  updateSale: async (id: string, data: UpdateSalePayload): Promise<{ success: boolean, message: string, data: Sale }> => {
    const response = await api.patch<{ success: boolean, message: string, data: Sale }>(`/pharmacy/sales/${id}`, data);
    return response.data;
  },

  // Sale Returns APIs
  createSaleReturn: async (data: SaleReturnPayload): Promise<{ success: boolean, message: string, data: any }> => {
    const response = await api.post<{ success: boolean, message: string, data: any }>('/pharmacy/sale-returns', data);
    return response.data;
  },

  getSaleReturns: async (params?: {
    page?: number;
    limit?: number;
    branchId?: string;
    patientId?: string;
    status?: string;
  }): Promise<SaleReturnListResponse> => {
    const response = await api.get<SaleReturnListResponse>('/pharmacy/sale-returns', { params });
    return response.data;
  },

  // --- Cash Register ---
  openCashRegister: async (data: CashRegisterOpenPayload): Promise<CashRegisterResponse> => {
    const response = await api.post<CashRegisterResponse>('/pharmacy/cash-register/open', data);
    return response.data;
  },

  closeCashRegister: async (id: string, data: CashRegisterClosePayload): Promise<CashRegisterResponse> => {
    const response = await api.post<CashRegisterResponse>(`/pharmacy/cash-register/${id}/close`, data);
    return response.data;
  },

  getActiveCashRegister: async (branchId: string): Promise<CashRegisterResponse> => {
    const response = await api.get<CashRegisterResponse>('/pharmacy/cash-register/active', { params: { branchId } });
    return response.data;
  },

  getCashRegisters: async (params?: { page?: number; limit?: number; branchId?: string; userId?: string; status?: string }): Promise<CashRegisterListResponse> => {
    const response = await api.get<CashRegisterListResponse>('/pharmacy/cash-register', { params });
    return response.data;
  },

  getCashRegister: async (id: string): Promise<CashRegisterResponse> => {
    const response = await api.get<CashRegisterResponse>(`/pharmacy/cash-register/${id}`);
    return response.data;
  },

  // --- Reports ---
  getPharmacyStats: async (params: { branchId?: string; startDate?: string; endDate?: string }): Promise<PharmacyStatsResponse> => {
    const response = await api.get<PharmacyStatsResponse>('/reports/pharmacy/stats', { params });
    return response.data;
  },

  getPharmacyGraph: async (params: { branchId?: string; startDate?: string; endDate?: string; days?: number }): Promise<PharmacyGraphResponse> => {
    const response = await api.get<PharmacyGraphResponse>('/reports/pharmacy/graph', { params });
    return response.data;
  },

  getTopSellingProducts: async (params: { branchId?: string; days?: number; startDate?: string; endDate?: string }): Promise<any> => {
    const response = await api.get('/reports/pharmacy/top-selling', { params });
    return response.data;
  },

  // --- Patients ---
  getBrands: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
  }): Promise<PharmacyResponse<PharmacyEntity>> => {
    const response = await api.get<PharmacyResponse<PharmacyEntity>>('/pharmacy/brands', { params });
    return response.data;
  },

  // Patients
  getPatients: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    name?: string;
    phone?: string;
    visitType?: 'ipd' | 'opd' | 'emergency';
  }): Promise<any> => {
    const response = await api.get('/patients', { params });
    return response.data;
  },

  getPatient: async (id: string): Promise<any> => {
    const response = await api.get(`/patients/${id}`);
    return response.data;
  },

  createPatient: async (data: any): Promise<any> => {
    const response = await api.post('/patients', data);
    return response.data;
  },

  updatePatient: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/patients/${id}`, data);
    return response.data;
  },

  deletePatient: async (id: string): Promise<any> => {
    const response = await api.delete(`/patients/${id}`);
    return response.data;
  },
};

