import { 
    IncomeCategoryPayload, 
    IncomeCategoryListResponse,
    IncomePayload,
    IncomeListResponse,
    IncomeQueryParams,
    Income
} from "@/types/income";
import { api } from "@/lib/api";

const BASE_PATH = "/finance/incomes";
const CATEGORY_PATH = "/finance/income-categories";

export const incomeService = {
    // Categories
    getCategories: async (params?: { page?: number; limit?: number; search?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);

        const queryString = queryParams.toString();
        const url = queryString ? `${CATEGORY_PATH}?${queryString}` : CATEGORY_PATH;
        
        const response = await api.get<IncomeCategoryListResponse>(url);
        return response.data;
    },

    createCategory: async (payload: IncomeCategoryPayload) => {
        const response = await api.post<{ success: boolean; message: string; data: any }>(CATEGORY_PATH, payload);
        return response.data;
    },

    updateCategory: async (id: string, payload: Partial<IncomeCategoryPayload>) => {
        const response = await api.patch<{ success: boolean; message: string; data: any }>(`${CATEGORY_PATH}/${id}`, payload);
        return response.data;
    },

    deleteCategory: async (id: string) => {
        const response = await api.delete<{ success: boolean; message: string }>(`${CATEGORY_PATH}/${id}`);
        return response.data;
    },

    // Incomes
    getIncomes: async (params?: IncomeQueryParams) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);
        if (params?.categoryId) queryParams.append('categoryId', params.categoryId);
        if (params?.branchId) queryParams.append('branchId', params.branchId);
        if (params?.accountId) queryParams.append('accountId', params.accountId);
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);

        const queryString = queryParams.toString();
        const url = queryString ? `${BASE_PATH}?${queryString}` : BASE_PATH;

        const response = await api.get<IncomeListResponse>(url);
        return response.data;
    },

    getIncome: async (id: string) => {
        const response = await api.get<{ success: boolean; message: string; data: Income }>(`${BASE_PATH}/${id}`);
        return response.data;
    },

    createIncome: async (payload: IncomePayload) => {
        const response = await api.post<{ success: boolean; message: string; data: Income }>(BASE_PATH, payload);
        return response.data;
    },

    deleteIncome: async (id: string) => {
        const response = await api.delete<{ success: boolean; message: string }>(`${BASE_PATH}/${id}`);
        return response.data;
    }
};
