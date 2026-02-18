export interface FinanceAccount {
    id: string;
    name: string;
    type: string;
    description?: string;
    openingBalance: string; // API returns string "0"
    currentBalance: string; // API returns string "0"
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        transactions: number;
    };
    transactions?: FinanceTransaction[];
}

export interface FinanceTransaction {
    id: string;
    accountId: string;
    amount: number;
    type: 'DEPOSIT' | 'WITHDRAW' | 'EXPENSE' | 'INCOME'; // Adjust based on actual API
    paymentMethod: string;
    note?: string;
    date: string;
    // Add other fields as per API response if known
}

export interface AccountListResponse {
    success: boolean;
    message: string;
    data: FinanceAccount[];
    meta: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface AccountDetailResponse {
    success: boolean;
    message: string;
    data: FinanceAccount;
}

export interface WithdrawPayload {
    accountId: string;
    amount: number;
    paymentMethod: string;
    note?: string;
}
