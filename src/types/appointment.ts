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
  note?: string;
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
  note?: string;
  status?: AppointmentStatus;
  referralPersonId?: string;
  chamberOrRoomNumber?: string;
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


export interface AppointmentDetailsResponse {
  success: boolean;
  message: string;
  data: {
    appointment: Appointment;
  };
}
