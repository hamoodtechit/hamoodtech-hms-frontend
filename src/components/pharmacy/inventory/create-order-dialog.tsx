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
import { Textarea } from "@/components/ui/textarea"
import { useFinanceAccounts } from "@/hooks/finance-queries"
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
  const [supplierSearch, setSupplierSearch] = useState("")
  const [debouncedSupplierSearch] = useDebounce(supplierSearch, 500)
  
  const { data: suppliersRes, isLoading: loadingSuppliers } = useSuppliers({ search: debouncedSupplierSearch, limit: 20 })
  const { data: medicinesRes, isFetching: loadingMedicines } = useMedicines({ search: debouncedMedicineSearch, limit: 50 })
  const { finance, fetchSettings } = useSettingsStore()
  const { formatCurrency } = useCurrency()
  
  const suppliers = suppliersRes?.data || []
  const medicines = medicinesRes?.data || []

  const createMutation = useCreatePurchase()
  const loading = createMutation.isPending

  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [paidAmount, setPaidAmount] = useState(0)
  
  // Combobox states
  const [openComboboxes, setOpenComboboxes] = useState<{ [key: number]: boolean }>({})
  const [openSupplierCombobox, setOpenSupplierCombobox] = useState(false)

  const [createSupplierOpen, setCreateSupplierOpen] = useState(false)
  const [status, setStatus] = useState<'pending' | 'completed' | 'rejected'>('pending')
  const [purchaseType, setPurchaseType] = useState<'pharmacy' | 'hospital' | 'clinic'>('pharmacy')
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [selectedSupplierName, setSelectedSupplierName] = useState("")
  const [note, setNote] = useState("")

  // Fetch accounts for manual selection
  const { data: accountsRes } = useFinanceAccounts({ isActive: true, limit: 100 })
  const accounts = accountsRes?.data || []

  useEffect(() => {
    fetchSettings()
  }, [])

  // Sync selected account with default from settings
  useEffect(() => {
    const defaultAccountId = finance?.paymentMethodAccounts?.[paymentMethod]?.id || ""
    setSelectedAccountId(defaultAccountId)
  }, [paymentMethod, finance])

  // Calculations
  const calculateItemTotal = (item: PurchaseItem) => {
    const qty = Number(item.quantity) || 0
    const price = Number(item.price) || 0
    const itemSubtotal = qty * price
    const itemDiscount = Number(item.discountAmount) || (itemSubtotal * (Number(item.discountPercentage) || 0) / 100)
    return Math.max(0, itemSubtotal - itemDiscount)
  }

  const subtotal = purchaseItems.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  
  // Final Total after Global Discount
  const globalDiscount = discountAmount || (subtotal * (discountPercentage || 0) / 100)
  const total = Math.max(0, subtotal - globalDiscount)

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
      salePrice: 0,
      quantity: 1,
      batchNumber: "",
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      rackNumber: "",
      discountPercentage: 0,
      discountAmount: 0,
    }])
  }

  const removeItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
  }

    const updateItem = (index: number, updates: Partial<PurchaseItem>) => {
    const newItems = [...purchaseItems]
    // If updating percentage, reset amount and vice versa to avoid conflict (optional UX)
    if ('discountPercentage' in updates) updates.discountAmount = 0
    if ('discountAmount' in updates) updates.discountPercentage = 0
    
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
      !item.batchNumber 
    )
    if (invalidItem) {
      toast.error("Please fill all required details (Medicine, Qty, Expiry, Batch)")
      return
    }

    try {
      const dueAmount = Math.max(0, total - paidAmount)
      let paymentStatus: 'paid' | 'due' | 'partial' = 'due'
      if (paidAmount >= total && total > 0) paymentStatus = 'paid'
      else if (paidAmount > 0) paymentStatus = 'partial'

      const payload = {
        branchId: activeStoreId,
        supplierId: selectedSupplier,
        type: purchaseType,
        status: status,
        discountPercentage,
        discountAmount,
        paymentMethod,
        paymentStatus,
        paidAmount,
        dueAmount,
        note,
        payments: paidAmount > 0 ? [{
            accountId: selectedAccountId || finance?.paymentMethodAccounts?.[paymentMethod]?.id || "",
            amount: paidAmount,
            paymentMethod,
            note: "Initial payment for purchase"
        }] : [],
        purchaseItems: purchaseItems.map(item => ({
          ...item,
          price: Number(item.price),
          mrp: Number(item.mrp),
          salePrice: Number(item.salePrice),
          quantity: Number(item.quantity),
          discountPercentage: Number(item.discountPercentage) || 0,
          discountAmount: Number(item.discountAmount) || 0,
          expiryDate: new Date(item.expiryDate).toISOString()
        }))
      }

     

      await createMutation.mutateAsync(payload)
      toast.success("Purchase Order created successfully")
      setOpen(false)
      setPurchaseItems([])
      setSelectedSupplier("")
      setNote("")
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-4">
                <div className="lg:col-span-6 flex flex-col gap-1.5">
                    <Label className="font-semibold text-xs text-muted-foreground uppercase tracking-tight">Supplier</Label>
                    <div className="flex gap-2">
                        <Popover open={openSupplierCombobox} onOpenChange={setOpenSupplierCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openSupplierCombobox}
                                    className="flex-1 justify-between h-9 text-xs border-primary/20"
                                >
                                    {selectedSupplier
                                        ? (suppliers.find((supplier) => supplier.id === selectedSupplier)?.name || selectedSupplierName)
                                        : "Select supplier..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput 
                                        placeholder="Search supplier..." 
                                        value={supplierSearch}
                                        onValueChange={setSupplierSearch}
                                    />
                                    <CommandList>
                                        {loadingSuppliers ? (
                                            <div className="p-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                                <Loader2 className="h-3 w-3 animate-spin" /> Searching...
                                            </div>
                                        ) : (
                                            <>
                                                <CommandEmpty className="p-2 text-xs text-muted-foreground">No supplier found.</CommandEmpty>
                                                <CommandGroup>
                                                    {suppliers.map((supplier) => (
                                                        <CommandItem
                                                            key={supplier.id}
                                                            value={supplier.id}
                                                            onSelect={() => {
                                                                setSelectedSupplier(supplier.id)
                                                                setSelectedSupplierName(supplier.name)
                                                                setOpenSupplierCombobox(false)
                                                                setSupplierSearch("")
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
                                            </>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" className="h-9 border-primary/20" onClick={() => setCreateSupplierOpen(true)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="lg:col-span-3 flex flex-col gap-1.5">
                    <Label className="font-semibold text-xs text-primary uppercase tracking-tight">Purchase Type</Label>
                    <div className="flex flex-col gap-1.5">
                        <Select onValueChange={(value: any) => setPurchaseType(value)} value={purchaseType}>
                            <SelectTrigger className="h-9 text-xs border-primary/20">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pharmacy" className="text-xs">Pharmacy</SelectItem>
                                <SelectItem value="hospital" className="text-xs">Hospital</SelectItem>
                                <SelectItem value="clinic" className="text-xs">Clinic</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="lg:col-span-3 flex flex-col gap-1.5">
                    <Label className="font-semibold text-xs text-emerald-600 uppercase tracking-tight">Status</Label>
                    <Select onValueChange={(value: any) => setStatus(value)} value={status}>
                        <SelectTrigger className="h-9 text-xs border-emerald-600/20">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                            <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                            <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
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

            <div className="flex-1 border rounded-md p-4 bg-muted/5 min-h-[400px]">
                <div className="space-y-4">
                {purchaseItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end border-b pb-6 last:border-0 last:pb-0">
                        {/* Row 1: Medicine, Qty, Buy Price, MRP, Sale Price */}
                         <div className="col-span-12 grid grid-cols-12 gap-3">
                            <div className="col-span-4 space-y-1.5">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Medicine *</Label>
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
                                    <PopoverContent className="w-[350px] p-0" align="start">
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
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2 overflow-hidden">
                                                                <span className="font-medium truncate text-xs">{medicine.name}</span>
                                                                {(medicine.dosageForm || medicine.strength) && (
                                                                    <span className="text-[9px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-bold uppercase shrink-0">
                                                                        {[medicine.dosageForm, medicine.strength].filter(Boolean).join(" - ")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                                                                {medicine.genericName}
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="col-span-1 space-y-1.5">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase pl-1 text-center block">Qty</Label>
                                <SmartNumberInput 
                                    className="h-9 px-1 text-center text-xs" 
                                    value={Number(item.quantity)} 
                                    onChange={(val: number | undefined) => updateItem(index, { quantity: val || 0 })}
                                />
                            </div>

                            <div className="col-span-1 space-y-1.5">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Buy Price</Label>
                                <SmartNumberInput 
                                    className="h-9 px-2 text-xs" 
                                    value={Number(item.price)} 
                                    onChange={(val: number | undefined) => updateItem(index, { price: val || 0 })}
                                />
                            </div>

                            <div className="col-span-1 space-y-1.5">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase pl-1 text-primary/80">MRP</Label>
                                <SmartNumberInput 
                                    className="h-9 px-2 text-xs" 
                                    value={Number(item.mrp)} 
                                    onChange={(val: number | undefined) => updateItem(index, { mrp: val || 0 })}
                                />
                            </div>

                            <div className="col-span-1 space-y-1.5">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase pl-1 text-emerald-600/80">Sale Price</Label>
                                <SmartNumberInput 
                                    className="h-9 px-2 text-xs font-medium text-emerald-600" 
                                    value={Number(item.salePrice)} 
                                    onChange={(val: number | undefined) => updateItem(index, { salePrice: val || 0 })}
                                />
                            </div>

                             <div className="col-span-4 space-y-1.5">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Discount (% | Flat)</Label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <div className="relative">
                                        <SmartNumberInput 
                                            placeholder="%"
                                            className="h-9 px-1 text-[11px] text-center pr-4" 
                                            value={Number(item.discountPercentage)} 
                                            onChange={(val: number | undefined) => updateItem(index, { discountPercentage: val || 0 })}
                                        />
                                        <span className="absolute right-1 top-2.5 text-[10px] text-muted-foreground">%</span>
                                    </div>
                                    <SmartNumberInput 
                                        placeholder="Flat Amount"
                                        className="h-9 px-1 text-[11px] text-center" 
                                        value={Number(item.discountAmount)} 
                                        onChange={(val: number | undefined) => updateItem(index, { discountAmount: val || 0 })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Batch, Expiry, Rack Number, Line Total, Actions */}
                         <div className="col-span-12 grid grid-cols-12 gap-3 pt-1">
                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Batch *</Label>
                                <Input 
                                    className="h-9 px-2 text-xs" 
                                    placeholder="Batch Number" 
                                    value={item.batchNumber} 
                                    onChange={(e) => updateItem(index, { batchNumber: e.target.value })}
                                />
                            </div>

                            <div className="col-span-2 space-y-1.5">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Expiry *</Label>
                                <Input 
                                    type="date"
                                    className="h-9 px-2 text-xs" 
                                    value={item.expiryDate} 
                                    onChange={(e) => updateItem(index, { expiryDate: e.target.value })}
                                />
                            </div>

                            <div className="col-span-3 space-y-1.5">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Rack (Optional)</Label>
                                <Input 
                                    className="h-9 px-2 text-xs" 
                                    placeholder="Rack Location" 
                                    value={item.rackNumber} 
                                    onChange={(e) => updateItem(index, { rackNumber: e.target.value })}
                                />
                            </div>

                            <div className="col-span-3 space-y-1.5">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase pl-1">Line Total</Label>
                                <div className="h-9 px-3 flex items-center justify-between bg-emerald-500/5 rounded border border-emerald-500/20 text-sm font-bold text-emerald-600">
                                    <span className="text-[10px] opacity-60 uppercase font-black">Subtotal:</span>
                                    {formatCurrency(calculateItemTotal(item))}
                                </div>
                            </div>

                            <div className="col-span-2 flex justify-end pb-0.5 pt-6">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-9 w-full text-destructive hover:text-destructive hover:bg-destructive/10 border border-destructive/20 shadow-sm" 
                                    onClick={() => removeItem(index)}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    <span className="text-xs font-bold uppercase tracking-tighter">Remove</span>
                                </Button>
                            </div>
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

            {/* Finance Section - Relocated to improve flow */}
            <div className="px-5 py-4 bg-muted/20 border-y border-primary/5 my-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-4 w-1 bg-primary rounded-full" />
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary/80">Financial & Payment Details</Label>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-4">
                    <div className="lg:col-span-2 flex flex-col gap-1.5">
                        <Label className="font-semibold text-[10px] text-muted-foreground uppercase tracking-tight">Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                            <SelectTrigger className="h-9 text-xs border-primary/10">
                                <SelectValue placeholder="Method" />
                            </SelectTrigger>
                            <SelectContent>
                                {['cash', 'card', 'online', 'cheque', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer'].map(method => (
                                    <SelectItem key={method} value={method} className="text-xs">
                                        <span className="capitalize">{method}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="lg:col-span-2 flex flex-col gap-1.5">
                        <Label className="font-semibold text-[10px] text-muted-foreground uppercase tracking-tight">Global Discount (%)</Label>
                        <SmartNumberInput 
                            value={discountPercentage}
                            onChange={(val: number | undefined) => {
                                setDiscountPercentage(val || 0)
                                setDiscountAmount(0)
                            }}
                            className="h-9 text-xs border-primary/10"
                            placeholder="0%"
                        />
                    </div>

                    <div className="lg:col-span-2 flex flex-col gap-1.5">
                        <Label className="font-semibold text-[10px] text-muted-foreground uppercase tracking-tight">Global Discount (Flat)</Label>
                        <SmartNumberInput 
                            value={discountAmount}
                            onChange={(val: number | undefined) => {
                                setDiscountAmount(val || 0)
                                setDiscountPercentage(0)
                            }}
                            className="h-9 text-xs font-bold border-primary/10"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="lg:col-span-3 flex flex-col gap-1.5">
                        <Label className="font-semibold text-[10px] text-muted-foreground uppercase tracking-tight font-black text-primary">Amount Paid</Label>
                        <div className="relative">
                            <SmartNumberInput 
                                value={paidAmount}
                                onChange={(val: number | undefined) => setPaidAmount(val || 0)}
                                className="h-9 pl-7 font-black text-xs bg-primary/5 border-primary/30"
                            />
                            <Banknote className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-primary opacity-60" />
                        </div>
                    </div>

                    <div className="lg:col-span-3 flex flex-col gap-1.5">
                        <Label className="font-semibold text-[10px] text-muted-foreground uppercase tracking-tight flex items-center gap-1">
                            Deposit Account *
                        </Label>
                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                            <SelectTrigger className="h-9 text-[11px] font-medium border-primary/20 bg-background">
                                <SelectValue placeholder="Deposit to..." />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id} className="text-[11px]">
                                        {acc.name} ({acc.type})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="lg:col-span-12 flex flex-col gap-1.5 pt-2">
                        <Label className="font-semibold text-[10px] text-muted-foreground uppercase tracking-tight">Purchase Note (Internal)</Label>
                        <Textarea 
                            placeholder="Add any specific notes about this purchase here..."
                            className="text-xs min-h-[60px] bg-background border-primary/10 transition-all focus:border-primary/30"
                            value={note}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Totals Summary */}
            <div className="bg-muted/30 p-4 rounded-lg border space-y-2">
                <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-tight">Line Items Subtotal:</span>
                    <span className="font-bold">{formatCurrency(subtotal)}</span>
                </div>
                {globalDiscount > 0 && (
                    <div className="flex justify-between text-xs text-blue-600">
                        <span className="font-medium uppercase tracking-tight">Global Discount:</span>
                        <span className="font-bold">-{formatCurrency(globalDiscount)}</span>
                    </div>
                )}
                <div className="flex justify-between text-base border-t pt-2 mt-1">
                    <span className="font-extrabold uppercase tracking-wider text-primary">Grand Total:</span>
                    <span className="font-extrabold text-primary text-lg">{formatCurrency(total)}</span>
                </div>
                
                <Separator className="bg-primary/10" />

                <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium uppercase">Paid Amount:</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(paidAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium uppercase">Due Amount:</span>
                        <span className={`font-bold ${total - paidAmount > 0 ? "text-destructive" : "text-emerald-600"}`}>
                            {formatCurrency(Math.max(0, total - paidAmount))}
                        </span>
                    </div>
                </div>

                {total > 0 && (
                    <div className="flex items-center justify-center gap-2 pt-2 border-t mt-2">
                        <div className={cn(
                            "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            paidAmount >= total 
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                                : paidAmount > 0 
                                    ? "bg-amber-100 text-amber-700 border-amber-200"
                                    : "bg-red-100 text-red-700 border-red-200"
                        )}>
                            {paidAmount >= total ? "✓ Fully Paid" : paidAmount > 0 ? "⚡ Partial Payment" : "⚠ Unpaid / Due"}
                        </div>
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
