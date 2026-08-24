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
