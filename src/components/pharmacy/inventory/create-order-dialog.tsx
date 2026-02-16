"use client"

import { SupplierDialog } from "@/components/pharmacy/inventory/supplier-dialog"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { pharmacyService } from "@/services/pharmacy-service"
import { useStoreContext } from "@/store/use-store-context"
import { Medicine, PurchaseItem, Supplier } from "@/types/pharmacy"
import { Check, ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react"
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
  
  // Combobox states
  const [openComboboxes, setOpenComboboxes] = useState<{ [key: number]: boolean }>({})

  // Create Supplier Dialog State
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false)
  const [status, setStatus] = useState<'pending' | 'completed'>('pending')

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

  const reloadSuppliers = async () => {
      try {
          const res = await pharmacyService.getSuppliers({ limit: 100 })
          setSuppliers(res.data)
          // If we just created a supplier, we might want to select it, 
          // but for now we'll just refresh the list so it appears.
      } catch (error) {
          console.error("Failed to reload suppliers", error)
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
      salePrice: 0, // Added salePrice
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
        newItems[index].salePrice = med.salePrice || 0 // Auto-fill salePrice
        newItems[index].unit = med.unit || "Piece"
      }
    }
    
    setPurchaseItems(newItems)
  }

  const toggleCombobox = (index: number, isOpen: boolean) => {
      setOpenComboboxes(prev => ({ ...prev, [index]: isOpen }))
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
      !item.expiryDate ||
      !item.batchNumber // Batch number is now required
    )
    if (invalidItem) {
      toast.error("Please fill all required details (Medicine, Qty, Expiry, Batch)")
      return
    }

    try {
      setLoading(true)
      
      const payload = {
        branchId: activeStoreId,
        supplierId: selectedSupplier,
        status: status,
        purchaseItems: purchaseItems.map(item => ({
          ...item,
          price: Number(item.price),
          mrp: Number(item.mrp),
          salePrice: Number(item.salePrice), // Include salePrice
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
    <>
        <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button variant="default">
                <Plus className="mr-2 h-4 w-4" /> Create Purchase
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col">
            <DialogHeader>
            <DialogTitle>Create Purchase</DialogTitle>
            <DialogDescription>
                Add a new purchase record to the system.
            </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4 overflow-hidden">
            <div className="grid gap-2">
                <Label>Supplier</Label>
                <div className="flex gap-2">
                    <Select onValueChange={setSelectedSupplier} value={selectedSupplier}>
                        <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select supplier..." />
                        </SelectTrigger>
                        <SelectContent>
                            {suppliers.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => setCreateSupplierOpen(true)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Status</Label>
                <Select onValueChange={(value: any) => setStatus(value)} value={status}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
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
                        <Popover open={openComboboxes[index]} onOpenChange={(isOpen) => toggleCombobox(index, isOpen)}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openComboboxes[index]}
                                className="w-full justify-between h-9 px-3 font-normal"
                                >
                                {item.medicineId
                                    ? medicines.find((medicine) => medicine.id === item.medicineId)?.name
                                    : "Select medicine..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search medicine..." />
                                    <CommandList>
                                        <CommandEmpty>No medicine found.</CommandEmpty>
                                        <CommandGroup>
                                        {medicines.map((medicine) => (
                                            <CommandItem
                                                key={medicine.id}
                                                value={medicine.name}
                                                onSelect={() => {
                                                    updateItem(index, { medicineId: medicine.id })
                                                    toggleCombobox(index, false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                    "mr-2 h-4 w-4",
                                                    item.medicineId === medicine.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex flex-col">
                                                    <span>{medicine.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">{medicine.genericName}</span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
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
                        <Label className="text-xs font-semibold">Purchase Price</Label>
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
                    {/* Added Sale Price Field */}
                    <div className="col-span-1 space-y-2">
                        <Label className="text-xs font-semibold">Sale</Label>
                        <Input 
                        type="number" 
                        className="h-9" 
                        value={item.salePrice} 
                        onChange={(e) => updateItem(index, { salePrice: parseFloat(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <Label className="text-xs font-semibold">Batch Number</Label>
                        <Input 
                        className="h-9" 
                        placeholder="Required" 
                        value={item.batchNumber} 
                        onChange={(e) => updateItem(index, { batchNumber: e.target.value })}
                        />
                    </div>
                    <div className="col-span-2 space-y-2">
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
                Create Purchase
            </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>

        <SupplierDialog 
            open={createSupplierOpen} 
            onOpenChange={setCreateSupplierOpen}
            onSuccess={reloadSuppliers}
        />
    </>
  )
}
