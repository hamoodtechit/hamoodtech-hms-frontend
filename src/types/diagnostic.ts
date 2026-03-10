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

export type ReportStatus = 
  | 'pending-billing' 
  | 'pending-sample-collection' 
  | 'sample-collected' 
  | 'processing' 
  | 'pending-verification' 
  | 'completed'
  | 'cancelled';

export interface DiagnosticReport {
  id: string;
  patientId: string;
  branchId: string;
  diagnosticTestId: string;
  saleItemId?: string;
  status: ReportStatus;
  barcode?: string;
  collectedById?: string;
  collectedAt?: string;
  sampleDetails?: string;
  technicianId?: string;
  result?: Record<string, any>;
  reportNotes?: string;
  approvedById?: string;
  approvedAt?: string;
  digitalSignature?: string;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    name: string;
    uhid: string;
    phone?: string;
  };
  diagnosticTest?: DiagnosticTest;
}

export interface RequisitionPayload {
  patientId: string;
  branchId: string;
  diagnosticTestId: string;
}

export interface CollectSamplePayload {
  collectedById: string;
  sampleDetails: string;
}

export interface ResultEntryPayload {
  technicianId: string;
  result: Record<string, any>;
  reportNotes?: string;
}

export interface ApprovalPayload {
  approvedById: string;
  digitalSignature?: string;
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

export interface DiagnosticReportParams {
  page?: number;
  limit?: number;
  search?: string;
  reportStatus?: string;
  sampleStatus?: string;
  barcode?: string;
  branchId?: string;
  patientId?: string;
}

export interface DiagnosticTestParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  type?: string; // e.g., pathology, radiology
  branchId?: string;
  isActive?: boolean;
}
