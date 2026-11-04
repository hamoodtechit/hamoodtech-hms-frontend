import { api } from "@/lib/api";
import { IOverallSummaryResponse, IServiceSalesParams, IServiceSalesResponse, IDepartmentSalesParams, IDepartmentSalesResponse, IPharmacySalesParams, IPharmacySalesReportResponse, IAmbulanceReportParams, IAmbulanceReportResponse } from "@/types/report";

export const reportService = {
  getOverallSummary: async (params?: { branchId?: string; startDate?: string; endDate?: string }): Promise<IOverallSummaryResponse> => {
    const response = await api.get<IOverallSummaryResponse>("/reports/overall-summary", { params });
    return response.data;
  },

  getServiceSales: async (params?: IServiceSalesParams): Promise<IServiceSalesResponse> => {
    const response = await api.get<IServiceSalesResponse>("/reports/service-sales", { params });
    return response.data;
  },

  getDepartmentSales: async (params?: IDepartmentSalesParams): Promise<IDepartmentSalesResponse> => {
    const response = await api.get<IDepartmentSalesResponse>("/reports/department-sales", { params });
    return response.data;
  },

  getPharmacySales: async (params?: IPharmacySalesParams): Promise<IPharmacySalesReportResponse> => {
    const response = await api.get<IPharmacySalesReportResponse>("/reports/pharmacy-sales", { params });
    return response.data;
  },
  getAmbulanceReport: async (params?: IAmbulanceReportParams): Promise<IAmbulanceReportResponse> => {
    const response = await api.get<IAmbulanceReportResponse>("/reports/ambulance", { params });
    return response.data;
  },
};
