import { financeService } from "@/services/finance-service";
import { CreateAccountPayload, UpdateAccountPayload } from "@/types/finance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const FINANCE_KEYS = {
    all: ["finance"] as const,
    accounts: (params?: any) => [...FINANCE_KEYS.all, "accounts", params] as const,
    account: (id: string) => [...FINANCE_KEYS.all, "account", id] as const,
    transactions: (params?: any) => [...FINANCE_KEYS.all, "transactions", params] as const,
};

export function useFinanceAccounts(params?: any) {
    return useQuery({
        queryKey: FINANCE_KEYS.accounts(params),
        queryFn: () => financeService.getAccounts(params),
    });
}

export function useFinanceAccount(id: string) {
    return useQuery({
        queryKey: FINANCE_KEYS.account(id),
        queryFn: () => financeService.getAccount(id),
        enabled: !!id,
    });
}

export function useFinanceTransactions(params?: any) {
    return useQuery({
        queryKey: FINANCE_KEYS.transactions(params),
        queryFn: () => financeService.getTransactions(params),
    });
}

export function useCreateFinanceAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateAccountPayload) => financeService.createAccount(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FINANCE_KEYS.all });
        },
    });
}

export function useUpdateFinanceAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAccountPayload }) => financeService.updateAccount(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FINANCE_KEYS.all });
        },
    });
}

export function useDeleteFinanceAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => financeService.deleteAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FINANCE_KEYS.all });
        },
    });
}
