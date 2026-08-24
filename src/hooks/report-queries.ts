import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/report-service";
import { IOverallSummaryResponse, IServiceSalesParams, IServiceSalesResponse, IDepartmentSalesParams, IDepartmentSalesResponse } from "@/types/report";

export function useOverallSummaryReport(params?: { branchId?: string; startDate?: string; endDate?: string }) {
  return useQuery<IOverallSummaryResponse>({
    queryKey: ["reports", "overall-summary", params],
    queryFn: () => reportService.getOverallSummary(params),
  });
}

export function useServiceSalesReport(params?: IServiceSalesParams) {
  return useQuery<IServiceSalesResponse>({
    queryKey: ["reports", "service-sales", params],
    queryFn: () => reportService.getServiceSales(params),
  });
}

export function useDepartmentSalesReport(params?: IDepartmentSalesParams) {
  return useQuery<IDepartmentSalesResponse>({
    queryKey: ["reports", "department-sales", params],
    queryFn: () => reportService.getDepartmentSales(params),
  });
}
