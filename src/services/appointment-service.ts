import { api } from "@/lib/api";
import { Appointment, AppointmentDetailsResponse, AppointmentPaginatedResponse, AppointmentPayload } from "@/types/appointment";

export const appointmentService = {
  getAppointments: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    patientId?: string;
    doctorId?: string;
    departmentId?: string;
    branchId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AppointmentPaginatedResponse> => {
    const response = await api.get<AppointmentPaginatedResponse>("/appointments", { params });
    return response.data;
  },

  getAppointment: async (id: string): Promise<AppointmentDetailsResponse> => {
    const response = await api.get<AppointmentDetailsResponse>(`/appointments/${id}`);
    return response.data;
  },

  createAppointment: async (data: AppointmentPayload): Promise<Appointment> => {
    const response = await api.post("/appointments", data);
    return response.data;
  },

  updateAppointment: async (id: string, data: Partial<AppointmentPayload>): Promise<Appointment> => {
    const response = await api.patch(`/appointments/${id}`, data);
    return response.data;
  },

  deleteAppointment: async (id: string): Promise<void> => {
    await api.delete(`/appointments/${id}`);
  },
};
