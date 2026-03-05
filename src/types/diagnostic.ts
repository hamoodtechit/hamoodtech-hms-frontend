export interface DiagnosticTest {
  id: string;
  branchId?: string;
  name: string;
  nameBangla?: string;
  description?: string;
  departmentId: string;
  price: number | string;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
    nameBangla?: string;
  };
  reportDays?: number;
  staffId?: string;
}

export interface DiagnosticTestPayload {
  branchId?: string;
  name: string;
  nameBangla?: string;
  description?: string;
  departmentId: string;
  price: number | string;
  reportDays?: number;
  staffId: string;
}

export interface DiagnosticPaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
