import { patientService } from "@/services/patient-service";
import { PatientPayload, PatientQueryParams } from "@/types/pharmacy";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const PATIENT_KEYS = {
  all: ["patients"] as const,
  list: (params?: PatientQueryParams) => [...PATIENT_KEYS.all, "list", params] as const,
  details: (id: string) => [...PATIENT_KEYS.all, "details", id] as const,
};

export function usePatients(params?: PatientQueryParams) {
  return useQuery({
    queryKey: PATIENT_KEYS.list(params),
    queryFn: () => patientService.getPatients(params),
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: PATIENT_KEYS.details(id),
    queryFn: () => patientService.getPatient(id),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PatientPayload) => patientService.createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.all });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PatientPayload }) => 
      patientService.updatePatient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.all });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patientService.deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.all });
    },
  });
}
