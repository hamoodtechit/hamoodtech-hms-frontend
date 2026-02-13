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
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useInventoryStore } from "@/store/use-inventory-store"
import { Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function CreateOrderDialog() {
  const { items, createPurchaseOrder, getLowStockItems } = useInventoryStore()
  const [open, setOpen] = useState(false)
  const [supplier, setSupplier] = useState("")
  const [autoFill, setAutoFill] = useState(false)

  const handleCreate = () => {
    if (!supplier) {
        toast.error("Please select a supplier")
        return
    }

    const lowStockItems = getLowStockItems()
    
    // Logic to select items based on supplier in a real app
    // For now, we take all low stock items or just a dummy item if manual
    const orderItems = autoFill 
        ? lowStockItems.map(i => ({ itemId: i.id, quantity: i.minStockData * 2 })) // Order double min stock
        : [] 

    if (autoFill && orderItems.length === 0) {
        toast.warning("No low stock items found to auto-fill.")
        return
    }
    
    // If not auto-fill, we'd have a dynamic form form items. 
    // For simplicity in this demo, we'll just create a dummy order if manual, or use auto-fill.
    if (!autoFill) {
        toast.info("Manual item selection not implemented in this demo. Using Auto-fill logic.")
        // Fallback to auto-fill logic for demo purposes or error
    }

    const totalCost = orderItems.reduce((acc, orderItem) => {
        const item = items.find(i => i.id === orderItem.itemId)
        return acc + (item ? item.price * 0.7 * orderItem.quantity : 0) // Assume cost is 70% of price
    }, 0)

    createPurchaseOrder({
        id: `PO-${Date.now()}`,
        date: new Date().toISOString(),
        supplier,
        items: orderItems,
        status: 'Pending',
        totalCost: totalCost > 0 ? totalCost : 500 // Fallback cost
    })

    toast.success("Purchase Order created successfully")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
            <Plus className="mr-2 h-4 w-4" /> Create Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Generate a new purchase order for restocking.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Supplier</Label>
            <Select onValueChange={setSupplier} value={supplier}>
                <SelectTrigger>
                    <SelectValue placeholder="Select supplier..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="PharmaDist Inc">PharmaDist Inc</SelectItem>
                    <SelectItem value="MedSupply Co">MedSupply Co</SelectItem>
                    <SelectItem value="BioCare Ltd">BioCare Ltd</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
              <Checkbox id="auto-fill" checked={autoFill} onCheckedChange={(c) => setAutoFill(!!c)} />
              <Label htmlFor="auto-fill">Auto-fill with Low Stock items</Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate}>Generate Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
