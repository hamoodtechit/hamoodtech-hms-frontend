import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { incomeService } from "@/services/income-service";
import { IncomeCategoryPayload, IncomePayload, IncomeQueryParams } from "@/types/income";

export const incomeKeys = {
    all: ['incomes'] as const,
    lists: () => [...incomeKeys.all, 'list'] as const,
    list: (filters: string) => [...incomeKeys.lists(), { filters }] as const,
    details: () => [...incomeKeys.all, 'detail'] as const,
    detail: (id: string) => [...incomeKeys.details(), id] as const,
    categories: ['incomeCategories'] as const,
};

// --- Categories ---

export const useIncomeCategories = (params?: { page?: number; limit?: number; search?: string }) => {
    return useQuery({
        queryKey: [...incomeKeys.categories, params],
        queryFn: () => incomeService.getCategories(params),
    });
};

export const useCreateIncomeCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: IncomeCategoryPayload) => incomeService.createCategory(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: incomeKeys.categories });
        },
    });
};

export const useUpdateIncomeCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<IncomeCategoryPayload> }) => 
            incomeService.updateCategory(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: incomeKeys.categories });
        },
    });
};

export const useDeleteIncomeCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => incomeService.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: incomeKeys.categories });
        },
    });
};

// --- Incomes ---

export const useIncomes = (params?: IncomeQueryParams) => {
    return useQuery({
        queryKey: incomeKeys.list(JSON.stringify(params || {})),
        queryFn: () => incomeService.getIncomes(params),
    });
};

export const useIncome = (id: string) => {
    return useQuery({
        queryKey: incomeKeys.detail(id),
        queryFn: () => incomeService.getIncome(id),
        enabled: !!id,
    });
};

export const useCreateIncome = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: IncomePayload) => incomeService.createIncome(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: incomeKeys.lists() });
            // Invalidate accounts because balances are updated
            queryClient.invalidateQueries({ queryKey: ['financeAccounts'] });
        },
    });
};

export const useDeleteIncome = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => incomeService.deleteIncome(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: incomeKeys.lists() });
            // Invalidate accounts because balances are reverted
            queryClient.invalidateQueries({ queryKey: ['financeAccounts'] });
        },
    });
};
