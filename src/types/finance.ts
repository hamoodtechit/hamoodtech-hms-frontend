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

// ── Doctor Consultation Charges ─────────────────────────────────

export interface ConsultationCharge {
    id: string;
    saleId: string;
    appointmentId?: string;
    doctorId: string;
    branchId: string;
    serviceAmount?: string; // Kept for compatibility if used elsewhere, but API sends totalAmount
    totalAmount: string;
    commissionPercentage: string;
    commissionAmount: string;
    isPaid: boolean;
    paidAt?: string;
    paymentId?: string;
    createdAt: string;
    updatedAt: string;
    doctor?: {
        id: string;
        fullName?: string;
        name?: string;
    };
    sale?: {
        id: string;
        invoiceNumber?: string;
        createdAt?: string;
    };
    appointment?: {
        id: string;
        serialNumber?: string;
        patient?: { name: string };
    };
}

export interface ConsultationChargeListResponse {
    success: boolean;
    message: string;
    data: ConsultationCharge[];
    meta: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface ConsultationPayment {
    id: string;
    paymentNumber: string;
    doctorId: string;
    branchId: string;
    accountId: string;
    totalAmount: string;
    paymentMethod: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
    doctor?: {
        id: string;
        fullName?: string;
        name?: string;
    };
    account?: FinanceAccount;
    charges?: ConsultationCharge[];
}

export interface ConsultationPaymentListResponse {
    success: boolean;
    message: string;
    data: ConsultationPayment[];
    meta: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface PayConsultationChargesPayload {
    branchId: string;
    doctorId: string;
    chargeIds: string[];
    accountId: string;
    paymentMethod: string;
    note?: string;
}

// ── Finance Reports ──────────────────────────────────────────────

export interface IncomeSummary {
  totalCollection: number;
  startDate: string | null;
  endDate: string | null;
}

export interface IncomeSaleRecord {
  slNo: number;
  patientNumber: string;
  patientName: string;
  invoiceNumber: string;
  totalPrice: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  paid: number;
  due: number;
  createdBy: string;
  createdAt: string;
}

export interface IncomeGroup {
  type: string;
  subTotals: Omit<IncomeSaleRecord, 'slNo' | 'patientNumber' | 'patientName' | 'invoiceNumber' | 'createdBy' | 'createdAt'>;
  sales: IncomeSaleRecord[];
}

export interface IncomeReportResponse {
  summary: IncomeSummary;
  groups: IncomeGroup[];
}

export interface ExpenseSummary {
  totalExpenditure: number;
  startDate: string | null;
  endDate: string | null;
}

export interface ExpenseRecord {
  slNo: number;
  expenseNumber: string;
  amount: number;
  note: string;
  recordedBy: string;
  date: string;
}

export interface ExpenseGroup {
  category: string;
  subTotals: { amount: number };
  expenses: ExpenseRecord[];
}

export interface ExpenseReportResponse {
  summary: ExpenseSummary;
  groups: ExpenseGroup[];
}
