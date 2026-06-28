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
    totalExpenses: number;
    totalPurchases: number;
    totalPurchasesPaid: number;
    grossProfit: number;
    netProfit: number;
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
}

export interface IOverallSummaryResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: IOverallSummaryData;
}
