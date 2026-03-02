"use client"

import { SearchableSelect } from "@/components/shared/searchable-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBranches, useSuppliers } from "@/hooks/pharmacy-queries"
import { useDebounce } from "@/hooks/use-debounce"
import { PurchaseStatus } from "@/types/pharmacy"
import { useState } from "react"

export interface PurchaseFilterValues {
    search?: string
    branchId?: string
    supplierId?: string
    status?: PurchaseStatus | 'all'
}

interface PurchaseFiltersProps {
    values: PurchaseFilterValues
    onChange: (values: PurchaseFilterValues) => void
    onReset: () => void
}

export function PurchaseFilters({ values, onChange, onReset }: PurchaseFiltersProps) {
    // Search States for dropdowns
    const [branchSearch, setBranchSearch] = useState("")
    const [debouncedBranchSearch] = useDebounce(branchSearch, 500)
    const { data: branchesRes, isLoading: loadingBranches } = useBranches({ search: debouncedBranchSearch, limit: 20 })
    const branches = branchesRes?.data || []

    const [supplierSearch, setSupplierSearch] = useState("")
    const [debouncedSupplierSearch] = useDebounce(supplierSearch, 500)
    const { data: suppliersRes, isLoading: loadingSuppliers } = useSuppliers({ search: debouncedSupplierSearch, limit: 20 })
    const suppliers = suppliersRes?.data || []

    const handleFieldChange = (field: keyof PurchaseFilterValues, value: any) => {
        onChange({ ...values, [field]: value === 'all' ? undefined : value })
    }

    return (
        <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
                {/* Search Text Field */}
                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Search</Label>
                    <Input 
                        placeholder="PO Number or notes..." 
                        className="h-9 text-xs"
                        value={values.search || ""} 
                        onChange={(e) => handleFieldChange('search', e.target.value)} 
                    />
                </div>

                {/* Dropdowns */}
                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Branch</Label>
                    <SearchableSelect
                        value={values.branchId}
                        onChange={(val) => handleFieldChange('branchId', val)}
                        options={branches.map(b => ({ id: b.id, name: b.name }))}
                        placeholder="All Branches"
                        allLabel="All Branches"
                        loading={loadingBranches}
                        onSearchChange={setBranchSearch}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Supplier</Label>
                    <SearchableSelect
                        value={values.supplierId}
                        onChange={(val) => handleFieldChange('supplierId', val)}
                        options={suppliers.map(s => ({ id: s.id, name: s.name }))}
                        placeholder="All Suppliers"
                        allLabel="All Suppliers"
                        loading={loadingSuppliers}
                        onSearchChange={setSupplierSearch}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Status</Label>
                    <Select 
                        value={values.status || "all"} 
                        onValueChange={(v) => handleFieldChange('status', v)}
                    >
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
