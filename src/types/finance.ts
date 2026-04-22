export type AccountGroup = 'pharmacy' | 'hospital' | 'ambulance' | 'general' | 'administration';

export interface FinanceAccount {
    id: string;
    name: string;
    type: string;
    group?: AccountGroup;
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
    saleReturnId: string | null;
    flowType: 'in' | 'out';
    txnType: 'opening' | 'sale' | 'purchase' | 'expense' | 'income' | 'withdraw' | 'deposit' | 'transfer' | 'adjustment' | 'sale-return';
    paymentMethod: string;
    amount: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
    account?: FinanceAccount;
    sale?: any;
    purchase?: any;
    expense?: any;
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

export interface CreateAccountPayload {
    name: string;
    type: 'cash' | 'bank' | 'mfs' | 'asset' | 'liability' | 'equity' | 'income' | 'expense';
    group?: AccountGroup;
    description?: string;
    openingBalance: number;
    isActive: boolean;
}

export interface UpdateAccountPayload {
    name?: string;
    type?: string;
    group?: AccountGroup;
    description?: string;
    isActive?: boolean;
}

export interface FundTransferPayload {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    note?: string;
}

export interface FundTransferResponse {
    transferOut: FinanceTransaction;
    transferIn: FinanceTransaction;
}

export interface TransactionQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    accountId?: string;
    branchId?: string;
    flowType?: 'in' | 'out';
    lowType?: 'in' | 'out'; // Alias for compatibility
    txnType?: 'opening' | 'sale' | 'purchase' | 'expense' | 'income' | 'transfer' | 'adjustment' | 'withdraw' | 'deposit' | 'sale-return';
    startDate?: string;
    endDate?: string;
}

export interface FinanceTransactionListResponse {
    success: boolean;
    message: string;
    data: FinanceTransaction[];
    pagination: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
