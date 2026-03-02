import { Branch, Patient, PaymentMethod } from "./pharmacy";

export interface SaleItem {
  medicineId: string;
  itemName: string;
  itemDescription?: string;
  unit: string;
  price: number | string;
  mrp: number | string;
  discountPercentage?: number | string;
  discountAmount?: number | string;
  quantity: number | string;
  batchNumber: string;
  expiryDate: string;
  dosageForm?: string;
}

export interface SalePayment {
  accountId: string;
  amount: number | string;
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface Sale {
  id: string;
  branchId: string;
  branch?: Branch;
  patientId?: string;
  patient?: Patient;
  invoiceNumber: string;
  totalPrice: number | string;
  netPrice: number | string;
  status: 'pending' | 'completed' | 'rejected';
  paymentStatus: 'paid' | 'due' | 'partial';
  paymentMethod: PaymentMethod;
  paidAmount: number | string;
  dueAmount: number | string;
  discountPercentage: number | string;
  discountAmount: number | string;
  taxPercentage: number | string;
  taxAmount: number | string;
  cashRegisterSessionId?: string;
  saleItems: SaleItemDetails[];
  createdAt: string;
  updatedAt: string;
}

export interface SaleItemDetails extends SaleItem {
  id: string;
  saleId: string;
  totalPrice: number | string;
  createdAt: string;
  updatedAt: string;
  saleReturnId?: string | null;
}

export interface SalePaymentPayload {
  accountId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface SalePayload {
  branchId?: string;
  patientId?: string;
  status: 'pending' | 'completed' | 'rejected';
  paymentMethod: PaymentMethod;
  paymentStatus?: 'paid' | 'due' | 'partial';
  paidAmount: number | string;
  dueAmount: number | string;
  discountPercentage: number | string;
  discountAmount: number | string;
  taxPercentage: number | string;
  taxAmount: number | string;
  payments?: SalePayment[];
  saleItems: SaleItem[];
}

export interface UpdateSalePayload extends Partial<SalePayload> {
  // Matches the user provided schema
  patientId?: string;
  status?: 'pending' | 'completed' | 'rejected';
  paymentMethod?: PaymentMethod;
  discountPercentage?: number | string;
  discountAmount?: number | string;
  paymentStatus?: 'paid' | 'due' | 'partial';
  paidAmount?: number | string;
  dueAmount?: number | string;
  saleItems?: SaleItem[];
}

export interface SaleReturnItem {
  medicineId: string;
  itemName: string;
  itemDescription?: string;
  unit: string;
  price: number | string;
  mrp?: number | string;
  quantity: number | string;
  totalPrice?: number | string;
  batchNumber: string;
  expiryDate: string;
}

export interface SaleReturn {
  id: string;
  branchId: string;
  branch?: Branch;
  patientId?: string;
  patient?: Patient;
  saleId?: string;
  invoiceNumber: string;
  taxPercentage?: number | string;
  taxAmount?: number | string;
  totalPrice: number | string;
  status: 'pending' | 'completed' | 'rejected';
  paymentMethod?: PaymentMethod;
  discountPercentage?: number | string;
  discountAmount?: number | string;
  saleReturnItems: SaleReturnItemDetails[];
  createdAt: string;
  updatedAt: string;
}

export interface SaleReturnItemDetails extends SaleReturnItem {
  id: string;
  saleReturnId: string;
  totalPrice: number | string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleReturnPayload {
  saleId: string;
  status?: 'pending' | 'completed' | 'rejected';
  saleReturnItems: SaleReturnItem[];
}

export interface SalesPaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    sales?: T[];
    returns?: T[];
    data?: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}
