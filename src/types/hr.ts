export interface Department {
  id: string;
  branchId: string;
  name: string;
  nameBangla: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentPayload {
  name: string;
  nameBangla?: string;
  description?: string;
  branchId: string;
}

export interface Designation {
  id: string;
  branchId: string;
  departmentId: string;
  name: string;
  nameBangla: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  department?: {
    id: string;
    name: string;
    nameBangla: string;
  };
}

export interface DesignationPayload {
  name: string;
  nameBangla?: string;
  description?: string;
  departmentId: string;
  branchId: string;
}

export interface Employee {
  id: string;
  branchId: string;
  employeeNumber?: string | null;
  employeeType: string;
  name: string;
  nameBangla?: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  dob?: string;
  bloodGroup?: string;
  address: string;
  designationId?: string;
  departmentId?: string;
  grossSalary: number | string;
  joiningDate: string;
  leavingDate?: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  userId?: string;
  chamberOrRoomNumber?: string;
  createdAt: string;
  updatedAt: string;
  photoUrl?: string;
  visitCharge?: number;
  repeatVisitCharge?: number;
  repeatVisitDayGap?: number;
  reportCharge?: number;
  department?: Department;
  designation?: Designation;
}

export interface EmployeePayload {
  branchId: string;
  employeeNumber?: string;
  employeeType: string;
  name: string;
  nameBangla?: string;
  age: number;
  gender: string;
  phone: string;
  email?: string;
  dob?: string;
  bloodGroup?: string;
  address: string;
  designationId?: string;
  departmentId?: string;
  grossSalary: number | string;
  joiningDate: string;
  leavingDate?: string;
  status?: 'active' | 'inactive' | 'on_leave' | 'terminated';
  userId?: string;
  chamberOrRoomNumber?: string;
  photoUrl?: string;
  visitCharge?: number;
  repeatVisitCharge?: number;
  repeatVisitDayGap?: number;
  reportCharge?: number;
}

export interface HRPaginatedResponse<T> {
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

export interface ReferralPerson {
  id: string;
  branchId: string;
  name: string;
  nameBangla: string;
  phone: string;
  email: string;
  address: string;
  commissionStructure: any;
  employeeId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
  };
  employee?: Employee;
  yearlyStats?: {
    year: number;
    totalSalesCount: number;
    totalSalesAmount: number;
    totalCommissionEarned: number;
  };
}

export interface ReferralPersonPayload {
  branchId: string;
  name: string;
  nameBangla: string;
  phone: string;
  email: string;
  address: string;
  commissionStructure: any;
  employeeId?: string;
  isActive?: boolean;
}

export interface Attendance {
  id: string;
  slNo?: string;
  employeeId?: string;
  employeeNumber?: string;
  employeeName: string;
  autoAssign?: string;
  date?: string;
  isoDate?: string | Date;
  shift?: string;
  onDuty?: string;
  offDuty?: string;
  clockIn?: string;
  clockOut?: string;
  normal?: string;
  realTime?: string;
  late?: string;
  early?: string;
  absent?: string;
  otTime?: string;
  workTime?: string;
  exception?: string;
  mustClockIn?: string;
  mustClockOut?: string;
  department?: string;
  nDays?: string;
  weekEnd?: string;
  holiday?: string;
  attTime?: string;
  nDaysOt?: string;
  weekEndOt?: string;
  holidayOt?: string;
  branchId: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    branchId: string;
    employeeNumber: string;
    employeeType: string;
    name: string;
    nameBangla?: string;
    photoUrl?: string;
    age: number;
    gender: string;
    phone: string;
    email?: string;
    dob?: string;
    bloodGroup?: string;
    address: string;
    designationId?: string;
    departmentId?: string;
    grossSalary?: string | number;
    joiningDate?: string;
    leavingDate?: string | null;
    chamberOrRoomNumber?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    department?: {
      name: string;
    };
    designation?: {
      name: string;
    };
  };
}

export type AttendancePayload = Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>;

export interface AttendanceFilters {
  page?: number;
  limit?: number;
  searchTerm?: string;
  employeeId?: string;
  branchId?: string;
  department?: string;
  shift?: string;
  startDate?: string;
  endDate?: string;
}

export interface AnnualCalendar {
  id: string;
  branchId: string;
  type: 'holiday' | 'vacation' | 'event';
  name: string;
  nameBangla?: string;
  description?: string;
  startDate: string;
  endDate: string;
  dayCount: number;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
  };
}

export interface AnnualCalendarPayload {
  branchId: string;
  type: 'holiday' | 'vacation' | 'event';
  name: string;
  nameBangla?: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface AnnualCalendarFilters {
  page?: number | string;
  limit?: number | string;
  searchTerm?: string;
  branchId?: string;
  year?: string;
  month?: string;
  type?: string;
}

export interface LeaveType {
  id: string;
  branchId: string;
  name: string;
  nameBangla?: string;
  description?: string;
  maxDaysPerYear: number;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
  };
}

export interface LeaveTypePayload {
  branchId: string;
  name: string;
  nameBangla?: string;
  description?: string;
  maxDaysPerYear: number;
  isPaid: boolean;
}

export interface LeaveTypeFilters {
  page?: number | string;
  limit?: number | string;
  searchTerm?: string;
  branchId?: string;
}

export interface Leave {
  id: string;
  branchId: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    name: string;
    designation?: { name: string };
  };
  leaveType?: {
    id: string;
    name: string;
  };
}

export interface LeavePayload {
  branchId: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  note?: string;
}

export interface ApproveLeavePayload {
  status: 'approved' | 'rejected' | 'pending';
  note?: string;
}

export interface LeaveFilters {
  page?: number | string;
  limit?: number | string;
  searchTerm?: string;
  branchId?: string;
  employeeId?: string;
  status?: string;
}

export interface LeaveCount {
  leaveName: string;
  leaveCount: number;
  totalLeave: number;
  availableLeave: number;
}

export interface LeaveSummary {
  approvedLeaves: Leave[];
  pendingLeaves: Leave[];
  rejectedLeaves: Leave[];
  leaveCounts: LeaveCount[];
  totalApprovedLeaves: number;
  totalPendingLeaves: number;
  totalRejectedLeaves: number;
}

export interface Commission {
  id: string;
  branchId: string;
  referralId: string;
  saleId: string;
  serviceId: string;
  serviceName: string;
  patientName?: string;
  invoiceNumber?: string;
  commissionType: string;
  commissionValue: string | number;
  isPaid: boolean;
  createdAt: string;
  updatedAt: string;
  referral?: {
    id: string;
    name: string;
    phone: string;
  };
  sale?: {
    id: string;
    invoiceNumber: string;
    netPrice: string | number;
  };
}

export interface CommissionFilters {
  page?: number | string;
  limit?: number | string;
  referralId?: string;
  isPaid?: boolean | string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CommissionPaymentPayload {
  referralId: string;
  accountId: string;
  commissionIds: string[];
  paymentMethod: string;
  note?: string;
}

// Duty Roster Types
export interface Shift {
  id: string;
  branchId: string;
  name: string;
  startTime: string;
  endTime: string;
  totalHours?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftPayload {
  branchId: string;
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
}

export interface ShiftFilters {
  page?: number | string;
  limit?: number | string;
  searchTerm?: string;
  branchId?: string;
}

export interface Roster {
  id: string;
  shiftId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  shift?: Shift;
}

export interface RosterPayload {
  branchId: string;
  shiftId: string;
  startDate: string;
  endDate: string;
}

export interface RosterFilters {
  page?: number | string;
  limit?: number | string;
  shiftId?: string;
  branchId?: string;
}

export interface AssignedRoster {
  id: string;
  rosterId: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  buildingName?: string;
  floorName?: string;
  sectionName?: string;
  buildingId?: string; // For facility integration
  floorId?: string;    // For facility integration
  sectionId?: string;  // For facility integration
  assignedBy?: string;
  createdAt: string;
  updatedAt: string;
  roster?: Roster;
  employee?: Employee;
}

export interface AssignedRosterPayload {
  branchId: string;
  rosterId: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  buildingName?: string;
  floorName?: string;
  sectionName?: string;
  buildingId?: string;
  floorId?: string;
  sectionId?: string;
  assignedBy?: string;
}

export interface AssignedRosterFilters {
  page?: number | string;
  limit?: number | string;
  rosterId?: string;
  employeeId?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}
