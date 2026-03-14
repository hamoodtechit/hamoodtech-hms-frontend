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
}

export interface DiagnosticTestPayload {
  branchId?: string;
  name: string;
  nameBangla?: string;
  description?: string;
  departmentId: string;
  price: number | string;
  reportDays?: number;
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

export type ResultMode = 'table' | 'narrative';

export interface ResultTableRow {
  parameter: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  isHeader?: boolean;
  isAbnormal?: boolean;
  isBold?: boolean;
}

export interface DiagnosticResult {
  mode: ResultMode;
  reportHeader?: string; // e.g., "BIOCHEMISTRY REPORT"
  machineInfo?: string;  // e.g., "Tests are carried out by Rayto RT-9200..."
  // Table fields
  rows?: ResultTableRow[];
  // Narrative fields
  content?: string;      // Findings
  interpretation?: string; // Comment/Impression
  preparedBy?: string;   // Name of technical person
  consultantName?: string; // Referred by doctor name
  doctorDegrees?: string;  // Approving pathologist degrees
}

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
  result?: DiagnosticResult | Record<string, any> | null;
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
  result: DiagnosticResult | Record<string, any>;
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
  branchId?: string;
  isActive?: boolean;
}

// Report Template Types
export interface ReportTemplate {
  id: string;
  name: string;
  type: string;
  description?: string;
  result: DiagnosticResult | Record<string, any>;
  diagnosticTestId?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportTemplatePayload {
  name: string;
  type: string;
  description?: string;
  result: DiagnosticResult | Record<string, any>;
  diagnosticTestId?: string;
  branchId: string;
}
