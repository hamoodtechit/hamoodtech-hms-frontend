"use client"

import { SearchableSelect } from "@/components/shared/searchable-select"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { CalendarIcon, Filter, MapPin, Calendar, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

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

// --- Attendance Filters ---
export interface AttendanceFilterValues {
    branchId?: string
    employeeId?: string
    departmentId?: string
    shift?: string
    startDate?: string
    endDate?: string
}

interface AttendanceFiltersProps {
    values: AttendanceFilterValues
    onChange: (values: AttendanceFilterValues) => void
    employees: { id: string; name: string }[]
    departments: { id: string; name: string }[]
    branches: { id: string; name: string }[]
}

export function AttendanceFilters({ 
    values, 
    onChange, 
    employees, 
    departments,
    branches
}: AttendanceFiltersProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Branch</Label>
                <SearchableSelect
                    value={values.branchId}
                    onChange={(val) => onChange({ ...values, branchId: val })}
                    options={branches.map(b => ({ id: b.id, name: b.name }))}
                    placeholder="All Branches"
                    allLabel="All Branches"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Employee</Label>
                <SearchableSelect
                    value={values.employeeId}
                    onChange={(val) => onChange({ ...values, employeeId: val })}
                    options={employees.map(e => ({ id: e.id, name: e.name }))}
                    placeholder="All Employees"
                    allLabel="All Employees"
                />
            </div>
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
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Shift</Label>
                <Select 
                    value={values.shift || "all"} 
                    onValueChange={(v) => onChange({ ...values, shift: v === "all" ? "" : v })}
                >
                    <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Shifts" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Shifts</SelectItem>
                        <SelectItem value="morning">Morning</SelectItem>
                        <SelectItem value="evening">Evening</SelectItem>
                        <SelectItem value="night">Night</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Start Date</Label>
                <Input 
                    type="date"
                    className="h-9 text-xs"
                    value={values.startDate || ""}
                    onChange={(e) => onChange({ ...values, startDate: e.target.value })}
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">End Date</Label>
                <Input 
                    type="date"
                    className="h-9 text-xs"
                    value={values.endDate || ""}
                    onChange={(e) => onChange({ ...values, endDate: e.target.value })}
                />
            </div>
        </div>
    )
}

// --- Annual Calendar Filters ---
export interface AnnualCalendarFilterValues {
    branchId?: string
    year?: string
    month?: string
    type?: string
}

interface AnnualCalendarFiltersProps {
    values: AnnualCalendarFilterValues
    onChange: (values: AnnualCalendarFilterValues) => void
    branches: { id: string; name: string }[]
}

export function AnnualCalendarFilters({
    values,
    onChange,
    branches
}: AnnualCalendarFiltersProps) {
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 12 }, (_, i) => (currentYear - 6 + i).toString())

    const months = [
        { id: "1", name: "Jan" },
        { id: "2", name: "Feb" },
        { id: "3", name: "Mar" },
        { id: "4", name: "Apr" },
        { id: "5", name: "May" },
        { id: "6", name: "Jun" },
        { id: "7", name: "Jul" },
        { id: "8", name: "Aug" },
        { id: "9", name: "Sep" },
        { id: "10", name: "Oct" },
        { id: "11", name: "Nov" },
        { id: "12", name: "Dec" },
    ]

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground px-1 flex items-center gap-2">
                    <Filter className="h-3 w-3" />
                    Entry Type
                </Label>
                <Select
                    value={values.type || "all"}
                    onValueChange={(v) => onChange({ ...values, type: v === "all" ? undefined : v })}
                >
                    <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="holiday">Holiday</SelectItem>
                        <SelectItem value="vacation">Vacation</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Branch</Label>
                <SearchableSelect
                    value={values.branchId}
                    onChange={(val) => onChange({ ...values, branchId: val })}
                    options={branches.map(b => ({ id: b.id, name: b.name }))}
                    placeholder="All Branches"
                    allLabel="All Branches"
                />
            </div>
            
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Year / Calendar</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button 
                            variant="outline" 
                            className={cn(
                                "w-full h-9 text-xs justify-start font-normal px-2",
                                !values.year && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                            {values.year || "All Years"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2 shadow-xl" align="start">
                        <div className="grid grid-cols-3 gap-1">
                            <Button 
                                variant={!values.year ? "secondary" : "ghost"} 
                                onClick={() => onChange({ ...values, year: "" })}
                                className="h-8 text-xs font-medium"
                            >
                                All
                            </Button>
                            {years.map(y => (
                                <Button 
                                    key={y}
                                    variant={values.year === y ? "default" : "ghost"}
                                    onClick={() => onChange({ ...values, year: y })}
                                    className="h-8 text-xs font-medium"
                                >
                                    {y}
                                </Button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Month</Label>
                <div className="flex flex-wrap gap-1 border p-1 rounded-md bg-muted/30">
                    <Button 
                        variant={!values.month ? "secondary" : "ghost"} 
                        size="sm"
                        onClick={() => onChange({ ...values, month: "" })}
                        className="h-7 text-[10px] px-1.5 font-bold"
                    >
                        ALL
                    </Button>
                    {months.map(m => (
                        <Button 
                            key={m.id}
                            variant={values.month === m.id ? "default" : "ghost"}
                            size="sm"
                            onClick={() => onChange({ ...values, month: m.id })}
                            className="h-7 text-[10px] px-1.5 font-bold"
                        >
                            {m.name}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// --- Referral Filters ---
export interface ReferralFilterValues {
    type?: string
    status?: string
    minCommission?: string
    maxCommission?: string
}

interface ReferralFiltersProps {
    values: ReferralFilterValues
    onChange: (values: ReferralFilterValues) => void
}

export function ReferralFilters({ 
    values, 
    onChange 
}: ReferralFiltersProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Partner Type</Label>
                <Select 
                    value={values.type || "all"} 
                    onValueChange={(v) => onChange({ ...values, type: v === "all" ? "" : v })}
                >
                    <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="All Partners" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Partners</SelectItem>
                        <SelectItem value="internal">Internal Staff</SelectItem>
                        <SelectItem value="external">External Partners</SelectItem>
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
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Min Cumulative Earn</Label>
                <Input 
                    type="number"
                    placeholder="E.g. 1000"
                    className="h-9 text-xs"
                    value={values.minCommission || ""}
                    onChange={(e) => onChange({ ...values, minCommission: e.target.value })}
                />
            </div>

            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Max Cumulative Earn</Label>
                <Input 
                    type="number"
                    placeholder="E.g. 50000"
                    className="h-9 text-xs"
                    value={values.maxCommission || ""}
                    onChange={(e) => onChange({ ...values, maxCommission: e.target.value })}
                />
            </div>
        </div>
    )
}
