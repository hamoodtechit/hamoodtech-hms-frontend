export interface DiagnosticTest {
  id: string;
  branchId?: string;
  name: string;
  nameBangla?: string;
  description?: string;
  departmentId: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
    nameBangla?: string;
  };
  reportDays?: number;
  testGroupId?: string;
  testGroup?: {
    id: string;
    name: string;
  };
}

export interface DiagnosticTestPayload {
  branchId?: string;
  name: string;
  nameBangla?: string;
  description?: string;
  departmentId: string;
  price: number;
  reportDays?: number;
  testGroupId?: string;
}

export interface DiagnosticTestGroup {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiagnosticTestGroupPayload {
  name: string;
  description?: string;
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

export type DiagnosticBlockType = 'header' | 'parameter' | 'narrative' | 'impression' | 'note';

export interface DiagnosticColumnDef {
  id: string;
  label: string;
  key: string;
  width?: string;
  isVisible: boolean;
}

export interface DiagnosticBlock {
  id: string;
  type: DiagnosticBlockType;
  // Configuration
  columnDefs?: DiagnosticColumnDef[];
  // Header fields
  headerText?: string;
  // Parameter fields
  parameter?: string;
  value?: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  isBold?: boolean;
  isHeader?: boolean; // For sub-headers within parameters
  // Narrative / Impression / Note fields
  content?: string;
  // For dynamic values in custom columns
  extraValues?: Record<string, string>;
}


export interface DiagnosticResult {
  mode: ResultMode; // Legacy mode (for backwards compatibility)
  blocks?: DiagnosticBlock[]; // New flexible blocks
  reportHeader?: string;
  machineInfo?: string;
  consultantName?: string;
  consultantDesignation?: string;
  doctorDegrees?: string;
  doctorDesignation?: string;
  // Legacy fields (kept for compatibility)
  rows?: ResultTableRow[];
  content?: string;
  interpretation?: string;
  preparedBy?: string;
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
  testGroupId?: string | null;
  testGroup?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  patient?: {
    id: string;
    name: string;
    phone?: string;
    patientNumber?: string;
    uhid?: string;
    age?: number | string;
    gender?: string;
    bloodGroup?: string;
    address?: string;
  };
  saleItem?: {
    id: string;
    invoiceNumber?: string;
    deliveryDate?: string;
    price?: string | number;
    itemName?: string;
  } | null;
  collectedBy?: any | null;
  technician?: any | null;
  approvedBy?: any | null;
  diagnosticTest?: {
    id: string;
    name: string;
    testGroupId?: string;
    testGroup?: {
      id: string;
      name: string;
    };
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
  startDate?: string;
  endDate?: string;
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
  isGlobal?: boolean;
  departmentId?: string;
}

