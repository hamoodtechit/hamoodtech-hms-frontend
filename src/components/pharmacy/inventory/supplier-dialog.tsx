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
import { ScrollArea } from "@/components/ui/scroll-area"
import { pharmacyService } from "@/services/pharmacy-service"
import { Supplier, SupplierPayload } from "@/types/pharmacy"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface SupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  supplierToEdit?: Supplier | null
}

export function SupplierDialog({
  open,
  onOpenChange,
  onSuccess,
  supplierToEdit
}: SupplierDialogProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<SupplierPayload>({
    name: "",
    nameBangla: "",
    address: "",
    phone: "",
    email: "",
  })

  useEffect(() => {
    if (open) {
      if (supplierToEdit) {
        setFormData({
          name: supplierToEdit.name || "",
          nameBangla: supplierToEdit.nameBangla || "",
          address: supplierToEdit.address || "",
          phone: supplierToEdit.phone || "",
          email: supplierToEdit.email || "",
        })
      } else {
        setFormData({
          name: "",
          nameBangla: "",
          address: "",
          phone: "",
          email: "",
        })
      }
    }
  }, [open, supplierToEdit])

  const handleInputChange = (field: keyof SupplierPayload, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Supplier name is required")
      return
    }
    if (!formData.address) {
      toast.error("Address is required")
      return
    }
    if (!formData.phone) {
      toast.error("Phone number is required")
      return
    }
    if (!formData.email) {
      toast.error("Email is required")
      return
    }

    try {
      setSaving(true)
      if (supplierToEdit) {
        await pharmacyService.updateSupplier(supplierToEdit.id, formData)
        toast.success("Supplier updated successfully")
      } else {
        await pharmacyService.createSupplier(formData)
        toast.success("Supplier created successfully")
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to save supplier")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{supplierToEdit ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
          <DialogDescription>
            Enter the details for the pharmacy supplier here.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4 mt-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="s-name">Supplier Name (English) *</Label>
              <Input
                id="s-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g. PharmaDist Inc"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-nameBangla">Supplier Name (Bangla)</Label>
              <Input
                id="s-nameBangla"
                value={formData.nameBangla}
                onChange={(e) => handleInputChange('nameBangla', e.target.value)}
                placeholder="যেমন: ফার্মাডিস্ট ইনক"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-address">Address *</Label>
              <Input
                id="s-address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Full address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-phone">Phone *</Label>
              <Input
                id="s-phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Contact number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="s-email">Email *</Label>
              <Input
                id="s-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Email address"
              />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {supplierToEdit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
