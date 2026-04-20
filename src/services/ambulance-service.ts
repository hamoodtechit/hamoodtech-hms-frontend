import { api } from "@/lib/api";
import { 
    Ambulance, 
    AmbulancePayload, 
    AmbulancePaginatedResponse,
    AmbulanceBooking,
    AmbulanceBookingPayload,
    AmbulanceBookingPaginatedResponse
} from "@/types/ambulance";

export const ambulanceService = {
    getAmbulances: async (params?: { 
        page?: number; 
        limit?: number; 
        search?: string; 
        branchId?: string; 
    }): Promise<AmbulancePaginatedResponse> => {
        const response = await api.get<AmbulancePaginatedResponse>("/ambulances", { params });
        return response.data;
    },

    createAmbulance: async (data: AmbulancePayload): Promise<{ 
        success: boolean; 
        message: string; 
        data: Ambulance 
    }> => {
        const response = await api.post<{ 
            success: boolean; 
            message: string; 
            data: Ambulance 
        }>("/ambulances", data);
        return response.data;
    },

    updateAmbulance: async (id: string, data: Partial<AmbulancePayload>): Promise<{ 
        success: boolean; 
        message: string; 
        data: Ambulance 
    }> => {
        const response = await api.put<{ 
            success: boolean; 
            message: string; 
            data: Ambulance 
        }>(`/ambulances/${id}`, data);
        return response.data;
    },

    deleteAmbulance: async (id: string): Promise<{ 
        success: boolean; 
        message: string 
    }> => {
        const response = await api.delete<{ 
            success: boolean; 
            message: string 
        }>(`/ambulances/${id}`);
        return response.data;
    },

    // Booking Methods
    getBookings: async (params?: { 
        page?: number; 
        limit?: number; 
        search?: string; 
        branchId?: string; 
        ambulanceId?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<AmbulanceBookingPaginatedResponse> => {
        const response = await api.get<AmbulanceBookingPaginatedResponse>("/ambulances/bookings", { params });
        return response.data;
    },

    createBooking: async (data: AmbulanceBookingPayload): Promise<{ 
        success: boolean; 
        message: string; 
        data: AmbulanceBooking 
    }> => {
        const response = await api.post<{ 
            success: boolean; 
            message: string; 
            data: AmbulanceBooking 
        }>("/ambulances/bookings", data);
        return response.data;
    },

    updateBooking: async (id: string, data: Partial<AmbulanceBookingPayload>): Promise<{ 
        success: boolean; 
        message: string; 
        data: AmbulanceBooking 
    }> => {
        const response = await api.put<{ 
            success: boolean; 
            message: string; 
            data: AmbulanceBooking 
        }>(`/ambulances/bookings/${id}`, data);
        return response.data;
    },

    deleteBooking: async (id: string): Promise<{ 
        success: boolean; 
        message: string 
    }> => {
        const response = await api.delete<{ 
            success: boolean; 
            message: string 
        }>(`/ambulances/bookings/${id}`);
        return response.data;
    },
};
