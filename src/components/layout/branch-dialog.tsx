"use client"

import { MediaPicker } from "@/components/media/media-picker"
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
import { Branch, BranchPayload } from "@/types/pharmacy"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface BranchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  branchToEdit?: Branch | null
}

export function BranchDialog({
  open,
  onOpenChange,
  onSuccess,
  branchToEdit
}: BranchDialogProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<BranchPayload>({
    name: "",
    nameBangla: "",
    address: "",
    phone: "",
    email: "",
    licenseNumber: "",
    taxRegistration: "",
  })

  useEffect(() => {
    if (open) {
      if (branchToEdit) {
        setFormData({
          name: branchToEdit.name || "",
          nameBangla: branchToEdit.nameBangla || "",
          address: branchToEdit.address || "",
          phone: branchToEdit.phone || "",
          email: branchToEdit.email || "",
          logoUrl: branchToEdit.logoUrl || "",
          licenseNumber: branchToEdit.licenseNumber || "",
          taxRegistration: branchToEdit.taxRegistration || "",
        })
      } else {
        setFormData({
          name: "",
          nameBangla: "",
          address: "",
          phone: "",
          email: "",
          logoUrl: "",
          licenseNumber: "",
          taxRegistration: "",
        })
      }
    }
  }, [open, branchToEdit])

  const handleInputChange = (field: keyof BranchPayload, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Branch name is required")
      return
    }

    try {
      setSaving(true)
      if (branchToEdit) {
        await pharmacyService.updateBranch(branchToEdit.id, formData)
        toast.success("Branch updated successfully")
      } else {
        await pharmacyService.createBranch(formData)
        toast.success("Branch created successfully")
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to save branch")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{branchToEdit ? "Edit Branch" : "Add New Branch"}</DialogTitle>
          <DialogDescription>
            Enter the details for the hospital branch here.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4 mt-4">
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center justify-center gap-4 mb-4">
              <div className="flex flex-col items-center gap-2">
                 <Label>Branch Logo</Label>
                 <MediaPicker 
                    value={formData.logoUrl}
                    onChange={(url) => setFormData(prev => ({ ...prev, logoUrl: url }))}
                 />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Branch Name (English) *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g. Dhaka Medical Center"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nameBangla">Branch Name (Bangla)</Label>
              <Input
                id="nameBangla"
                value={formData.nameBangla}
                onChange={(e) => handleInputChange('nameBangla', e.target.value)}
                placeholder="যেমন: ঢাকা মেডিকেল সেন্টার"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Full address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Contact number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                placeholder="Business license"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="taxRegistration">Tax Registration (TIN)</Label>
              <Input
                id="taxRegistration"
                value={formData.taxRegistration}
                onChange={(e) => handleInputChange('taxRegistration', e.target.value)}
                placeholder="Tax ID"
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
            {branchToEdit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
