"use client"

import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useManufacturers, usePharmacyEntities } from "@/hooks/pharmacy-queries"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"
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
    const { data: categoriesRes, isLoading: loadingCats } = usePharmacyEntities('categories', { search: debouncedCatSearch, limit: 20 })
    const categories = categoriesRes?.data || []

    const [genSearch, setGenSearch] = useState("")
    const [debouncedGenSearch] = useDebounce(genSearch, 500)
    const { data: genericsRes, isLoading: loadingGens } = usePharmacyEntities('generics', { search: debouncedGenSearch, limit: 20 })
    const generics = genericsRes?.data || []

    const [grpSearch, setGrpSearch] = useState("")
    const [debouncedGrpSearch] = useDebounce(grpSearch, 500)
    const { data: groupsRes, isLoading: loadingGrps } = usePharmacyEntities('groups', { search: debouncedGrpSearch, limit: 20 })
    const groups = groupsRes?.data || []

    const [mfgSearch, setMfgSearch] = useState("")
    const [debouncedMfgSearch] = useDebounce(mfgSearch, 500)
    const { data: manufacturersRes, isLoading: loadingMfgs } = useManufacturers({ search: debouncedMfgSearch, limit: 20 })
    const manufacturers = manufacturersRes?.data || []

    // Popover Open States
    const [openCat, setOpenCat] = useState(false)
    const [openGen, setOpenGen] = useState(false)
    const [openGrp, setOpenGrp] = useState(false)
    const [openMfg, setOpenMfg] = useState(false)

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
                    <Popover open={openCat} onOpenChange={setOpenCat}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-full h-9 justify-between text-xs font-normal"
                            >
                                {values.categoryId 
                                    ? categories.find(c => c.id === values.categoryId)?.name || "Category Selected" 
                                    : "All Categories"}
                                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                            <Command shouldFilter={false}>
                                <CommandInput 
                                    placeholder="Search category..." 
                                    value={catSearch}
                                    onValueChange={setCatSearch}
                                />
                                <CommandList>
                                    {loadingCats ? (
                                        <div className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                                        </div>
                                    ) : (
                                        <>
                                            <CommandEmpty className="p-2 text-xs text-muted-foreground">No category found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="all"
                                                    onSelect={() => {
                                                        handleFieldChange('categoryId', 'all')
                                                        setOpenCat(false)
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-3 w-3", !values.categoryId ? "opacity-100" : "opacity-0")} />
                                                    All Categories
                                                </CommandItem>
                                                {categories.map((c) => (
                                                    <CommandItem
                                                        key={c.id}
                                                        value={c.id}
                                                        onSelect={() => {
                                                            handleFieldChange('categoryId', c.id)
                                                            setOpenCat(false)
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-3 w-3", values.categoryId === c.id ? "opacity-100" : "opacity-0")} />
                                                        {c.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </>
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Generic</Label>
                    <Popover open={openGen} onOpenChange={setOpenGen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-full h-9 justify-between text-xs font-normal"
                            >
                                {values.genericId 
                                    ? generics.find(g => g.id === values.genericId)?.name || "Generic Selected" 
                                    : "All Generics"}
                                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                            <Command shouldFilter={false}>
                                <CommandInput 
                                    placeholder="Search generic..." 
                                    value={genSearch}
                                    onValueChange={setGenSearch}
                                />
                                <CommandList>
                                    {loadingGens ? (
                                        <div className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                                        </div>
                                    ) : (
                                        <>
                                            <CommandEmpty className="p-2 text-xs text-muted-foreground">No generic found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="all"
                                                    onSelect={() => {
                                                        handleFieldChange('genericId', 'all')
                                                        setOpenGen(false)
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-3 w-3", !values.genericId ? "opacity-100" : "opacity-0")} />
                                                    All Generics
                                                </CommandItem>
                                                {generics.map((g) => (
                                                    <CommandItem
                                                        key={g.id}
                                                        value={g.id}
                                                        onSelect={() => {
                                                            handleFieldChange('genericId', g.id)
                                                            setOpenGen(false)
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-3 w-3", values.genericId === g.id ? "opacity-100" : "opacity-0")} />
                                                        {g.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </>
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Group</Label>
                    <Popover open={openGrp} onOpenChange={setOpenGrp}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-full h-9 justify-between text-xs font-normal"
                            >
                                {values.groupId 
                                    ? groups.find(g => g.id === values.groupId)?.name || "Group Selected" 
                                    : "All Groups"}
                                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                            <Command shouldFilter={false}>
                                <CommandInput 
                                    placeholder="Search group..." 
                                    value={grpSearch}
                                    onValueChange={setGrpSearch}
                                />
                                <CommandList>
                                    {loadingGrps ? (
                                        <div className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                                        </div>
                                    ) : (
                                        <>
                                            <CommandEmpty className="p-2 text-xs text-muted-foreground">No group found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="all"
                                                    onSelect={() => {
                                                        handleFieldChange('groupId', 'all')
                                                        setOpenGrp(false)
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-3 w-3", !values.groupId ? "opacity-100" : "opacity-0")} />
                                                    All Groups
                                                </CommandItem>
                                                {groups.map((g) => (
                                                    <CommandItem
                                                        key={g.id}
                                                        value={g.id}
                                                        onSelect={() => {
                                                            handleFieldChange('groupId', g.id)
                                                            setOpenGrp(false)
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-3 w-3", values.groupId === g.id ? "opacity-100" : "opacity-0")} />
                                                        {g.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </>
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[11px] font-bold uppercase text-muted-foreground">Manufacturer</Label>
                    <Popover open={openMfg} onOpenChange={setOpenMfg}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-full h-9 justify-between text-xs font-normal"
                            >
                                {values.medicineManufacturerId 
                                    ? manufacturers.find(m => m.id === values.medicineManufacturerId)?.name || "Manufacturer Selected" 
                                    : "All Manufacturers"}
                                <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0" align="start">
                            <Command shouldFilter={false}>
                                <CommandInput 
                                    placeholder="Search manufacturer..." 
                                    value={mfgSearch}
                                    onValueChange={setMfgSearch}
                                />
                                <CommandList>
                                    {loadingMfgs ? (
                                        <div className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                                        </div>
                                    ) : (
                                        <>
                                            <CommandEmpty className="p-2 text-xs text-muted-foreground">No manufacturer found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="all"
                                                    onSelect={() => {
                                                        handleFieldChange('medicineManufacturerId', 'all')
                                                        setOpenMfg(false)
                                                    }}
                                                >
                                                    <Check className={cn("mr-2 h-3 w-3", !values.medicineManufacturerId ? "opacity-100" : "opacity-0")} />
                                                    All Manufacturers
                                                </CommandItem>
                                                {manufacturers.map((m) => (
                                                    <CommandItem
                                                        key={m.id}
                                                        value={m.id}
                                                        onSelect={() => {
                                                            handleFieldChange('medicineManufacturerId', m.id)
                                                            setOpenMfg(false)
                                                        }}
                                                    >
                                                        <Check className={cn("mr-2 h-3 w-3", values.medicineManufacturerId === m.id ? "opacity-100" : "opacity-0")} />
                                                        {m.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </>
                                    )}
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
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
