import { api } from "@/lib/api";
import { IOverallSummaryResponse } from "@/types/report";

export const reportService = {
  getOverallSummary: async (params?: { branchId?: string; startDate?: string; endDate?: string }): Promise<IOverallSummaryResponse> => {
    const response = await api.get<IOverallSummaryResponse>("/report/overall-summary", { params });
    return response.data;
  },
};
