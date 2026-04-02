import { diagnosticService } from "@/services/diagnostic-service";
import { 
  DiagnosticReportParams, 
  DiagnosticTestGroup, 
  DiagnosticTestGroupPayload, 
  DiagnosticTestParams, 
  DiagnosticTestPayload, 
  ReportTemplate, 
  ReportTemplatePayload,
  UpdateDeliveryStatusPayload
} from "@/types/diagnostic";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const DIAGNOSTIC_KEYS = {
  all: ["diagnostic"] as const,
  tests: (params?: DiagnosticTestParams) => [...DIAGNOSTIC_KEYS.all, "tests", params] as const,
  test: (id: string) => [...DIAGNOSTIC_KEYS.all, "test", id] as const,
  testGroups: (params?: any) => [...DIAGNOSTIC_KEYS.all, "test-groups", params] as const,
  reports: (params?: DiagnosticReportParams) => [...DIAGNOSTIC_KEYS.all, "reports", params] as const,
  report: (id: string) => [...DIAGNOSTIC_KEYS.all, "report", id] as const,
  templates: (params?: any) => [...DIAGNOSTIC_KEYS.all, "templates", params] as const,
};

// Test Group Hooks
export function useTestGroups(params?: any) {
  return useQuery({
    queryKey: DIAGNOSTIC_KEYS.testGroups(params),
    queryFn: () => diagnosticService.getTestGroups(params),
  });
}

export function useCreateTestGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DiagnosticTestGroupPayload) => diagnosticService.createTestGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.testGroups() });
    },
  });
}

export function useUpdateTestGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DiagnosticTestGroupPayload> }) => 
      diagnosticService.updateTestGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.testGroups() });
    },
  });
}

export function useDeleteTestGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => diagnosticService.deleteTestGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.testGroups() });
    },
  });
}

export function useDiagnosticTests(params?: DiagnosticTestParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: DIAGNOSTIC_KEYS.tests(params),
    queryFn: () => diagnosticService.getDiagnosticTests(params),
    ...options
  });
}

export function useCreateDiagnosticTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DiagnosticTestPayload) => diagnosticService.createDiagnosticTest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.tests() });
    },
  });
}

export function useUpdateDiagnosticTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DiagnosticTestPayload> }) => 
      diagnosticService.updateDiagnosticTest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.all });
    },
  });
}

export function useDeleteDiagnosticTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => diagnosticService.deleteDiagnosticTest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.all });
    },
  });
}

// Diagnostic Report Workflow Hooks

export function useDiagnosticReports(params?: DiagnosticReportParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: DIAGNOSTIC_KEYS.reports(params),
    queryFn: () => diagnosticService.getReports(params),
    placeholderData: keepPreviousData,
    ...options
  });
}

export function useDiagnosticReport(id: string) {
  return useQuery({
    queryKey: DIAGNOSTIC_KEYS.report(id),
    queryFn: () => diagnosticService.getReportById(id),
    enabled: !!id,
  });
}

export function useCreateRequisition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => diagnosticService.createRequisition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.reports() });
    },
  });
}

export function useCollectSample() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      diagnosticService.collectSample(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.reports() });
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.report(variables.id) });
    },
  });
}

export function useEnterResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      diagnosticService.enterResult(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.reports() });
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.report(variables.id) });
    },
  });
}

export function useApproveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      diagnosticService.approveReport(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.reports() });
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.report(variables.id) });
    },
  });
}

export function useUpdateDeliveryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDeliveryStatusPayload }) => 
      diagnosticService.updateDeliveryStatus(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.reports() });
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.report(variables.id) });
    },
  });
}

// Report Template Hooks

export function useReportTemplates(params?: any) {
  return useQuery({
    queryKey: DIAGNOSTIC_KEYS.templates(params),
    queryFn: () => diagnosticService.getReportTemplates(params),
  });
}

export function useCreateReportTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReportTemplatePayload) => diagnosticService.createReportTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.templates() });
    },
  });
}

export function useUpdateReportTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReportTemplatePayload> }) => 
      diagnosticService.updateReportTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.templates() });
    },
  });
}

export function useDeleteReportTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => diagnosticService.deleteReportTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.templates() });
    },
  });
}
