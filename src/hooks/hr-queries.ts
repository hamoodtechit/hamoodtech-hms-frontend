import { hrService } from "@/services/hr-service";
import { DepartmentPayload, DesignationPayload, EmployeePayload, AttendancePayload, AttendanceFilters } from "@/types/hr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "./use-permissions";


export const HR_KEYS = {
  all: ["hr"] as const,
  departments: (params?: any) => [...HR_KEYS.all, "departments", params] as const,
  designations: (params?: any) => [...HR_KEYS.all, "designations", params] as const,
  employees: (params?: any) => [...HR_KEYS.all, "employees", params] as const,
  employee: (id: string) => [...HR_KEYS.all, "employee", id] as const,
  commissionAgents: (params?: any) => [...HR_KEYS.all, "commissionAgents", params] as const,
  commissionAgent: (id: string) => [...HR_KEYS.all, "commissionAgent", id] as const,
  attendance: (params?: AttendanceFilters) => [...HR_KEYS.all, "attendance", params] as const,
};

// Commission Agent Hooks
export function useCommissionAgents(params?: any) {
  return useQuery({
    queryKey: HR_KEYS.commissionAgents(params),
    queryFn: () => hrService.getCommissionAgents(params),
  });
}

export function useCommissionAgent(id: string) {
  return useQuery({
    queryKey: HR_KEYS.commissionAgent(id),
    queryFn: () => hrService.getCommissionAgent(id),
    enabled: !!id,
  });
}

export function useCreateCommissionAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => hrService.createCommissionAgent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.commissionAgents() });
    },
  });
}

export function useUpdateCommissionAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      hrService.updateCommissionAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.all });
    },
  });
}

export function useDeleteCommissionAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrService.deleteCommissionAgent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.commissionAgents() });
    },
  });
}

// Department Hooks
export function useDepartments(params?: any) {
  return useQuery({
    queryKey: HR_KEYS.departments(params),
    queryFn: () => hrService.getDepartments(params),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DepartmentPayload) => hrService.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.departments() });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DepartmentPayload> }) => 
      hrService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.departments() });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrService.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.departments() });
    },
  });
}

// Designation Hooks
export function useDesignations(params?: any) {
  return useQuery({
    queryKey: HR_KEYS.designations(params),
    queryFn: () => hrService.getDesignations(params),
  });
}

export function useCreateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DesignationPayload) => hrService.createDesignation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.designations() });
    },
  });
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DesignationPayload> }) => 
      hrService.updateDesignation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.designations() });
    },
  });
}

export function useDeleteDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrService.deleteDesignation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.designations() });
    },
  });
}

// Employee Hooks
export function useEmployees(params?: any, options: { enabled?: boolean } = {}) {
  const { hasPermission } = usePermissions();
  return useQuery({
    queryKey: HR_KEYS.employees(params),
    queryFn: () => hrService.getEmployees(params),
    enabled: (options.enabled !== false) && hasPermission('employee:read'),
    retry: false,
    ...options
  });
}


export function useEmployee(id: string) {
  return useQuery({
    queryKey: HR_KEYS.employee(id),
    queryFn: () => hrService.getEmployee(id),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmployeePayload) => hrService.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.employees() });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmployeePayload> }) => 
      hrService.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.all });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrService.deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.employees() });
    },
  });
}

// Attendance Hooks
export function useAttendance(params?: AttendanceFilters) {
  return useQuery({
    queryKey: HR_KEYS.attendance(params),
    queryFn: () => hrService.getAttendance(params),
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AttendancePayload) => hrService.createAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.attendance() });
    },
  });
}

export function useAttendanceById(id: string) {
  return useQuery({
    queryKey: [...HR_KEYS.all, "attendance", id],
    queryFn: () => hrService.getAttendanceById(id),
    enabled: !!id,
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AttendancePayload> }) => 
      hrService.updateAttendance(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.attendance() });
      queryClient.invalidateQueries({ queryKey: [...HR_KEYS.all, "attendance", variables.id] });
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrService.deleteAttendance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.attendance() });
    },
  });
}

export function useImportAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ branchId, file }: { branchId: string; file: File }) => 
      hrService.importAttendance(branchId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.attendance() });
    },
  });
}
