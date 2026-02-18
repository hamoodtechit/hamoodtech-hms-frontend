import { financeService } from "@/services/finance-service";
import { useQuery } from "@tanstack/react-query";

export const FINANCE_KEYS = {
    all: ["finance"] as const,
    accounts: (params?: any) => [...FINANCE_KEYS.all, "accounts", params] as const,
    account: (id: string) => [...FINANCE_KEYS.all, "account", id] as const,
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
