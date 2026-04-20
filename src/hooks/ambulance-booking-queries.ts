import { ambulanceService } from "@/services/ambulance-service";
import { AmbulanceBookingPayload } from "@/types/ambulance";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const AMBULANCE_BOOKING_KEYS = {
    all: ["ambulance-bookings"] as const,
    lists: () => [...AMBULANCE_BOOKING_KEYS.all, "list"] as const,
    list: (params: any) => [...AMBULANCE_BOOKING_KEYS.lists(), params] as const,
    detail: (id: string) => [...AMBULANCE_BOOKING_KEYS.all, "detail", id] as const,
};

export function useAmbulanceBookings(params: any = {}) {
    return useQuery({
        queryKey: AMBULANCE_BOOKING_KEYS.list(params),
        queryFn: () => ambulanceService.getBookings(params),
        placeholderData: keepPreviousData,
    });
}

export function useCreateAmbulanceBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: AmbulanceBookingPayload) => ambulanceService.createBooking(data),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: AMBULANCE_BOOKING_KEYS.all });
                // Also invalidate ambulances as a booking might change vehicle availability
                queryClient.invalidateQueries({ queryKey: ["ambulances"] });
                toast.success(res.message || "Booking created successfully");
            } else {
                toast.error(res.message || "Failed to create booking");
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "An error occurred while creating booking");
        }
    });
}

export function useUpdateAmbulanceBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AmbulanceBookingPayload> }) => 
            ambulanceService.updateBooking(id, data),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: AMBULANCE_BOOKING_KEYS.all });
                queryClient.invalidateQueries({ queryKey: ["ambulances"] });
                toast.success(res.message || "Booking updated successfully");
            } else {
                toast.error(res.message || "Failed to update booking");
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "An error occurred while updating booking");
        }
    });
}

export function useDeleteAmbulanceBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => ambulanceService.deleteBooking(id),
        onSuccess: (res) => {
            if (res.success) {
                queryClient.invalidateQueries({ queryKey: AMBULANCE_BOOKING_KEYS.all });
                queryClient.invalidateQueries({ queryKey: ["ambulances"] });
                toast.success(res.message || "Booking deleted successfully");
            } else {
                toast.error(res.message || "Failed to delete booking");
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "An error occurred while deleting booking");
        }
    });
}
