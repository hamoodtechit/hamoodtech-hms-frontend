import { api } from "@/lib/api";
import {
    Department,
    DepartmentPayload,
    Designation,
    DesignationPayload,
    Employee,
    EmployeePayload,
    HRPaginatedResponse,
    ReferralPerson,
    ReferralPersonPayload,
    Attendance,
    AttendancePayload,
    AttendanceFilters,
    Holiday,
    HolidayPayload,
    HolidayFilters,
    LeaveType,
    LeaveTypePayload,
    LeaveTypeFilters,
    Leave,
    LeavePayload,
    LeaveFilters,
    ApproveLeavePayload,
    Commission,
    CommissionFilters,
    CommissionPaymentPayload
} from "@/types/hr";

export const hrService = {
    // Holiday APIs
    getHolidays: async (params?: HolidayFilters): Promise<HRPaginatedResponse<Holiday>> => {
        const response = await api.get<HRPaginatedResponse<Holiday>>("/hr/holidays", { params });
        return response.data;
    },

    createHoliday: async (data: HolidayPayload): Promise<{ success: boolean; data: Holiday }> => {
        const response = await api.post<{ success: boolean; data: Holiday }>("/hr/holidays", data);
        return response.data;
    },

    getHolidayById: async (id: string): Promise<{ success: boolean; data: Holiday }> => {
        const response = await api.get<{ success: boolean; data: Holiday }>(`/hr/holidays/${id}`);
        return response.data;
    },

    updateHoliday: async (id: string, data: Partial<HolidayPayload>): Promise<{ success: boolean; data: Holiday }> => {
        const response = await api.patch<{ success: boolean; data: Holiday }>(`/hr/holidays/${id}`, data);
        return response.data;
    },

    deleteHoliday: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete<{ success: boolean; message: string }>(`/hr/holidays/${id}`);
        return response.data;
    },

    // Department APIs
  getDepartments: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    branchId?: string;
  }): Promise<HRPaginatedResponse<Department>> => {
    const response = await api.get<HRPaginatedResponse<Department>>("/hr/departments", { params });
    return response.data;
  },

  createDepartment: async (data: DepartmentPayload): Promise<Department> => {
    const response = await api.post("/hr/departments", data);
    return response.data;
  },

  updateDepartment: async (id: string, data: Partial<DepartmentPayload>): Promise<Department> => {
    const response = await api.patch(`/hr/departments/${id}`, data);
    return response.data;
  },

  deleteDepartment: async (id: string): Promise<void> => {
    await api.delete(`/hr/departments/${id}`);
  },

  // Designation APIs
  getDesignations: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    departmentId?: string;
    branchId?: string;
  }): Promise<HRPaginatedResponse<Designation>> => {
    const response = await api.get<HRPaginatedResponse<Designation>>("/hr/designations", { params });
    return response.data;
  },

  createDesignation: async (data: DesignationPayload): Promise<Designation> => {
    const response = await api.post("/hr/designations", data);
    return response.data;
  },

  updateDesignation: async (id: string, data: Partial<DesignationPayload>): Promise<Designation> => {
    const response = await api.patch(`/hr/designations/${id}`, data);
    return response.data;
  },

  deleteDesignation: async (id: string): Promise<void> => {
    await api.delete(`/hr/designations/${id}`);
  },

  // Employee APIs
  getEmployees: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    employeeType?: string;
    departmentId?: string;
    designationId?: string;
    branchId?: string;
    status?: string;
  }): Promise<HRPaginatedResponse<Employee>> => {
    const response = await api.get<HRPaginatedResponse<Employee>>("/hr/employees", { params });
    return response.data;
  },

  getEmployee: async (id: string): Promise<{ success: boolean; data: Employee }> => {
    const response = await api.get<{ success: boolean; data: Employee }>(`/hr/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data: EmployeePayload): Promise<Employee> => {
    const response = await api.post("/hr/employees", data);
    return response.data;
  },

  updateEmployee: async (id: string, data: Partial<EmployeePayload>): Promise<Employee> => {
    const response = await api.patch(`/hr/employees/${id}`, data);
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<void> => {
    await api.delete(`/hr/employees/${id}`);
  },

  // Referral Person APIs
  getReferrals: async (params?: { 
    page?: number | string; 
    limit?: number | string; 
    search?: string; 
    branchId?: string;
  }): Promise<HRPaginatedResponse<ReferralPerson>> => {
    const response = await api.get<HRPaginatedResponse<ReferralPerson>>("/referrals", { params });
    return response.data;
  },

  getReferral: async (id: string): Promise<{ success: boolean; data: ReferralPerson }> => {
    const response = await api.get<{ success: boolean; data: ReferralPerson }>(`/referrals/${id}`);
    return response.data;
  },

  createReferral: async (data: ReferralPersonPayload): Promise<ReferralPerson> => {
    const response = await api.post("/referrals", data);
    return response.data;
  },

  updateReferral: async (id: string, data: Partial<ReferralPersonPayload>): Promise<ReferralPerson> => {
    const response = await api.patch(`/referrals/${id}`, data);
    return response.data;
  },

  deleteReferral: async (id: string): Promise<void> => {
    await api.delete(`/referrals/${id}`);
  },

  // Attendance APIs
  getAttendance: async (params?: AttendanceFilters): Promise<HRPaginatedResponse<Attendance>> => {
    const response = await api.get<HRPaginatedResponse<Attendance>>("/hr/attendance", { params });
    return response.data;
  },

  createAttendance: async (data: AttendancePayload): Promise<{ success: boolean; data: Attendance }> => {
    const response = await api.post<{ success: boolean; data: Attendance }>("/hr/attendance", data);
    return response.data;
  },

  getAttendanceById: async (id: string): Promise<{ success: boolean; data: Attendance }> => {
    const response = await api.get<{ success: boolean; data: Attendance }>(`/hr/attendance/${id}`);
    return response.data;
  },

  updateAttendance: async (id: string, data: Partial<AttendancePayload>): Promise<{ success: boolean; data: Attendance }> => {
    const response = await api.patch<{ success: boolean; data: Attendance }>(`/hr/attendance/${id}`, data);
    return response.data;
  },

  deleteAttendance: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/hr/attendance/${id}`);
    return response.data;
  },

  importAttendance: async (branchId: string, file: File): Promise<{ success: boolean; message: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ success: boolean; message: string }>(`/hr/attendance/import/${branchId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Leave Types APIs
  getLeaveTypes: async (params?: LeaveTypeFilters): Promise<HRPaginatedResponse<LeaveType>> => {
    // Note: The API spec suggests this might be paginated or not. 
    // We'll use HRPaginatedResponse as standard and handle the structure in the UI.
    const response = await api.get<any>("/hr/leave-types", { params });
    
    // Auto-wrap unpaginated responses to match our HRPaginatedResponse expected type 
    // in case the backend doesn't paginate this specific endpoint but returns a simple data array
    if (response.data && response.data.data && Array.isArray(response.data.data) && !response.data.meta) {
        return {
            success: response.data.success,
            message: response.data.message,
            data: response.data.data,
            meta: { page: 1, pageSize: 100, totalPages: 1, totalItems: response.data.data.length, hasNextPage: false, hasPreviousPage: false }
        } as HRPaginatedResponse<LeaveType>;
    }
    
    return response.data;
  },

  createLeaveType: async (data: LeaveTypePayload): Promise<{ success: boolean; data: LeaveType }> => {
    const response = await api.post<{ success: boolean; data: LeaveType }>("/hr/leave-types", data);
    return response.data;
  },

  getLeaveTypeById: async (id: string): Promise<{ success: boolean; data: LeaveType }> => {
    const response = await api.get<{ success: boolean; data: LeaveType }>(`/hr/leave-types/${id}`);
    return response.data;
  },

  updateLeaveType: async (id: string, data: Partial<LeaveTypePayload>): Promise<{ success: boolean; data: LeaveType }> => {
    const response = await api.patch<{ success: boolean; data: LeaveType }>(`/hr/leave-types/${id}`, data);
    return response.data;
  },

  deleteLeaveType: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/hr/leave-types/${id}`);
    return response.data;
  },

  // Leaves APIs
  getLeaves: async (params?: LeaveFilters): Promise<HRPaginatedResponse<Leave>> => {
    const response = await api.get<any>("/hr/leaves", { params });
    if (response.data && response.data.data && Array.isArray(response.data.data) && !response.data.meta) {
        return {
            success: response.data.success,
            message: response.data.message,
            data: response.data.data,
            meta: { page: 1, pageSize: 100, totalPages: 1, totalItems: response.data.data.length, hasNextPage: false, hasPreviousPage: false }
        } as HRPaginatedResponse<Leave>;
    }
    return response.data;
  },

  createLeave: async (data: LeavePayload): Promise<{ success: boolean; data: Leave }> => {
    const response = await api.post<{ success: boolean; data: Leave }>("/hr/leaves", data);
    return response.data;
  },

  getLeaveById: async (id: string): Promise<{ success: boolean; data: Leave }> => {
    const response = await api.get<{ success: boolean; data: Leave }>(`/hr/leaves/${id}`);
    return response.data;
  },

  deleteLeave: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete<{ success: boolean; message: string }>(`/hr/leaves/${id}`);
    return response.data;
  },

  approveLeave: async (id: string, data: ApproveLeavePayload): Promise<{ success: boolean; data: Leave }> => {
    const response = await api.patch<{ success: boolean; data: Leave }>(`/hr/leaves/${id}/approve`, data);
    return response.data;
  },

  // Commission APIs
  getCommissions: async (params?: CommissionFilters): Promise<HRPaginatedResponse<Commission>> => {
    const response = await api.get<HRPaginatedResponse<Commission>>("/referrals/commissions", { params });
    return response.data;
  },

  processCommissionPayment: async (data: CommissionPaymentPayload): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>("/referrals/commissions/payment", data);
    return response.data;
  },
};
