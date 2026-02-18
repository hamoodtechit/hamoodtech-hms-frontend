"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { pharmacyService } from "@/services/pharmacy-service"
import { Sale, SaleReturnPayload } from "@/types/pharmacy"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface CreateReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sale: Sale | null
  onSuccess: () => void
}

export function CreateReturnDialog({ open, onOpenChange, sale, onSuccess }: CreateReturnDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({}) // Record<saleItemId, boolean>
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({}) // Record<saleItemId, quantity>

  if (!sale) return null

  const handleToggleItem = (itemId: string, checked: boolean) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: checked }))
    if (checked) {
      // Default to full quantity if not already set
      if (!returnQuantities[itemId]) {
        const item = sale.saleItems.find(i => i.id === itemId)
        if (item) {
          setReturnQuantities(prev => ({ ...prev, [itemId]: Number(item.quantity) }))
        }
      }
    } else {
        // Optional: clear quantity or keep it
    }
  }

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const item = sale.saleItems.find(i => i.id === itemId)
    if (!item) return
    
    const max = Number(item.quantity)
    const validQuantity = Math.min(Math.max(1, quantity), max) // constrain between 1 and max
    setReturnQuantities(prev => ({ ...prev, [itemId]: validQuantity }))
    
    // Auto-select if quantity is changed
    if (!selectedItems[itemId]) {
        setSelectedItems(prev => ({ ...prev, [itemId]: true }))
    }
  }

  const handleSubmit = async () => {
    const itemsToReturn = sale.saleItems.filter(item => selectedItems[item.id])
    
    if (itemsToReturn.length === 0) {
      toast.error("Please select at least one item to return")
      return
    }

    try {
      setLoading(true)
      
      const saleReturnItems = itemsToReturn.map(item => {
        const quantity = returnQuantities[item.id] || Number(item.quantity)
        const price = Number(item.price)
        
        return {
          medicineId: item.medicineId,
          itemName: item.itemName,
          itemDescription: item.itemDescription || undefined,
          unit: item.unit,
          price: price,
          mrp: Number(item.mrp),
          quantity: quantity,
          totalPrice: price * quantity,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate
        }
      })

      const payload: SaleReturnPayload = {
        saleId: sale.id,
        saleReturnItems
      }

      console.log('🔍 Sale Return Payload:', JSON.stringify(payload, null, 2))

      await pharmacyService.createSaleReturn(payload)

      toast.success("Return created successfully")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create return", error)
      toast.error("Failed to create return")
    } finally {
      setLoading(false)
    }
  }

  // Calculate total refund amount
  const totalRefund = sale.saleItems.reduce((sum, item) => {
    if (selectedItems[item.id]) {
      const qty = returnQuantities[item.id] || Number(item.quantity)
      return sum + (Number(item.price) * qty)
    }
    return sum
  }, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Return - {sale.invoiceNumber}</DialogTitle>
          <DialogDescription>
            Select items to return from this sale.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="border rounded-md max-h-[400px] overflow-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[200px]">Item</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Sold Qty</TableHead>
                  <TableHead>Return Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.saleItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox 
                        checked={!!selectedItems[item.id]}
                        onCheckedChange={(checked) => handleToggleItem(item.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                        <div className="font-medium truncate max-w-[200px]" title={item.itemName}>{item.itemName}</div>
                        <div className="text-xs text-muted-foreground truncate w-32" title={item.medicineId}>
                            ID: ...{item.medicineId.slice(-6)}
                        </div>
                    </TableCell>
                    <TableCell>{item.batchNumber}</TableCell>
                    <TableCell>{Number(item.quantity)} {item.unit}</TableCell>
                    <TableCell>
                        <SmartNumberInput 
                            min={1}
                            max={Number(item.quantity)}
                            className="w-16 h-8"
                            value={returnQuantities[item.id] || Number(item.quantity)}
                            onChange={(val) => handleQuantityChange(item.id, val || 0)}
                            disabled={!selectedItems[item.id]}
                        />
                    </TableCell>
                    <TableCell className="text-right">${Number(item.price).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                        ${(Number(item.price) * (returnQuantities[item.id] || Number(item.quantity))).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-4">
            <div className="text-lg font-bold">
                Total Refund: ${totalRefund.toFixed(2)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || totalRefund === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Process Return
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
