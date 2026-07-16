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
  commissionPercentage?: number | string;
  dutyStartTime?: string;
  dutyEndTime?: string;
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
  commissionPercentage?: number | string;
  dutyStartTime?: string;
  dutyEndTime?: string;
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
  email: string | null;
  address: string;
  commissionStructure: {
    serviceId: string;
    serviceName: string;
    commissionPercentage: number;
  }[];
  employeeId: string | null;
  isActive: boolean;
  monthlyCommission: number;
  paidAmount?: number;
  dueAmount?: number;
  lastPaidAmount?: number;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
  };
  employee?: Employee | null;
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
  id: number;
  deviceSn: string;
  uid: string | number;
  punchTime: string;
  status: number | null;
  verifyType: number;
  source: string;
  forwarded: boolean;
  isDuplicate: boolean;
  rawData?: string | null;
  createdAt: string;
}

export interface AttendanceFilters {
  uid?: string | number;
  dateFrom?: string;
  dateTo?: string;
  excludeDuplicates?: string | boolean;
  limit?: string | number;
  page?: string | number;
  order?: 'asc' | 'desc';
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
  commissionPercentage?: number;
  commissionAmount?: number;
  isPaid: boolean;
  testStatus?: string;
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
    status: string;
    paymentStatus: string;
    createdAt: string;
    patient?: {
      id: string;
      patientNumber: string;
      name: string;
      phone: string;
    };
  };
}

export interface CommissionResponse {
  success: boolean;
  message: string;
  data: {
    commissions: Commission[];
    summary: {
      monthly: {
        totalCommission: number;
        totalPaid: number;
        totalDue: number;
      };
      range: any;
    };
  };
  meta: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
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
  branchId: string;
  referralId: string;
  accountId: string;
  commissionIds: string[];
  paymentMethod: string;
  note?: string;
}

export interface ReferralPayment {
  id: string;
  paymentNumber?: string;
  branchId: string;
  referralId: string;
  accountId: string;
  totalAmount: string | number;
  paymentMethod: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  referralCommissions?: Commission[];
  referral?: {
    id: string;
    name: string;
    phone: string;
  };
}

// Duty Roster Types
export interface Shift {
  id: string | number;
  name: string;
  shiftStartTime: string;
  shiftEndTime: string;
  checkInStartTime: string;
  checkInEndTime: string;
  checkOutStartTime: string;
  checkOutEndTime: string;
  graceMinutes: number;
  overtimeThresholdMinutes: number;
  breakMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftPayload {
  name: string;
  shiftStartTime: string;
  shiftEndTime: string;
  checkInStartTime: string;
  checkInEndTime: string;
  checkOutStartTime: string;
  checkOutEndTime: string;
  graceMinutes: number;
  overtimeThresholdMinutes: number;
  breakMinutes: number;
  isActive?: boolean;
}

export interface ShiftFilters {
  page?: number | string;
  limit?: number | string;
  searchTerm?: string;
}

export interface Schedule {
  id: number;
  uid: number | string;
  timetableId: number | string;
  scheduleDate: string;
  createdAt: string;
  updatedAt: string;
  timetable?: Shift;
}

export interface SchedulePayload {
  uid: number;
  timetableId: number;
  scheduleDate: string; // YYYY-MM-DD
}

export interface ScheduleBulkPayload {
  schedules: SchedulePayload[];
}

export interface ScheduleFilters {
  date?: string;
  uid?: number | string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AttendancePayload {
  uid: string | number;
  deviceSn?: string;
  punchTime: string;
  verifyType?: number;
  status?: number;
}
