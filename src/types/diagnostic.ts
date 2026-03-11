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
  type?: string | null;
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

export type SampleStatus = 'not-required' | 'pending' | 'collected';

export interface DiagnosticReport {
  id: string;
  patientId: string;
  branchId: string;
  diagnosticTestId: string;
  saleItemId?: string | null;
  employeeId?: string | null;
  // API uses reportStatus (not status)
  reportStatus: ReportStatus;
  sampleStatus: SampleStatus;
  barcode?: string | null;
  qrCode?: string | null;
  collectedById?: string | null;
  sampleCollectedAt?: string | null;
  sampleDetails?: string | null;
  technicianId?: string | null;
  result?: Record<string, any> | null;
  reportNotes?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  digitalSignature?: string | null;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    name: string;
    phone?: string;
  };
  saleItem?: any | null;
  collectedBy?: any | null;
  technician?: any | null;
  approvedBy?: any | null;
  diagnosticTest?: {
    id: string;
    name: string;
    type?: string | null;
  };
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
  status?: string;
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
