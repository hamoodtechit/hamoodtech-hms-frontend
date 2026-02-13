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

