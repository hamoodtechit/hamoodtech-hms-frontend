export interface DiagnosticTest {
  id: string;
  branchId?: string;
  name: string;
  nameBangla: string;
  description: string;
  departmentId: string;
  price: number;
  reportDays: number;
  isDiagnosticTest: boolean;
  testResultTemplate?: any;
  testGroupId?: string;
  unit?: string;
  templateType: 'table' | 'narrative';
  templateDescription?: string;
  type: string;
  machineName?: string;
  machineDescription?: string;
  refCommissionsPercentage?: number;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
    nameBangla?: string;
  };
  testGroup?: {
    id: string;
    name: string;
  };
}

// Alias for backwards compatibility
export type HospitalService = DiagnosticTest;

export interface DiagnosticTestPayload {
  name: string;
  nameBangla?: string;
  description?: string;
  departmentId?: string;
  price: number;
  reportDays?: number;
  isDiagnosticTest?: boolean;
  testResultTemplate?: any;
  testGroupId?: string;
  templateType?: 'table' | 'narrative';
  templateDescription?: string;
  type?: string;
  unit?: string;
  branchId?: string;
  machineName?: string;
  machineDescription?: string;
  refCommissionsPercentage?: number;
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
  | 'pending'
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
  machineInfo?: string;
  // Narrative / Impression / Note fields
  content?: string;
  // For dynamic values in custom columns
  extraValues?: Record<string, string>;
  fieldType?: 'text' | 'dropdown';
  options?: string[];
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
  testResults?: Record<string, any>;
}


export interface DiagnosticReport {
  id: string;
  patientId: string;
  branchId: string;
  doctorId?: string | null;
  saleId?: string | null;
  departmentId?: string | null;
  medicalTechnologistId?: string | null;
  
  // New simplified arrays
  testItems?: any[]; 
  diagnosticTests?: Array<{
    id: string;
    itemName: string;
    price: number;
    deliveryDate?: string;
    isDiagnosticTest: boolean;
    service?: DiagnosticTest;
    [key: string]: any;
  }>;

  status: ReportStatus; // Renamed from reportStatus
  sampleStatus: SampleStatus;
  deliveryStatus?: DeliveryStatus;
  
  isSampleCollected: boolean;
  isDelivered: boolean;
  
  result?: DiagnosticResult | Record<string, any> | null;
  note?: string | null;
  reportNotes?: string | null; // Keep for compatibility
  digitalSignature?: string | null;
  barcode?: string | null;
  qrCode?: string | null;
  createdAt: string;
  updatedAt: string;

  patient?: {
    id: string;
    name: string;
    phone?: string;
    patientNumber?: string;
    uhid?: string;
    pin?: string;
    age?: number | string;
    gender?: string;
    bloodGroup?: string;
    address?: string;
  };
  doctor?: {
    id: string;
    fullName: string;
    username?: string;
    phone?: string;
  };
  sale?: {
    id: string;
    invoiceNumber: string;
    totalPrice?: string | number;
    netPrice?: string | number;
    status?: string;
    paymentStatus?: string;
  };
  
  // Legacy fields (optionalized)
  diagnosticTestId?: string;
  saleItemId?: string | null;
  testGroupId?: string | null;
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
  reportStatus?: string; // Query param uses reportStatus
  sampleStatus?: string;
  barcode?: string;
  deliveryStatus?: string;
  testGroupId?: string;
  branchId?: string;
  patientId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  isSampleCollected?: string;
  isDelivered?: string;
  serviceId?: string;
  departmentId?: string;
}
export interface DiagnosticTestParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  testGroupId?: string;
  type?: string;
  isDiagnosticTest?: boolean;
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

export type DeliveryStatus = 'pending' | 'delivered' | 'cancelled';

export interface UpdateDeliveryStatusPayload {
  deliveryStatus: DeliveryStatus;
}
