export interface PharmacyEntity {
  id: string;
  name: string;
  nameBangla: string;
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
  data: {
    suppliers: Supplier[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }
  }
}

export interface PurchaseItem {
  id?: string;
  medicineId: string;
  itemName: string;
  itemDescription?: string;
  unit: string;
  price: number | string;
  mrp: number | string;
  quantity: number | string;
  totalPrice?: number | string;
  batchNumber?: string;
  expiryDate: string;
}

export type PurchaseStatus = 'pending' | 'completed' | 'rejected';

export interface Purchase {
  id: string;
  branchId: string;
  supplierId: string;
  poNumber?: string;
  totalPrice?: number | string;
  status: PurchaseStatus;
  purchaseItems: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
  branch?: Branch;
  supplier?: Supplier;
}

export interface PurchasePayload {
  branchId: string;
  supplierId: string;
  status: PurchaseStatus;
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
  medicineId: string;
  branchId: string;
  branch?: { id: string; name: string };
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number | string;
  mrp: number | string;
  unit: string;
  createdAt: string;
  updatedAt: string;
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
  brandId: string;
  brand?: { id: string; name: string };
  groupId: string;
  group?: { id: string; name: string };
  medicineUnitId: string;
  medicineUnit?: { id: string; name: string };
  unitPrice: number | string;
  salePrice: number | string;
  mrp: number | string;
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
  brandId: string;
  groupId?: string;
  medicineUnitId?: string;
  unitPrice?: number;
  salePrice?: number;
  mrp?: number;
  reorderLevel?: number;
  isActive?: boolean;
  rackNumber?: string;
  openingStock?: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface StockAdjustmentPayload {
  stockId: string;
  quantity: number;
  type: 'increase' | 'decrease';
  note: string;
}

export interface StockTransferPayload {
  stockId: string;
  toBranchId: string;
  quantity: number;
  note: string;
}

export type PharmacyEntityType = 'brands' | 'categories' | 'groups' | 'units' | 'branches';

export interface Patient {
  id: string;
  name: string;
  nameBangla?: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  dob?: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  address: string;
  visitType?: 'ipd' | 'opd' | 'emergency';
  createdAt: string;
  updatedAt: string;
}

export interface PatientPayload {
  name: string;
  nameBangla?: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  dob?: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  address: string;
  visitType?: 'ipd' | 'opd' | 'emergency';
}

export interface PatientQueryParams {
  page?: number;
  limit?: number;
  name?: string;
  phone?: string;
  visitType?: 'ipd' | 'opd' | 'emergency';
}

export interface PatientListResponse {
    success: boolean;
    message: string;
    data: Patient[];
    meta: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    }
}

export interface SaleItem {
  medicineId: string;
  itemName: string;
  itemDescription?: string;
  unit: string;
  price: number;
  mrp: number;
  quantity: number;
  batchNumber: string;
  expiryDate: string;
}

export interface SalePayload {
  branchId: string;
  patientId?: string; // Optional if not registered/walk-in
  status: 'pending' | 'completed' | 'cancelled';
  saleItems: SaleItem[];
}

export interface Sale {
  id: string;
  branchId: string;
  patientId: string;
  invoiceNumber: string;
  totalPrice: number | string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  branch?: { name: string };
  patient?: { name: string };
  saleItems: SaleItemDetails[];
}

export interface SaleItemDetails {
  id: string;
  saleId: string;
  medicineId: string;
  invoiceNumber: string;
  itemName: string;
  itemDescription?: string | null;
  unit: string;
  price: number | string;
  mrp: number | string;
  quantity: number | string;
  totalPrice: number | string;
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
  mrp: number;
  quantity: number;
  batchNumber: string;
  expiryDate: string;
}

export interface SaleReturnPayload {
  branchId: string;
  patientId?: string;
  invoiceNumber: string;
  status: 'pending' | 'verified' | 'approved' | 'rejected';
  saleReturnItems: SaleReturnItemPayload[];
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
  branch?: { name: string };
  sales?: {
    id: string;
    branchId: string;
    patientId: string;
    invoiceNumber: string;
    totalPrice: string | number;
    status: string;
    createdAt: string;
    updatedAt: string;
    cashRegisterSessionId: string;
  }[];
}

export interface CashRegisterOpenPayload {
  branchId: string;
  openingBalance: number;
  openingNote?: string;
}

export interface CashRegisterClosePayload {
  actualBalance: number;
  closingNote?: string;
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
  }
}
