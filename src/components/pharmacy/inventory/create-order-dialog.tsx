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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { useCreatePurchase, useMedicines, useSuppliers } from "@/hooks/pharmacy-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { PaymentMethod, PurchaseItem } from "@/types/pharmacy"
import { Banknote, Check, ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function CreateOrderDialog() {
  const { activeStoreId } = useStoreContext()
  const [open, setOpen] = useState(false)
  const [medicineSearch, setMedicineSearch] = useState("")
  const [debouncedMedicineSearch] = useDebounce(medicineSearch, 500)
  
  const { data: suppliersRes } = useSuppliers({ limit: 200 })
  const { data: medicinesRes, isFetching: loadingMedicines } = useMedicines({ search: debouncedMedicineSearch, limit: 100 })
  const { finance, fetchSettings } = useSettingsStore()
  const { formatCurrency } = useCurrency()
  
  const suppliers = suppliersRes?.data || []
  const medicines = medicinesRes?.data || []

  const createMutation = useCreatePurchase()
  const loading = createMutation.isPending

  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [paidAmount, setPaidAmount] = useState(0)
  
  // Combobox states
  const [openComboboxes, setOpenComboboxes] = useState<{ [key: number]: boolean }>({})
  const [openSupplierCombobox, setOpenSupplierCombobox] = useState(false)

  // Create Supplier Dialog State
  const [createSupplierOpen, setCreateSupplierOpen] = useState(false)
  const [status, setStatus] = useState<'pending' | 'completed'>('pending')

  useEffect(() => {
    fetchSettings()
  }, [])

  // Calculations
  const subtotal = purchaseItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0)
  const total = subtotal // Add tax/discount logic here if needed in future

  // Sync paidAmount with total when total changes if status is completed
  useEffect(() => {
    if (status === 'completed') {
        setPaidAmount(total)
    }
  }, [total, status])

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
    setPurchaseItems(newItems)
  }

  const toggleCombobox = (index: number, isOpen: boolean) => {
      setOpenComboboxes(prev => ({ ...prev, [index]: isOpen }))
      if (isOpen) {
          setMedicineSearch("") // Reset search term when opening a new line's selector
      }
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
      const dueAmount = Math.max(0, total - paidAmount)
      
      const payload = {
        branchId: activeStoreId,
        supplierId: selectedSupplier,
        status: status,
        paymentMethod,
        paidAmount,
        dueAmount,
        payments: [{
            accountId: finance?.paymentMethodAccounts?.[paymentMethod]?.id || "",
            amount: paidAmount,
            paymentMethod,
            note: "Initial payment for purchase"
        }],
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

      await createMutation.mutateAsync(payload)
      toast.success("Purchase Order created successfully")
      setOpen(false)
      setPurchaseItems([])
      setSelectedSupplier("")
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
        <DialogContent className="sm:max-w-[1200px] w-[95vw] h-[95vh] sm:h-[90vh] flex flex-col p-0 overflow-hidden gap-0 border-none shadow-2xl">
            <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Create Purchase</DialogTitle>
            <DialogDescription>
                Add a new purchase record to the system with real-time stock updates.
            </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto p-0 [scrollbar-gutter:stable] focus:outline-none pointer-events-auto overscroll-contain">
                <div className="p-6 pt-2">
                    <div className="grid gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 flex flex-col gap-2">
                    <Label className="font-semibold">Supplier</Label>
                    <div className="flex gap-2">
                        <Popover open={openSupplierCombobox} onOpenChange={setOpenSupplierCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openSupplierCombobox}
                                    className="flex-1 justify-between h-10"
                                >
                                    {selectedSupplier
                                        ? suppliers.find((supplier) => supplier.id === selectedSupplier)?.name
                                        : "Select supplier..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search supplier..." />
                                    <CommandList>
                                        <CommandEmpty>No supplier found.</CommandEmpty>
                                        <CommandGroup>
                                            {suppliers.map((supplier) => (
                                                <CommandItem
                                                    key={supplier.id}
                                                    value={supplier.name}
                                                    onSelect={() => {
                                                        setSelectedSupplier(supplier.id)
                                                        setOpenSupplierCombobox(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedSupplier === supplier.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {supplier.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" className="h-10" onClick={() => setCreateSupplierOpen(true)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-2">
                    <Label className="font-semibold">Status</Label>
                    <Select onValueChange={(value: any) => setStatus(value)} value={status}>
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select status..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Pending (PO only)</SelectItem>
                            <SelectItem value="completed">Completed (Adds Stock)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-3 flex flex-col gap-2">
                    <Label className="font-semibold">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                            {['cash', 'card', 'online', 'cheque', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer'].map(method => (
                                <SelectItem key={method} value={method}>
                                    <span className="capitalize">{method}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-2">
                    <Label className="font-semibold">Amount Paid</Label>
                    <div className="relative">
                        <SmartNumberInput 
                            value={paidAmount}
                            onChange={(val: number | undefined) => setPaidAmount(val || 0)}
                            className="h-10 pl-8 font-bold"
                        />
                         <Banknote className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    </div>
                </div>

                <div className="lg:col-span-5 flex flex-col gap-2">
                    <Label className="font-semibold flex items-center gap-2">
                        Target Account
                    </Label>
                    <div className="text-sm px-3 h-10 bg-muted/50 rounded-md border font-medium truncate flex items-center text-primary">
                        <Check className="mr-2 h-4 w-4 opacity-70" />
                        {finance?.paymentMethodAccounts?.[paymentMethod]?.name || (
                            <span className="text-destructive text-xs italic">No account mapped (Check Settings)</span>
                        )}
                    </div>
                </div>
            </div>

            <Separator className="my-2" />

            <div className="flex items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <Label className="text-lg font-bold">Purchase Items</Label>
                </div>
                <Button type="button" variant="default" size="sm" onClick={addItem} className="h-8 shadow-sm">
                <Plus className="mr-2 h-4 w-4" /> Add Line
                </Button>
            </div>

            <div className="flex-1 border rounded-md p-4 bg-muted/5 min-h-[300px]">
                <div className="space-y-4">
                {purchaseItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-[3.2fr_0.7fr_1fr_1.2fr_1fr_1fr_1.3fr_1.6fr_0.5fr] gap-2 items-end border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1.5 overflow-hidden">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase opacity-80 pl-1">Medicine *</Label>
                        <Popover open={openComboboxes[index]} onOpenChange={(isOpen) => toggleCombobox(index, isOpen)}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openComboboxes[index]}
                                className="w-full justify-between h-9 px-2 font-normal text-xs"
                                >
                                <span className="truncate">
                                    {item.itemName || "Select medicine..."}
                                </span>
                                <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput 
                                        placeholder="Search medicine..." 
                                        value={medicineSearch}
                                        onValueChange={setMedicineSearch}
                                    />
                                    <CommandList className="relative min-h-[200px]">
                                        {loadingMedicines && (
                                            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            </div>
                                        )}
                                        <CommandEmpty>{loadingMedicines ? "Searching..." : "No medicine found."}</CommandEmpty>
                                        <CommandGroup>
                                        {medicines.map((medicine) => (
                                            <CommandItem
                                                key={medicine.id}
                                                value={medicine.name}
                                                onSelect={() => {
                                                    updateItem(index, { 
                                                        medicineId: medicine.id,
                                                        itemName: medicine.name,
                                                        itemDescription: medicine.genericName || "",
                                                        price: medicine.purchasePrice || medicine.unitPrice || 0,
                                                        mrp: medicine.mrp || 0,
                                                        salePrice: medicine.salePrice || 0,
                                                        unit: medicine.unit || "Piece"
                                                    })
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
                                                    <span className="font-medium">{medicine.name}</span>
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
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase opacity-80 pl-1 text-center block">Qty</Label>
                        <SmartNumberInput 
                        className="h-9 px-1 text-center text-xs" 
                        value={Number(item.quantity)} 
                        onChange={(val: number | undefined) => updateItem(index, { quantity: val || 0 })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase opacity-80 pl-1">Buy Price</Label>
                        <SmartNumberInput 
                        className="h-9 px-1 text-xs" 
                        value={Number(item.price)} 
                        onChange={(val: number | undefined) => updateItem(index, { price: val || 0 })}
                        />
                    </div>
                    <div className="space-y-1.5 overflow-hidden">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase opacity-80 pl-1">Total</Label>
                        <div className="h-9 px-2 flex items-center bg-primary/5 rounded border border-primary/10 text-xs font-bold text-primary truncate">
                            {formatCurrency(Number(item.quantity) * Number(item.price))}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase opacity-80 pl-1 text-primary/80">MRP</Label>
                        <SmartNumberInput 
                        className="h-9 px-1 text-xs" 
                        value={Number(item.mrp)} 
                        onChange={(val: number | undefined) => updateItem(index, { mrp: val || 0 })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase opacity-80 pl-1 text-emerald-600/80">Sale</Label>
                        <SmartNumberInput 
                        className="h-9 px-1 text-xs font-medium text-emerald-600" 
                        value={Number(item.salePrice)} 
                        onChange={(val: number | undefined) => updateItem(index, { salePrice: val || 0 })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase opacity-80 pl-1">Batch *</Label>
                        <Input 
                        className="h-9 px-2 text-xs" 
                        placeholder="Lot #" 
                        value={item.batchNumber} 
                        onChange={(e) => updateItem(index, { batchNumber: e.target.value })}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold text-muted-foreground uppercase opacity-80 pl-1">Expiry *</Label>
                        <Input 
                        type="date"
                        className="h-9 px-1 text-[11px]" 
                        value={item.expiryDate} 
                        onChange={(e) => updateItem(index, { expiryDate: e.target.value })}
                        />
                    </div>
                    <div className="pb-0.5 flex justify-end">
                        <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors" 
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
            </div>

            {/* Totals Summary */}
            <div className="bg-muted/30 p-4 rounded-lg border space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Subtotal:</span>
                    <span className="font-bold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-base border-t pt-2">
                    <span className="font-bold uppercase tracking-wider">Total Amount:</span>
                    <span className="font-bold text-primary">{formatCurrency(total)}</span>
                </div>
                {total > 0 && (
                    <div className="flex justify-between text-xs pt-1">
                        <span className={paidAmount >= total ? "text-emerald-600 font-medium" : "text-destructive font-medium"}>
                            {paidAmount >= total ? "Fully Paid" : "Due Amount:"}
                        </span>
                        <span className={`font-bold ${paidAmount >= total ? "text-emerald-600" : "text-destructive"}`}>
                            {paidAmount >= total ? "✓" : formatCurrency(total - paidAmount)}
                        </span>
                    </div>
                )}
                </div>
            </div>
        </div>
    </div>

            <DialogFooter className="border-t p-6 mt-auto">
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
        />
    </>
  )
}
