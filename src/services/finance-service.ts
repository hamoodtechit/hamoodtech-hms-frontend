import { api } from "@/lib/api";
import { AccountDetailResponse, AccountListResponse, ConsultationChargeListResponse, ConsultationPaymentListResponse, CreateAccountPayload, FinanceTransaction, FinanceTransactionListResponse, FundTransferPayload, FundTransferResponse, PayConsultationChargesPayload, TransactionQueryParams, UpdateAccountPayload, WithdrawPayload } from "@/types/finance";

export const financeService = {
    getAccounts: async (params?: { page?: number; limit?: number; type?: string; group?: string; search?: string; isActive?: boolean }): Promise<AccountListResponse> => {
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

    transferFunds: async (payload: FundTransferPayload): Promise<FundTransferResponse> => {
        const response = await api.post<FundTransferResponse>("/finance/transactions/transfer", payload);
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
    },

    // ── Consultation Charges ────────────────────────────────────

    getConsultationCharges: async (params?: { page?: number; limit?: number; doctorId?: string; branchId?: string; isPaid?: string; search?: string; startDate?: string; endDate?: string }): Promise<ConsultationChargeListResponse> => {
        const response = await api.get<ConsultationChargeListResponse>("/finance/consultation-charges/charges", { params });
        return response.data;
    },

    payConsultationCharges: async (data: PayConsultationChargesPayload): Promise<any> => {
        const response = await api.post("/finance/consultation-charges/pay", data);
        return response.data;
    },

    getConsultationPayments: async (params?: { page?: number; limit?: number; doctorId?: string; branchId?: string; search?: string; startDate?: string; endDate?: string }): Promise<ConsultationPaymentListResponse> => {
        const response = await api.get<ConsultationPaymentListResponse>("/finance/consultation-charges/payments", { params });
        return response.data;
    },

    getConsultationPayment: async (id: string): Promise<any> => {
        const response = await api.get(`/finance/consultation-charges/payments/${id}`);
        return response.data;
    },
};
