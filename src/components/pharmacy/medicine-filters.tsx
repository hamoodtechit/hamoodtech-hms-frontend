"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useManufacturers, usePharmacyEntities } from "@/hooks/pharmacy-queries"
import { X } from "lucide-react"

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
}

interface MedicineFiltersProps {
    values: MedicineFilterValues
    onChange: (values: MedicineFilterValues) => void
    onReset: () => void
    showActiveStatus?: boolean
}

export function MedicineFilters({ values, onChange, onReset, showActiveStatus = true }: MedicineFiltersProps) {
    const { data: categoriesRes } = usePharmacyEntities('categories')
    const { data: genericsRes } = usePharmacyEntities('generics')
    const { data: groupsRes } = usePharmacyEntities('groups')
    const { data: manufacturersRes } = useManufacturers()

    const categories = categoriesRes?.data || []
    const generics = genericsRes?.data || []
    const groups = groupsRes?.data || []
    const manufacturers = manufacturersRes?.data || []

    const handleFieldChange = (field: keyof MedicineFilterValues, value: any) => {
        onChange({ ...values, [field]: value === 'all' ? undefined : value })
    }

    return (
        <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b pb-2 mb-2">
                <h4 className="font-semibold text-sm uppercase tracking-wider">Advanced Filters</h4>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onReset} 
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
                >
                    <X className="h-3 w-3" />
                    Reset All
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">
                {/* Search Text Fields */}
                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Medicine Name</Label>
                    <Input 
                        placeholder="Search by name..." 
                        className="h-9 text-sm"
                        value={values.name || ""} 
                        onChange={(e) => handleFieldChange('name', e.target.value)} 
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground text-emerald-700">নাম (বাংলা)</Label>
                    <Input 
                        placeholder="বাংলা নাম দিয়ে খুঁজুন..." 
                        className="h-9 text-sm font-hindi"
                        value={values.nameBangla || ""} 
                        onChange={(e) => handleFieldChange('nameBangla', e.target.value)} 
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Barcode</Label>
                    <Input 
                        placeholder="Scan or type barcode..." 
                        className="h-9 text-sm font-mono"
                        value={values.barcode || ""} 
                        onChange={(e) => handleFieldChange('barcode', e.target.value)} 
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Generic Name</Label>
                    <Input 
                        placeholder="Search generic..." 
                        className="h-9 text-sm"
                        value={values.genericName || ""} 
                        onChange={(e) => handleFieldChange('genericName', e.target.value)} 
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground text-emerald-700">জেনেরিক নাম (বাংলা)</Label>
                    <Input 
                        placeholder="বাংলা নাম দিয়ে খুঁজুন..." 
                        className="h-9 text-sm font-hindi"
                        value={values.genericNameBangla || ""} 
                        onChange={(e) => handleFieldChange('genericNameBangla', e.target.value)} 
                    />
                </div>

                {/* Dropdowns */}
                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Category</Label>
                    <Select 
                        value={values.categoryId || "all"} 
                        onValueChange={(v) => handleFieldChange('categoryId', v)}
                    >
                        <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Generic</Label>
                    <Select 
                        value={values.genericId || "all"} 
                        onValueChange={(v) => handleFieldChange('genericId', v)}
                    >
                        <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All Generics" />
                        </SelectTrigger>
                        <SelectContent side="top">
                            <SelectItem value="all">All Generics</SelectItem>
                            {generics.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Group</Label>
                    <Select 
                        value={values.groupId || "all"} 
                        onValueChange={(v) => handleFieldChange('groupId', v)}
                    >
                        <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All Groups" />
                        </SelectTrigger>
                        <SelectContent side="top">
                            <SelectItem value="all">All Groups</SelectItem>
                            {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Manufacturer</Label>
                    <Select 
                        value={values.medicineManufacturerId || "all"} 
                        onValueChange={(v) => handleFieldChange('medicineManufacturerId', v)}
                    >
                        <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="All Manufacturers" />
                        </SelectTrigger>
                        <SelectContent side="top">
                            <SelectItem value="all">All Manufacturers</SelectItem>
                            {manufacturers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Dosage Form</Label>
                    <Input 
                        placeholder="e.g. Tablet" 
                        className="h-9 text-sm"
                        value={values.dosageForm || ""} 
                        onChange={(e) => handleFieldChange('dosageForm', e.target.value)} 
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Strength</Label>
                    <Input 
                        placeholder="e.g. 500mg" 
                        className="h-9 text-sm"
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
                            <SelectTrigger className="h-9 text-sm">
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
            </div>
        </div>
    )
}
