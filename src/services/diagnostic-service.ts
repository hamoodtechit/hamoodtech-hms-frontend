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
  RequisitionPayload,
  ResultEntryPayload,
  ReportTemplate,
  ReportTemplatePayload
} from "@/types/diagnostic";

export const diagnosticService = {
  // Diagnostic Test APIs
  getDiagnosticTests: async (params?: DiagnosticTestParams): Promise<DiagnosticPaginatedResponse<DiagnosticTest>> => {
    const response = await api.get<DiagnosticPaginatedResponse<DiagnosticTest>>("/diagnostic/tests", { params });
    console.log("Diagnostic Tests API Response:", response.data);
    return response.data;
  },

  createDiagnosticTest: async (data: DiagnosticTestPayload): Promise<DiagnosticTest> => {
    const response = await api.post("/diagnostic/tests", data);
    console.log("Create Diagnostic Test API Response:", response.data);
    return response.data;
  },

  updateDiagnosticTest: async (id: string, data: Partial<DiagnosticTestPayload>): Promise<DiagnosticTest> => {
    const response = await api.patch(`/diagnostic/tests/${id}`, data);
    console.log("Update Diagnostic Test API Response:", response.data);
    return response.data;
  },

  deleteDiagnosticTest: async (id: string): Promise<void> => {
    await api.delete(`/diagnostic/tests/${id}`);
    console.log("Delete Diagnostic Test: Success");
  },

  // Diagnostic Report Workflow APIs
  getReports: async (params?: DiagnosticReportParams): Promise<DiagnosticPaginatedResponse<DiagnosticReport>> => {
    const response = await api.get<DiagnosticPaginatedResponse<DiagnosticReport>>("/diagnostic/reports", { params });
    console.log("Diagnostic Reports API Response:", response.data);
    return response.data;
  },

  getReportById: async (id: string): Promise<{ data: DiagnosticReport }> => {
    const response = await api.get<{ data: DiagnosticReport }>(`/diagnostic/reports/${id}`);
    console.log("Get Report By ID API Response:", response.data);
    return response.data;
  },

  createRequisition: async (data: RequisitionPayload): Promise<{ data: DiagnosticReport }> => {
    const response = await api.post<{ data: DiagnosticReport }>("/diagnostic/reports/requisition", data);
    console.log("Create Requisition API Response:", response.data);
    return response.data;
  },

  collectSample: async (id: string, data: CollectSamplePayload): Promise<{ data: DiagnosticReport }> => {
    const response = await api.patch<{ data: DiagnosticReport }>(`/diagnostic/reports/${id}/collect-sample`, data);
    console.log("Collect Sample API Response:", response.data);
    return response.data;
  },

  enterResult: async (id: string, data: ResultEntryPayload): Promise<{ data: DiagnosticReport }> => {
    const response = await api.patch<{ data: DiagnosticReport }>(`/diagnostic/reports/${id}/result`, data);
    console.log("Enter Result API Response:", response.data);
    return response.data;
  },

  approveReport: async (id: string, data: ApprovalPayload): Promise<{ data: DiagnosticReport }> => {
    const response = await api.patch<{ data: DiagnosticReport }>(`/diagnostic/reports/${id}/approve`, data);
    console.log("Approve Report API Response:", response.data);
    return response.data;
  },

  // Report Template APIs
  getReportTemplates: async (params?: any): Promise<DiagnosticPaginatedResponse<ReportTemplate>> => {
    const response = await api.get<DiagnosticPaginatedResponse<ReportTemplate>>("/reports/templates", { params });
    console.log("Get Report Templates API Response:", response.data);
    return response.data;
  },

  createReportTemplate: async (data: ReportTemplatePayload): Promise<ReportTemplate> => {
    const response = await api.post("/reports/templates", data);
    console.log("Create Report Template API Response:", response.data);
    return response.data;
  },

  updateReportTemplate: async (id: string, data: Partial<ReportTemplatePayload>): Promise<ReportTemplate> => {
    const response = await api.patch(`/reports/templates/${id}`, data);
    console.log("Update Report Template API Response:", response.data);
    return response.data;
  },

  deleteReportTemplate: async (id: string): Promise<void> => {
    await api.delete(`/reports/templates/${id}`);
    console.log("Delete Report Template: Success");
  },
};
