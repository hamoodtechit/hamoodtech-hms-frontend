import { 
    IncomeCategoryPayload, 
    IncomeCategoryListResponse,
    IncomePayload,
    IncomeListResponse,
    IncomeQueryParams,
    Income
} from "@/types/income";
import { fetcher } from "./api";

const BASE_PATH = "/finance/incomes";
const CATEGORY_PATH = "/finance/incomes/categories";

export const incomeService = {
    // Categories
    getCategories: async (params?: { page?: number; limit?: number; search?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);

        const queryString = queryParams.toString();
        const url = queryString ? `${CATEGORY_PATH}?${queryString}` : CATEGORY_PATH;
        
        return await fetcher.get<IncomeCategoryListResponse>(url);
    },

    createCategory: async (payload: IncomeCategoryPayload) => {
        return await fetcher.post<{ success: boolean; message: string; data: any }>(CATEGORY_PATH, payload);
    },

    updateCategory: async (id: string, payload: Partial<IncomeCategoryPayload>) => {
        return await fetcher.patch<{ success: boolean; message: string; data: any }>(`${CATEGORY_PATH}/${id}`, payload);
    },

    deleteCategory: async (id: string) => {
        return await fetcher.delete<{ success: boolean; message: string }>(`${CATEGORY_PATH}/${id}`);
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

        return await fetcher.get<IncomeListResponse>(url);
    },

    getIncome: async (id: string) => {
        return await fetcher.get<{ success: boolean; message: string; data: Income }>(`${BASE_PATH}/${id}`);
    },

    createIncome: async (payload: IncomePayload) => {
        return await fetcher.post<{ success: boolean; message: string; data: Income }>(BASE_PATH, payload);
    },

    deleteIncome: async (id: string) => {
        return await fetcher.delete<{ success: boolean; message: string }>(`${BASE_PATH}/${id}`);
    }
};
