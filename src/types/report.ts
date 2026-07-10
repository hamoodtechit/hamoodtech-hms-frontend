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
