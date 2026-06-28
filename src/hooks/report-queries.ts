import { useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/report-service";
import { IOverallSummaryResponse } from "@/types/report";

export function useOverallSummaryReport(params?: { branchId?: string; startDate?: string; endDate?: string }) {
  return useQuery<IOverallSummaryResponse>({
    queryKey: ["reports", "overall-summary", params],
    queryFn: () => reportService.getOverallSummary(params),
  });
}
