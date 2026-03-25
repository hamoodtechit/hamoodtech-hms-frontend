import { pharmacyService } from "@/services/pharmacy-service";
import { Medicine, PharmacyEntityType, PharmacyResponse, PurchaseStatus, UpdateOpeningStockDto } from "@/types/pharmacy";
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const PHARMACY_KEYS = {
  all: ["pharmacy"] as const,
  stats: (params: any) => [...PHARMACY_KEYS.all, "stats", params] as const,
  graph: (params: any) => [...PHARMACY_KEYS.all, "graph", params] as const,
  summary: (params: any) => [...PHARMACY_KEYS.all, "summary", params] as const,
  topSelling: (branchId?: string, days?: number, startDate?: string, endDate?: string) => [...PHARMACY_KEYS.all, "topSelling", branchId, days, startDate, endDate] as const,
  patients: (params: any) => [...PHARMACY_KEYS.all, "patients", params] as const,
  activeSession: (branchId?: string) => [...PHARMACY_KEYS.all, "session", "active", branchId] as const,
  medicines: (params: any) => [...PHARMACY_KEYS.all, "medicines", params] as const,
  entities: (type: string, params: any) => [...PHARMACY_KEYS.all, "entities", type, params] as const,
  manufacturers: (params: any) => [...PHARMACY_KEYS.all, "manufacturers", params] as const,
  stocks: (params: any) => [...PHARMACY_KEYS.all, "stocks", params] as const,
  suppliers: (params: any) => [...PHARMACY_KEYS.all, "suppliers", params] as const,
  purchases: (params: any) => [...PHARMACY_KEYS.all, "purchases", params] as const,
  purchase: (id: string) => [...PHARMACY_KEYS.all, "purchase", id] as const,
  reports: (params: any) => [...PHARMACY_KEYS.all, "reports", params] as const,
  cashRegisters: (params: any) => [...PHARMACY_KEYS.all, "cash-registers", params] as const,
  branches: (params: any) => [...PHARMACY_KEYS.all, "branches", params] as const,
};

export function useCashRegisters(params: any = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.cashRegisters(params),
    queryFn: () => pharmacyService.getCashRegisters(params),
    placeholderData: keepPreviousData,
  });
}

export function usePharmacyStats(params: { branchId?: string; startDate?: string; endDate?: string }, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.stats(params),
    queryFn: () => pharmacyService.getPharmacyStats(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
}

export function usePharmacyGraph(params: { branchId?: string; startDate?: string; endDate?: string; days?: number }, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.graph(params),
    queryFn: () => pharmacyService.getPharmacyGraph(params),
    staleTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
    ...options
  });
}

export function usePharmacySummary(params: { branchId?: string; startDate?: string; endDate?: string }, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.summary(params),
    queryFn: () => pharmacyService.getPharmacySummary(params),
    staleTime: 5 * 60 * 1000,
    ...options
  });
}

export function useTopSellingProducts(params: { branchId?: string; days?: number; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: PHARMACY_KEYS.topSelling(params.branchId, params.days, params.startDate, params.endDate),
    queryFn: () => pharmacyService.getTopSellingProducts(params),
    staleTime: 30 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function usePatients(params: { 
  page?: number; 
  limit?: number; 
  search?: string; 
  name?: string; 
  phone?: string; 
  visitType?: 'ipd' | 'opd' | 'emergency' 
}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.patients(params),
    queryFn: () => pharmacyService.getPatients(params),
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useActiveSession(branchId: string) {
  return useQuery({
    queryKey: PHARMACY_KEYS.activeSession(branchId),
    queryFn: () => pharmacyService.getActiveCashRegister(branchId),
    enabled: !!branchId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Poll every 1 minute
  });
}

export function useMedicines(params: any = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.medicines(params),
    queryFn: () => pharmacyService.getMedicines(params),
    placeholderData: keepPreviousData,
  });
}

export function useInfiniteMedicines(params: any = {}) {
  return useInfiniteQuery<PharmacyResponse<Medicine>>({
    queryKey: ['pharmacy', 'medicines', 'infinite', params],
    queryFn: ({ pageParam = 1 }) => pharmacyService.getMedicines({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta || {};
      return page < totalPages ? page + 1 : undefined;
    },
    placeholderData: keepPreviousData,
  });
}

export function usePharmacyEntities(type: any, params: any = { limit: 100 }, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.entities(type, params),
    queryFn: () => pharmacyService.getEntities(type, params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
}

export function useManufacturers(params: any = { limit: 100 }, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.manufacturers(params),
    queryFn: () => pharmacyService.getManufacturers(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
}

// Mutations
export function useCreateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => pharmacyService.createMedicine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

export function useUpdateMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pharmacyService.updateMedicine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

export function useDeleteMedicine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pharmacyService.deleteMedicine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, data }: { type: PharmacyEntityType; data: any }) => pharmacyService.createEntity(type, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

export function useUpdateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id, data }: { type: PharmacyEntityType; id: string; data: any }) => pharmacyService.updateEntity(type, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id }: { type: PharmacyEntityType; id: string }) => pharmacyService.deleteEntity(type, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

export function useCreateManufacturer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => pharmacyService.createManufacturer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

export function useUpdateManufacturer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pharmacyService.updateManufacturer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

export function useDeleteManufacturer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pharmacyService.deleteManufacturer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

export function useActiveCashRegister(branchId: string | null) {
    return useQuery({
        queryKey: ['pharmacy', 'cash-register', 'active', branchId],
        queryFn: () => branchId ? pharmacyService.getActiveCashRegister(branchId) : null,
        enabled: !!branchId,
    });
}

export function useOpenCashRegister() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => pharmacyService.openCashRegister(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pharmacy', 'cash-register', 'active', variables.branchId] });
        },
    });
}

export function useCloseCashRegister() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => 
            pharmacyService.closeCashRegister(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pharmacy', 'cash-register', 'active'] });
        },
    });
}

export function useCreateSale() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => pharmacyService.createSale(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
            queryClient.invalidateQueries({ queryKey: ['pharmacy', 'cash-register', 'active'] });
        },
    });
}

export function useImportMedicines() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => pharmacyService.importMedicines(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

// Stock Hooks
export function useStocks(params: any = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.stocks(params),
    queryFn: () => pharmacyService.getStocks(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => pharmacyService.adjustStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

export function useAddOpeningStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => pharmacyService.addOpeningStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

export function useUpdateOpeningStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOpeningStockDto }) => pharmacyService.updateOpeningStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

// Supplier Hooks
export function useSuppliers(params: any = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.suppliers(params),
    queryFn: () => pharmacyService.getSuppliers(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => pharmacyService.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.suppliers({}) });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pharmacyService.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.suppliers({}) });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pharmacyService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.suppliers({}) });
    },
  });
}

// Purchase Hooks
export function usePurchases(params: { 
  page?: number; 
  limit?: number; 
  search?: string;
  branchId?: string;
  supplierId?: string;
  status?: PurchaseStatus;
  paymentStatus?: 'paid' | 'due' | 'partial';
  type?: 'pharmacy' | 'hospital' | 'clinic';
  startDate?: string;
  endDate?: string;
} = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.purchases(params),
    queryFn: () => pharmacyService.getPurchases(params),
    placeholderData: keepPreviousData,
    ...options
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => pharmacyService.createPurchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

export function useUpdatePurchaseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: any }) => pharmacyService.updatePurchaseStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
    },
  });
}

export function useAddPurchasePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { accountId: string; amount: number; paymentMethod: string; note?: string } }) => 
        pharmacyService.addPurchasePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
      toast.success("Payment added successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add payment");
    }
  });
}

export function usePurchase(id: string) {
  return useQuery({
    queryKey: PHARMACY_KEYS.purchase(id),
    queryFn: () => pharmacyService.getPurchase(id),
    enabled: !!id,
  });
}


export function useBranches(params: any = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.branches(params),
    queryFn: async () => {
      const res = await pharmacyService.getBranches(params);
      return {
        data: res.data.branches,
        meta: {
            page: res.data.pagination.page,
            pageSize: res.data.pagination.limit,
            totalPages: res.data.pagination.totalPages,
            totalItems: res.data.pagination.total,
            hasNextPage: res.data.pagination.page < res.data.pagination.totalPages,
            hasPreviousPage: res.data.pagination.page > 1,
        }
      };
    },
    placeholderData: keepPreviousData,
  });
}

export function useDeleteBranch() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => pharmacyService.deleteBranch(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.branches({}) });
            queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.all });
            toast.success("Branch deleted successfully");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to delete branch");
        }
    });
}

export function usePurchaseReport(params: { branchId: string; startDate: string; endDate: string }) {
  return useQuery({
    queryKey: PHARMACY_KEYS.reports(params),
    queryFn: () => pharmacyService.getPurchaseReport(params),
    enabled: !!params.branchId && !!params.startDate && !!params.endDate,
  });
}
