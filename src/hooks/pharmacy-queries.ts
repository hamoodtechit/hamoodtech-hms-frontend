import { pharmacyService } from "@/services/pharmacy-service";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const PHARMACY_KEYS = {
  all: ["pharmacy"] as const,
  stats: (branchId?: string) => [...PHARMACY_KEYS.all, "stats", branchId] as const,
  graph: (branchId?: string, days?: number) => [...PHARMACY_KEYS.all, "graph", branchId, days] as const,
  topSelling: (branchId?: string, days?: number) => [...PHARMACY_KEYS.all, "topSelling", branchId, days] as const,
  patients: (params: any) => [...PHARMACY_KEYS.all, "patients", params] as const,
  activeSession: (branchId?: string) => [...PHARMACY_KEYS.all, "session", "active", branchId] as const,
};

export function usePharmacyStats(params: { branchId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: PHARMACY_KEYS.stats(params.branchId),
    queryFn: () => pharmacyService.getPharmacyStats(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePharmacyGraph(params: { branchId?: string; startDate?: string; endDate?: string; days?: number }) {
  return useQuery({
    queryKey: PHARMACY_KEYS.graph(params.branchId, params.days),
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
