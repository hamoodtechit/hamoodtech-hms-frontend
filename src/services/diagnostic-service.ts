import { api } from "@/lib/api";
import { DiagnosticPaginatedResponse, DiagnosticTest, DiagnosticTestPayload } from "@/types/diagnostic";

export const diagnosticService = {
  // Diagnostic Test APIs
  getDiagnosticTests: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    category?: string;
    branchId?: string;
    isActive?: boolean;
  }): Promise<DiagnosticPaginatedResponse<DiagnosticTest>> => {
    const response = await api.get<DiagnosticPaginatedResponse<DiagnosticTest>>("/diagnostic/tests", { params });
    return response.data;
  },

  createDiagnosticTest: async (data: DiagnosticTestPayload): Promise<DiagnosticTest> => {
    const response = await api.post("/diagnostic/tests", data);
    return response.data;
  },

  updateDiagnosticTest: async (id: string, data: Partial<DiagnosticTestPayload>): Promise<DiagnosticTest> => {
    const response = await api.patch(`/diagnostic/tests/${id}`, data);
    return response.data;
  },

  deleteDiagnosticTest: async (id: string): Promise<void> => {
    await api.delete(`/diagnostic/tests/${id}`);
  },
};
