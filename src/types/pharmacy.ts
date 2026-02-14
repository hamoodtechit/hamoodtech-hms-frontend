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

export type PurchaseStatus = 'pending' | 'complete' | 'rejected';

export interface Purchase {
  id: string;
  branchId: string;
  supplierId: string;
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
  unitPrice: number;
  mrp: number;
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
  category?: PharmacyEntity;
  brandId: string;
  brand?: PharmacyEntity;
  groupId: string;
  group?: PharmacyEntity;
  medicineUnitId: string;
  medicineUnit?: PharmacyEntity;
  unitPrice: number;
  salePrice: number;
  mrp: number;
  reorderLevel: number;
  isActive: boolean;
  stock?: number;
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

