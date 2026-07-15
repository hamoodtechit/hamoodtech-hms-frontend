import axios from "axios";
import { api } from "@/lib/api";

const zkApi = axios.create({
  baseURL: "https://attendance.genify.live/api/v1",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
  }
});
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
    AnnualCalendar,
    AnnualCalendarPayload,
    AnnualCalendarFilters,
    LeaveType,
    LeaveTypePayload,
    LeaveTypeFilters,
    Leave,
    LeavePayload,
    LeaveFilters,
    LeaveSummary,
    ApproveLeavePayload,
    Commission,
    CommissionFilters,
    CommissionResponse,
    CommissionPaymentPayload,
    ReferralPayment,
    Shift,
    ShiftPayload,
    ShiftFilters,
    Schedule,
    SchedulePayload,
    ScheduleBulkPayload,
    ScheduleFilters
} from "@/types/hr";

export const hrService = {
    // Annual Calendar APIs
    getAnnualCalendars: async (params?: AnnualCalendarFilters): Promise<HRPaginatedResponse<AnnualCalendar>> => {
        const response = await api.get<HRPaginatedResponse<AnnualCalendar>>("/hr/annual-calendars", { params });
        return response.data;
    },

    createAnnualCalendar: async (data: AnnualCalendarPayload): Promise<{ success: boolean; data: AnnualCalendar }> => {
        const response = await api.post<{ success: boolean; data: AnnualCalendar }>("/hr/annual-calendars", data);
        return response.data;
    },

    getAnnualCalendarById: async (id: string): Promise<{ success: boolean; data: AnnualCalendar }> => {
        const response = await api.get<{ success: boolean; data: AnnualCalendar }>(`/hr/annual-calendars/${id}`);
        return response.data;
    },

    updateAnnualCalendar: async (id: string, data: Partial<AnnualCalendarPayload>): Promise<{ success: boolean; data: AnnualCalendar }> => {
        const response = await api.patch<{ success: boolean; data: AnnualCalendar }>(`/hr/annual-calendars/${id}`, data);
        return response.data;
    },

    deleteAnnualCalendar: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete<{ success: boolean; message: string }>(`/hr/annual-calendars/${id}`);
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
  getAttendance: async (params?: AttendanceFilters): Promise<{ success: boolean; data: { data: Attendance[]; meta: { total: number; page: number; limit: number; totalPages: number } }; message: string }> => {
    const response = await zkApi.get<{ success: boolean; data: { data: Attendance[]; meta: { total: number; page: number; limit: number; totalPages: number } }; message: string }>("/attendance", { params });
    return response.data;
  },

  createAttendance: async (data: AttendancePayload): Promise<{ success: boolean; data: Attendance }> => {
    const response = await zkApi.post<{ success: boolean; data: Attendance }>("/attendance", data);
    return response.data;
  },

  getAttendanceById: async (id: string): Promise<{ success: boolean; data: Attendance }> => {
    const response = await zkApi.get<{ success: boolean; data: Attendance }>(`/attendance/${id}`);
    return response.data;
  },

  updateAttendance: async (id: string, data: Partial<AttendancePayload>): Promise<{ success: boolean; data: Attendance }> => {
    const response = await zkApi.patch<{ success: boolean; data: Attendance }>(`/attendance/${id}`, data);
    return response.data;
  },

  deleteAttendance: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await zkApi.delete<{ success: boolean; message: string }>(`/attendance/${id}`);
    return response.data;
  },

  importAttendance: async (branchId: string, file: File): Promise<{ success: boolean; message: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await zkApi.post<{ success: boolean; message: string }>(`/attendance/import/${branchId}`, formData, {
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

  getEmployeeLeaveSummary: async (employeeId: string): Promise<{ success: boolean; data: LeaveSummary }> => {
    const response = await api.get<{ success: boolean; data: LeaveSummary }>(`/hr/leaves/${employeeId}`);
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
  getCommissions: async (params?: CommissionFilters): Promise<CommissionResponse> => {
    const response = await api.get<CommissionResponse>("/referrals/commissions", { params });
    return response.data;
  },

  processCommissionPayment: async (data: CommissionPaymentPayload): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>("/referrals/pay", data);
    return response.data;
  },

  getReferralPayments: async (params?: { referralId?: string; page?: number; limit?: number }): Promise<{ success: boolean; data: ReferralPayment[]; meta: any }> => {
    const response = await api.get<{ success: boolean; data: ReferralPayment[]; meta: any }>("/referrals/payments", { params });
    return response.data;
  },

  getReferralPaymentDetails: async (id: string): Promise<{ success: boolean; data: ReferralPayment }> => {
    const response = await api.get<{ success: boolean; data: ReferralPayment }>(`/referrals/payments/${id}`);
    return response.data;
  },

  // Shift APIs
  getShifts: async (params?: ShiftFilters): Promise<{ success: boolean; data: Shift[] }> => {
    const response = await zkApi.get<{ success: boolean; data: Shift[] }>("/shifts", { params });
    return response.data;
  },

  createShift: async (data: ShiftPayload): Promise<{ success: boolean; data: Shift }> => {
    const response = await zkApi.post<{ success: boolean; data: Shift }>("/shifts", data);
    return response.data;
  },

  getShiftById: async (id: string): Promise<{ success: boolean; data: Shift }> => {
    const response = await zkApi.get<{ success: boolean; data: Shift }>(`/shifts/${id}`);
    return response.data;
  },

  updateShift: async (id: string, data: Partial<ShiftPayload>): Promise<{ success: boolean; data: Shift }> => {
    const response = await zkApi.patch<{ success: boolean; data: Shift }>(`/shifts/${id}`, data);
    return response.data;
  },

  deleteShift: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await zkApi.delete<{ success: boolean; message: string }>(`/shifts/${id}`);
    return response.data;
  },

  // Schedule APIs
  getSchedules: async (params?: ScheduleFilters): Promise<{ success: boolean; data: Schedule[] }> => {
    const response = await zkApi.get<{ success: boolean; data: Schedule[] }>("/schedules", { params });
    return response.data;
  },

  createBulkSchedules: async (data: ScheduleBulkPayload): Promise<{ success: boolean; message: string }> => {
    const response = await zkApi.post<{ success: boolean; message: string }>("/schedules/bulk", data);
    return response.data;
  },

  deleteSchedule: async (id: number | string): Promise<{ success: boolean; message: string }> => {
    const response = await zkApi.delete<{ success: boolean; message: string }>(`/schedules/${id}`);
    return response.data;
  },
};
