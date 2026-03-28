"use client"

import { SearchableSelect } from "@/components/shared/searchable-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AdmissionQueryParams, Patient } from "@/types/patient"
import { Bed } from "@/types/facility"

interface AdmissionFiltersProps {
    values: AdmissionQueryParams
    onChange: (values: AdmissionQueryParams) => void
    patients: Patient[]
    beds: Bed[]
}

export function AdmissionFilters({ values, onChange, patients, beds }: AdmissionFiltersProps) {
    const handleChange = (key: keyof AdmissionQueryParams, value: any) => {
        onChange({ ...values, [key]: value === "all" ? undefined : value })
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 pt-2">
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Select Patient</Label>
                <SearchableSelect 
                    value={values.patientId}
                    onChange={(val) => handleChange("patientId", val)}
                    options={patients.map(p => ({ id: p.id, name: `${p.name} (${p.phone})` }))}
                    placeholder="All Patients"
                    allLabel="All Patients"
                />
            </div>

            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Select Bed</Label>
                <SearchableSelect 
                    value={values.bedId}
                    onChange={(val) => handleChange("bedId", val)}
                    options={beds.map(b => ({ id: b.id, name: `${b.bedNumber} - ${b.section?.name}` }))}
                    placeholder="All Beds"
                    allLabel="All Beds"
                />
            </div>

            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Status</Label>
                <Select 
                    value={values.status || "all"} 
                    onValueChange={(val) => handleChange("status", val)}
                >
                    <SelectTrigger className="h-9 text-xs bg-muted/50 border-none focus:ring-1 focus:ring-primary/20">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="admitted">Admitted</SelectItem>
                        <SelectItem value="discharged">Discharged</SelectItem>
                        <SelectItem value="transferred">Transferred</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Start Date</Label>
                <Input 
                    type="date" 
                    className="h-9 text-xs bg-muted/50 border-none" 
                    value={values.startDate || ""}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                />
            </div>

            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">End Date</Label>
                <Input 
                    type="date" 
                    className="h-9 text-xs bg-muted/50 border-none" 
                    value={values.endDate || ""}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                />
            </div>
        </div>
    )
}
