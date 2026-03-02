import { api } from "@/lib/api";
import { AccountDetailResponse, AccountListResponse, CreateAccountPayload, FinanceTransaction, FinanceTransactionListResponse, TransactionQueryParams, UpdateAccountPayload, WithdrawPayload } from "@/types/finance";

export const financeService = {
    getAccounts: async (params?: { page?: number; limit?: number; type?: string; search?: string; isActive?: boolean }): Promise<AccountListResponse> => {
        const response = await api.get<AccountListResponse>("/finance/accounts", { params });
        return response.data;
    },

    getAccount: async (id: string): Promise<AccountDetailResponse> => {
        const response = await api.get<AccountDetailResponse>(`/finance/accounts/${id}`);
        return response.data;
    },

    createAccount: async (data: CreateAccountPayload): Promise<AccountDetailResponse> => {
        const response = await api.post<AccountDetailResponse>("/finance/accounts", data);
        return response.data;
    },

    updateAccount: async (id: string, data: UpdateAccountPayload): Promise<AccountDetailResponse> => {
        const response = await api.patch<AccountDetailResponse>(`/finance/accounts/${id}`, data);
        return response.data;
    },

    deleteAccount: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete<{ success: boolean; message: string }>(`/finance/accounts/${id}`);
        return response.data;
    },

    withdraw: async (payload: WithdrawPayload): Promise<{ success: boolean; message: string }> => {
        const response = await api.post<{ success: boolean; message: string }>("/finance/transactions/withdraw", payload);
        return response.data;
    },

    getTransactions: async (params?: TransactionQueryParams): Promise<FinanceTransactionListResponse> => {
        const response = await api.get<FinanceTransactionListResponse>("/finance/transactions", { params });
        return response.data;
    },
    
    getTransaction: async (id: string): Promise<FinanceTransaction> => {
        const response = await api.get<FinanceTransaction>(`/finance/transactions/${id}`);
        return response.data;
    },

    updateTransaction: async (id: string, data: { note?: string; paymentMethod?: string }): Promise<FinanceTransaction> => {
        const response = await api.patch<FinanceTransaction>(`/finance/transactions/${id}`, data);
        return response.data;
    }
};
