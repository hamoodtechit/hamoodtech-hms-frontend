import { appointmentService } from "@/services/appointment-service";
import { AppointmentPayload } from "@/types/appointment";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const APPOINTMENT_KEYS = {
  all: ["appointments"] as const,
  list: (params?: any) => [...APPOINTMENT_KEYS.all, "list", params] as const,
  details: (id: string) => [...APPOINTMENT_KEYS.all, "details", id] as const,
};

export function useAppointments(params?: any) {
  return useQuery({
    queryKey: APPOINTMENT_KEYS.list(params),
    queryFn: () => appointmentService.getAppointments(params),
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: APPOINTMENT_KEYS.details(id),
    queryFn: () => appointmentService.getAppointment(id),
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointmentPayload) => appointmentService.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AppointmentPayload> }) => 
      appointmentService.updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentService.deleteAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentService.cancelAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all });
    },
  });
}
