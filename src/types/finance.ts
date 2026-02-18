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
    txnId: string;
    accountId: string;
    accountBalanceBefore: string;
    accountBalanceNow: string;
    saleId: string | null;
    purchaseId: string | null;
    expenseId: string | null;
    flowType: 'in' | 'out';
    txnType: 'sale' | 'purchase' | 'expense' | 'income' | 'withdraw' | 'deposit';
    paymentMethod: string;
    amount: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
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
