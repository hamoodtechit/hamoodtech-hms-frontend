import { api } from '@/lib/api';
import {
    Sale,
    SalePayload,
    SaleReturn,
    SaleReturnPayload,
    SalesPaginatedResponse
} from '@/types/sales';

export const salesService = {
  getSales: async (params?: {
    page?: number;
    limit?: number;
    branchId?: string;
    patientId?: string;
    status?: string;
    search?: string;
  }): Promise<SalesPaginatedResponse<Sale>> => {
    const response = await api.get<SalesPaginatedResponse<Sale>>('/sales', { params });
    return response.data;
  },

  getSale: async (id: string): Promise<{ success: boolean; message: string; data: Sale }> => {
    const response = await api.get<{ success: boolean; message: string; data: Sale }>(`/sales/${id}`);
    return response.data;
  },

  createSale: async (data: SalePayload): Promise<{ success: boolean; message: string; data: Sale }> => {
    const response = await api.post<{ success: boolean; message: string; data: Sale }>('/sales', data);
    return response.data;
  },

  updateSale: async (id: string, data: Partial<SalePayload>): Promise<{ success: boolean; message: string; data: Sale }> => {
    const response = await api.patch<{ success: boolean; message: string; data: Sale }>(`/sales/${id}`, data);
    return response.data;
  },

  getSaleReturns: async (params?: {
    page?: number;
    limit?: number;
    branchId?: string;
    patientId?: string;
    status?: string;
    search?: string;
  }): Promise<SalesPaginatedResponse<SaleReturn>> => {
    const response = await api.get<SalesPaginatedResponse<SaleReturn>>('/sales/returns', { params });
    return response.data;
  },

  getSaleReturn: async (id: string): Promise<{ success: boolean; message: string; data: SaleReturn }> => {
    const response = await api.get<{ success: boolean; message: string; data: SaleReturn }>(`/sales/returns/${id}`);
    return response.data;
  },

  createSaleReturn: async (data: SaleReturnPayload): Promise<{ success: boolean; message: string; data: SaleReturn }> => {
    const response = await api.post<{ success: boolean; message: string; data: SaleReturn }>('/sales/returns', data);
    return response.data;
  },

  updateSaleReturnStatus: async (id: string, status: string): Promise<{ success: boolean; message: string; data: any }> => {
    const response = await api.patch<{ success: boolean; message: string; data: any }>(`/sales/returns/${id}/status`, { status });
    return response.data;
  },
};
