import { expenseService } from "@/services/expense-service";
import {
    CreateExpenseCategoryPayload,
    CreateExpensePayload,
    ExpenseCategoryQueryParams,
    ExpenseQueryParams,
    UpdateExpenseCategoryPayload
} from "@/types/expense";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const EXPENSE_KEYS = {
    all: ["expenses"] as const,
    categories: (params?: ExpenseCategoryQueryParams) => [...EXPENSE_KEYS.all, "categories", params] as const,
    list: (params?: ExpenseQueryParams) => [...EXPENSE_KEYS.all, "list", params] as const,
    details: (id: string) => [...EXPENSE_KEYS.all, "details", id] as const,
};

// Expense Categories
export function useExpenseCategories(params?: ExpenseCategoryQueryParams) {
    return useQuery({
        queryKey: EXPENSE_KEYS.categories(params),
        queryFn: () => expenseService.getCategories(params),
    });
}

export function useCreateExpenseCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateExpenseCategoryPayload) => expenseService.createCategory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.categories() });
        },
    });
}

export function useUpdateExpenseCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateExpenseCategoryPayload }) => 
            expenseService.updateCategory(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.categories() });
        },
    });
}

export function useDeleteExpenseCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => expenseService.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.categories() });
        },
    });
}

// Expenses
export function useExpenses(params?: ExpenseQueryParams) {
    return useQuery({
        queryKey: EXPENSE_KEYS.list(params),
        queryFn: () => expenseService.getExpenses(params),
    });
}

export function useExpense(id: string) {
    return useQuery({
        queryKey: EXPENSE_KEYS.details(id),
        queryFn: () => expenseService.getExpense(id),
        enabled: !!id,
    });
}

export function useCreateExpense() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateExpensePayload) => expenseService.createExpense(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPENSE_KEYS.all });
        },
    });
}
