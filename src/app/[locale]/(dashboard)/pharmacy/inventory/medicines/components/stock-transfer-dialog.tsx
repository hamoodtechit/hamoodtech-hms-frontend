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
import { Textarea } from "@/components/ui/textarea"
import { pharmacyService } from "@/services/pharmacy-service"
import { PharmacyEntity, Stock } from "@/types/pharmacy"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface StockTransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  stock: Stock | null
}

export function StockTransferDialog({
  open,
  onOpenChange,
  onSuccess,
  stock
}: StockTransferDialogProps) {
  const [saving, setSaving] = useState(false)
  const [quantity, setQuantity] = useState(0)
  const [branchId, setBranchId] = useState("")
  const [note, setNote] = useState("")
  const [branches, setBranches] = useState<PharmacyEntity[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)

  useEffect(() => {
    if (open) {
      loadBranches()
    }
  }, [open])

  const loadBranches = async () => {
    try {
      setLoadingBranches(true)
      const res = await pharmacyService.getEntities('branches')
      setBranches(res.data)
    } catch (error) {
      console.error("Failed to load branches")
    } finally {
      setLoadingBranches(false)
    }
  }

  const handleSave = async () => {
    if (!stock || !branchId || quantity <= 0) {
      toast.error("Valid quantity and branch are required")
      return
    }

    if (quantity > (stock.quantity || 0)) {
        toast.error("Insufficient stock for transfer")
        return
    }

    try {
      setSaving(true)
      await pharmacyService.transferStock({
        stockId: stock.id,
        toBranchId: branchId,
        quantity,
        note
      })
      toast.success("Stock transfer initiated successfully")
      onSuccess()
      onOpenChange(false)
      setQuantity(0)
      setNote("")
      setBranchId("")
    } catch (error) {
      toast.error("Failed to transfer stock")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Transfer Stock</DialogTitle>
          <DialogDescription>
            Batch: {stock?.batchNumber} - Available: {stock?.quantity || 0} {stock?.unit}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Target Branch</Label>
            <Select 
              value={branchId} 
              onValueChange={setBranchId}
              disabled={loadingBranches}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingBranches ? "Loading branches..." : "Select Destination"} />
              </SelectTrigger>
              <SelectContent>
                {branches.filter(b => b.id !== stock?.branchId).map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quantity">Transfer Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value))}
              max={stock?.quantity || 100}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Transaction Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Emergency replenishment..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Initiate Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
