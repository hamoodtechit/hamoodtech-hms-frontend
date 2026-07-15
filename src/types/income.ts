import { FinanceAccount, FinanceTransaction } from "./finance";

export interface IncomeCategory {
    id: string;
    name: string;
    nameBangla?: string;
    description?: string;
    parentId?: string | null;
    parent?: IncomeCategory | null;
    createdAt: string;
    updatedAt: string;
}

export interface IncomeCategoryPayload {
    name: string;
    nameBangla?: string;
    description?: string;
    parentId?: string | null;
}

export interface IncomeCategoryListResponse {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    categories: IncomeCategory[];
}

export interface Income {
    id: string;
    incomeNumber: string;
    categoryId: string;
    subCategoryId?: string | null;
    branchId: string;
    accountId: string;
    amount: string;
    date: string;
    note?: string;
    recordedById: string;
    createdAt: string;
    updatedAt: string;
    category?: IncomeCategory;
    account?: FinanceAccount;
    branch?: { name: string };
    recordedBy?: { fullName?: string; username?: string };
    transactions?: FinanceTransaction[];
}

export interface IncomePayload {
    categoryId: string;
    subCategoryId?: string | null;
    branchId: string;
    accountId: string;
    amount: number;
    date?: string;
    note?: string;
}

export interface IncomeListResponse {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    incomes: Income[];
}

export interface IncomeQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    branchId?: string;
    accountId?: string;
    startDate?: string;
    endDate?: string;
}
