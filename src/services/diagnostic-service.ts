import { api } from "@/lib/api";
import {
  ApprovalPayload,
  CollectSamplePayload,
  DiagnosticPaginatedResponse,
  DiagnosticReport,
  DiagnosticReportParams,
  DiagnosticTest,
  DiagnosticTestParams,
  DiagnosticTestPayload,
  ReportTemplate,
  ReportTemplatePayload,
  RequisitionPayload,
  ResultEntryPayload
} from "@/types/diagnostic";

export const diagnosticService = {
  // Diagnostic Test APIs
  getDiagnosticTests: async (params?: DiagnosticTestParams): Promise<DiagnosticPaginatedResponse<DiagnosticTest>> => {
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

  // Diagnostic Report Workflow APIs
  getReports: async (params?: DiagnosticReportParams): Promise<DiagnosticPaginatedResponse<DiagnosticReport>> => {
    const response = await api.get<DiagnosticPaginatedResponse<DiagnosticReport>>("/diagnostic/reports", { params });
    
    return response.data;
  },

  getReportById: async (id: string): Promise<{ data: DiagnosticReport }> => {
    const response = await api.get<{ data: DiagnosticReport }>(`/diagnostic/reports/${id}`);
    
    return response.data;
  },

  createRequisition: async (data: RequisitionPayload): Promise<{ data: DiagnosticReport }> => {
    const response = await api.post<{ data: DiagnosticReport }>("/diagnostic/reports/requisition", data);
    
    return response.data;
  },

  collectSample: async (id: string, data: CollectSamplePayload): Promise<{ data: DiagnosticReport }> => {
    const response = await api.patch<{ data: DiagnosticReport }>(`/diagnostic/reports/${id}/collect-sample`, data);
    
    return response.data;
  },

  enterResult: async (id: string, data: ResultEntryPayload): Promise<{ data: DiagnosticReport }> => {
    const response = await api.patch<{ data: DiagnosticReport }>(`/diagnostic/reports/${id}/result`, data);
   
    return response.data;
  },

  approveReport: async (id: string, data: ApprovalPayload): Promise<{ data: DiagnosticReport }> => {
    const response = await api.patch<{ data: DiagnosticReport }>(`/diagnostic/reports/${id}/approve`, data);
    
    return response.data;
  },

  // Report Template APIs
  getReportTemplates: async (params?: any): Promise<DiagnosticPaginatedResponse<ReportTemplate>> => {
    const response = await api.get<DiagnosticPaginatedResponse<ReportTemplate>>("/reports/templates", { params });
    
    return response.data;
  },

  createReportTemplate: async (data: ReportTemplatePayload): Promise<ReportTemplate> => {
    const response = await api.post("/reports/templates", data);
    
    return response.data;
  },

  updateReportTemplate: async (id: string, data: Partial<ReportTemplatePayload>): Promise<ReportTemplate> => {
    const response = await api.patch(`/reports/templates/${id}`, data);
    return response.data;
  },

  deleteReportTemplate: async (id: string): Promise<void> => {
    await api.delete(`/reports/templates/${id}`);
    
  },
};
