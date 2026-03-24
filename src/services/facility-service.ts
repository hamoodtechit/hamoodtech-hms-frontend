import { api } from "@/lib/api";
import { 
    Bed, 
    BedPayload, 
    BedType, 
    BedTypePayload, 
    Building, 
    BuildingPayload, 
    FacilityPaginatedResponse, 
    Floor, 
    FloorPayload, 
    Section, 
    SectionPayload 
} from "@/types/facility";

export const facilityService = {
    // Bed Types
    getBedTypes: async (params?: { page?: number; limit?: number; search?: string; branchId?: string }): Promise<FacilityPaginatedResponse<BedType>> => {
        const response = await api.get<FacilityPaginatedResponse<BedType>>("/facility/bed-types", { params });
        return response.data;
    },
    createBedType: async (data: BedTypePayload): Promise<{ success: boolean; message: string; data: BedType }> => {
        const response = await api.post<{ success: boolean; message: string; data: BedType }>("/facility/bed-types", data);
        return response.data;
    },
    updateBedType: async (id: string, data: Partial<BedTypePayload>): Promise<{ success: boolean; message: string; data: BedType }> => {
        const response = await api.patch<{ success: boolean; message: string; data: BedType }>(`/facility/bed-types/${id}`, data);
        return response.data;
    },
    deleteBedType: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete<{ success: boolean; message: string }>(`/facility/bed-types/${id}`);
        return response.data;
    },

    // Beds
    getBeds: async (params?: { page?: number; limit?: number; search?: string; bedTypeId?: string; sectionId?: string; status?: string }): Promise<FacilityPaginatedResponse<Bed>> => {
        const response = await api.get<FacilityPaginatedResponse<Bed>>("/facility/beds", { params });
        return response.data;
    },
    createBed: async (data: BedPayload): Promise<{ success: boolean; message: string; data: Bed }> => {
        const response = await api.post<{ success: boolean; message: string; data: Bed }>("/facility/beds", data);
        return response.data;
    },
    updateBed: async (id: string, data: Partial<BedPayload>): Promise<{ success: boolean; message: string; data: Bed }> => {
        const response = await api.patch<{ success: boolean; message: string; data: Bed }>(`/facility/beds/${id}`, data);
        return response.data;
    },
    deleteBed: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete<{ success: boolean; message: string }>(`/facility/beds/${id}`);
        return response.data;
    },

    // Buildings
    getBuildings: async (params?: { page?: number; limit?: number; search?: string; branchId?: string }): Promise<FacilityPaginatedResponse<Building>> => {
        const response = await api.get<FacilityPaginatedResponse<Building>>("/facility/buildings", { params });
        return response.data;
    },
    createBuilding: async (data: BuildingPayload): Promise<{ success: boolean; message: string; data: Building }> => {
        const response = await api.post<{ success: boolean; message: string; data: Building }>("/facility/buildings", data);
        return response.data;
    },
    updateBuilding: async (id: string, data: Partial<BuildingPayload>): Promise<{ success: boolean; message: string; data: Building }> => {
        const response = await api.patch<{ success: boolean; message: string; data: Building }>(`/facility/buildings/${id}`, data);
        return response.data;
    },
    deleteBuilding: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete<{ success: boolean; message: string }>(`/facility/buildings/${id}`);
        return response.data;
    },

    // Floors
    getFloors: async (params?: { page?: number; limit?: number; search?: string; buildingId?: string }): Promise<FacilityPaginatedResponse<Floor>> => {
        const response = await api.get<FacilityPaginatedResponse<Floor>>("/facility/floors", { params });
        return response.data;
    },
    createFloor: async (data: FloorPayload): Promise<{ success: boolean; message: string; data: Floor }> => {
        const response = await api.post<{ success: boolean; message: string; data: Floor }>("/facility/floors", data);
        return response.data;
    },
    updateFloor: async (id: string, data: Partial<FloorPayload>): Promise<{ success: boolean; message: string; data: Floor }> => {
        const response = await api.patch<{ success: boolean; message: string; data: Floor }>(`/facility/floors/${id}`, data);
        return response.data;
    },
    deleteFloor: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete<{ success: boolean; message: string }>(`/facility/floors/${id}`);
        return response.data;
    },

    // Sections
    getSections: async (params?: { page?: number; limit?: number; search?: string; floorId?: string }): Promise<FacilityPaginatedResponse<Section>> => {
        const response = await api.get<FacilityPaginatedResponse<Section>>("/facility/sections", { params });
        return response.data;
    },
    createSection: async (data: SectionPayload): Promise<{ success: boolean; message: string; data: Section }> => {
        const response = await api.post<{ success: boolean; message: string; data: Section }>("/facility/sections", data);
        return response.data;
    },
    updateSection: async (id: string, data: Partial<SectionPayload>): Promise<{ success: boolean; message: string; data: Section }> => {
        const response = await api.patch<{ success: boolean; message: string; data: Section }>(`/facility/sections/${id}`, data);
        return response.data;
    },
    deleteSection: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete<{ success: boolean; message: string }>(`/facility/sections/${id}`);
        return response.data;
    },
};
