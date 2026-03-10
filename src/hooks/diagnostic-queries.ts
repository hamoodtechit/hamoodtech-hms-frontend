import { diagnosticService } from "@/services/diagnostic-service";
import { DiagnosticReportParams, DiagnosticTestParams, DiagnosticTestPayload } from "@/types/diagnostic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const DIAGNOSTIC_KEYS = {
  all: ["diagnostic"] as const,
  tests: (params?: DiagnosticTestParams) => [...DIAGNOSTIC_KEYS.all, "tests", params] as const,
  test: (id: string) => [...DIAGNOSTIC_KEYS.all, "test", id] as const,
  reports: (params?: DiagnosticReportParams) => [...DIAGNOSTIC_KEYS.all, "reports", params] as const,
  report: (id: string) => [...DIAGNOSTIC_KEYS.all, "report", id] as const,
};

export function useDiagnosticTests(params?: DiagnosticTestParams) {
  return useQuery({
    queryKey: DIAGNOSTIC_KEYS.tests(params),
    queryFn: () => diagnosticService.getDiagnosticTests(params),
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

export function useDiagnosticReports(params?: DiagnosticReportParams) {
  return useQuery({
    queryKey: DIAGNOSTIC_KEYS.reports(params),
    queryFn: () => diagnosticService.getReports(params),
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
