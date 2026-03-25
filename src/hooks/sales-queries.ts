import { diagnosticService } from "@/services/diagnostic-service";
import { DIAGNOSTIC_KEYS } from "./diagnostic-queries";
import { salesService } from "@/services/sales-service";
import { SalePaymentPayload, UpdateSalePayload } from "@/types/sales";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const SALES_KEYS = {
  all: ["sales"] as const,
  lists: () => [...SALES_KEYS.all, "list"] as const,
  list: (params: any) => [...SALES_KEYS.lists(), params] as const,
  details: () => [...SALES_KEYS.all, "detail"] as const,
  detail: (id: string) => [...SALES_KEYS.details(), id] as const,
  returns: () => [...SALES_KEYS.all, "returns"] as const,
  returnList: (params: any) => [...SALES_KEYS.returns(), "list", params] as const,
  returnDetail: (id: string) => [...SALES_KEYS.returns(), "detail", id] as const,
};

export function useSales(params: any = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: SALES_KEYS.list(params),
    queryFn: () => salesService.getSales(params),
    placeholderData: keepPreviousData,
    ...options
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: SALES_KEYS.detail(id),
    queryFn: () => salesService.getSale(id),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: salesService.createSale,
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: SALES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ["pharmacy", "cash-register"] });
      // Invalidate diagnostic reports - use prefix match
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.all });
      if (variables && (variables as any).id) {
        queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.report((variables as any).id) });
      }
    },
  });
}

export function useSaleReturns(params: any = {}) {
  return useQuery({
    queryKey: SALES_KEYS.returnList(params),
    queryFn: () => salesService.getSaleReturns(params),
    placeholderData: keepPreviousData,
  });
}

export function useSaleReturn(id: string) {
  return useQuery({
    queryKey: SALES_KEYS.returnDetail(id),
    queryFn: () => salesService.getSaleReturn(id),
    enabled: !!id,
  });
}

export function useUpdateSaleReturnStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      salesService.updateSaleReturnStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALES_KEYS.all });
    },
  });
}
export const useUpdateSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSalePayload }) =>
      salesService.updateSale(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SALES_KEYS.all });
      queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.all });
      toast.success("Sale updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update sale");
    },
  });
};

export const useAddSalePayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: SalePaymentPayload }) =>
        salesService.addSalePayment(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: SALES_KEYS.all });
        queryClient.invalidateQueries({ queryKey: DIAGNOSTIC_KEYS.all });
        toast.success("Payment added successfully");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to add payment");
      },
    });
};
