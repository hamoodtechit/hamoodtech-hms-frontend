"use client"

import { SearchableSelect } from "@/components/shared/searchable-select"
import { Button } from "@/components/ui/button"
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
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCreateMedicine, useManufacturers, usePharmacyEntities, useUpdateMedicine } from "@/hooks/pharmacy-queries"
import { useDebounce } from "@/hooks/use-debounce"
import { useStoreContext } from "@/store/use-store-context"
import { Medicine, MedicinePayload, PharmacyEntityType } from "@/types/pharmacy"
import { Loader2 } from "lucide-react"
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
    genericId: "",
    genericNameBangla: "",
    barcode: "",
    unit: "",
    categoryId: "",
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
  const [categorySearch, setCategorySearch] = useState("")
  const [debouncedCategorySearch] = useDebounce(categorySearch, 500)

  const { data: categoriesRes, isLoading: loadingCategories } = usePharmacyEntities('categories', {
    search: debouncedCategorySearch,
    limit: 50
  })
  const categories = categoriesRes?.data || []

  const [genericSearch, setGenericSearch] = useState("")
  const [debouncedGenericSearch] = useDebounce(genericSearch, 500)

  const { data: genericsRes, isLoading: loadingGenerics } = usePharmacyEntities('generics', { 
    search: debouncedGenericSearch, 
    limit: 50 
  })
  const generics = genericsRes?.data || []

  const [groupSearch, setGroupSearch] = useState("")
  const [debouncedGroupSearch] = useDebounce(groupSearch, 500)

  const { data: groupsRes, isLoading: loadingGroups } = usePharmacyEntities('groups', {
    search: debouncedGroupSearch,
    limit: 50
  })
  const groups = groupsRes?.data || []

  const [unitSearch, setUnitSearch] = useState("")
  const [debouncedUnitSearch] = useDebounce(unitSearch, 500)

  const { data: unitsRes, isLoading: loadingUnits } = usePharmacyEntities('units', {
    search: debouncedUnitSearch,
    limit: 50
  })
  const units = unitsRes?.data || []

  const [manufacturerSearch, setManufacturerSearch] = useState("")
  const [debouncedManufacturerSearch] = useDebounce(manufacturerSearch, 500)

  const { data: manufacturersRes, isLoading: loadingManufacturers } = useManufacturers({
    search: debouncedManufacturerSearch,
    limit: 50
  })
  const manufacturers = manufacturersRes?.data || []

  const loading = loadingCategories || loadingGenerics || loadingGroups || loadingUnits || loadingManufacturers

  const createMutation = useCreateMedicine()
  const updateMutation = useUpdateMedicine()

  useEffect(() => {
    if (open) {
      if (medicineToEdit) {
        setFormData({
          name: medicineToEdit.name || "",
          nameBangla: medicineToEdit.nameBangla || "",
          genericId: medicineToEdit.genericId || "",
          genericNameBangla: medicineToEdit.genericNameBangla || "",
          barcode: medicineToEdit.barcode || "",
          unit: medicineToEdit.unit || "",
          categoryId: medicineToEdit.categoryId || "",
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
        setSelectedLabels({
          generic: medicineToEdit.generic?.name || "",
          category: medicineToEdit.category?.name || "",
          unit: medicineToEdit.medicineUnit?.name || "",
          manufacturer: medicineToEdit.medicineManufacturer?.name || ""
        })
      } else {
        setFormData({
          name: "",
          nameBangla: "",
          genericId: "",
          genericNameBangla: "",
          barcode: "",
          unit: "",
          categoryId: "",
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
        setSelectedLabels({
          generic: "",
          category: "",
          unit: "",
          manufacturer: ""
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
  const [quickAddType, setQuickAddType] = useState<PharmacyEntityType>('generics')
  const [quickAddTitle, setQuickAddTitle] = useState("")
  const [manufacturerSearchOpen, setManufacturerSearchOpen] = useState(false)
  const [genericSearchOpen, setGenericSearchOpen] = useState(false)
  const [categorySearchOpen, setCategorySearchOpen] = useState(false)
  const [unitSearchOpen, setUnitSearchOpen] = useState(false)

  // Track selected labels for searchable dropdowns to handle label disappearance on search-clear
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({
    generic: "",
    category: "",
    unit: "",
    manufacturer: ""
  })

  const openQuickAdd = (type: PharmacyEntityType, title: string) => {
    setQuickAddType(type)
    setQuickAddTitle(title)
    setQuickAddOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.dosageForm || !formData.genericId) {
      toast.error("Required fields are missing: Name, Generic, and Dosage Form are required")
      return
    }

    if (formData.openingStock && formData.openingStock > 0 && (!formData.batchNumber || !formData.expiryDate)) {
      toast.error("Batch number and Expiry date are required for opening stock")
      return
    }

    if (formData.salePrice && formData.mrp && formData.salePrice > formData.mrp) {
      toast.error("Sale price cannot be greater than MRP")
      return
    }

    if (formData.purchasePrice && formData.mrp && Number(formData.purchasePrice) > Number(formData.mrp)) {
      toast.error("Purchase Price cannot be greater than MRP")
      return
    }

    try {
      setSaving(true)
      
      const selectedGeneric = generics.find(g => g.id === formData.genericId);
      const selectedUnit = units.find(u => u.id === formData.medicineUnitId);

      // Sanitize payload: convert empty strings to undefined for optional fields
      const payload: any = {
        name: formData.name,
        genericId: formData.genericId || undefined,
        genericName: selectedGeneric?.name || "",
        unit: selectedUnit?.name || formData.unit || 'Pcs',
        categoryId: formData.categoryId || undefined,
        nameBangla: formData.nameBangla || undefined,
        genericNameBangla: formData.genericNameBangla || undefined,
        barcode: formData.barcode || undefined,
        groupId: formData.groupId || undefined,
        medicineUnitId: formData.medicineUnitId || undefined,
        medicineManufacturerId: formData.medicineManufacturerId || undefined,
        purchasePrice: Number(formData.purchasePrice || formData.unitPrice) || 0,
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
              {/* Medicine Name | Generic Name | Barcode — 3 columns inline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Medicine Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Medicine Name *</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g. Napa Extend"
                  />
                </div>

                {/* Generic Name */}
                <div className="space-y-2">
                  <Label htmlFor="genericId">Generic Name *</Label>
                  <SearchableSelect
                    value={formData.genericId}
                    onChange={(val) => handleInputChange('genericId', val)}
                    options={generics.map(g => ({ id: g.id, name: g.name }))}
                    placeholder="Select Generic..."
                    loading={loadingGenerics}
                    onSearchChange={setGenericSearch}
                    onAddClick={() => openQuickAdd('generics', 'Generic')}
                    addLabel="Create New Generic"
                    showAll={false}
                  />
                </div>

                {/* Barcode */}
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
                {/* Category */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <SearchableSelect
                    value={formData.categoryId}
                    onChange={(val) => handleInputChange('categoryId', val)}
                    options={categories.map(c => ({ id: c.id, name: c.name }))}
                    placeholder="Select Category"
                    loading={loadingCategories}
                    onSearchChange={setCategorySearch}
                    onAddClick={() => openQuickAdd('categories', 'Category')}
                    addLabel="Create New Category"
                    showAll={false}
                  />
                </div>

                {/* Unit */}
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <SearchableSelect
                    value={formData.medicineUnitId}
                    onChange={(val) => handleInputChange('medicineUnitId', val)}
                    options={units.map(u => ({ id: u.id, name: u.name }))}
                    placeholder="Select Unit Type"
                    loading={loadingUnits}
                    onSearchChange={setUnitSearch}
                    onAddClick={() => openQuickAdd('units', 'Unit')}
                    addLabel="Create New Unit"
                    showAll={false}
                  />
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
                  <Label>Manufacturer</Label>
                  <SearchableSelect
                    value={formData.medicineManufacturerId}
                    onChange={(val) => handleInputChange('medicineManufacturerId', val)}
                    options={manufacturers.map(m => ({ id: m.id, name: m.name }))}
                    placeholder="Select Manufacturer..."
                    loading={loadingManufacturers}
                    onSearchChange={setManufacturerSearch}
                    onAddClick={() => openQuickAdd('manufacturers', 'Manufacturer')}
                    addLabel="Create New Manufacturer"
                    showAll={false}
                  />
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
