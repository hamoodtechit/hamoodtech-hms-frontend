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
import { PaymentMethod } from "@/types/pharmacy"
import { useStoreContext } from "@/store/use-store-context"
import { useCurrency } from "@/hooks/use-currency"
import { toast } from "sonner"
import { Loader2, Plus, Search, FileText, Activity, Trash2, Wallet } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AddAdmissionServiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    admission: Admission | null
    onSuccess?: () => void
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

    const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
    const [lastCreatedSale, setLastCreatedSale] = useState<any>(null)

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
    const [activeTab, setActiveTab] = useState("catalog")

    // Discount State
    const [discountPercentage, setDiscountPercentage] = useState(0)
    const [discountFixedAmount, setDiscountFixedAmount] = useState(0)

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
    const [selectedAccountId, setSelectedAccountId] = useState("")
    const [paidAmount, setPaidAmount] = useState(0)

    const { data: servicesRes, isLoading: isLoadingServices } = useDiagnosticTests({
        branchId: activeStoreId || undefined,
        limit: 1000,
    }, { enabled: open && activeTab === "catalog" })

    const services = servicesRes?.data || []

    const { data: accountsRes } = useFinanceAccounts({ branchId: activeStoreId, group: 'hospital', isActive: true, limit: 100 })
    const accounts = accountsRes?.data || []

    // Auto-select first account
    useEffect(() => {
        if (open && accounts.length > 0 && !selectedAccountId) {
            const defaultAccount = accounts.find((a: any) => a.name?.toLowerCase().includes('hospital')) || accounts[0]
            if (defaultAccount) setSelectedAccountId(defaultAccount.id)
        }
    }, [open, accounts, selectedAccountId])

    const handleAddToCart = () => {
        if (activeTab === "catalog") {
            const service = services.find(s => s.id === selectedServiceId)
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
        } else {
            if (!manualItemName || manualItemPrice <= 0) {
                toast.error("Please provide valid item name and price")
                return
            }
            const item: CartItem = {
                id: Math.random().toString(36).substring(7),
                name: manualItemName,
                price: manualItemPrice,
                quantity: quantity
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
    const dueAmount = Math.max(0, totalBill - paidAmount)

    // Sync paid amount when total changes
    useEffect(() => {
        setPaidAmount(totalBill)
    }, [totalBill])

    const handleFinalizeBill = async () => {
        if (!admission || cart.length === 0) return

        if (paidAmount > 0 && !selectedAccountId) {
            toast.error("Please select a payment account")
            return
        }

        const payload: SalePayload = {
            branchId: activeStoreId || "",
            patientId: admission.patientId,
            patientAdmissionId: admission.id,
            type: "hospital",
            status: dueAmount > 0 ? "pending" : "completed",
            paymentMethod: paymentMethod,
            paidAmount: paidAmount,
            dueAmount: dueAmount,
            discountPercentage: discountPercentage,
            discountAmount: discountAmount,
            taxPercentage: 0,
            taxAmount: 0,
            isIndoorSale: true,
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

            // Process payment if there's a paid amount
            if (saleId && paidAmount > 0 && selectedAccountId) {
                try {
                    await addPaymentMutation.mutateAsync({
                        id: saleId,
                        data: {
                            accountId: selectedAccountId,
                            amount: paidAmount,
                            paymentMethod: paymentMethod,
                        }
                    })
                    toast.success(dueAmount > 0 
                        ? `Bill created with ${formatCurrency(paidAmount)} paid, ${formatCurrency(dueAmount)} due`
                        : "Services added and payment processed!"
                    )
                } catch (pError) {
                    console.error("Payment failed:", pError)
                    toast.warning("Bill created, but payment recording failed. Please collect manually.")
                }
            } else {
                toast.success("Services added to hospital bill successfully")
            }

            // Capture the sale data to pass to the receipt dialog
            if (saleId) {
                setLastCreatedSale(saleRes.data || saleRes)
                setReceiptDialogOpen(true)
            }

            resetForm()
            onSuccess?.()
            onOpenChange(false)
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
        setPaidAmount(0)
        setSelectedAccountId("")
    }

    const paymentMethods: PaymentMethod[] = ['cash', 'card', 'online', 'cheque', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer']

    return (
        <>
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetForm()
            onOpenChange(val)
        }}>
            <DialogContent className="sm:max-w-[700px] border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 bg-primary/5 border-b border-primary/10">
                    <DialogTitle className="text-xl font-black tracking-tight text-primary flex items-center gap-3">
                        <Plus className="h-6 w-6" />
                        Add Admission Services
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium opacity-70">
                        Queue multiple services or charges for {admission?.patient?.name}.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Add Item Section */}
                    <div className="bg-muted/10 border border-muted-foreground/10 rounded-2xl p-4 space-y-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/40 rounded-xl h-10">
                                <TabsTrigger value="catalog" className="rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary gap-2">
                                    <Search className="h-3.5 w-3.5" /> Catalog
                                </TabsTrigger>
                                <TabsTrigger value="manual" className="rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary gap-2">
                                    <FileText className="h-3.5 w-3.5" /> Manual
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="catalog" className="space-y-4 pt-3 mt-0 border-none outline-none">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Service</Label>
                                    <SearchableSelect
                                        value={selectedServiceId}
                                        onChange={(val) => {
                                            setSelectedServiceId(val)
                                            const service = services.find(s => s.id === val)
                                            if (service) setPrice(Number(service.price))
                                        }}
                                        options={services.map(s => ({
                                            id: s.id,
                                            name: `${s.name} - ${formatCurrency(Number(s.price))}`
                                        }))}
                                        placeholder="Search catalog..."
                                        loading={isLoadingServices}
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

                            <TabsContent value="manual" className="space-y-4 pt-3 mt-0 border-none outline-none">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Custom Service Name</Label>
                                    <Input
                                        placeholder="e.g. Special Nursing"
                                        value={manualItemName}
                                        onChange={(e) => setManualItemName(e.target.value)}
                                        className="h-10 rounded-xl bg-background border-muted font-bold text-xs"
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
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unit Price</Label>
                                        <div className="flex gap-2">
                                            <SmartNumberInput
                                                placeholder="0.00"
                                                value={manualItemPrice}
                                                onChange={(val) => setManualItemPrice(val || 0)}
                                                className="h-10 rounded-xl bg-background border-muted font-bold text-xs flex-1"
                                            />
                                            <Button 
                                                onClick={handleAddToCart}
                                                disabled={!manualItemName || manualItemPrice <= 0}
                                                className="h-10 px-4 rounded-xl font-black uppercase text-[10px] gap-2 tracking-widest shrink-0"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Add
                                            </Button>
                                        </div>
                                    </div>
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

                            {/* Payment */}
                            <div className="space-y-3">
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

                <DialogFooter className="p-6 border-t border-primary/10 bg-muted/20">
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

        <AppointmentReceiptDialog
            open={receiptDialogOpen}
            onOpenChange={(open) => {
                setReceiptDialogOpen(open)
                if (!open) setLastCreatedSale(null)
            }}
            transaction={lastCreatedSale}
        />
        </>
    )
}
