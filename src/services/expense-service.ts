import { api } from "@/lib/api";
import {
    CreateExpenseCategoryPayload,
    CreateExpensePayload,
    ExpenseCategoryListResponse,
    ExpenseCategoryQueryParams,
    ExpenseDetailResponse,
    ExpenseListResponse,
    ExpenseQueryParams,
    UpdateExpenseCategoryPayload
} from "@/types/expense";

export const expenseService = {
    // Expense Categories
    getCategories: async (params?: ExpenseCategoryQueryParams): Promise<ExpenseCategoryListResponse> => {
        const response = await api.get<ExpenseCategoryListResponse>("/finance/expense-categories", { params });
        return response.data;
    },

    createCategory: async (data: CreateExpenseCategoryPayload): Promise<any> => {
        const response = await api.post("/finance/expense-categories", data);
        return response.data;
    },

    updateCategory: async (id: string, data: UpdateExpenseCategoryPayload): Promise<any> => {
        const response = await api.patch(`/finance/expense-categories/${id}`, data);
        return response.data;
    },

    deleteCategory: async (id: string): Promise<void> => {
        await api.delete(`/finance/expense-categories/${id}`);
    },

    // Expenses
    getExpenses: async (params?: ExpenseQueryParams): Promise<ExpenseListResponse> => {
        const response = await api.get<ExpenseListResponse>("/finance/expenses", { params });
        return response.data;
    },

    getExpense: async (id: string): Promise<ExpenseDetailResponse> => {
        const response = await api.get<ExpenseDetailResponse>(`/finance/expenses/${id}`);
        return response.data;
    },

    createExpense: async (data: CreateExpensePayload): Promise<any> => {
        const response = await api.post("/finance/expenses", data);
        return response.data;
    }
};
