"use client"

import { SearchableSelect } from "@/components/shared/searchable-select"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// --- Department Filters ---
export interface DepartmentFilterValues {
    branchId?: string
}

interface DepartmentFiltersProps {
    values: DepartmentFilterValues
    onChange: (values: DepartmentFilterValues) => void
}

export function DepartmentFilters({ values, onChange }: DepartmentFiltersProps) {
    // const { data: branchesRes } = useBranches({ limit: 100 }) // Removed useBranches
    // const branches = branchesRes?.data || [] // Removed branches

    return (
        <div className="space-y-4">
            {/* No manual branch selection - uses global active branch */}
            <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground italic">Filtering by active branch...</p>
            </div>
        </div>
    )
}

// --- Designation Filters ---
export interface DesignationFilterValues {
    // branchId?: string // Removed branchId
    departmentId?: string
}

interface DesignationFiltersProps {
    values: DesignationFilterValues
    onChange: (values: DesignationFilterValues) => void
    departments: { id: string; name: string }[] // Added departments prop
}

export function DesignationFilters({ values, onChange, departments }: DesignationFiltersProps) {
    // const { data: branchesRes } = useBranches({ limit: 100 }) // Removed useBranches
    // const { data: departmentsRes } = useDepartments({ branchId: values.branchId, limit: 100 }) // Removed useDepartments and branchId filter
    
    // const branches = branchesRes?.data || [] // Removed branches
    // const departments = departmentsRes?.data || [] // Removed departments

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Department</Label>
                <SearchableSelect
                    value={values.departmentId}
                    onChange={(val) => onChange({ ...values, departmentId: val })}
                    options={departments.map(d => ({ id: d.id, name: d.name }))}
                    placeholder="All Departments"
                    allLabel="All Departments"
                />
            </div>
        </div>
    )
}

// --- Employee Filters ---
export interface EmployeeFilterValues {
    // branchId?: string // Removed branchId
    departmentId?: string
    designationId?: string
    type?: string
    status?: string
}

interface EmployeeFiltersProps {
    values: EmployeeFilterValues
    onChange: (values: EmployeeFilterValues) => void
    departments: { id: string; name: string }[] // Added departments prop
    designations: { id: string; name: string }[] // Added designations prop
}

export function EmployeeFilters({ 
    values, 
    onChange, 
    departments, 
    designations 
}: EmployeeFiltersProps) {
    // const { data: branchesRes } = useBranches({ limit: 100 }) // Removed useBranches
    // const { data: departmentsRes } = useDepartments({ branchId: values.branchId, limit: 100 }) // Removed useDepartments and branchId filter
    // const { data: designationsRes } = useDesignations({ branchId: values.branchId, departmentId: values.departmentId, limit: 100 }) // Removed useDesignations and branchId filter

    // const branches = branchesRes?.data || [] // Removed branches
    // const departments = departmentsRes?.data || [] // Removed departments
    // const designations = designationsRes?.data || [] // Removed designations

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
            {/* Removed Branch filter */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Department</Label>
                <SearchableSelect
                    value={values.departmentId}
                    onChange={(val) => onChange({ ...values, departmentId: val, designationId: "" })}
                    options={departments.map(d => ({ id: d.id, name: d.name }))}
                    placeholder="All Departments"
                    allLabel="All Departments"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Designation</Label>
                <SearchableSelect
                    value={values.designationId}
                    onChange={(val) => onChange({ ...values, designationId: val })}
                    options={designations.map(d => ({ id: d.id, name: d.name }))}
                    placeholder="All Designations"
                    allLabel="All Designations"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Employee Type</Label>
                <Select 
                    value={values.type || "all"} 
                    onValueChange={(v) => onChange({ ...values, type: v === "all" ? "" : v })}
                >
                    <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="nurse">Nurse</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Status</Label>
                <Select 
                    value={values.status || "all"} 
                    onValueChange={(v) => onChange({ ...values, status: v === "all" ? "" : v })}
                >
                    <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
