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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import { CreditCard, History, Plus, Receipt, Search, Trash2 } from "lucide-react"
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
    const { data: accountsRes } = useFinanceAccounts({ branchId: activeStoreId || undefined, limit: 10, isActive: true })

    // Pagination/History State
    const [modalSearch, setModalSearch] = useState("")
    const debouncedModalSearch = useDebounce(modalSearch, 500)
    const [modalPage, setModalPage] = useState(1)
    const modalLimit = 8

    const { data: recentSalesRes, refetch: refetchSales } = useSales({ 
        branchId: activeStoreId || undefined, 
        type: 'others', 
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
    
    // UI State
    const [receiptOpen, setReceiptOpen] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [lastSale, setLastSale] = useState<any | null>(null)
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)

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

        setCart([...cart, item])
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
            type: 'others',
            staffId: selectedStaffId || undefined,
            status: paidAmount >= total ? 'completed' : 'pending',
            paymentMethod: paymentMethod,
            paymentStatus: paidAmount >= total ? 'paid' : paidAmount > 0 ? 'partial' : 'due',
            paidAmount: paidAmount,
            dueAmount: Math.max(0, total - paidAmount),
            discountPercentage: 0,
            discountAmount: 0,
            taxPercentage: vatPercentage,
            taxAmount: tax,
            payments: paidAmount > 0 ? [{
                accountId: selectedAccountId,
                amount: paidAmount,
                paymentMethod: paymentMethod,
            }] : [],
            saleItems: cart.map(item => ({
                itemName: item.name,
                itemDescription: item.description,
                unit: 'service',
                price: item.price,
                mrp: item.price,
                quantity: item.quantity,
                totalPrice: item.price * item.quantity,
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
            refetchSales()
        } catch (error) {
            toast.error("Failed to process extra charge")
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-muted/20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-primary">Extra Charges</h1>
                    <p className="text-muted-foreground text-sm font-medium">Record additional fees and services for patients.</p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-primary/20 hover:bg-primary/5 shadow-sm"
                    onClick={() => setHistoryOpen(true)}
                >
                    <History className="h-4 w-4 text-primary" />
                    Charge History
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl shadow-primary/5">
                        <CardHeader className="p-4 border-b bg-muted/30">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Charge Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Patient Selection *</Label>
                                    <PatientSearch selectedPatient={selectedCustomer} onSelect={setSelectedCustomer} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Staff Member</Label>
                                    <SearchableSelect 
                                        value={selectedStaffId}
                                        onChange={setSelectedStaffId}
                                        options={staffs.map(s => ({ id: s.id, name: s.name }))}
                                        placeholder="Select Staff"
                                        loading={loadingStaff}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Add New Charge Item</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="md:col-span-1">
                                        <Input 
                                            placeholder="Charge Name (e.g. Oxygen Service)" 
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <SmartNumberInput 
                                            placeholder="Price" 
                                            value={newItemPrice}
                                            onChange={(val) => setNewItemPrice(val || 0)}
                                            className="h-9 text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Note (optional)" 
                                            value={newItemDesc}
                                            onChange={(e) => setNewItemDesc(e.target.value)}
                                            className="h-9 text-sm flex-1"
                                        />
                                        <Button onClick={handleAddItem} disabled={!newItemName || newItemPrice <= 0}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {cart.length > 0 && (
                        <Card className="border-none shadow-xl shadow-primary/5">
                            <CardHeader className="p-4 border-b bg-muted/30">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Charge List ({cart.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-4">Item Name</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead className="text-right pr-4">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cart.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="pl-4 font-medium">
                                                    {item.name}
                                                    {item.description && <p className="text-[10px] text-muted-foreground">{item.description}</p>}
                                                </TableCell>
                                                <TableCell className="font-bold">{formatCurrency(item.price)}</TableCell>
                                                <TableCell className="text-right pr-4 flex items-center justify-end gap-3 h-[52px]">
                                                    <span className="font-black text-primary">{formatCurrency(item.price)}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveItem(item.id)}>
                                                        <Trash2 className="h-3 w-3" />
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

                <div className="space-y-6">
                    <Card className="border-none shadow-xl shadow-primary/5 sticky top-6">
                        <CardHeader className="p-4 border-b bg-muted/30">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Settlement Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            <div className="space-y-1.5 p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {tax > 0 && (
                                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                        <span>Tax ({vatPercentage}%)</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-baseline pt-2 border-t mt-2">
                                    <span className="text-sm font-bold uppercase">Total Charges</span>
                                    <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Amount Paid Now</Label>
                                    <SmartNumberInput 
                                        value={paidAmount}
                                        onChange={(val) => setPaidAmount(val || 0)}
                                        className="h-12 text-xl font-black border-primary/20 text-primary bg-primary/5"
                                    />
                                    <div className="flex justify-between items-center text-xs px-1">
                                        <span className="text-muted-foreground font-medium uppercase min-w-[50px]">To be Due</span>
                                        <span className="font-bold text-rose-500">{formatCurrency(Math.max(0, total - paidAmount))}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Method</Label>
                                        <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                                            <SelectTrigger className="h-9 text-xs font-medium">
                                                <SelectValue />
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
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Account *</Label>
                                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                            <SelectTrigger className="h-9 text-xs font-medium">
                                                <SelectValue placeholder="Account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accounts.map((acc: FinanceAccount) => (
                                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button 
                                    className="w-full h-14 text-lg font-black shadow-xl"
                                    disabled={cart.length === 0 || !selectedCustomer || !selectedAccountId || createSaleMutation.isPending}
                                    onClick={handleCheckout}
                                >
                                    <CreditCard className="mr-2 h-5 w-5" />
                                    {createSaleMutation.isPending ? "Processing..." : "Process Charge"}
                                </Button>
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
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search invoice..."
                                    value={modalSearch}
                                    onChange={(e) => setModalSearch(e.target.value)}
                                    className="pl-9 h-9 text-xs"
                                />
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="p-6 overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentSalesRes?.data?.sales?.map((sale: Sale) => (
                                    <TableRow key={sale.id}>
                                        <TableCell className="font-black text-[10px]">{sale.invoiceNumber}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold">{sale.patient?.name}</span>
                                                <span className="text-[10px] opacity-60">{sale.patient?.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold">{formatCurrency(Number(sale.netPrice))}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-[9px] font-black uppercase", sale.paymentStatus === 'paid' ? "bg-emerald-500/10 text-emerald-600 border-none" : "bg-rose-500/10 text-rose-600 border-none")}>
                                                {sale.paymentStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-[10px] opacity-60">{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedSale(sale); setDetailsOpen(true); }}>
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
