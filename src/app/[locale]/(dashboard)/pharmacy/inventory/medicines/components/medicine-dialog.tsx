"use client"

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { pharmacyService } from "@/services/pharmacy-service"
import { useStoreContext } from "@/store/use-store-context"
import { Medicine, MedicinePayload, PharmacyEntity, PharmacyEntityType } from "@/types/pharmacy"
import { Loader2, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { MasterDataDialog } from "../../../setup/components/master-data-dialog"

interface MedicineDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  medicineToEdit?: Medicine | null
}

export function MedicineDialog({
  open,
  onOpenChange,
  onSuccess,
  medicineToEdit
}: MedicineDialogProps) {
  const { activeStoreId } = useStoreContext()
  const [loading, setLoading] = useState(false)
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
    unitPrice: 0,
    salePrice: 0,
    mrp: 0,
    reorderLevel: 5,
    isActive: true,
    rackNumber: "",
    openingStock: 0,
    batchNumber: "",
    expiryDate: ""
  })

  // Master Data State
  const [categories, setCategories] = useState<PharmacyEntity[]>([])
  const [brands, setBrands] = useState<PharmacyEntity[]>([])
  const [groups, setGroups] = useState<PharmacyEntity[]>([])
  const [units, setUnits] = useState<PharmacyEntity[]>([])

  useEffect(() => {
    if (open) {
      loadMasterData()
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
          unitPrice: Number(medicineToEdit.unitPrice) || 0,
          salePrice: Number(medicineToEdit.salePrice) || 0,
          mrp: Number(medicineToEdit.mrp) || 0,
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
          unitPrice: 0,
          salePrice: 0,
          mrp: 0,
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

  const loadMasterData = async () => {
    try {
      setLoading(true)
      const [catRes, brandRes, groupRes, unitRes] = await Promise.all([
        pharmacyService.getEntities('categories', { limit: 100 }),
        pharmacyService.getEntities('brands', { limit: 100 }),
        pharmacyService.getEntities('groups', { limit: 100 }),
        pharmacyService.getEntities('units', { limit: 100 }),
      ])
      setCategories(catRes.data)
      setBrands(brandRes.data)
      setGroups(groupRes.data)
      setUnits(unitRes.data)
    } catch (error) {
      toast.error("Failed to load master data")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof MedicinePayload, value: any) => {
    let finalValue = value;
    if (['unitPrice', 'salePrice', 'mrp', 'reorderLevel', 'openingStock'].includes(field)) {
      finalValue = (value === "" || isNaN(value)) ? 0 : value;
    }
    setFormData(prev => ({ ...prev, [field]: finalValue }))
  }

  // Quick Add State
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddType, setQuickAddType] = useState<PharmacyEntityType>('brands')
  const [quickAddTitle, setQuickAddTitle] = useState("")

  const openQuickAdd = (type: PharmacyEntityType, title: string) => {
    setQuickAddType(type)
    setQuickAddTitle(title)
    setQuickAddOpen(true)
  }

  const handleQuickAddSuccess = () => {
    loadMasterData()
  }

  const handleSave = async () => {
    if (!formData.name || !formData.genericName || !formData.unit || !formData.categoryId || !formData.brandId) {
      toast.error("Required fields are missing")
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
        genericName: formData.genericName,
        unit: formData.unit || 'Pcs',
        categoryId: formData.categoryId,
        brandId: formData.brandId,
        nameBangla: formData.nameBangla || undefined,
        genericNameBangla: formData.genericNameBangla || undefined,
        barcode: formData.barcode || undefined,
        groupId: formData.groupId || undefined,
        medicineUnitId: formData.medicineUnitId || undefined,
        unitPrice: Number(formData.unitPrice) || 0,
        salePrice: Number(formData.salePrice) || 0,
        mrp: Number(formData.mrp) || 0,
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
        await pharmacyService.updateMedicine(medicineToEdit.id, payload as Partial<MedicinePayload>)
        toast.success("Medicine updated successfully")
      } else {
        await pharmacyService.createMedicine(payload)
        toast.success("Medicine created successfully")
      }
      onSuccess()
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
          <DialogTitle>{medicineToEdit ? "Edit Medicine" : "Register New Medicine"}</DialogTitle>
          <DialogDescription>
            Configure medicine details, pricing, and initial stock levels.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-2 min-h-0 custom-scrollbar">
          <div className="grid gap-6 pb-8">
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
                <Label htmlFor="genericName">Generic Name (English) *</Label>
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
            
            <div className="space-y-2">
                <Label htmlFor="unit">Base Unit (e.g. Pcs, Strip) *</Label>
                <Input 
                  id="unit" 
                  value={formData.unit} 
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  placeholder="e.g. Pcs"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Category *</Label>
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
                  <Label>Brand *</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-1 md:px-2 text-xs text-primary"
                    onClick={() => openQuickAdd('brands', 'Brand')}
                  >
                    <Plus className="h-3 w-3 md:mr-1" />
                    <span className="hidden md:inline">Add New</span>
                  </Button>
                </div>
                <Select 
                  value={formData.brandId} 
                  onValueChange={(v) => handleInputChange('brandId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Group</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-1 md:px-2 text-xs text-primary"
                    onClick={() => openQuickAdd('groups', 'Group')}
                  >
                    <Plus className="h-3 w-3 md:mr-1" />
                    <span className="hidden md:inline">Add New</span>
                  </Button>
                </div>
                <Select 
                  value={formData.groupId} 
                  onValueChange={(v) => handleInputChange('groupId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Medicine Type (Unit)</Label>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Unit Price</Label>
                <Input 
                  id="unitPrice" 
                  type="number" 
                  value={formData.unitPrice} 
                  onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price</Label>
                <Input 
                  id="salePrice" 
                  type="number" 
                  value={formData.salePrice} 
                  onChange={(e) => handleInputChange('salePrice', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mrp">MRP</Label>
                <Input 
                  id="mrp" 
                  type="number" 
                  value={formData.mrp} 
                  onChange={(e) => handleInputChange('mrp', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input 
                  id="reorderLevel" 
                  type="number" 
                  value={formData.reorderLevel} 
                  onChange={(e) => handleInputChange('reorderLevel', parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center space-x-2 pt-4 md:pt-8">
                <Switch 
                  id="isActive" 
                  checked={formData.isActive} 
                  onCheckedChange={(v) => handleInputChange('isActive', v)}
                />
                <Label htmlFor="isActive">Active for Sale</Label>
              </div>
            </div>

            {!medicineToEdit && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Initial Stock (Optional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="openingStock">Opening Stock</Label>
                    <Input 
                      id="openingStock" 
                      type="number" 
                      value={formData.openingStock} 
                      onChange={(e) => handleInputChange('openingStock', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batchNumber">Batch Number</Label>
                    <Input 
                      id="batchNumber" 
                      value={formData.batchNumber} 
                      onChange={(e) => handleInputChange('batchNumber', e.target.value)}
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
          </div>
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
        onSuccess={handleQuickAddSuccess}
        type={quickAddType}
        title={quickAddTitle}
      />
    </Dialog>
  )
}
