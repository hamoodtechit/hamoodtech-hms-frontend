export interface ExpenseCategory {
    id: string;
    name: string;
    nameBangla?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Expense {
    id: string;
    categoryId: string;
    branchId: string;
    accountId: string;
    amount: string; // API returns string "100000"
    date: string;
    expenseNumber: string;
    note?: string;
    recordedById: string;
    createdAt: string;
    updatedAt: string;
    category?: ExpenseCategory;
    account?: {
        id: string;
        name: string;
        type: string;
        description?: string;
        openingBalance: string;
        currentBalance: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
    };
}

export interface ExpenseCategoryListResponse {
    success: boolean;
    message: string;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    categories: ExpenseCategory[]; 
}

export interface CreateExpenseCategoryPayload {
    name: string;
    nameBangla?: string;
    description?: string;
}

export interface UpdateExpenseCategoryPayload {
    name?: string;
    nameBangla?: string;
    description?: string;
}

export interface CreateExpensePayload {
    categoryId: string;
    branchId: string;
    accountId: string;
    amount: number;
    date: string;
    note?: string;
}

export interface ExpenseListResponse {
    success: boolean;
    message: string;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    expenses: Expense[];
}

export interface ExpenseDetailResponse {
    success: boolean;
    message: string;
    data: Expense;
}

export interface ExpenseQueryParams {
    page?: number;
    limit?: number;
    categoryId?: string;
    branchId?: string;
    accountId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
}

export interface ExpenseCategoryQueryParams {
    page?: number;
    limit?: number;
    search?: string;
}
