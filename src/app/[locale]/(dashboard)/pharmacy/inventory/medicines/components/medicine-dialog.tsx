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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCreateMedicine, useManufacturers, usePharmacyEntities, useUpdateMedicine } from "@/hooks/pharmacy-queries"
import { cn } from "@/lib/utils"
import { useStoreContext } from "@/store/use-store-context"
import { Medicine, MedicinePayload, PharmacyEntityType } from "@/types/pharmacy"
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { MasterDataDialog } from "../../../setup/components/master-data-dialog"
import { ImportMedicinesDialog } from "./import-medicines-dialog"

interface MedicineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  medicineToEdit?: Medicine | null
}

export function MedicineDialog({
  open,
  onOpenChange,
  medicineToEdit
}: MedicineDialogProps) {
  const { activeStoreId } = useStoreContext()
  const [saving, setSaving] = useState(false)
  
  // Form State
  const [formData, setFormData] = useState<Partial<MedicinePayload>>({
    name: "",
    nameBangla: "",
    genericName: "",
    genericNameBangla: "",
    barcode: "",
    unit: "",
    categoryId: "",
    brandId: "",
    groupId: "",
    medicineUnitId: "",
    medicineManufacturerId: "",
    unitPrice: 0,
    purchasePrice: 0,
    salePrice: 0,
    mrp: 0,
    dosageForm: "",
    strength: "",
    reorderLevel: 5,
    isActive: true,
    rackNumber: "",
    openingStock: 0,
    batchNumber: "",
    expiryDate: ""
  })

  // Data Fetching Hooks
  const { data: categoriesRes, isLoading: loadingCategories } = usePharmacyEntities('categories')
  const categories = categoriesRes?.data || []

  const { data: brandsRes, isLoading: loadingBrands } = usePharmacyEntities('brands')
  const brands = brandsRes?.data || []

  const { data: groupsRes, isLoading: loadingGroups } = usePharmacyEntities('groups')
  const groups = groupsRes?.data || []

  const { data: unitsRes, isLoading: loadingUnits } = usePharmacyEntities('units')
  const units = unitsRes?.data || []

  const { data: manufacturersRes, isLoading: loadingManufacturers } = useManufacturers()
  const manufacturers = manufacturersRes?.data || []

  const loading = loadingCategories || loadingBrands || loadingGroups || loadingUnits || loadingManufacturers

  const createMutation = useCreateMedicine()
  const updateMutation = useUpdateMedicine()

  useEffect(() => {
    if (open) {
      if (medicineToEdit) {
        setFormData({
          name: medicineToEdit.name || "",
          nameBangla: medicineToEdit.nameBangla || "",
          genericName: medicineToEdit.genericName || "",
          genericNameBangla: medicineToEdit.genericNameBangla || "",
          barcode: medicineToEdit.barcode || "",
          unit: medicineToEdit.unit || "",
          categoryId: medicineToEdit.categoryId || "",
          brandId: medicineToEdit.brandId || "",
          groupId: medicineToEdit.groupId || "",
          medicineUnitId: medicineToEdit.medicineUnitId || "",
          medicineManufacturerId: medicineToEdit.medicineManufacturerId || "",
          unitPrice: Number(medicineToEdit.unitPrice) || 0,
          purchasePrice: Number(medicineToEdit.purchasePrice) || 0,
          salePrice: Number(medicineToEdit.salePrice) || 0,
          mrp: Number(medicineToEdit.mrp) || 0,
          dosageForm: medicineToEdit.dosageForm || "",
          strength: medicineToEdit.strength || "",
          reorderLevel: Number(medicineToEdit.reorderLevel) || 5,
          isActive: medicineToEdit.isActive ?? true,
          rackNumber: medicineToEdit.rackNumber || "",
          openingStock: undefined,
          batchNumber: undefined,
          expiryDate: undefined
        })
      } else {
        setFormData({
          name: "",
          nameBangla: "",
          genericName: "",
          genericNameBangla: "",
          barcode: "",
          unit: "",
          categoryId: "",
          brandId: "",
          groupId: "",
          medicineUnitId: "",
          medicineManufacturerId: "",
          unitPrice: 0,
          purchasePrice: 0,
          salePrice: 0,
          mrp: 0,
          dosageForm: "",
          strength: "",
          reorderLevel: 5,
          isActive: true,
          rackNumber: "",
          openingStock: 0,
          batchNumber: "",
          expiryDate: ""
        })
      }
    }
  }, [open, medicineToEdit])

  const handleInputChange = (field: keyof MedicinePayload, value: any) => {
    let finalValue = value;
    if (['unitPrice', 'purchasePrice', 'salePrice', 'mrp', 'reorderLevel', 'openingStock'].includes(field)) {
      finalValue = (value === "" || isNaN(value)) ? 0 : value;
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }))
  }

  // Quick Add State
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [quickAddType, setQuickAddType] = useState<PharmacyEntityType>('brands')
  const [quickAddTitle, setQuickAddTitle] = useState("")
  const [manufacturerSearchOpen, setManufacturerSearchOpen] = useState(false)

  const openQuickAdd = (type: PharmacyEntityType, title: string) => {
    setQuickAddType(type)
    setQuickAddTitle(title)
    setQuickAddOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.dosageForm) {
      toast.error("Required fields are missing: Name and Dosage Form are required")
      return
    }

    if (formData.openingStock && formData.openingStock > 0 && !formData.batchNumber) {
      toast.error("Batch number is required for opening stock")
      return
    }

    if (formData.salePrice && formData.mrp && formData.salePrice > formData.mrp) {
      toast.error("Sale price cannot be greater than MRP")
      return
    }

    try {
      setSaving(true)
      
      // Sanitize payload: convert empty strings to undefined for optional fields
      const payload: any = {
        name: formData.name,
        genericName: formData.genericName || undefined,
        unit: formData.unit || 'Pcs',
        categoryId: formData.categoryId || undefined,
        brandId: formData.brandId || undefined,
        nameBangla: formData.nameBangla || undefined,
        genericNameBangla: formData.genericNameBangla || undefined,
        barcode: formData.barcode || undefined,
        groupId: formData.groupId || undefined,
        medicineUnitId: formData.medicineUnitId || undefined,
        medicineManufacturerId: formData.medicineManufacturerId || undefined,
        unitPrice: Number(formData.unitPrice) || 0,
        purchasePrice: Number(formData.purchasePrice) || 0,
        salePrice: Number(formData.salePrice) || 0,
        mrp: Number(formData.mrp) || 0,
        dosageForm: formData.dosageForm || undefined,
        strength: formData.strength || undefined,
        reorderLevel: Number(formData.reorderLevel) || 10,
        isActive: formData.isActive ?? true,
        rackNumber: formData.rackNumber || undefined,
      };

      // Add opening stock fields only if it's a new medicine
      if (!medicineToEdit) {
        if (formData.openingStock && formData.openingStock > 0) {
          payload.openingStock = Number(formData.openingStock);
          payload.batchNumber = formData.batchNumber || undefined;
          if (activeStoreId) {
            payload.branchId = activeStoreId;
          }
          if (formData.expiryDate) {
            // Backend expects ISO 8601 datetime string
            payload.expiryDate = new Date(formData.expiryDate).toISOString();
          }
        }
      }

      console.log("Submitting Optimized Medicine Payload:", payload);

      if (medicineToEdit) {
        await updateMutation.mutateAsync({ id: medicineToEdit.id, data: payload as Partial<MedicinePayload> })
        toast.success("Medicine updated successfully")
      } else {
        await createMutation.mutateAsync(payload)
        toast.success("Medicine created successfully")
      }
      onOpenChange(false)
    } catch (error: any) {
      console.error("Medicine Save Error Response:", error.response?.data)
      const message = error.response?.data?.message || "Validation failed"
      const details = error.response?.data?.errors 
        ? Object.values(error.response.data.errors).flat().join(", ") 
        : (error.response?.data?.error || "")
      
      toast.error(`${message}: ${details}`, {
        duration: 5000,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>{medicineToEdit ? "Edit Medicine" : "Register New Medicine"}</DialogTitle>
            {!medicineToEdit && (
                <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)} className="h-8">
                    <Loader2 className="mr-2 h-3 w-3 hidden" /> {/* Dummy hidden loader for layout stability if needed, using Upload here */}
                    <span className="flex items-center">Import Excel</span>
                </Button>
            )}
          </div>
          <DialogDescription>
            Configure medicine details, pricing, and initial stock levels.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-2 min-h-0 custom-scrollbar">
        <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList className="w-full justify-start h-12 bg-transparent p-0 gap-6">
              <TabsTrigger 
                value="info" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 h-12"
              >
                Product Information
              </TabsTrigger>
              <TabsTrigger 
                value="stock" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 h-12"
              >
                Stock & Storage
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 min-h-0 custom-scrollbar">
            <TabsContent value="info" className="mt-0 space-y-6 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Medicine Name (English) *</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g. Napa Extend"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nameBangla">Medicine Name (Bangla)</Label>
                  <Input 
                    id="nameBangla" 
                    value={formData.nameBangla} 
                    onChange={(e) => handleInputChange('nameBangla', e.target.value)}
                    placeholder="যেমন: নাপা এক্সটেন্ড"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="genericName">Generic Name (English)</Label>
                  <Input 
                    id="genericName" 
                    value={formData.genericName} 
                    onChange={(e) => handleInputChange('genericName', e.target.value)}
                    placeholder="e.g. Paracetamol"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genericNameBangla">Generic Name (Bangla)</Label>
                  <Input 
                    id="genericNameBangla" 
                    value={formData.genericNameBangla} 
                    onChange={(e) => handleInputChange('genericNameBangla', e.target.value)}
                    placeholder="যেমন: প্যারাসিটামল"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input 
                    id="barcode" 
                    value={formData.barcode} 
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    placeholder="Scan or enter barcode"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Category</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-1 md:px-2 text-xs text-primary"
                      onClick={() => openQuickAdd('categories', 'Category')}
                    >
                      <Plus className="h-3 w-3 md:mr-1" />
                      <span className="hidden md:inline">Add New</span>
                    </Button>
                  </div>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(v) => handleInputChange('categoryId', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Unit</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-1 md:px-2 text-xs text-primary"
                      onClick={() => openQuickAdd('units', 'Unit')}
                    >
                      <Plus className="h-3 w-3 md:mr-1" />
                      <span className="hidden md:inline">Add New</span>
                    </Button>
                  </div>
                  <Select 
                    value={formData.medicineUnitId} 
                    onValueChange={(v) => handleInputChange('medicineUnitId', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Unit Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dosageForm">Dosage Form *</Label>
                  <Input 
                    id="dosageForm" 
                    value={formData.dosageForm} 
                    onChange={(e) => handleInputChange('dosageForm', e.target.value)}
                    placeholder="e.g. Tablet, Syrup"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strength">Strength</Label>
                  <Input 
                    id="strength" 
                    value={formData.strength} 
                    onChange={(e) => handleInputChange('strength', e.target.value)}
                    placeholder="e.g. 500mg"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Manufacturer</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-1 md:px-2 text-xs text-primary"
                      onClick={() => openQuickAdd('manufacturers', 'Manufacturer')}
                    >
                      <Plus className="h-3 w-3 md:mr-1" />
                      <span className="hidden md:inline">Add New</span>
                    </Button>
                  </div>
                <Popover open={manufacturerSearchOpen} onOpenChange={setManufacturerSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={manufacturerSearchOpen}
                      className="w-full justify-between font-normal"
                    >
                      {formData.medicineManufacturerId
                        ? manufacturers.find((m) => m.id === formData.medicineManufacturerId)?.name
                        : "Select Manufacturer..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search manufacturer..." />
                      <CommandList>
                        <CommandEmpty>No manufacturer found.</CommandEmpty>
                        <CommandGroup>
                          {manufacturers.map((m) => (
                            <CommandItem
                              key={m.id}
                              value={m.name}
                              onSelect={() => {
                                handleInputChange('medicineManufacturerId', m.id)
                                setManufacturerSearchOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.medicineManufacturerId === m.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {m.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="hidden">
                    <Label htmlFor="unitPrice">Unit Price</Label>
                    <SmartNumberInput 
                        id="unitPrice" 
                        value={formData.unitPrice || undefined} 
                        onChange={(val: number | undefined) => handleInputChange('unitPrice', val)}
                    />
                  </div>
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <SmartNumberInput 
                    id="purchasePrice" 
                    value={formData.purchasePrice || undefined} 
                    onChange={(val: number | undefined) => handleInputChange('purchasePrice', val)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Sale Price</Label>
                  <SmartNumberInput 
                    id="salePrice" 
                    value={formData.salePrice || undefined} 
                    onChange={(val: number | undefined) => handleInputChange('salePrice', val)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mrp">MRP</Label>
                  <SmartNumberInput 
                    id="mrp" 
                    value={formData.mrp || undefined} 
                    onChange={(val: number | undefined) => handleInputChange('mrp', val)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  id="isActive" 
                  checked={formData.isActive} 
                  onCheckedChange={(v) => handleInputChange('isActive', v)}
                />
                <Label htmlFor="isActive">Active for Sale</Label>
              </div>
            </TabsContent>

            <TabsContent value="stock" className="mt-0 space-y-6 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <Label htmlFor="rackNumber">Rack / Self No.</Label>
                   <Input 
                     id="rackNumber" 
                     value={formData.rackNumber} 
                     onChange={(e) => handleInputChange('rackNumber', e.target.value)}
                     placeholder="e.g. A-12"
                   />
                </div>
              </div>

              {!medicineToEdit && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Opening Stock Details</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="openingStock">Opening Stock (Qty)</Label>
                      <SmartNumberInput 
                        id="openingStock" 
                        value={formData.openingStock || undefined} 
                        onChange={(val: number | undefined) => handleInputChange('openingStock', val)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="batchNumber">
                          Batch Number
                          {formData.openingStock && formData.openingStock > 0 ? <span className="text-destructive ml-1">*</span> : ""}
                      </Label>
                      <Input 
                        id="batchNumber" 
                        value={formData.batchNumber} 
                        onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                        required={!!(formData.openingStock && formData.openingStock > 0)}
                        placeholder="Batch Number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input 
                        id="expiryDate" 
                        type="date" 
                        value={formData.expiryDate} 
                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {medicineToEdit && (
                <div className="p-8 text-center border-2 border-dashed rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">
                    Opening stock can only be set during medicine registration. 
                    Use the Stock In/Out or Purchase features to update current inventory levels.
                  </p>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
        </div>

        <DialogFooter className="p-6 pt-2 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {(saving || loading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {medicineToEdit ? "Update Medicine" : "Register Medicine"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <MasterDataDialog
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        type={quickAddType}
        title={quickAddTitle}
      />
      
      <ImportMedicinesDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </Dialog>
  )
}
