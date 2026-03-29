import { facilityService } from "@/services/facility-service";
import { BedPayload, BedTypePayload, BuildingPayload, FloorPayload, SectionPayload } from "@/types/facility";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

export const FACILITY_KEYS = {
    all: ["facility"] as const,
    bedTypes: (params?: any) => params ? [...FACILITY_KEYS.all, "bed-types", params] : [...FACILITY_KEYS.all, "bed-types"] as const,
    beds: (params?: any) => params ? [...FACILITY_KEYS.all, "beds", params] : [...FACILITY_KEYS.all, "beds"] as const,
    buildings: (params?: any) => params ? [...FACILITY_KEYS.all, "buildings", params] : [...FACILITY_KEYS.all, "buildings"] as const,
    floors: (params?: any) => params ? [...FACILITY_KEYS.all, "floors", params] : [...FACILITY_KEYS.all, "floors"] as const,
    sections: (params?: any) => params ? [...FACILITY_KEYS.all, "sections", params] : [...FACILITY_KEYS.all, "sections"] as const,
};

// Bed Types
export function useBedTypes(params?: any) {
    return useQuery({
        queryKey: FACILITY_KEYS.bedTypes(params),
        queryFn: () => facilityService.getBedTypes(params),
        placeholderData: keepPreviousData,
    });
}

export function useCreateBedType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: BedTypePayload) => facilityService.createBedType(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.all });
            toast.success("Bed type created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create bed type");
        }
    });
}

export function useUpdateBedType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<BedTypePayload> }) => facilityService.updateBedType(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.all });
            toast.success("Bed type updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update bed type");
        }
    });
}

export function useDeleteBedType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => facilityService.deleteBedType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.all });
            toast.success("Bed type deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete bed type");
        }
    });
}

// Beds
export function useBeds(params?: any) {
    return useQuery({
        queryKey: FACILITY_KEYS.beds(params),
        queryFn: () => facilityService.getBeds(params),
        placeholderData: keepPreviousData,
    });
}

export function useCreateBed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: BedPayload) => facilityService.createBed(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.all });
            toast.success("Bed created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create bed");
        }
    });
}

export function useUpdateBed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<BedPayload> }) => facilityService.updateBed(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.all });
            toast.success("Bed updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update bed");
        }
    });
}

export function useDeleteBed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => facilityService.deleteBed(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.all });
            toast.success("Bed deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete bed");
        }
    });
}

// Buildings
export function useBuildings(params?: any) {
    return useQuery({
        queryKey: FACILITY_KEYS.buildings(params),
        queryFn: () => facilityService.getBuildings(params),
        placeholderData: keepPreviousData,
    });
}

export function useCreateBuilding() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: BuildingPayload) => facilityService.createBuilding(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.buildings() });
            toast.success("Building created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create building");
        }
    });
}

export function useUpdateBuilding() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<BuildingPayload> }) => facilityService.updateBuilding(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.buildings() });
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.floors() });
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.sections() });
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.beds() });
            toast.success("Building updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update building");
        }
    });
}

export function useDeleteBuilding() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => facilityService.deleteBuilding(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.buildings() });
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.floors() });
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.sections() });
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.beds() });
            toast.success("Building deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete building");
        }
    });
}

// Floors
export function useFloors(params?: any) {
    return useQuery({
        queryKey: FACILITY_KEYS.floors(params),
        queryFn: () => facilityService.getFloors(params),
        placeholderData: keepPreviousData,
    });
}

export function useCreateFloor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: FloorPayload) => facilityService.createFloor(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.floors() });
            toast.success("Floor created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create floor");
        }
    });
}

export function useUpdateFloor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<FloorPayload> }) => facilityService.updateFloor(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.floors() });
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.sections() });
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.beds() });
            toast.success("Floor updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update floor");
        }
    });
}

export function useDeleteFloor() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => facilityService.deleteFloor(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.floors() });
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.sections() });
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.beds() });
            toast.success("Floor deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete floor");
        }
    });
}

// Sections
export function useSections(params?: any) {
    return useQuery({
        queryKey: FACILITY_KEYS.sections(params),
        queryFn: () => facilityService.getSections(params),
        placeholderData: keepPreviousData,
    });
}

export function useCreateSection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SectionPayload) => facilityService.createSection(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.sections() });
            toast.success("Section created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create section");
        }
    });
}

export function useUpdateSection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<SectionPayload> }) => facilityService.updateSection(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.sections() });
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.beds() });
            toast.success("Section updated successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update section");
        }
    });
}

export function useDeleteSection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => facilityService.deleteSection(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.sections() });
            queryClient.invalidateQueries({ queryKey: FACILITY_KEYS.beds() });
            toast.success("Section deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to delete section");
        }
    });
}
