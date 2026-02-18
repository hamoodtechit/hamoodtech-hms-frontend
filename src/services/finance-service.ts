import { api } from "@/lib/api";
import { AccountDetailResponse, AccountListResponse, WithdrawPayload } from "@/types/finance";

export const financeService = {
    getAccounts: async (params?: { page?: number; limit?: number; type?: string; search?: string; isActive?: boolean }): Promise<AccountListResponse> => {
        const response = await api.get<AccountListResponse>("/finance/accounts", { params });
        return response.data;
    },

    getAccount: async (id: string): Promise<AccountDetailResponse> => {
        const response = await api.get<AccountDetailResponse>(`/finance/accounts/${id}`);
        return response.data;
    },

    withdraw: async (payload: WithdrawPayload): Promise<{ success: boolean; message: string }> => {
        const response = await api.post<{ success: boolean; message: string }>("/finance/transactions/withdraw", payload);
        return response.data;
    }
};
