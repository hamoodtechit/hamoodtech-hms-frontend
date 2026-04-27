"use client"

import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { useUsers } from "@/hooks/user-queries"
import { AuditLogQueryParams } from "@/types/audit-log"
import { DateRange } from "react-day-picker"
import { useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"

interface AuditLogFiltersProps {
    values: AuditLogQueryParams
    onChange: (values: AuditLogQueryParams) => void
    dateRange: DateRange | undefined
    setDateRange: (range: DateRange | undefined) => void
}

export function AuditLogFilters({ 
    values, 
    onChange, 
    dateRange, 
    setDateRange 
}: AuditLogFiltersProps) {
    const [userSearch, setUserSearch] = useState("")
    const [debouncedUserSearch] = useDebounce(userSearch, 500)
    
    const { data: usersRes, isLoading: loadingUsers } = useUsers({ 
        search: debouncedUserSearch, 
        limit: 20 
    })
    const users = usersRes?.data || []

    const handleChange = (key: keyof AuditLogQueryParams, value: any) => {
        onChange({ ...values, [key]: value === "all" ? undefined : value })
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-2">
            {/* Module Filter */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Module</Label>
                <Select 
                    value={values.module || "all"} 
                    onValueChange={(val) => handleChange("module", val)}
                >
                    <SelectTrigger className="h-10 rounded-xl bg-muted/50 border-none focus:ring-primary/20">
                        <SelectValue placeholder="All Modules" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Modules</SelectItem>
                        <SelectItem value="Medicine">Medicine</SelectItem>
                        <SelectItem value="User">User</SelectItem>
                        <SelectItem value="Patient">Patient</SelectItem>
                        <SelectItem value="Sale">Sale</SelectItem>
                        <SelectItem value="Purchase">Purchase</SelectItem>
                        <SelectItem value="Appointment">Appointment</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Action Filter */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Action</Label>
                <Select 
                    value={values.action || "all"} 
                    onValueChange={(val) => handleChange("action", val)}
                >
                    <SelectTrigger className="h-10 rounded-xl bg-muted/50 border-none focus:ring-primary/20">
                        <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="CREATE">Create</SelectItem>
                        <SelectItem value="UPDATE">Update</SelectItem>
                        <SelectItem value="DELETE">Delete</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* User Filter */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">User / Performer</Label>
                <SearchableSelect
                    value={values.userId}
                    onChange={(val) => handleChange("userId", val)}
                    options={users.map(u => ({ id: u.id, name: u.fullName || u.username }))}
                    placeholder="All Users"
                    allLabel="All Users"
                    loading={loadingUsers}
                    onSearchChange={setUserSearch}
                />
            </div>

            {/* Date Range Filter */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground">Date Range</Label>
                <DatePickerWithRange 
                    date={dateRange}
                    setDate={setDateRange}
                    className="w-full"
                />
            </div>
        </div>
    )
}
