"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useDiagnosticTests } from "@/hooks/diagnostic-queries"
import { useCreateSale, useAddSalePayment } from "@/hooks/sales-queries"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { AppointmentReceiptDialog } from "@/components/appointments/appointment-receipt-dialog"
import { Admission } from "@/types/patient"
import { SalePayload } from "@/types/sales"
import { useStoreContext } from "@/store/use-store-context"
import { useCurrency } from "@/hooks/use-currency"
import { toast } from "sonner"
import { Loader2, Plus, Search, FileText, Activity, Trash2, Wallet } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HospitalReceiptDialog } from "./hospital-receipt-dialog"

interface AddAdmissionServiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    admission: Admission | null
    onSuccess?: (sale?: any, action?: 'make-bill' | 'bill-and-pay') => void
}

interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
    serviceId?: string
    isDiagnosticTest?: boolean
}

export function AddAdmissionServiceDialog({
    open,
    onOpenChange,
    admission,
    onSuccess
}: AddAdmissionServiceDialogProps) {
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const { mutateAsync: createSale, isPending: isSaving } = useCreateSale()
    const addPaymentMutation = useAddSalePayment()
    
    const { data: accountsRes } = useFinanceAccounts({ limit: 100 })
    const accounts = accountsRes?.data || []

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([])

    // Service Selection State
    const [selectedServiceId, setSelectedServiceId] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [price, setPrice] = useState(0)
    
    // Manual Entry State
    const [manualItemName, setManualItemName] = useState("")
    const [manualItemPrice, setManualItemPrice] = useState(0)

    // Mode
    const [activeTab, setActiveTab] = useState("labtest")

    // Discount State
    const [discountPercentage, setDiscountPercentage] = useState(0)
    const [discountFixedAmount, setDiscountFixedAmount] = useState(0)

    // Note State
    const [note, setNote] = useState("")

    type PaymentMethod = 'cash' | 'card' | 'online' | 'cheque' | 'bKash' | 'Nagad' | 'Rocket' | 'Bank Transfer'
    const paymentMethods: PaymentMethod[] = ['cash', 'card', 'online', 'cheque', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer']

    const [billingMode, setBillingMode] = useState<'make-bill' | 'bill-and-pay'>('make-bill')
    const [paidAmount, setPaidAmount] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
    const [selectedAccountId, setSelectedAccountId] = useState("")
    const [receiptSale, setReceiptSale] = useState<any>(null)

    useEffect(() => {
        if (open && accounts.length > 0 && !selectedAccountId) {
            const defaultAccount = accounts.find((a: any) => a.name?.toLowerCase().includes('hospital')) || accounts[0]
            if (defaultAccount) setSelectedAccountId(defaultAccount.id)
        }
    }, [open, accounts, selectedAccountId])

    const { data: labServicesRes, isLoading: isLoadingLabServices } = useDiagnosticTests({
        branchId: activeStoreId || undefined,
        limit: 1000,
        isDiagnosticTest: true,
    }, { enabled: open && activeTab === "labtest" })

    const { data: hospitalServicesRes, isLoading: isLoadingHospitalServices } = useDiagnosticTests({
        branchId: activeStoreId || undefined,
        limit: 1000,
        isDiagnosticTest: false,
    }, { enabled: open && activeTab === "hospitalbill" })

    const labServices = labServicesRes?.data || []
    const hospitalServices = hospitalServicesRes?.data || []

    const handleAddToCart = () => {
        if (activeTab === "labtest") {
            const service = labServices.find(s => s.id === selectedServiceId)
            if (!service) {
                toast.error("Please select a service from the list")
                return
            }
            const item: CartItem = {
                id: Math.random().toString(36).substring(7),
                name: service.name,
                price: Number(service.price),
                quantity: quantity,
                serviceId: service.id,
                isDiagnosticTest: service.isDiagnosticTest
            }
            setCart(prev => [...prev, item])
            setSelectedServiceId("")
            setQuantity(1)
            setPrice(0)
        } else if (activeTab === "hospitalbill") {
            // Hospital Bill tab — select from non-lab services with editable price
            const service = hospitalServices.find(s => s.id === selectedServiceId)
            if (!service) {
                toast.error("Please select a service from the list")
                return
            }
            const finalPrice = manualItemPrice > 0 ? manualItemPrice : Number(service.price)
            const item: CartItem = {
                id: Math.random().toString(36).substring(7),
                name: service.name,
                price: finalPrice,
                quantity: quantity,
                serviceId: service.id,
                isDiagnosticTest: false
            }
            setCart(prev => [...prev, item])
            setSelectedServiceId("")
            setManualItemPrice(0)
            setQuantity(1)
            setPrice(0)
        } else if (activeTab === "manual") {
            if (!manualItemName.trim() || manualItemPrice <= 0) {
                toast.error("Please enter a valid item name and price")
                return
            }
            const item: CartItem = {
                id: Math.random().toString(36).substring(7),
                name: manualItemName,
                price: manualItemPrice,
                quantity: quantity,
                isDiagnosticTest: false
            }
            setCart(prev => [...prev, item])
            setManualItemName("")
            setManualItemPrice(0)
            setQuantity(1)
        }
    }

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(c => c.id !== id))
    }

    // Totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const discountAmount = discountFixedAmount > 0 ? discountFixedAmount : (subtotal * discountPercentage) / 100
    const totalBill = Math.max(0, subtotal - discountAmount)
    const activePaidAmount = billingMode === 'make-bill' ? paidAmount : 0
    const dueAmount = Math.max(0, totalBill - activePaidAmount)

    useEffect(() => {
        if (billingMode === 'make-bill') {
            setPaidAmount(totalBill)
        } else {
            setPaidAmount(0)
        }
    }, [totalBill, billingMode])

    const handleFinalizeBill = async () => {
        if (!admission || cart.length === 0) return

        const payload: SalePayload = {
            branchId: activeStoreId || "",
            patientId: admission.patientId,
            patientAdmissionId: admission.id,
            type: "admission",
            status: dueAmount > 0 ? "pending" : "completed",
            paymentMethod: billingMode === 'make-bill' ? paymentMethod : "cash",
            paidAmount: activePaidAmount,
            dueAmount: dueAmount,
            discountPercentage: discountPercentage,
            discountAmount: discountAmount,
            taxPercentage: 0,
            taxAmount: 0,
            isIndoorSale: true,
            note: note,
            saleItems: cart.map(item => ({
                itemName: item.name,
                unit: "service",
                price: Number(item.price),
                mrp: Number(item.price),
                quantity: Number(item.quantity),
                totalPrice: Number(item.price) * Number(item.quantity),
                serviceId: item.serviceId,
                isDiagnosticTest: item.isDiagnosticTest
            }))
        }

        try {
            const saleRes = await createSale(payload)
            const saleId = saleRes?.data?.id
            let processedSale = saleRes.data || saleRes

            if (billingMode === 'make-bill') {
                if (saleId && activePaidAmount > 0 && selectedAccountId) {
                    try {
                        const paymentRes = await addPaymentMutation.mutateAsync({
                            id: saleId,
                            data: {
                                accountId: selectedAccountId,
                                amount: activePaidAmount,
                                paymentMethod: paymentMethod,
                            }
                        })
                        // Use updated sale from payment response if available
                        if (paymentRes?.data) {
                            processedSale = paymentRes.data
                        }
                        toast.success(dueAmount > 0 
                            ? `Bill created with ${formatCurrency(activePaidAmount)} paid, ${formatCurrency(dueAmount)} due`
                            : "Services added and payment processed!"
                        )
                    } catch (pError) {
                        console.error("Payment failed:", pError)
                        toast.warning("Bill created, but payment recording failed. Please collect manually.")
                    }
                } else {
                    toast.success("Services added to hospital bill successfully")
                }
                
                // For 'make-bill', we show the receipt instead of redirecting
                setReceiptSale(processedSale)
                // Don't close parent modal yet, wait for receipt to close
            } else {
                toast.success("Services added to hospital bill successfully")
                resetForm()
                onSuccess?.(processedSale, 'bill-and-pay')
                onOpenChange(false)
            }
        } catch (error: any) {
            if (!error?.response?.data?.message) {
                toast.error("Failed to submit bill")
            }
        }
    }

    const resetForm = () => {
        setCart([])
        setSelectedServiceId("")
        setQuantity(1)
        setPrice(0)
        setManualItemName("")
        setManualItemPrice(0)
        setDiscountPercentage(0)
        setDiscountFixedAmount(0)
        setNote("")
        setPaidAmount(0)
        setSelectedAccountId("")
    }

    return (
        <>
        <Dialog open={open && !receiptSale} onOpenChange={(val) => {
            if (!val) resetForm()
            onOpenChange(val)
        }}>
            <DialogContent className="sm:max-w-[750px] border-none shadow-2xl rounded-3xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader className="p-6 pb-4 bg-primary/5 border-b border-primary/10">
                    <DialogTitle className="text-xl font-black tracking-tight text-primary flex items-center gap-3">
                        <Plus className="h-6 w-6" />
                        Add Admission Services
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium opacity-70">
                        Queue multiple services or charges for {admission?.patient?.name}.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Add Item Section */}
                    <div className="bg-muted/10 border border-muted-foreground/10 rounded-2xl p-4 space-y-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-3 p-1 bg-muted/40 rounded-xl h-10">
                                <TabsTrigger value="labtest" className="rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary gap-2">
                                    <Search className="h-3.5 w-3.5" /> Lab Test
                                </TabsTrigger>
                                <TabsTrigger value="hospitalbill" className="rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary gap-2">
                                    <FileText className="h-3.5 w-3.5" /> Hospital Bill
                                </TabsTrigger>
                                <TabsTrigger value="manual" className="rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary gap-2">
                                    <Activity className="h-3.5 w-3.5" /> Manual Bill
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="labtest" className="space-y-4 pt-3 mt-0 border-none outline-none">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Lab Test</Label>
                                    <SearchableSelect
                                        value={selectedServiceId}
                                        onChange={(val) => {
                                            setSelectedServiceId(val)
                                            const service = labServices.find(s => s.id === val)
                                            if (service) setPrice(Number(service.price))
                                        }}
                                        options={labServices.map(s => ({
                                            id: s.id,
                                            name: `${s.name} - ${formatCurrency(Number(s.price))}`
                                        }))}
                                        placeholder="Search lab tests..."
                                        loading={isLoadingLabServices}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Qty</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="h-10 rounded-xl bg-background border-muted font-bold text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subtotal</Label>
                                        <div className="flex gap-2">
                                            <div className="h-10 flex-1 flex items-center px-3 rounded-xl bg-background border border-muted text-sm font-black tabular-nums">
                                                {formatCurrency(price * quantity)}
                                            </div>
                                            <Button 
                                                onClick={handleAddToCart}
                                                disabled={!selectedServiceId}
                                                className="h-10 px-4 rounded-xl font-black uppercase text-[10px] gap-2 tracking-widest shrink-0"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Add
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="hospitalbill" className="space-y-4 pt-3 mt-0 border-none outline-none">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Service</Label>
                                    <SearchableSelect
                                        value={selectedServiceId}
                                        onChange={(val) => {
                                            setSelectedServiceId(val)
                                            const service = hospitalServices.find(s => s.id === val)
                                            if (service) {
                                                setPrice(Number(service.price))
                                                setManualItemPrice(Number(service.price))
                                            }
                                        }}
                                        options={hospitalServices.map(s => ({
                                            id: s.id,
                                            name: `${s.name} - ${formatCurrency(Number(s.price))}`
                                        }))}
                                        placeholder="Search hospital services..."
                                        loading={isLoadingHospitalServices}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Qty</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="h-10 rounded-xl bg-background border-muted font-bold text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Price</Label>
                                        <SmartNumberInput
                                            value={manualItemPrice}
                                            onChange={(val) => setManualItemPrice(val || 0)}
                                            min={0}
                                            className="h-10 rounded-xl bg-amber-50 border-amber-200 font-bold text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subtotal</Label>
                                        <div className="flex gap-2">
                                            <div className="h-10 flex-1 flex items-center px-3 rounded-xl bg-background border border-muted text-sm font-black tabular-nums">
                                                {formatCurrency((manualItemPrice || price) * quantity)}
                                            </div>
                                            <Button 
                                                onClick={handleAddToCart}
                                                disabled={!selectedServiceId}
                                                className="h-10 px-4 rounded-xl font-black uppercase text-[10px] gap-2 tracking-widest shrink-0"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Add
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="manual" className="space-y-4 pt-3 mt-0 border-none outline-none">
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="space-y-1.5 col-span-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Item Name</Label>
                                        <Input
                                            value={manualItemName}
                                            onChange={(e) => setManualItemName(e.target.value)}
                                            placeholder="Enter service or item name..."
                                            className="h-10 rounded-xl bg-background border-muted font-bold text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Price</Label>
                                        <SmartNumberInput
                                            value={manualItemPrice}
                                            onChange={(val) => setManualItemPrice(val || 0)}
                                            min={0}
                                            className="h-10 rounded-xl bg-amber-50 border-amber-200 font-bold text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Qty</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="h-10 rounded-xl bg-background border-muted font-bold text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-10 flex-1 flex items-center px-3 rounded-xl bg-background border border-muted text-sm font-black tabular-nums">
                                        Subtotal: {formatCurrency((manualItemPrice || 0) * quantity)}
                                    </div>
                                    <Button 
                                        onClick={handleAddToCart}
                                        disabled={!manualItemName.trim() || manualItemPrice <= 0}
                                        className="h-10 px-6 rounded-xl font-black uppercase text-[10px] gap-2 tracking-widest shrink-0"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Cart View Section */}
                    {cart.length > 0 && (
                        <div className="space-y-3 animate-in fade-in zoom-in-95">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Queued Services</Label>
                            <div className="max-h-[140px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                {cart.map(item => (
                                    <div key={item.id} className="p-3 bg-muted/10 rounded-xl border border-muted flex items-center justify-between group">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black uppercase">{item.name}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground">{item.quantity} x {formatCurrency(item.price)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black text-primary tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 opacity-50 hover:opacity-100 hover:bg-rose-50 rounded-lg" onClick={() => removeFromCart(item.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Discount & Payment Section — only visible when cart has items */}
                    {cart.length > 0 && (
                        <>
                            <Separator />
                            {/* Discount */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Discount</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-bold text-muted-foreground ml-1">Subtotal</Label>
                                        <div className="h-9 flex items-center px-3 rounded-lg bg-muted/30 border text-sm font-black tabular-nums">
                                            {formatCurrency(subtotal)}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-bold text-muted-foreground ml-1">Disc %</Label>
                                        <SmartNumberInput
                                            value={discountPercentage}
                                            onChange={(v) => {
                                                setDiscountPercentage(v || 0)
                                                setDiscountFixedAmount(0)
                                            }}
                                            className="h-9 text-xs font-bold rounded-lg"
                                            min={0}
                                            max={100}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-bold text-muted-foreground ml-1">Disc Amt</Label>
                                        <SmartNumberInput
                                            value={discountFixedAmount || (subtotal * discountPercentage) / 100}
                                            onChange={(v) => {
                                                setDiscountFixedAmount(v || 0)
                                                setDiscountPercentage(0)
                                            }}
                                            className="h-9 text-xs font-bold rounded-lg"
                                            min={0}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Toggle Billing Mode */}
                            <div className="bg-primary/5 rounded-2xl p-1.5 flex gap-1 border border-primary/10">
                                <Button
                                    variant={billingMode === 'make-bill' ? 'default' : 'ghost'}
                                    className={`flex-1 rounded-xl h-10 text-xs font-black uppercase tracking-widest ${billingMode === 'make-bill' ? 'shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                                    onClick={() => setBillingMode('make-bill')}
                                >
                                    Make Bill
                                </Button>
                                <Button
                                    variant={billingMode === 'bill-and-pay' ? 'default' : 'ghost'}
                                    className={`flex-1 rounded-xl h-10 text-xs font-black uppercase tracking-widest ${billingMode === 'bill-and-pay' ? 'shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                                    onClick={() => setBillingMode('bill-and-pay')}
                                >
                                    Bill & Pay Other Bills
                                </Button>
                            </div>

                            {/* Payment Section (Conditional) */}
                            {billingMode === 'make-bill' && (
                                <div className="space-y-3 bg-muted/20 border border-border/50 p-4 rounded-2xl">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="h-4 w-4 text-primary" />
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Payment</Label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-bold text-muted-foreground ml-1">Account *</Label>
                                            <SearchableSelect
                                                value={selectedAccountId}
                                                onChange={setSelectedAccountId}
                                                options={accounts.filter((a: any) => a.isActive).map((a: any) => ({
                                                    id: a.id,
                                                    name: `${a.name} (${formatCurrency(Number(a.currentBalance))})`
                                                }))}
                                                placeholder="Select account..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-bold text-muted-foreground ml-1">Method</Label>
                                            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                                                <SelectTrigger className="h-9 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {paymentMethods.map(m => (
                                                        <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-bold text-muted-foreground ml-1">Paid Amount</Label>
                                            <SmartNumberInput
                                                value={paidAmount}
                                                onChange={(v) => setPaidAmount(v || 0)}
                                                className="h-9 text-xs font-bold rounded-lg"
                                                min={0}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-bold text-muted-foreground ml-1">Due Amount</Label>
                                            <div className={`h-9 flex items-center px-3 rounded-lg border text-sm font-black tabular-nums ${dueAmount > 0 ? 'text-rose-500 bg-rose-50/50 border-rose-200' : 'text-emerald-600 bg-emerald-50/50 border-emerald-200'}`}>
                                                {formatCurrency(dueAmount)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bill Note / Remarks</Label>
                                <Input 
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Enter additional details for this bill..."
                                    className="h-10 rounded-xl bg-background border-muted font-bold text-xs"
                                />
                            </div>
                        </>
                    )}

                    {/* Bill Total */}
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex justify-between items-center group">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Net Bill Total</span>
                            <span className="text-2xl font-black text-primary tabular-nums group-hover:scale-105 transition-transform origin-left">
                                {formatCurrency(totalBill)}
                            </span>
                        </div>
                        <Activity className="h-8 w-8 text-primary opacity-20" />
                    </div>
                </div>

                <DialogFooter className="p-6 border-t border-primary/10 bg-muted/20 shrink-0 mt-auto">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="rounded-xl px-6 h-11 font-black uppercase text-xs border-muted-foreground/20">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleFinalizeBill}
                        disabled={isSaving || cart.length === 0}
                        className="rounded-xl px-8 h-11 font-black uppercase text-xs gap-2 shadow-lg shadow-primary/20"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Submit Bill Invoice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <HospitalReceiptDialog
            open={!!receiptSale}
            onOpenChange={(op) => {
                if (!op) {
                    setReceiptSale(null)
                    resetForm()
                    onSuccess?.(receiptSale, 'make-bill')
                    onOpenChange(false)
                }
            }}
            transaction={receiptSale}
        />

        </>
    )
}
