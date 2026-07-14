"use client"

import { SearchableSelect } from "@/components/shared/searchable-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useManufacturers, usePharmacyEntities } from "@/hooks/pharmacy-queries"
import { useDebounce } from "@/hooks/use-debounce"
import { useState } from "react"

export interface MedicineFilterValues {
    name?: string
    nameBangla?: string
    genericName?: string
    genericNameBangla?: string
    barcode?: string
    dosageForm?: string
    strength?: string
    categoryId?: string
    genericId?: string
    groupId?: string
    medicineManufacturerId?: string
    isActive?: boolean | string
    hasStock?: boolean | string
}

interface MedicineFiltersProps {
    values: MedicineFilterValues
    onChange: (values: MedicineFilterValues) => void
    onReset: () => void
    showActiveStatus?: boolean
}

export function MedicineFilters({ values, onChange, onReset, showActiveStatus = true }: MedicineFiltersProps) {
    // Search States
    const [catSearch, setCatSearch] = useState("")
    const [debouncedCatSearch] = useDebounce(catSearch, 500)
    const { data: categoriesRes, isLoading: loadingCats } = usePharmacyEntities('categories', { search: debouncedCatSearch, limit: 500 })
    const categories = categoriesRes?.data || []

    const [genSearch, setGenSearch] = useState("")
    const [debouncedGenSearch] = useDebounce(genSearch, 500)
    const { data: genericsRes, isLoading: loadingGens } = usePharmacyEntities('generics', { search: debouncedGenSearch, limit: 500 })
    const generics = genericsRes?.data || []

    const [grpSearch, setGrpSearch] = useState("")
    const [debouncedGrpSearch] = useDebounce(grpSearch, 500)
    const { data: groupsRes, isLoading: loadingGrps } = usePharmacyEntities('groups', { search: debouncedGrpSearch, limit: 500 })
    const groups = groupsRes?.data || []

    const [mfgSearch, setMfgSearch] = useState("")
    const [debouncedMfgSearch] = useDebounce(mfgSearch, 500)
    const { data: manufacturersRes, isLoading: loadingMfgs } = useManufacturers({ search: debouncedMfgSearch, limit: 500 })
    const manufacturers = manufacturersRes?.data || []

    const handleFieldChange = (field: keyof MedicineFilterValues, value: any) => {
        onChange({ ...values, [field]: value === 'all' ? undefined : value })
    }

    return (
        <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                {/* Search Text Fields */}
                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Medicine Name</Label>
                    <Input 
                        placeholder="Search by name..." 
                        className="h-9 text-xs"
                        value={values.name || ""} 
                        onChange={(e) => handleFieldChange('name', e.target.value)} 
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground text-emerald-700">নাম (বাংলা)</Label>
                    <Input 
                        placeholder="বাংলা নাম..." 
                        className="h-9 text-xs font-hindi"
                        value={values.nameBangla || ""} 
                        onChange={(e) => handleFieldChange('nameBangla', e.target.value)} 
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Barcode</Label>
                    <Input 
                        placeholder="Scan or type barcode..." 
                        className="h-9 text-xs font-mono"
                        value={values.barcode || ""} 
                        onChange={(e) => handleFieldChange('barcode', e.target.value)} 
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Generic Name</Label>
                    <Input 
                        placeholder="Search generic..." 
                        className="h-9 text-xs"
                        value={values.genericName || ""} 
                        onChange={(e) => handleFieldChange('genericName', e.target.value)} 
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground text-emerald-700">জেনেরিক নাম (বাংলা)</Label>
                    <Input 
                        placeholder="জেনেরিক বাংলা..." 
                        className="h-9 text-xs font-hindi"
                        value={values.genericNameBangla || ""} 
                        onChange={(e) => handleFieldChange('genericNameBangla', e.target.value)} 
                    />
                </div>

                {/* Dropdowns */}
                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Category</Label>
                    <SearchableSelect
                        value={values.categoryId}
                        onChange={(val) => handleFieldChange('categoryId', val)}
                        options={categories.map(c => ({ id: c.id, name: c.name }))}
                        placeholder="All Categories"
                        allLabel="All Categories"
                        loading={loadingCats}
                        onSearchChange={setCatSearch}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Generic</Label>
                    <SearchableSelect
                        value={values.genericId}
                        onChange={(val) => handleFieldChange('genericId', val)}
                        options={generics.map(g => ({ id: g.id, name: g.name }))}
                        placeholder="All Generics"
                        allLabel="All Generics"
                        loading={loadingGens}
                        onSearchChange={setGenSearch}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Group</Label>
                    <SearchableSelect
                        value={values.groupId}
                        onChange={(val) => handleFieldChange('groupId', val)}
                        options={groups.map(g => ({ id: g.id, name: g.name }))}
                        placeholder="All Groups"
                        allLabel="All Groups"
                        loading={loadingGrps}
                        onSearchChange={setGrpSearch}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Manufacturer</Label>
                    <SearchableSelect
                        value={values.medicineManufacturerId}
                        onChange={(val) => handleFieldChange('medicineManufacturerId', val)}
                        options={manufacturers.map(m => ({ id: m.id, name: m.name }))}
                        placeholder="All Manufacturers"
                        allLabel="All Manufacturers"
                        loading={loadingMfgs}
                        onSearchChange={setMfgSearch}
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Dosage Form</Label>
                    <Input 
                        placeholder="e.g. Tablet" 
                        className="h-9 text-xs"
                        value={values.dosageForm || ""} 
                        onChange={(e) => handleFieldChange('dosageForm', e.target.value)} 
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Strength</Label>
                    <Input 
                        placeholder="e.g. 500mg" 
                        className="h-9 text-xs"
                        value={values.strength || ""} 
                        onChange={(e) => handleFieldChange('strength', e.target.value)} 
                    />
                </div>
                {showActiveStatus && (
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold uppercase text-muted-foreground">Status</Label>
                        <Select 
                            value={values.isActive === undefined ? "all" : String(values.isActive)} 
                            onValueChange={(v) => handleFieldChange('isActive', v === 'all' ? undefined : v === 'true')}
                        >
                            <SelectTrigger className="h-9 text-xs">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent side="top">
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="true">Active Only</SelectItem>
                                <SelectItem value="false">Inactive Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Stock Availability</Label>
                    <Select 
                        value={values.hasStock === undefined ? "all" : String(values.hasStock)} 
                        onValueChange={(v) => handleFieldChange('hasStock', v === 'all' ? undefined : v === 'true')}
                    >
                        <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent side="top">
                            <SelectItem value="all">All Items</SelectItem>
                            <SelectItem value="true">In-Stock Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
