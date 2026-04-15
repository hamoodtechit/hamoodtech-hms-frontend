import { hrService } from "@/services/hr-service";
import { 
  DepartmentPayload, 
  DesignationPayload, 
  EmployeePayload, 
  AttendancePayload, 
  AttendanceFilters, 
  AnnualCalendarPayload, 
  AnnualCalendarFilters,
  LeaveTypePayload,
  LeaveTypeFilters,
  LeavePayload,
  LeaveFilters,
  ApproveLeavePayload,
  ReferralPersonPayload,
  CommissionFilters,
  CommissionPaymentPayload,
  ShiftFilters,
  ShiftPayload,
  RosterFilters,
  RosterPayload,
  AssignedRosterFilters,
  AssignedRosterPayload
} from "@/types/hr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "./use-permissions";


export const HR_KEYS = {
  all: ["hr"] as const,
  departments: (params?: { page?: number; limit?: number; search?: string; branchId?: string }) => params ? [...HR_KEYS.all, "departments", params] as const : [...HR_KEYS.all, "departments"] as const,
  designations: (params?: { page?: number; limit?: number; search?: string; branchId?: string }) => params ? [...HR_KEYS.all, "designations", params] as const : [...HR_KEYS.all, "designations"] as const,
  employees: (params?: { page?: number; limit?: number; search?: string; branchId?: string }) => params ? [...HR_KEYS.all, "employees", params] as const : [...HR_KEYS.all, "employees"] as const,
  employee: (id: string) => [...HR_KEYS.all, "employee", id] as const,
  referrals: (params?: { page?: number; limit?: number; search?: string; branchId?: string }) => params ? [...HR_KEYS.all, "referrals", params] as const : [...HR_KEYS.all, "referrals"] as const,
  referral: (id: string) => [...HR_KEYS.all, "referral", id] as const,
  attendance: (params?: AttendanceFilters) => params ? [...HR_KEYS.all, "attendance", params] as const : [...HR_KEYS.all, "attendance"] as const,
  annualCalendars: (params?: AnnualCalendarFilters) => params ? [...HR_KEYS.all, "annual-calendars", params] as const : [...HR_KEYS.all, "annual-calendars"] as const,
  annualCalendar: (id: string) => [...HR_KEYS.all, "annual-calendar", id] as const,
  leaveTypes: (params?: LeaveTypeFilters) => params ? [...HR_KEYS.all, "leaveTypes", params] as const : [...HR_KEYS.all, "leaveTypes"] as const,
  leaveType: (id: string) => [...HR_KEYS.all, "leaveType", id] as const,
  leaves: (params?: LeaveFilters) => params ? [...HR_KEYS.all, "leaves", params] as const : [...HR_KEYS.all, "leaves"] as const,
  leave: (id: string) => [...HR_KEYS.all, "leave", id] as const,
  commissions: (params?: CommissionFilters) => params ? [...HR_KEYS.all, "commissions", params] as const : [...HR_KEYS.all, "commissions"] as const,
  shifts: (params?: ShiftFilters) => params ? [...HR_KEYS.all, "shifts", params] as const : [...HR_KEYS.all, "shifts"] as const,
  shift: (id: string) => [...HR_KEYS.all, "shift", id] as const,
  rosters: (params?: RosterFilters) => params ? [...HR_KEYS.all, "rosters", params] as const : [...HR_KEYS.all, "rosters"] as const,
  roster: (id: string) => [...HR_KEYS.all, "roster", id] as const,
  assignedRosters: (params?: AssignedRosterFilters) => params ? [...HR_KEYS.all, "assignedRosters", params] as const : [...HR_KEYS.all, "assignedRosters"] as const,
};

// Annual Calendar Hooks
export function useAnnualCalendars(params?: AnnualCalendarFilters) {
  return useQuery({
    queryKey: HR_KEYS.annualCalendars(params),
    queryFn: () => hrService.getAnnualCalendars(params),
  });
}

export function useAnnualCalendar(id?: string) {
  return useQuery({
    queryKey: HR_KEYS.annualCalendar(id!),
    queryFn: () => hrService.getAnnualCalendarById(id!),
    enabled: !!id,
  });
}

export function useCreateAnnualCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AnnualCalendarPayload) => hrService.createAnnualCalendar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.annualCalendars() });
    },
  });
}

export function useUpdateAnnualCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AnnualCalendarPayload> }) => 
      hrService.updateAnnualCalendar(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.annualCalendars() });
    },
  });
}

export function useDeleteAnnualCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrService.deleteAnnualCalendar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.annualCalendars() });
    },
  });
}

// Referral Person Hooks
export function useReferrals(params?: { page?: number; limit?: number; search?: string; branchId?: string }) {
  return useQuery({
    queryKey: HR_KEYS.referrals(params),
    queryFn: () => hrService.getReferrals(params),
  });
}

export function useReferral(id: string) {
  return useQuery({
    queryKey: HR_KEYS.referral(id),
    queryFn: () => hrService.getReferral(id),
    enabled: !!id,
  });
}

export function useCreateReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReferralPersonPayload) => hrService.createReferral(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.referrals() });
    },
  });
}

export function useUpdateReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReferralPersonPayload> }) => 
      hrService.updateReferral(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.referrals() });
      queryClient.invalidateQueries({ queryKey: HR_KEYS.all });
    },
  });
}

export function useDeleteReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrService.deleteReferral(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.referrals() });
    },
  });
}

// Department Hooks
export function useDepartments(params?: { page?: number; limit?: number; search?: string; branchId?: string }) {
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
export function useDesignations(params?: { page?: number; limit?: number; search?: string; branchId?: string; departmentId?: string }) {
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
export function useEmployees(params?: { page?: number; limit?: number; search?: string; branchId?: string }, options: { enabled?: boolean } = {}) {
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

// Leave Types Hooks
export function useLeaveTypes(params?: LeaveTypeFilters) {
  return useQuery({
    queryKey: HR_KEYS.leaveTypes(params),
    queryFn: () => hrService.getLeaveTypes(params),
  });
}

export function useLeaveType(id?: string) {
  return useQuery({
    queryKey: HR_KEYS.leaveType(id!),
    queryFn: () => hrService.getLeaveTypeById(id!),
    enabled: !!id,
  });
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeaveTypePayload) => hrService.createLeaveType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.leaveTypes() });
    },
  });
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeaveTypePayload> }) => 
      hrService.updateLeaveType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.leaveTypes() });
    },
  });
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrService.deleteLeaveType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.leaveTypes() });
    },
  });
}

// Leaves Hooks
export function useLeaves(params?: LeaveFilters) {
  return useQuery({
    queryKey: HR_KEYS.leaves(params),
    queryFn: () => hrService.getLeaves(params),
  });
}

export function useLeave(id?: string) {
  return useQuery({
    queryKey: HR_KEYS.leave(id!),
    queryFn: () => hrService.getLeaveById(id!),
    enabled: !!id,
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeavePayload) => hrService.createLeave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.leaves() });
    },
  });
}

export function useDeleteLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrService.deleteLeave(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.leaves() });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ApproveLeavePayload }) => 
      hrService.approveLeave(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.leaves() });
      queryClient.invalidateQueries({ queryKey: HR_KEYS.leave(variables.id) });
    },
  });
}

// Commission Hooks
export function useCommissions(params?: CommissionFilters) {
  return useQuery({
    queryKey: HR_KEYS.commissions(params),
    queryFn: () => hrService.getCommissions(params),
  });
}

export function useProcessCommissionPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CommissionPaymentPayload) => hrService.processCommissionPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.commissions() });
      queryClient.invalidateQueries({ queryKey: HR_KEYS.all });
    },
  });
}

// Shift Hooks
export function useShifts(params?: ShiftFilters) {
  return useQuery({
    queryKey: HR_KEYS.shifts(params),
    queryFn: () => hrService.getShifts(params),
  });
}

export function useShift(id?: string) {
  return useQuery({
    queryKey: HR_KEYS.shift(id!),
    queryFn: () => hrService.getShiftById(id!),
    enabled: !!id,
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ShiftPayload) => hrService.createShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.shifts() });
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ShiftPayload> }) => 
      hrService.updateShift(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.shifts() });
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrService.deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.shifts() });
    },
  });
}

// Roster Hooks
export function useRosters(params?: RosterFilters) {
  return useQuery({
    queryKey: HR_KEYS.rosters(params),
    queryFn: () => hrService.getRosters(params),
  });
}

export function useRoster(id?: string) {
  return useQuery({
    queryKey: HR_KEYS.roster(id!),
    queryFn: () => hrService.getRosterById(id!),
    enabled: !!id,
  });
}

export function useCreateRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RosterPayload) => hrService.createRoster(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.rosters() });
    },
  });
}

export function useUpdateRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RosterPayload> }) => 
      hrService.updateRoster(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.rosters() });
    },
  });
}

export function useDeleteRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrService.deleteRoster(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.rosters() });
    },
  });
}

// Assigned Roster Hooks
export function useAssignedRosters(params?: AssignedRosterFilters) {
  return useQuery({
    queryKey: HR_KEYS.assignedRosters(params),
    queryFn: () => hrService.getAssignedRosters(params),
  });
}

export function useCreateAssignedRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignedRosterPayload) => hrService.createAssignedRoster(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.assignedRosters() });
    },
  });
}

export function useDeleteAssignedRoster() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hrService.deleteAssignedRoster(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HR_KEYS.assignedRosters() });
    },
  });
}
