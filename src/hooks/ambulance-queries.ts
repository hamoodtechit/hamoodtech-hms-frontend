import { ambulanceService } from "@/services/ambulance-service";
import { Ambulance, AmbulancePayload } from "@/types/ambulance";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const AMBULANCE_KEYS = {
    all: ["ambulances"] as const,
    lists: () => [...AMBULANCE_KEYS.all, "list"] as const,
    list: (params: any) => [...AMBULANCE_KEYS.lists(), params] as const,
    detail: (id: string) => [...AMBULANCE_KEYS.all, "detail", id] as const,
};

export function useAmbulances(params: any = {}) {
    return useQuery({
        queryKey: AMBULANCE_KEYS.list(params),
        queryFn: () => ambulanceService.getAmbulances(params),
        placeholderData: keepPreviousData,
    });
}

export function useCreateAmbulance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: AmbulancePayload) => ambulanceService.createAmbulance(data),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: AMBULANCE_KEYS.all });
                toast.success(res.message || "Ambulance created successfully");
            } else {
                toast.error(res.message || "Failed to create ambulance");
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "An error occurred while creating ambulance");
        }
    });
}

export function useUpdateAmbulance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AmbulancePayload> }) => 
            ambulanceService.updateAmbulance(id, data),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: AMBULANCE_KEYS.all });
                toast.success(res.message || "Ambulance updated successfully");
            } else {
                toast.error(res.message || "Failed to update ambulance");
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "An error occurred while updating ambulance");
        }
    });
}

export function useDeleteAmbulance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => ambulanceService.deleteAmbulance(id),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: AMBULANCE_KEYS.all });
                toast.success(res.message || "Ambulance deleted successfully");
            } else {
                toast.error(res.message || "Failed to delete ambulance");
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "An error occurred while deleting ambulance");
        }
    });
}
