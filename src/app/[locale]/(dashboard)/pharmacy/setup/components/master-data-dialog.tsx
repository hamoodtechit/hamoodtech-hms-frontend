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
import { pharmacyService } from "@/services/pharmacy-service"
import { PharmacyEntity, PharmacyEntityType } from "@/types/pharmacy"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface MasterDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  entityToEdit?: PharmacyEntity | null
  type: PharmacyEntityType
  title: string
}

export function MasterDataDialog({
  open,
  onOpenChange,
  onSuccess,
  entityToEdit,
  type,
  title
}: MasterDataDialogProps) {
  const [name, setName] = useState("")
  const [nameBangla, setNameBangla] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (entityToEdit) {
      setName(entityToEdit.name || "")
      setNameBangla(entityToEdit.nameBangla || "")
    } else {
      setName("")
      setNameBangla("")
    }
  }, [entityToEdit, open])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required")
      return
    }

    try {
      setSaving(true)
      const payload = { name, nameBangla }

      if (entityToEdit) {
        await pharmacyService.updateEntity(type, entityToEdit.id, payload)
        toast.success(`${title} updated successfully`)
      } else {
        await pharmacyService.createEntity(type, payload)
        toast.success(`${title} created successfully`)
      }
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error(`Failed to save ${title.toLowerCase()}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{entityToEdit ? `Edit ${title}` : `Add New ${title}`}</DialogTitle>
          <DialogDescription>
            Enter the details for the {title.toLowerCase()} here.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name (English)</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paracetamol"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nameBangla">Name (Bangla)</Label>
            <Input
              id="nameBangla"
              value={nameBangla}
              onChange={(e) => setNameBangla(e.target.value)}
              placeholder="যেমন: প্যারাসিটামল"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {entityToEdit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
