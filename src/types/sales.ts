import { Branch, Patient, PaymentMethod } from "./pharmacy";

export interface SaleItem {
  medicineId?: string;
  serviceId?: string; // Prisma model uses serviceId
  itemName: string;
  itemDescription?: string;
  unit: string;
  price: number | string;
  mrp: number | string;
  discountPercentage?: number | string;
  discountAmount?: number | string;
  totalPrice?: number | string;
  quantity: number | string;
  batchNumber?: string;
  expiryDate?: string;
  dosageForm?: string;
  deliveryDate?: string;
  testBy?: string;
  isDiagnosticTest?: boolean;
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
  status: 'pending' | 'completed' | 'rejected' | 'returned';
  paymentStatus: 'paid' | 'due' | 'partial';
  paymentMethod: PaymentMethod;
  paidAmount: number | string;
  dueAmount: number | string;
  discountPercentage: number | string;
  discountAmount: number | string;
  taxPercentage: number | string;
  taxAmount: number | string;
  isIndoorSale: boolean;
  note?: string;
  appointmentId?: string;
  patientAdmissionId?: string;
  cashRegisterSessionId?: string;
  saleItems: SaleItemDetails[];
  type?: 'pos' | 'hospital' | 'appointment' | 'pathology' | 'radiology' | 'admission' | 'others';
  doctorId?: string;
  staffId?: string;
  referralPersonId?: string;
  referralPerson?: any;
  chamberOrRoomNumber?: string;
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
  status: 'pending' | 'completed' | 'rejected' | 'returned';
  paymentMethod: PaymentMethod;
  paymentStatus?: 'paid' | 'due' | 'partial';
  paidAmount: number | string;
  dueAmount: number | string;
  discountPercentage: number | string;
  discountAmount: number | string;
  taxPercentage: number | string;
  taxAmount: number | string;
  isIndoorSale?: boolean;
  note?: string;
  appointmentId?: string;
  patientAdmissionId?: string;
  payments?: SalePayment[];
  saleItems: SaleItem[];
  type?: 'pos' | 'hospital' | 'appointment' | 'pathology' | 'radiology' | 'admission' | 'others';
  doctorId?: string;
  staffId?: string;
  referralPersonId?: string;
  chamberOrRoomNumber?: string;
}

export interface UpdateSalePayload extends Partial<SalePayload> {
  patientId?: string;
  status?: 'pending' | 'completed' | 'rejected' | 'returned';
  paymentMethod?: PaymentMethod;
  discountPercentage?: number | string;
  discountAmount?: number | string;
  paymentStatus?: 'paid' | 'due' | 'partial';
  paidAmount?: number | string;
  dueAmount?: number | string;
  doctorId?: string;
  staffId?: string;
  doctor?: {
    id: string;
    name: string;
  };
  saleItems?: SaleItem[];
  type?: 'pos' | 'hospital' | 'appointment' | 'pathology' | 'radiology' | 'admission' | 'others';
}

export interface SaleReturnItem {
  medicineId?: string;
  serviceId?: string;
  itemName: string;
  itemDescription?: string;
  unit: string;
  price: number | string;
  mrp?: number | string;
  quantity: number | string;
  totalPrice?: number | string;
  batchNumber?: string;
  expiryDate?: string;
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
