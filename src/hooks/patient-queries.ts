import { 
  AdmissionPayload, 
  AdmissionQueryParams, 
  PatientPayload, 
  PatientQueryParams 
} from "@/types/patient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { patientService } from "@/services/patient-service";

export const PATIENT_KEYS = {
  all: ["patients"] as const,
  list: (params?: PatientQueryParams) => [...PATIENT_KEYS.all, "list", params] as const,
  details: (id: string) => [...PATIENT_KEYS.all, "details", id] as const,
  admissions: ["patients", "admissions"] as const,
  admissionList: (params?: AdmissionQueryParams) => [...PATIENT_KEYS.admissions, "list", params] as const,
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

// Admissions
export function useAdmissions(params?: AdmissionQueryParams) {
  return useQuery({
    queryKey: PATIENT_KEYS.admissionList(params),
    queryFn: () => patientService.getAdmissions(params),
  });
}

export function useAdmission(id: string) {
  return useQuery({
    queryKey: [...PATIENT_KEYS.admissions, "details", id],
    queryFn: () => patientService.getAdmission(id),
    enabled: !!id,
  });
}

export function useCreateAdmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdmissionPayload) => patientService.createAdmission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.admissions });
    },
  });
}

export function useUpdateAdmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdmissionPayload> }) => 
      patientService.updateAdmission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.admissions });
    },
  });
}

export function useDeleteAdmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patientService.deleteAdmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENT_KEYS.admissions });
    },
  });
}

