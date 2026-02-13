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
import { useState } from "react"
import { toast } from "sonner"

interface PrescriptionLinkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLink: (prescriptionId: string) => void
}

export function PrescriptionLinkDialog({
  open,
  onOpenChange,
  onLink
}: PrescriptionLinkDialogProps) {
  const [prescriptionId, setPrescriptionId] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLink = () => {
    if (!prescriptionId.trim()) return

    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
        setIsLoading(false)
        onLink(prescriptionId)
        toast.success(`Prescription #${prescriptionId} linked successfully`)
        setPrescriptionId("")
        onOpenChange(false)
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Link Prescription</DialogTitle>
          <DialogDescription>
            Enter the Prescription ID to link it to this transaction.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pid" className="text-right">
              ID
            </Label>
            <Input
              id="pid"
              value={prescriptionId}
              onChange={(e) => setPrescriptionId(e.target.value)}
              placeholder="e.g. RX-12345"
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleLink} disabled={isLoading || !prescriptionId.trim()}>
            {isLoading ? "Linking..." : "Link Prescription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
