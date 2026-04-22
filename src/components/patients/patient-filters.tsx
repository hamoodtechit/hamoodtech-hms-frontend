"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PatientQueryParams } from "@/types/patient"

interface PatientFiltersProps {
    values: PatientQueryParams
    onChange: (values: PatientQueryParams) => void
    hideVisitType?: boolean
}

export function PatientFilters({ values, onChange, hideVisitType = false }: PatientFiltersProps) {
    const handleChange = (key: keyof PatientQueryParams, value: any) => {
        onChange({ ...values, [key]: value === "all" ? undefined : value })
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 pt-2">

            {/* Visit Type — only shown when not locked by the page */}
            {!hideVisitType && (
                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Visit Type</Label>
                    <Select
                        value={values.visitType || "all"}
                        onValueChange={(val) => handleChange("visitType", val)}
                    >
                        <SelectTrigger className="h-9 text-xs bg-muted/50 border-none focus:ring-1 focus:ring-primary/20">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="opd">OPD</SelectItem>
                            <SelectItem value="ipd">IPD</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Gender */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Gender</Label>
                <Select
                    value={values.gender || "all"}
                    onValueChange={(val) => handleChange("gender", val)}
                >
                    <SelectTrigger className="h-9 text-xs bg-muted/50 border-none focus:ring-1 focus:ring-primary/20">
                        <SelectValue placeholder="All Genders" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Genders</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Blood Group */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Blood Group</Label>
                <Select
                    value={values.bloodGroup || "all"}
                    onValueChange={(val) => handleChange("bloodGroup", val)}
                >
                    <SelectTrigger className="h-9 text-xs bg-muted/50 border-none focus:ring-1 focus:ring-primary/20">
                        <SelectValue placeholder="All Blood Groups" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Blood Groups</SelectItem>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Marital Status */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Marital Status</Label>
                <Select
                    value={values.maritalStatus || "all"}
                    onValueChange={(val) => handleChange("maritalStatus", val)}
                >
                    <SelectTrigger className="h-9 text-xs bg-muted/50 border-none focus:ring-1 focus:ring-primary/20">
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* District */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">District</Label>
                <Input
                    placeholder="e.g. Dhaka"
                    className="h-9 text-xs bg-muted/50 border-none"
                    value={values.district || ""}
                    onChange={(e) => handleChange("district", e.target.value || undefined)}
                />
            </div>

            {/* Occupation */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Occupation</Label>
                <Input
                    placeholder="e.g. Farmer"
                    className="h-9 text-xs bg-muted/50 border-none"
                    value={values.occupation || ""}
                    onChange={(e) => handleChange("occupation", e.target.value || undefined)}
                />
            </div>

            {/* Religion */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Religion</Label>
                <Input
                    placeholder="e.g. Islam"
                    className="h-9 text-xs bg-muted/50 border-none"
                    value={values.religion || ""}
                    onChange={(e) => handleChange("religion", e.target.value || undefined)}
                />
            </div>
        </div>
    )
}
