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
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { Textarea } from "@/components/ui/textarea"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { pharmacyService } from "@/services/pharmacy-service"
import { Stock } from "@/types/pharmacy"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface StockAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  stock: Stock | null
}

export function StockAdjustmentDialog({
  open,
  onOpenChange,
  onSuccess,
  stock
}: StockAdjustmentDialogProps) {
  const [saving, setSaving] = useState(false)
  const [quantity, setQuantity] = useState(0)
  const [type, setType] = useState<'increase' | 'decrease'>('increase')
  const [note, setNote] = useState("")
  const [recoverAmount, setRecoverAmount] = useState(0)
  const [accountId, setAccountId] = useState("")

  const { data: accountsRes } = useFinanceAccounts({ isActive: true })
  const accounts = accountsRes?.data || []

  const handleSave = async () => {
    if (!stock || quantity <= 0) {
      toast.error("Valid quantity is required")
      return
    }

    try {
      setSaving(true)
      await pharmacyService.adjustStock({
        stockId: stock.id,
        quantity,
        type,
        note,
        recoverAmount: recoverAmount || undefined,
        accountId: accountId || undefined
      })
      toast.success("Stock adjusted successfully")
      onSuccess()
      onOpenChange(false)
      setQuantity(0)
      setNote("")
      setRecoverAmount(0)
      setAccountId("")
    } catch (error) {
      toast.error("Failed to adjust stock")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
             Batch: {stock?.batchNumber} - Current: {stock?.quantity} {stock?.unit}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Adjustment Type</Label>
            <Select 
              value={type} 
              onValueChange={(v: 'increase' | 'decrease') => setType(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="increase">Increase Stock (+)</SelectItem>
                <SelectItem value="decrease">Decrease Stock (-)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <SmartNumberInput
              id="quantity"
              value={quantity || undefined}
              onChange={(val: number | undefined) => setQuantity(val || 0)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Reason / Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Physical count correction, damaged items..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label htmlFor="recoverAmount">Recover Amount</Label>
                <SmartNumberInput
                    id="recoverAmount"
                    value={recoverAmount || undefined}
                    onChange={(val) => setRecoverAmount(val || 0)}
                    placeholder="0.00"
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="account">Target Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger id="account">
                        <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                        {accounts.map(acc => (
                            <SelectItem key={acc.id} value={acc.id}>
                                {acc.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
