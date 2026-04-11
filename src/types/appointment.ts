export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'in-progress' | 'no-show';

export interface Appointment {
  id: string;
  branchId: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  serialNumber: string;
  date: string;
  timeSlot: string;
  status: AppointmentStatus;
  fees: number;
  saleId?: string;
  note?: string;
  purpose?: string;
  referralPersonId?: string;
  referralPerson?: any;
  chamberOrRoomNumber?: string;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    patientNumber: string;
    name: string;
    phone: string;
    nameBangla?: string;
    age?: number;
    gender?: string;
    bloodGroup?: string;
    address?: string;
  };
  doctor: {
    id: string;
    employeeNumber: string;
    name: string;
    fullName?: string;
    username?: string;
    employeeType: string;
    department?: {
        name: string;
    };
    designation?: {
        name: string;
    };
  };
  department: {
    id: string;
    name: string;
  };
}

export interface AppointmentPayload {
  branchId: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  date: string;
  timeSlot: string;
  fees?: number;
  note?: string;
  status?: AppointmentStatus;
  referralPersonId?: string;
  referralPerson?: any;
  chamberOrRoomNumber?: string;
  type?: 'hospital';
  serviceItems?: {
    serviceId: string;
    itemName: string;
    unit: string;
    price: number;
    mrp: number;
    quantity: number;
    totalPrice: number;
    isDiagnosticTest?: boolean;
    discountPercentage?: number;
    discountAmount?: number;
    deliveryDate?: string;
  }[];
}

export interface AppointmentPaginatedResponse {
  success: boolean;
  message: string;
  data: Appointment[];
  meta: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

import { Sale } from "./sales";

export interface AppointmentDetailsResponse {
  success: boolean;
  message: string;
  data: {
    appointment: Appointment;
    sale: Sale;
  };
}
