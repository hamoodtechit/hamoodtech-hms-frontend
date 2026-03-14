import { api } from "@/lib/api";
import {
    Department,
    DepartmentPayload,
    Designation,
    DesignationPayload,
    Employee,
    EmployeePayload,
    HRPaginatedResponse,
    CommissionAgent,
    CommissionAgentPayload
} from "@/types/hr";

export const hrService = {
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

  // Commission Agent APIs
  getCommissionAgents: async (params?: { 
    page?: number | string; 
    limit?: number | string; 
    search?: string; 
    branchId?: string;
  }): Promise<HRPaginatedResponse<CommissionAgent>> => {
    const response = await api.get<HRPaginatedResponse<CommissionAgent>>("/commission-agents", { params });
    return response.data;
  },

  getCommissionAgent: async (id: string): Promise<{ success: boolean; data: CommissionAgent }> => {
    const response = await api.get<{ success: boolean; data: CommissionAgent }>(`/commission-agents/${id}`);
    return response.data;
  },

  createCommissionAgent: async (data: CommissionAgentPayload): Promise<CommissionAgent> => {
    const response = await api.post("/commission-agents", data);
    return response.data;
  },

  updateCommissionAgent: async (id: string, data: Partial<CommissionAgentPayload>): Promise<CommissionAgent> => {
    const response = await api.put(`/commission-agents/${id}`, data);
    return response.data;
  },

  deleteCommissionAgent: async (id: string): Promise<void> => {
    await api.delete(`/commission-agents/${id}`);
  },
};
