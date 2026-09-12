export interface ISalesByType {
  type: string;
  totalSales: number;
  totalDues: number;
  totalDiscount: number;
  totalPaid: number;
}

export interface IOverallSummaryData {
  summary: {
    totalSales: number;
    totalDiscount: number;
    totalDues: number;
    totalPaid: number;
    totalReturned?: number;
    totalExpenses: number;
    totalPurchases: number;
    totalPurchasesPaid: number;
    grossProfit: number;
    netProfit: number;
    returns?: {
      saleReturnAmount: number;
      saleReturnCount: number;
      purchaseReturnAmount: number;
      purchaseReturnCount: number;
    };
  };
  consultations: {
    chargePaid: number;
    chargeDue: number;
    commissionPaid: number;
  };
  referrals: {
    totalCommission: number;
    commissionPaid: number;
    commissionDue: number;
  };
  salesByType: ISalesByType[];
  returns?: {
    saleReturnAmount: number;
    saleReturnCount: number;
    purchaseReturnAmount: number;
    purchaseReturnCount: number;
  };
}

export interface IOverallSummaryResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: IOverallSummaryData;
}

// Service Sales Report Types
export interface IServiceSalesItem {
  serviceId: string;
  serviceName: string;
  totalSaleCount: number;
  totalAmount: number;
  totalDiscount: number;
  netAmount: number;
}

export interface IServiceSalesParams {
  startDate?: string;
  endDate?: string;
  serviceId?: string;
  branchId?: string;
}

export interface IServiceSalesResponse {
  success: boolean;
  message: string;
  data: IServiceSalesItem[];
}

// Department Sales Report Types
export interface IDepartmentSalesItem {
  departmentId: string;
  departmentName: string;
  totalSaleCount: number;
  totalAmount: number;
  totalDiscount: number;
  netAmount: number;
  services: IServiceSalesItem[];
}

export interface IDepartmentSalesParams {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  branchId?: string;
}

export interface IDepartmentSalesResponse {
  success: boolean;
  message: string;
  data: IDepartmentSalesItem[];
}

// Pharmacy Sales Report Types
export interface IPharmacySalesPayment {
  date: string;
  amount: number;
  paymentMethod: string;
  receiveAccount: string;
}

export interface IPharmacySaleItem {
  slNo: number;
  patientNumber: string;
  invoiceNumber: string;
  totalPrice: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  paid: number;
  due: number;
  createdBy: string;
  createdAt: string;
  payments: IPharmacySalesPayment[];
}

export interface IPharmacyReturnItem {
  slNo: number;
  patientNumber: string;
  invoiceNumber: string;
  totalReturn: number;
  taxAmount: number;
  createdAt: string;
}

export interface IPharmacySalesReportData {
  outdoorSales: IPharmacySaleItem[];
  indoorSales: IPharmacySaleItem[];
  outdoorReturns: IPharmacyReturnItem[];
  indoorReturns: IPharmacyReturnItem[];
  totalPrice: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  paid: number;
  due: number;
  totalReturn: number;
}

export interface IPharmacySalesParams {
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

export interface IPharmacySalesReportResponse {
  success: boolean;
  message: string;
  data: IPharmacySalesReportData;
}

