import { api } from "@/lib/api";
import { 
    Ambulance, 
    AmbulancePayload, 
    AmbulancePaginatedResponse 
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
};
