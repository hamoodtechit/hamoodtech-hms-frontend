"use client"

import { SaleDetailsDialog } from "@/components/pharmacy/sale-details-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useCreateAppointment } from "@/hooks/appointment-queries"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useEmployees } from "@/hooks/hr-queries"
import { useCreateSale, useSales } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/use-auth-store"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { FinanceAccount } from "@/types/finance"
import { Patient, PaymentMethod } from "@/types/pharmacy"
import { Sale, SalePayload } from "@/types/sales"
import { CreditCard, History, Plus, Receipt, Search, Trash2, ShoppingCart, Loader2, User, LayoutGrid, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"

import { PatientSearch } from "@/components/pharmacy/pos/patient-search"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { DiagnosticReceiptDialog } from "./diagnostic-receipt-dialog"

interface CartItem {
    id: string
    name: string
    description?: string
    price: number
    quantity: number
}

export function ExtraChargeBillingForm() {
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const { pharmacy } = useSettingsStore()
    const { user } = useAuthStore()

    // Data Fetching
    const { data: staffRes, isLoading: loadingStaff } = useEmployees({ branchId: activeStoreId || undefined, limit: 1000 })
    const { data: accountsRes } = useFinanceAccounts({ branchId: activeStoreId || undefined, group: 'hospital', limit: 100, isActive: true })

    // Pagination/History State
    const [modalSearch, setModalSearch] = useState("")
    const debouncedModalSearch = useDebounce(modalSearch, 500)
    const [modalPage, setModalPage] = useState(1)
    const modalLimit = 8

    const { data: recentSalesRes, refetch: refetchSales } = useSales({ 
        branchId: activeStoreId || undefined, 
        type: 'hospital', 
        limit: modalLimit, 
        page: modalPage,
        search: debouncedModalSearch || undefined,
    })

    const staffs = useMemo(() => staffRes?.data || [], [staffRes?.data])
    const accounts = accountsRes?.data || []
    const vatPercentage = pharmacy?.vatPercentage || 0
    const createSaleMutation = useCreateSale()

    // Form State
    const [selectedCustomer, setSelectedCustomer] = useState<Patient | null>(null)
    const [selectedStaffId, setSelectedStaffId] = useState<string>("")
    const [cart, setCart] = useState<CartItem[]>([])
    
    // New Item State
    const [newItemName, setNewItemName] = useState("")
    const [newItemPrice, setNewItemPrice] = useState<number>(0)
    const [newItemDesc, setNewItemDesc] = useState("")

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
    const [selectedAccountId, setSelectedAccountId] = useState<string>("")
    const [paidAmount, setPaidAmount] = useState<number>(0)
    const [paymentNote, setPaymentNote] = useState<string>("")
    const [saleNote, setSaleNote] = useState<string>("")
    
    // UI State
    const [receiptOpen, setReceiptOpen] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [lastSale, setLastSale] = useState<any | null>(null)
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

    // Validation
    const isReady = !!selectedCustomer && !!selectedAccountId && cart.length > 0

    // Set default staff
    useEffect(() => {
        if (user && staffs.length > 0 && !selectedStaffId) {
            const currentStaff = staffs.find(s => s.id === user.id || (s as any).userId === user.id)
            if (currentStaff) {
                // Using a functional update to ensure we don't trigger unnecessary re-renders if the value is the same
                setSelectedStaffId(prev => (prev === currentStaff.id ? prev : currentStaff.id))
            }
        }
    }, [user, staffs, selectedStaffId])

    // Automatically select the first account if none is selected or if current one is invalid
    useEffect(() => {
        if (accounts.length > 0) {
            const isCurrentAccountValid = accounts.some(acc => acc.id === selectedAccountId)
            if (!selectedAccountId || !isCurrentAccountValid) {
                setSelectedAccountId(accounts[0].id)
            }
        }
    }, [accounts, selectedAccountId])

    const handleAddItem = () => {
        if (!newItemName || newItemPrice <= 0) {
            toast.error("Please enter a valid name and price")
            return
        }

        const item: CartItem = {
            id: Math.random().toString(36).substring(7),
            name: newItemName,
            price: newItemPrice,
            description: newItemDesc,
            quantity: 1
        }

        setCart(prev => [...prev, item])
        setNewItemName("")
        setNewItemPrice(0)
        setNewItemDesc("")
    }

    const handleRemoveItem = (id: string) => {
        setCart(cart.filter(item => item.id !== id))
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const tax = subtotal * (vatPercentage / 100)
    const total = subtotal + tax

    const handleCheckout = async () => {
        if (!selectedCustomer) {
            toast.error("Please select a patient")
            return
        }
        if (cart.length === 0) {
            toast.error("No items added to the bill")
            return
        }
        if (!selectedAccountId) {
            toast.error("Please select a target finance account")
            return
        }

        const payload: SalePayload = {
            branchId: activeStoreId || "",
            patientId: selectedCustomer.id,
            type: 'hospital',
            note: saleNote || undefined,
            staffId: selectedStaffId || undefined,
            status: paidAmount >= total ? 'completed' : 'pending',
            paymentMethod: paymentMethod,
            paymentStatus: paidAmount >= total ? 'paid' : paidAmount > 0 ? 'partial' : 'due',
            paidAmount: Number(paidAmount),
            dueAmount: Math.max(0, total - Number(paidAmount)),
            discountPercentage: 0,
            discountAmount: 0,
            taxPercentage: Number(vatPercentage),
            taxAmount: Number(tax),
            payments: Number(paidAmount) > 0 ? [{
                accountId: selectedAccountId,
                amount: Number(paidAmount),
                paymentMethod: paymentMethod,
                note: paymentNote || undefined
            }] : [],
            saleItems: cart.map(item => ({
                itemName: item.name,
                itemDescription: item.description,
                unit: 'service',
                price: Number(item.price),
                mrp: Number(item.price),
                quantity: Number(item.quantity),
                totalPrice: Number(item.price) * Number(item.quantity),
            }))
        }

        try {
            const res = await createSaleMutation.mutateAsync(payload)
            setLastSale(res.data)
            toast.success("Extra charge processed successfully!")
            setReceiptOpen(true)
            
            // Reset
            setCart([])
            setSelectedCustomer(null)
            setPaidAmount(0)
            setPaymentNote("")
            setSaleNote("")
            refetchSales()
        } catch (error) {
            toast.error("Failed to process extra charge")
        }
    }

    return (
        <div className="flex flex-col gap-4 p-4 lg:p-6 min-h-[calc(100vh-64px)] bg-muted/10 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-primary">Extra Charges</h1>
                    <p className="text-muted-foreground text-sm font-medium">Record additional fees and services for patients.</p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 h-11 px-6 rounded-2xl border-primary/20 hover:bg-primary/5 shadow-sm font-black text-xs uppercase tracking-widest"
                    onClick={() => setHistoryOpen(true)}
                >
                    <History className="h-4 w-4 text-primary" />
                    Transaction Logs
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-2xl shadow-primary/10 overflow-hidden rounded-[2rem]">
                        <CardHeader className="bg-primary/5 border-b p-6">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Service Admission
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Define New Charge Parameter</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-1">
                                        <Input 
                                            placeholder="Charge Name (e.g. Nursing Care)" 
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            className="h-11 rounded-xl bg-muted/20 border-none font-bold text-xs"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <SmartNumberInput 
                                            placeholder="Price" 
                                            value={newItemPrice}
                                            onChange={(val) => setNewItemPrice(val || 0)}
                                            className="h-11 rounded-xl bg-muted/20 border-none font-bold text-xs"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                            <Input 
                                                placeholder="Note (optional)" 
                                                value={newItemDesc}
                                                onChange={(e) => setNewItemDesc(e.target.value)}
                                                className="h-11 rounded-xl bg-muted/20 border-none font-bold text-xs flex-1"
                                            />
                                            <Button 
                                                onClick={handleAddItem} 
                                                disabled={!newItemName || newItemPrice <= 0}
                                                className="h-11 w-11 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-90"
                                            >
                                                <Plus className="h-5 w-5" />
                                            </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {cart.length > 0 && (
                        <Card className="border-none shadow-2xl shadow-primary/10 overflow-hidden rounded-[2.5rem]">
                            <CardHeader className="bg-indigo-500/5 border-b p-6">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-700 flex items-center gap-2">
                                    <LayoutGrid className="w-4 h-4" /> Categorized Services
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 max-h-[40vh] overflow-y-auto custom-scrollbar relative">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                                        <TableRow className="h-12 border-b">
                                            <TableHead className="text-[10px] uppercase font-black px-6 tracking-widest">Service Item</TableHead>
                                            <TableHead className="text-[10px] uppercase font-black px-6 tracking-widest">Unit Rate</TableHead>
                                            <TableHead className="text-[10px] uppercase font-black text-right px-6 tracking-widest">Subtotal</TableHead>
                                            <TableHead className="w-16 px-6"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cart.map((item) => (
                                            <TableRow key={item.id} className="h-16 hover:bg-muted/30 transition-colors border-b last:border-0 group">
                                                <TableCell className="px-6">
                                                    <div className="flex flex-col gap-0.5">
                                                        <p className="text-sm font-black leading-tight text-foreground">{item.name}</p>
                                                        {item.description && <p className="text-[10px] text-muted-foreground font-medium">{item.description}</p>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-6 text-xs font-bold text-muted-foreground tabular-nums">
                                                    {formatCurrency(item.price)}
                                                </TableCell>
                                                <TableCell className="text-right px-6 text-sm font-black text-primary tabular-nums">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </TableCell>
                                                <TableCell className="px-6">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-10 w-10 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-all rounded-xl opacity-0 group-hover:opacity-100" 
                                                        onClick={() => handleRemoveItem(item.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-1 self-start sticky top-20">
                    <Card className="border-none shadow-2xl shadow-primary/20 overflow-hidden rounded-[2rem] bg-background flex flex-col h-[calc(100vh-140px)] transition-all">
                        <CardHeader className="p-5 border-b bg-muted/30 shrink-0">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4" /> Charge Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-hidden flex flex-col flex-1">
                            {/* Summary Detail */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 opacity-40">
                                        <div className="p-4 bg-muted rounded-2xl">
                                            <Plus className="h-8 w-8" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-center">Awaiting Entry</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {cart.map((item) => (
                                            <div key={item.id} className="p-3 bg-muted/20 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-right-2">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-black text-[11px] text-foreground truncate uppercase">{item.name}</p>
                                                        <p className="text-[9px] text-muted-foreground font-bold mt-0.5">Quantity: 1</p>
                                                    </div>
                                                    <p className="font-black text-xs text-primary">{formatCurrency(item.price)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Sticky SETTLEMENT Sums */}
                            <div className="p-6 bg-secondary/5 border-t shrink-0 space-y-6">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        <span>Base Subtotal</span>
                                        <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                                    </div>
                                    {tax > 0 && (
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            <span>Govt. VAT ({vatPercentage}%)</span>
                                            <span className="tabular-nums">{formatCurrency(tax)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-baseline pt-4 border-t border-dashed mt-4 border-primary/20">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Final Payable</span>
                                        <span className="text-3xl font-black text-primary tabular-nums tracking-tighter">{formatCurrency(total)}</span>
                                    </div>
                                </div>

                                <Sheet open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                                    <SheetTrigger asChild>
                                        <Button 
                                            className="w-full h-16 text-lg font-black uppercase tracking-[0.2em] rounded-3xl shadow-2xl transition-all active:scale-[0.98] bg-primary hover:bg-primary/90 shadow-primary/20 group relative overflow-hidden"
                                            disabled={cart.length === 0}
                                        >
                                            <div className="flex items-center gap-3 relative z-10 font-black">
                                                <Receipt className="w-6 h-6" />
                                                Review & Finalize
                                            </div>
                                            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0 border-none shadow-2xl rounded-l-[3rem] overflow-hidden">
                                        <SheetHeader className="p-8 border-b bg-primary/3">
                                            <SheetTitle className="flex items-center gap-3 text-xl font-black tracking-tight">
                                                <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                                    <Receipt className="w-5 h-5 text-white" />
                                                </div>
                                                Refining Charge Detail
                                            </SheetTitle>
                                        </SheetHeader>

                                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                            {/* Section 1: Personnel Attribution */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="h-1 bg-primary w-6 rounded-full" />
                                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Personnel Attribution</Label>
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Patient *</Label>
                                                    <PatientSearch selectedPatient={selectedCustomer} onSelect={setSelectedCustomer} />
                                                    {selectedCustomer && (
                                                        <div className="flex items-center gap-3 p-3 bg-emerald-500/3 rounded-2xl border border-emerald-500/20">
                                                            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20">
                                                                {selectedCustomer.name.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-black text-sm text-foreground truncate">{selectedCustomer.name}</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground">{selectedCustomer.phone}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Staff Member</Label>
                                                    <SearchableSelect 
                                                        value={selectedStaffId}
                                                        onChange={setSelectedStaffId}
                                                        options={staffs.map(s => ({ id: s.id, name: s.name }))}
                                                        placeholder="Attributing Staff..."
                                                        loading={loadingStaff}
                                                        showAll={false}
                                                    />
                                                </div>
                                            </div>

                                            <Separator className="bg-muted/50" />

                                            {/* Section 2: Financial Settlement */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="h-1 bg-primary w-6 rounded-full" />
                                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Settlement Detail</Label>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Method</Label>
                                                        <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                                                            <SelectTrigger className="h-11 rounded-xl border-none bg-muted/20 font-bold text-xs uppercase tracking-widest">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                                {['cash', 'card', 'online', 'cheque', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer'].map(method => (
                                                                    <SelectItem key={method} value={method} className="text-xs font-bold py-3 capitalize">
                                                                        {method}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Amount Collected</Label>
                                                        <SmartNumberInput 
                                                            value={paidAmount}
                                                            onFocus={(e: any) => e.target.select()} 
                                                            onChange={(val) => setPaidAmount(val || 0)}
                                                            className="h-11 text-base font-black border-none bg-primary/5 text-primary rounded-xl tabular-nums shadow-inner"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target Account *</Label>
                                                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                                        <SelectTrigger className="h-11 rounded-xl border-none bg-muted/20 font-bold text-xs">
                                                            <SelectValue placeholder="Choose account..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                            {accounts.map((acc: FinanceAccount) => (
                                                                <SelectItem key={acc.id} value={acc.id} className="text-xs font-bold py-3">
                                                                    {acc.name} ({acc.type}) - Tk {formatCurrency(Number(acc.currentBalance))}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-primary">Note (For Sale)</Label>
                                                        <Input 
                                                            placeholder="General note for this sale..."
                                                            value={saleNote}
                                                            onChange={(e) => setSaleNote(e.target.value)}
                                                            className="h-11 rounded-xl border-none bg-muted/20 font-bold text-xs"
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Payment Note (Finance Memo)</Label>
                                                        <Input 
                                                            placeholder="Add payment details memo..."
                                                            value={paymentNote}
                                                            onChange={(e) => setPaymentNote(e.target.value)}
                                                            className="h-11 rounded-xl bg-background border-primary/5 font-medium text-xs italic"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Drawer Sticky Footer */}
                                        <div className="p-8 border-t bg-foreground text-background shrink-0">
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Total Gross</p>
                                                    <p className="text-3xl font-black tabular-nums tracking-tighter">{formatCurrency(total)}</p>
                                                </div>
                                                <div className="text-right space-y-0.5">
                                                    <p className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest",
                                                        paidAmount >= (total - 0.01) ? "text-emerald-400" : "text-rose-400"
                                                    )}>
                                                        {paidAmount >= (total - 0.01) ? "Settled" : "Ref. Balance"}
                                                    </p>
                                                    <p className={cn(
                                                        "text-xl font-black tabular-nums tracking-tight",
                                                        paidAmount >= (total - 0.01) ? "text-emerald-400" : "text-rose-400"
                                                    )}>
                                                        {formatCurrency(Math.abs(paidAmount - total))}
                                                    </p>
                                                </div>
                                            </div>

                                            <Button 
                                                className={cn(
                                                    "w-full h-18 text-xl font-black uppercase tracking-[0.2em] rounded-3xl shadow-2xl transition-all active:scale-[0.98]",
                                                    paidAmount < (total - 0.01) && total > 0 
                                                        ? "bg-rose-500 hover:bg-rose-600 text-white" 
                                                        : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                                                )}
                                                disabled={!isReady || createSaleMutation.isPending}
                                                onClick={handleCheckout}
                                            >
                                                {createSaleMutation.isPending ? (
                                                    <Loader2 className="w-6 h-6 animate-spin" />
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <CheckCircle2 className="w-6 h-6" />
                                                        Process Transaction
                                                    </div>
                                                )}
                                            </Button>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
                    <DialogHeader className="p-6 border-b bg-muted/30">
                        <div className="flex items-center justify-between gap-4 pr-8">
                            <DialogTitle className="text-xl font-black flex items-center gap-2 capitalize">
                                <History className="h-5 w-5 text-primary" />
                                Charge History
                            </DialogTitle>
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by invoice or patient..."
                                    value={modalSearch}
                                    onChange={(e) => setModalSearch(e.target.value)}
                                    className="pl-9 h-11 rounded-xl bg-muted/20 border-none font-bold text-xs"
                                />
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 border border-border/50 rounded-[2.5rem] overflow-y-auto custom-scrollbar relative bg-background shadow-xl shadow-muted/20">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                                <TableRow className="h-12 border-b">
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6">Invoice #</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6">Patient Identifier</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6">Billed Amount</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6">Settlement</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest px-6">Timestamps</TableHead>
                                    <TableHead className="text-right px-6"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentSalesRes?.data?.sales?.map((sale: Sale) => (
                                    <TableRow key={sale.id} className="h-16 hover:bg-muted/30 transition-colors border-b last:border-0 group">
                                        <TableCell className="px-6 font-black text-xs text-primary">{sale.invoiceNumber}</TableCell>
                                        <TableCell className="px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-[10px] font-black">
                                                    {sale.patient?.name.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-foreground">{sale.patient?.name}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground">{sale.patient?.phone}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-6 font-black text-sm tabular-nums">{formatCurrency(Number(sale.netPrice))}</TableCell>
                                        <TableCell className="px-6">
                                            <Badge variant="outline" className={cn(
                                                "text-[9px] font-black uppercase rounded-lg px-2 py-0.5 border-none", 
                                                sale.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                                            )}>
                                                {sale.paymentStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-6 text-[10px] font-bold text-muted-foreground">{new Date(sale.createdAt).toLocaleString()}</TableCell>
                                        <TableCell className="text-right px-6">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all rounded-xl" onClick={() => { setSelectedSale(sale); setDetailsOpen(true); }}>
                                                <Receipt className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            <DiagnosticReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} transaction={lastSale} />
            <SaleDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} sale={selectedSale} />
        </div>
    )
}
