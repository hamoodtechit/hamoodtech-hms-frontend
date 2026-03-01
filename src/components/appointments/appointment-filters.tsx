"use client"

import { SearchableSelect } from "@/components/shared/searchable-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface AppointmentFilterValues {
    doctorId?: string
    patientId?: string
    departmentId?: string
    status?: string
    startDate?: string
    endDate?: string
}

interface AppointmentFiltersProps {
    values: AppointmentFilterValues
    onChange: (values: AppointmentFilterValues) => void
    doctors: { id: string; name: string }[]
    patients: { id: string; name: string }[]
    departments: { id: string; name: string }[]
}

export function AppointmentFilters({ 
    values, 
    onChange, 
    doctors, 
    patients, 
    departments 
}: AppointmentFiltersProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
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
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Doctor</Label>
                <SearchableSelect
                    value={values.doctorId}
                    onChange={(val) => onChange({ ...values, doctorId: val })}
                    options={doctors.map(d => ({ id: d.id, name: d.name }))}
                    placeholder="All Doctors"
                    allLabel="All Doctors"
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Patient</Label>
                <SearchableSelect
                    value={values.patientId}
                    onChange={(val) => onChange({ ...values, patientId: val })}
                    options={patients.map(p => ({ id: p.id, name: p.name }))}
                    placeholder="All Patients"
                    allLabel="All Patients"
                />
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="no-show">No Show</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Start Date</Label>
                <Input 
                    type="date"
                    className="h-9 text-xs"
                    value={values.startDate}
                    onChange={(e) => onChange({ ...values, startDate: e.target.value })}
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">End Date</Label>
                <Input 
                    type="date"
                    className="h-9 text-xs"
                    value={values.endDate}
                    onChange={(e) => onChange({ ...values, endDate: e.target.value })}
                />
            </div>
        </div>
    )
}
