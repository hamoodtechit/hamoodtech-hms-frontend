import { diagnosticService } from "@/services/diagnostic-service";
import { DiagnosticTestPayload } from "@/types/diagnostic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const DIAGNOSTIC_KEYS = {
  all: ["diagnostic"] as const,
  tests: (params?: any) => [...DIAGNOSTIC_KEYS.all, "tests", params] as const,
  test: (id: string) => [...DIAGNOSTIC_KEYS.all, "test", id] as const,
};

export function useDiagnosticTests(params?: any) {
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
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.all });
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
