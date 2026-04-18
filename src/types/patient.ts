import { Bed } from "./facility";
import { Branch, PaymentMethod } from "./pharmacy";

export type { PaymentMethod };

export type AdmissionStatus = 'admitted' | 'discharged' | 'transferred' | 'cancelled';

export interface Admission {
  id: string;
  branchId: string;
  patientId: string;
  bedId: string;
  admissionDate: string;
  dischargeDate?: string;
  reason: string;
  note?: string;
  status: AdmissionStatus;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  fees: number | string;
  referralPersonId?: string;
  referralPerson?: any;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  bed?: Bed;
  branch?: Branch;
  doctorId?: string;
  doctor?: {
    fullName: string;
    designation?: string;
  };
  refDoctorName?: string;
  departmentId?: string;
  department?: {
    name: string;
  };
  discountPercentage?: number;
  discountAmount?: number;
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
}

export interface AdmissionPayload {
  branchId: string;
  patientId: string;
  bedId: string;
  admissionDate?: string;
  reason?: string;
  note?: string;
  status?: AdmissionStatus;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  fees?: number | string;
  referralPersonId?: string;
  referralPerson?: any;
  doctorId?: string;
  refDoctorName?: string;
  departmentId?: string;
  saleItems?: any[]; // For structured billing
  discountPercentage?: number;
  discountAmount?: number;
  taxPercentage?: number;
  taxAmount?: number;
  type?: 'hospital';
}

export interface AdmissionQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  patientId?: string;
  branchId?: string;
  bedId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface AdmissionListResponse {
  success: boolean;
  message: string;
  data: Admission[];
  meta: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Patient types (Migrated from pharmacy.ts)
export interface Patient {
  id: string;
  uhid: string;
  patientNumber?: string;
  name: string;
  nameBangla?: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  dob?: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  address: string;
  visitType?: 'ipd' | 'opd' | 'emergency';

  // Additional Fields
  village?: string;
  union?: string;
  postOffice?: string;
  thana?: string;
  district?: string;
  religion?: string;
  occupation?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  nationality?: string;

  createdAt: string;
  updatedAt: string;
}

export interface PatientPayload {
  name: string;
  nameBangla?: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  dob?: string;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  address: string;
  visitType?: 'ipd' | 'opd' | 'emergency';

  // Additional Fields
  village?: string;
  union?: string;
  postOffice?: string;
  thana?: string;
  district?: string;
  religion?: string;
  occupation?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  nationality?: string;
}

export interface PatientQueryParams {
  page?: number;
  limit?: number;
  name?: string;
  phone?: string;
  visitType?: 'ipd' | 'opd' | 'emergency';
}

export interface PatientListResponse {
    success: boolean;
    message: string;
    data: Patient[];
    meta: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    }
}
import { Sale } from "./sales";

export interface DischargeInitiateData {
  patient: Patient;
  pharmacy: {
    bills: Sale[];
    totals: {
      totalBill: number;
      totalPaid: number;
      totalDue: number;
    };
  };
  hospital: {
    bills: Sale[];
    totals: {
      totalBill: number;
      totalPaid: number;
      totalDue: number;
    };
  };
  grandTotal: {
    totalBill: number;
    totalPaid: number;
    totalDue: number;
  };
}

export interface DischargePayload {
  patientId: string;
  discountPercentage?: number;
  discountAmount?: number;
  totalAmount?: number;
  paidAmount?: number;
  dueAmount?: number;
  payments: {
    accountId: string;
    amount: number;
    paymentMethod: string;
    note?: string;
  }[];
}

export interface PharmacyPaymentPayload {
  patientId: string;
  amount: number;
  accountId: string;
  paymentMethod: string;
  note?: string;
}
