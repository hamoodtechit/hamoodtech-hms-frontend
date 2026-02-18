import { pharmacyService } from "@/services/pharmacy-service";
import { Medicine, PharmacyEntityType, PharmacyResponse } from "@/types/pharmacy";
import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const PHARMACY_KEYS = {
  all: ["pharmacy"] as const,
  stats: (params: any) => [...PHARMACY_KEYS.all, "stats", params] as const,
  graph: (params: any) => [...PHARMACY_KEYS.all, "graph", params] as const,
  topSelling: (branchId?: string, days?: number) => [...PHARMACY_KEYS.all, "topSelling", branchId, days] as const,
  patients: (params: any) => [...PHARMACY_KEYS.all, "patients", params] as const,
  activeSession: (branchId?: string) => [...PHARMACY_KEYS.all, "session", "active", branchId] as const,
  medicines: (params: any) => [...PHARMACY_KEYS.all, "medicines", params] as const,
  entities: (type: string, params: any) => [...PHARMACY_KEYS.all, "entities", type, params] as const,
  manufacturers: (params: any) => [...PHARMACY_KEYS.all, "manufacturers", params] as const,
  stocks: (params: any) => [...PHARMACY_KEYS.all, "stocks", params] as const,
  suppliers: (params: any) => [...PHARMACY_KEYS.all, "suppliers", params] as const,
  purchases: (params: any) => [...PHARMACY_KEYS.all, "purchases", params] as const,
  sales: (params: any) => [...PHARMACY_KEYS.all, "sales", params] as const,
  saleReturns: (params: any) => [...PHARMACY_KEYS.all, "saleReturns", params] as const,
  cashRegisters: (params: any) => [...PHARMACY_KEYS.all, "cash-registers", params] as const,
};

export function useCashRegisters(params: any = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.cashRegisters(params),
    queryFn: () => pharmacyService.getCashRegisters(params),
    placeholderData: keepPreviousData,
  });
}

export function usePharmacyStats(params: { branchId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: PHARMACY_KEYS.stats(params),
    queryFn: () => pharmacyService.getPharmacyStats(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePharmacyGraph(params: { branchId?: string; startDate?: string; endDate?: string; days?: number }) {
  return useQuery({
    queryKey: PHARMACY_KEYS.graph(params),
    queryFn: () => pharmacyService.getPharmacyGraph(params),
    staleTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useTopSellingProducts(params: { branchId?: string; days?: number; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: PHARMACY_KEYS.topSelling(params.branchId, params.days),
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

export function usePharmacyEntities(type: any, params: any = { limit: 100 }) {
  return useQuery({
    queryKey: PHARMACY_KEYS.entities(type, params),
    queryFn: () => pharmacyService.getEntities(type, params),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useManufacturers(params: any = { limit: 100 }) {
  return useQuery({
    queryKey: PHARMACY_KEYS.manufacturers(params),
    queryFn: () => pharmacyService.getManufacturers(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
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
export function usePurchases(params: any = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.purchases(params),
    queryFn: () => pharmacyService.getPurchases(params),
    placeholderData: keepPreviousData,
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

// Sales Hooks (for History/Dashboard)
export function useSales(params: any = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.sales(params),
    queryFn: () => pharmacyService.getSales(params),
    placeholderData: keepPreviousData,
  });
}

export function useSaleReturns(params: any = {}) {
  return useQuery({
    queryKey: PHARMACY_KEYS.saleReturns(params),
    queryFn: () => pharmacyService.getSaleReturns(params),
    placeholderData: keepPreviousData,
  });
}
