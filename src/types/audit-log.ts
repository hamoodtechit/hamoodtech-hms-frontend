export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  branchId: string;
  branchName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  module: string;
  recordId: string;
  userAgent: string;
  ipAddress: string;
  deviceInfo: {
    platform: string;
    mobile: boolean;
  };
  createdAt: string;
}

export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  branchId?: string;
  module?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditLogPaginatedResponse {
  success: boolean;
  message: string;
  data: AuditLog[];
  meta: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
