export type { Patient, PatientListResponse, PatientPayload, PatientQueryParams } from './patient';

export interface PharmacyEntity {
  id: string;
  name: string;
  nameBangla: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PharmacyMeta {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PharmacyResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: PharmacyMeta;
}

export interface PharmacyPayload {
  name: string;
  nameBangla: string;
}

export interface Branch {
  id: string;
  name: string;
  nameBangla: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  licenseNumber: string | null;
  taxRegistration: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BranchPayload {
  name: string;
  nameBangla?: string;
  address?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  licenseNumber?: string;
  taxRegistration?: string;
}
export interface BranchListResponse {
  success: boolean;
  message: string;
  data: {
    branches: Branch[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
}

export interface Supplier {
  id: string;
  name: string;
  nameBangla: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierPayload {
  name: string;
  nameBangla?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface SupplierListResponse {
  success: boolean;
  message: string;
  data: Supplier[];
  meta: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }
}

// ... existing Supplier interfaces ...

export interface Manufacturer {
  id: string;
  name: string;
  nameBangla: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ManufacturerPayload {
  name: string;
  nameBangla?: string;
}

export interface ManufacturerListResponse extends PharmacyResponse<Manufacturer> {}

export interface PurchaseItem {
  id?: string;
  medicineId: string;
  itemName: string;
  itemDescription?: string;
  unit: string;
  price: number | string;
  mrp: number | string;
  salePrice?: number | string;
  quantity: number | string;
  totalPrice?: number | string;
  batchNumber?: string;
  expiryDate: string;
  rackNumber?: string;
  discountPercentage?: number | string;
  discountAmount?: number | string;
}

export type PurchaseStatus = 'pending' | 'completed' | 'rejected';

export interface Purchase {
  id: string;
  branchId: string;
  supplierId: string;
  poNumber?: string;
  totalPrice?: number | string;
  netPrice?: number | string;
  status: PurchaseStatus;
  type?: 'pharmacy' | 'hospital' | 'clinic';
  note?: string;
  discountPercentage?: number | string;
  discountAmount?: number | string;
  purchaseItems: PurchaseItem[];
  paymentMethod?: PaymentMethod;
  paidAmount?: number | string;
  dueAmount?: number | string;
  transactions?: any[];
  createdAt: string;
  updatedAt: string;
  branch?: Branch;
  supplier?: Supplier;
}

export interface PurchasePayload {
  branchId: string;
  supplierId: string;
  type?: 'pharmacy' | 'hospital' | 'clinic';
  discountPercentage?: number;
  discountAmount?: number;
  status: PurchaseStatus;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'due' | 'paid' | 'partial';
  paidAmount: number;
  dueAmount: number;
  payments: {
    accountId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    note?: string;
  }[];
  purchaseItems: PurchaseItem[];
}

export interface PurchaseListResponse {
  success: boolean;
  message: string;
  data: {
    purchases: Purchase[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
}

export interface Stock {
  id: string;
  sku?: string;
  medicineId: string;
  branchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number | string;
  mrp: number | string;
  unit: string;
  rackNumber?: string | null;
  createdAt: string;
  updatedAt: string;
  medicine?: {
    id: string;
    name: string;
    genericName?: string;
    unit: string;
  };
  branch?: {
    id: string;
    name: string;
  };
}

export interface Medicine {
  id: string;
  name: string;
  nameBangla: string;
  genericName?: string;
  genericNameBangla?: string;
  barcode?: string;
  unit: string;
  categoryId: string;
  category?: { id: string; name: string };
  genericId: string;
  generic?: { id: string; name: string };
  groupId: string;
  group?: { id: string; name: string };
  medicineUnitId: string;
  medicineUnit?: { id: string; name: string };
  unitPrice: number | string;
  purchasePrice?: number | string;
  salePrice: number | string;
  mrp: number | string;
  dosageForm?: string;
  medicineManufacturerId?: string;
  medicineManufacturer?: Manufacturer;
  strength?: string;
  reorderLevel: number;
  isActive: boolean;
  rackNumber?: string;
  stock?: number;
  stocks?: Stock[];
  createdAt: string;
  updatedAt: string;
}

export interface MedicinePayload {
  name: string;
  nameBangla?: string;
  genericName: string;
  genericNameBangla?: string;
  barcode?: string;
  unit: string;
  categoryId: string;
  genericId: string;
  groupId?: string;
  medicineUnitId?: string;
  unitPrice?: number;
  purchasePrice?: number;
  salePrice?: number;
  mrp?: number;
  dosageForm?: string;
  strength?: string;
  medicineManufacturerId?: string;
  reorderLevel?: number;
  isActive?: boolean;
  rackNumber?: string;
  openingStock?: number;
  batchNumber?: string;
  expiryDate?: string;
  branchId?: string;
}

export interface AdjustStockDto {
  stockId: string;
  quantity: number;
  type: 'increase' | 'decrease';
  note?: string;
  recoverAmount?: number;
  accountId?: string;
}

export interface StockTransferPayload {
  stockId: string;
  toBranchId: string;
  quantity: number;
  note: string;
}

export interface AddOpeningStockDto {
  medicineId: string;
  branchId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  unit?: string;
  rackNumber?: string;
  note?: string;
}

export interface UpdateOpeningStockDto {
  quantity?: number;
  unitPrice?: number;
  mrp?: number;
  expiryDate?: string;
  note?: string;
}

export type PharmacyEntityType = 'generics' | 'categories' | 'groups' | 'units' | 'branches' | 'manufacturers';

// Moved to patient.ts

export interface SaleItem {
  medicineId: string;
  itemName: string;
  itemDescription?: string;
  unit: string;
  price: number;
  mrp: number;
  discountPercentage?: number;
  discountAmount?: number;
  quantity: number;
  batchNumber: string;
  expiryDate: string;
  dosageForm?: string;
  diagnosticTestId?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'online' | 'cheque' | 'bKash' | 'Nagad' | 'Rocket' | 'Bank Transfer';

export interface SalePayment {
  accountId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface SalePayload {
  branchId: string;
  patientId: string;
  status: 'pending' | 'completed' | 'rejected';
  paymentStatus?: 'paid' | 'due' | 'partial';
  paymentMethod: PaymentMethod;
  paidAmount: number;
  dueAmount: number;
  discountPercentage: number;
  discountAmount: number;
  taxPercentage: number;
  taxAmount: number;
  type?: 'general-sale' | 'pos' | 'appointment' | 'pathology' | 'radiology'; // 'pos', 'general-sale', 'appointment', 'pathology', 'radiology'
  doctorId?: string;
  payments: SalePayment[];
  saleItems: SaleItem[];
}

export interface Sale {
  id: string;
  branchId: string;
  patientId: string;
  invoiceNumber: string;
  totalPrice: number | string;
  netPrice?: number | string;
  status: 'pending' | 'completed' | 'rejected';
  paymentStatus?: 'paid' | 'due' | 'partial';
  paymentMethod?: PaymentMethod;
  paidAmount?: number;
  dueAmount?: number;
  discountPercentage?: number | string;
  discountAmount?: number | string;
  taxPercentage?: number | string;
  taxAmount?: number | string;
  cashRegisterSessionId?: string;
  type?: string;
  doctorId?: string;
  doctor?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  branch?: Branch;
  patient?: { name: string };
  saleItems: SaleItemDetails[];
}

export interface UpdateSalePayload {
  patientId?: string;
  status?: 'pending' | 'completed' | 'rejected';
  paymentStatus?: 'paid' | 'due' | 'partial';
  paymentMethod?: PaymentMethod;
  paidAmount?: number;
  dueAmount?: number;
  discountPercentage?: number;
  discountAmount?: number;
  type?: string;
  doctorId?: string;
  payments?: {
    accountId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    note?: string;
  }[];
  saleItems?: SaleItem[];
}

export interface SaleItemDetails {
  id: string;
  saleId: string;
  medicineId: string;
  invoiceNumber: string;
  itemName: string;
  itemDescription?: string | null;
  unit: string;
  dosageForm?: string | null;
  price: number | string;
  mrp: number | string;
  quantity: number | string;
  totalPrice: number | string;
  discountPercentage?: number | string;
  discountAmount?: number | string;
  batchNumber: string;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
  saleReturnId?: string | null;
}

export interface SaleListResponse {
  success: boolean;
  message: string;
  data: {
    sales: Sale[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
}

export interface SaleReturnItemPayload {
  medicineId: string;
  itemName: string;
  itemDescription?: string;
  unit: string;
  price: number;
  mrp?: number;
  quantity: number;
  totalPrice?: number;
  batchNumber: string;
  expiryDate: string;
}

export interface SaleReturnPayload {
  saleId: string;
  status?: 'pending' | 'completed' | 'rejected';
  saleReturnItems: SaleReturnItemPayload[];
}

export interface SaleReturnItemDetails {
  id: string;
  saleReturnId: string;
  medicineId: string;
  itemName: string;
  itemDescription?: string;
  unit: string;
  price: number;
  mrp: number;
  quantity: number;
  totalPrice: number;
  batchNumber: string;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleReturn {
  id: string;
  branchId: string;
  patientId: string;
  saleId?: string;
  invoiceNumber: string;
  taxPercentage?: number | string;
  taxAmount?: number | string;
  totalPrice: number | string;
  status: 'pending' | 'completed' | 'rejected';
  paymentMethod?: PaymentMethod;
  discountPercentage?: number;
  discountAmount?: number;
  createdAt: string;
  updatedAt: string;
  branch?: { name: string };
  patient?: { name: string };
  saleReturnItems: SaleReturnItemDetails[];
}

export interface SaleReturnListResponse {
  success: boolean;
  message: string;
  data: {
    data: SaleReturn[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
}

export interface CashRegister {
  id: string;
  branchId: string;
  userId: string;
  openingBalance: number | string;
  closingBalance?: number | string | null;
  actualBalance?: number | string | null;
  difference?: number | string | null;
  openingNote?: string | null;
  closingNote?: string | null;
  salesCount?: number;
  salesAmount?: number | string;
  expensesCount?: number;
  expensesAmount?: number | string;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { name: string };
  branch?: Branch;
  sales?: {
    id: string;
    branchId: string;
    patientId: string;
    invoiceNumber: string;
    totalPrice: string | number;
    netPrice?: string | number;
    status: string;
    createdAt: string;
    updatedAt: string;
    cashRegisterSessionId: string;
  }[];
  purchases?: {
    id: string;
    branchId: string;
    supplierId: string;
    poNumber?: string;
    totalPrice: string | number;
    netPrice?: string | number;
    status: string;
    createdAt: string;
    updatedAt: string;
    supplier?: { name: string };
  }[];
}

export interface PharmacyStats {
  totalSales: number;
  salesCount: number;
  totalPurchases: number;
  purchasesCount: number;
  totalMedicines: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalCashInHand: number;
  expiringIn30Days: number;
}

export interface PharmacyGraphDataItem {
  date: string;
  sales: number;
  purchases: number;
}

export interface PharmacyStatsResponse {
  success: boolean;
  message: string;
  data: PharmacyStats;
}

export interface PharmacyGraphResponse {
  success: boolean;
  message: string;
  data: PharmacyGraphDataItem[];
}

export interface PharmacySummary {
  sales: {
    totalAmount: number;
    taxAmount: number;
    netSales: number;
    paidAmount: number;
    dueAmount: number;
    count: number;
  };
  purchases: {
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    count: number;
  };
  expenses: {
    totalAmount: number;
    count: number;
  };
  returns: {
    saleReturnAmount: number;
    saleReturnCount: number;
    purchaseReturnAmount: number;
    purchaseReturnCount: number;
  };
  cogs: number;
  grossProfit: number;
  netProfit: number;
}

export interface PharmacySummaryResponse {
  success: boolean;
  message: string;
  data: PharmacySummary;
}

export interface CashRegisterOpenPayload {
  branchId: string;
  openingBalance: number;
  openingNote?: string;
}

export interface CashRegisterClosePayload {
  actualBalance: number;
  closingNote?: string;
  cashRegisterId?: string;
  sessionId?: string;
}

export interface CashRegisterResponse {
  success: boolean;
  message: string;
  data: CashRegister;
}

export interface CashRegisterListResponse {
  success: boolean;
  message: string;
  data: CashRegister[];
  meta: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface TopSellingProduct {
  id: string;
  name: string;
  genericName?: string;
  unitsSold: number;
  revenue: number;
}

export interface TopSellingProductsResponse {
  success: boolean;
  message: string;
  data: TopSellingProduct[];
}
