"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { pharmacyService } from "@/services/pharmacy-service"
import { useStoreContext } from "@/store/use-store-context"
import { Medicine, PurchaseItem, Supplier } from "@/types/pharmacy"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function CreateOrderDialog() {
  const { activeStoreId } = useStoreContext()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([])

  const fetchInitialData = async () => {
    try {
      const [suppliersRes, medicinesRes] = await Promise.all([
        pharmacyService.getSuppliers({ limit: 100 }),
        pharmacyService.getMedicines({ limit: 100 })
      ])
      setSuppliers(suppliersRes.data)
      setMedicines(medicinesRes.data)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    }
  }

  useEffect(() => {
    if (open) {
      fetchInitialData()
      setPurchaseItems([])
      setSelectedSupplier("")
    }
  }, [open])

  const addItem = () => {
    setPurchaseItems([...purchaseItems, {
      medicineId: "",
      itemName: "",
      itemDescription: "",
      unit: "Piece",
      price: 0,
      mrp: 0,
      quantity: 1,
      batchNumber: "",
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }])
  }

  const removeItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, updates: Partial<PurchaseItem>) => {
    const newItems = [...purchaseItems]
    newItems[index] = { ...newItems[index], ...updates }
    
    // Auto-fill item name and prices if medicineId changed
    if (updates.medicineId) {
      const med = medicines.find(m => m.id === updates.medicineId)
      if (med) {
        newItems[index].itemName = med.name
        newItems[index].itemDescription = med.genericName || ""
        newItems[index].price = med.unitPrice || 0
        newItems[index].mrp = med.mrp || 0
        newItems[index].unit = med.unit || "Piece"
      }
    }
    
    setPurchaseItems(newItems)
  }

  const handleCreate = async () => {
    if (!activeStoreId) {
      toast.error("No active branch selected")
      return
    }
    if (!selectedSupplier) {
      toast.error("Please select a supplier")
      return
    }
    if (purchaseItems.length === 0) {
      toast.error("Please add at least one item")
      return
    }
    
    const invalidItem = purchaseItems.find(item => 
      !item.medicineId || 
      Number(item.quantity) <= 0 || 
      !item.expiryDate
    )
    if (invalidItem) {
      toast.error("Please fill all required details (Medicine, Qty, Expiry)")
      return
    }

    try {
      setLoading(true)
      
      const payload = {
        branchId: activeStoreId,
        supplierId: selectedSupplier,
        status: 'pending' as const,
        purchaseItems: purchaseItems.map(item => ({
          ...item,
          price: Number(item.price),
          mrp: Number(item.mrp),
          quantity: Number(item.quantity),
          expiryDate: new Date(item.expiryDate).toISOString()
        }))
      }

      console.log("Creating Purchase with payload:", payload)

      await pharmacyService.createPurchase(payload)
      toast.success("Purchase Order created successfully")
      setOpen(false)
      if (typeof window !== 'undefined') {
        window.location.reload()
      }
    } catch (error: any) {
      console.error("Failed to create purchase order:", error.response?.data)
      const message = error.response?.data?.message || "Failed to create purchase order"
      const details = error.response?.data?.errors 
        ? Object.entries(error.response.data.errors)
            .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
            .join(" | ")
        : (error.response?.data?.error || "")
      
      toast.error(`${message}${details ? `: ${details}` : ""}`, {
        duration: 8000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
            <Plus className="mr-2 h-4 w-4" /> Create Purchase Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Purchase Order</DialogTitle>
          <DialogDescription>
            Generate a new purchase order for restocking.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 overflow-hidden">
          <div className="grid gap-2">
            <Label>Supplier</Label>
            <Select onValueChange={setSelectedSupplier} value={selectedSupplier}>
                <SelectTrigger>
                    <SelectValue placeholder="Select supplier..." />
                </SelectTrigger>
                <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <Label className="text-base font-semibold">Items</Label>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>

          <ScrollArea className="flex-1 max-h-[400px] border rounded-md p-4">
            <div className="space-y-4">
              {purchaseItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end border-b pb-4 last:border-0 last:pb-0">
                  <div className="col-span-3 space-y-2">
                    <Label className="text-xs font-semibold">Medicine</Label>
                    <Select 
                      value={item.medicineId} 
                      onValueChange={(val) => updateItem(index, { medicineId: val })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {medicines.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label className="text-xs font-semibold">Qty</Label>
                    <Input 
                      type="number" 
                      className="h-9" 
                      value={item.quantity} 
                      onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label className="text-xs font-semibold">Price</Label>
                    <Input 
                      type="number" 
                      className="h-9" 
                      value={item.price} 
                      onChange={(e) => updateItem(index, { price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label className="text-xs font-semibold">MRP</Label>
                    <Input 
                      type="number" 
                      className="h-9" 
                      value={item.mrp} 
                      onChange={(e) => updateItem(index, { mrp: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="text-xs font-semibold">Batch # (Opt)</Label>
                    <Input 
                      className="h-9" 
                      placeholder="Batch" 
                      value={item.batchNumber} 
                      onChange={(e) => updateItem(index, { batchNumber: e.target.value })}
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <Label className="text-xs font-semibold">Expiry Date</Label>
                    <Input 
                      type="date"
                      className="h-9" 
                      value={item.expiryDate} 
                      onChange={(e) => updateItem(index, { expiryDate: e.target.value })}
                    />
                  </div>
                  <div className="col-span-1 pb-0.5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10" 
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {purchaseItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm italic">
                  No items added yet. Click "Add Item" to start.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
