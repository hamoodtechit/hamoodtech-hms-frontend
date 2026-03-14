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

export interface CommissionAgent {
  id: string;
  branchId: string;
  name: string;
  nameBangla: string;
  phone: string;
  email: string;
  address: string;
  commissionPercentage: string | number;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
  };
  yearlyStats?: {
    year: number;
    totalSalesCount: number;
    totalSalesAmount: number;
    commissionPercentage: number;
    totalCommissionEarned: number;
  };
}

export interface CommissionAgentPayload {
  branchId: string;
  name: string;
  nameBangla: string;
  phone: string;
  email: string;
  address: string;
  commissionPercentage: number;
}
