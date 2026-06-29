import { FinanceAccount, FinanceTransaction } from "./finance";

export interface IncomeCategory {
    id: string;
    name: string;
    nameBangla?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

export interface IncomeCategoryPayload {
    name: string;
    nameBangla?: string;
    description?: string;
}

export interface IncomeCategoryListResponse {
    success: boolean;
    message: string;
    data: IncomeCategory[];
    meta?: {
        page: number;
        limit: number;
        totalPages: number;
        total: number;
    };
}

export interface Income {
    id: string;
    incomeNumber: string;
    categoryId: string;
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
    branchId: string;
    accountId: string;
    amount: number;
    date?: string;
    note?: string;
}

export interface IncomeListResponse {
    success: boolean;
    message: string;
    data: Income[];
    meta?: {
        page: number;
        limit: number;
        totalPages: number;
        total: number;
    };
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
