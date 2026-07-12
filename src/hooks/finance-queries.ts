import { financeService } from "@/services/finance-service";
import { CreateAccountPayload, FundTransferPayload, PayConsultationChargesPayload, UpdateAccountPayload } from "@/types/finance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const FINANCE_KEYS = {
    all: ["finance"] as const,
    accounts: (params?: any) => [...FINANCE_KEYS.all, "accounts", params] as const,
    account: (id: string) => [...FINANCE_KEYS.all, "account", id] as const,
    transactions: (params?: any) => [...FINANCE_KEYS.all, "transactions", params] as const,
    transaction: (id: string) => [...FINANCE_KEYS.all, "transaction", id] as const,
    consultationCharges: (params?: any) => [...FINANCE_KEYS.all, "consultation-charges", params] as const,
    consultationPayments: (params?: any) => [...FINANCE_KEYS.all, "consultation-payments", params] as const,
    consultationPayment: (id: string) => [...FINANCE_KEYS.all, "consultation-payment", id] as const,
    incomeReport: (params?: any) => [...FINANCE_KEYS.all, "income-report", params] as const,
    expenseReport: (params?: any) => [...FINANCE_KEYS.all, "expense-report", params] as const,
    doctorSummaryReport: (params?: any) => [...FINANCE_KEYS.all, "doctor-summary-report", params] as const,
};

export function useFinanceAccounts(params?: any, options: { enabled?: boolean } = {}) {
    return useQuery({
        queryKey: FINANCE_KEYS.accounts(params),
        queryFn: () => financeService.getAccounts(params),
        ...options
    });
}


export function useFinanceAccount(id: string) {
    return useQuery({
        queryKey: FINANCE_KEYS.account(id),
        queryFn: () => financeService.getAccount(id),
        enabled: !!id,
    });
}

export function useFinanceTransactions(params?: any, options: { enabled?: boolean } = {}) {
    return useQuery({
        queryKey: FINANCE_KEYS.transactions(params),
        queryFn: () => financeService.getTransactions(params),
        ...options
    });
}


export function useFinanceTransaction(id: string) {
    return useQuery({
        queryKey: FINANCE_KEYS.transaction(id),
        queryFn: () => financeService.getTransaction(id),
        enabled: !!id,
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

export function useUpdateFinanceTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { note?: string; paymentMethod?: string } }) => 
            financeService.updateTransaction(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: FINANCE_KEYS.transaction(id) });
            queryClient.invalidateQueries({ queryKey: FINANCE_KEYS.transactions() });
        },
    });
}

export function useTransferFunds() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: FundTransferPayload) => financeService.transferFunds(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FINANCE_KEYS.all });
        },
    });
}

// ── Consultation Charges ────────────────────────────────────

export function useConsultationCharges(params?: any) {
    return useQuery({
        queryKey: FINANCE_KEYS.consultationCharges(params),
        queryFn: () => financeService.getConsultationCharges(params),
    });
}

export function useConsultationPayments(params?: any) {
    return useQuery({
        queryKey: FINANCE_KEYS.consultationPayments(params),
        queryFn: () => financeService.getConsultationPayments(params),
    });
}

export function useConsultationPayment(id: string) {
    return useQuery({
        queryKey: FINANCE_KEYS.consultationPayment(id),
        queryFn: () => financeService.getConsultationPayment(id),
        enabled: !!id,
    });
}

export function usePayConsultationCharges() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: PayConsultationChargesPayload) => financeService.payConsultationCharges(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: FINANCE_KEYS.all });
        },
    });
}

// ── Reports ──────────────────────────────────────────────────

export function useFinanceIncomeReport(params?: { branchId?: string; startDate?: string; endDate?: string; type?: string }, options: { enabled?: boolean } = {}) {
    return useQuery({
        queryKey: FINANCE_KEYS.incomeReport(params),
        queryFn: () => financeService.getIncomeReport(params),
        ...options,
    });
}

export function useFinanceExpenseReport(params?: { branchId?: string; startDate?: string; endDate?: string }, options: { enabled?: boolean } = {}) {
    return useQuery({
        queryKey: FINANCE_KEYS.expenseReport(params),
        queryFn: () => financeService.getExpenseReport(params),
        ...options,
    });
}

export function useDoctorSummaryReport(params?: { branchId?: string; startDate?: string; endDate?: string; doctorId?: string }, options: { enabled?: boolean } = {}) {
    return useQuery({
        queryKey: FINANCE_KEYS.doctorSummaryReport(params),
        queryFn: () => financeService.getDoctorSummaryReport(params),
        ...options,
    });
}

