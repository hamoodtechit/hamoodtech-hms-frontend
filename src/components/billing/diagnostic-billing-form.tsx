"use client"

import { SaleDetailsDialog } from "@/components/pharmacy/sale-details-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
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
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { useDiagnosticTests } from "@/hooks/diagnostic-queries"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useEmployees } from "@/hooks/hr-queries"
import { useCreateSale, useSales } from "@/hooks/sales-queries"
import { useUsers } from "@/hooks/user-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/use-permissions"
import { useAuthStore } from "@/store/use-auth-store"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { FinanceAccount } from "@/types/finance"
import { Patient, PaymentMethod } from "@/types/pharmacy"
import { Sale, SalePayload } from "@/types/sales"
import { format } from "date-fns"
import { 
    CalendarDays, 
    ChevronLeft, 
    ChevronRight, 
    CreditCard, 
    DollarSign, 
    Eye, 
    Filter, 
    History, 
    Plus, 
    Receipt, 
    Search, 
    Trash2, 
    X, 
    User, 
    Stethoscope, 
    Clock,
    LayoutGrid, 
    Users, 
    DoorOpen, 
    CheckCircle2, 
    ArrowRight,
    AlertCircle,
    TestTube2,
    Microscope,
    Radiation,
    Loader2,
    ShoppingCart
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { DateRange } from "react-day-picker"
import { toast } from "sonner"

import { PatientSearch } from "@/components/pharmacy/pos/patient-search"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { ReferralSearch } from "@/components/hr/referral-search"
import { DiagnosticReceiptDialog } from "./diagnostic-receipt-dialog"

interface DiagnosticBillingFormProps {
    type?: 'pathology' | 'radiology' | 'opd' | 'emergency'
    title?: string
    description?: string
}

interface CartItem {
    id: string
    testId: string
    name: string
    price: number
    quantity: number
    unit: string
    reportDays: number
    deliveryDate: string
    discountPercentage: number
    discountAmount: number
    title?: string
    description?: string
    serviceId: string
    isDiagnosticTest: boolean
}

export function DiagnosticBillingForm({ 
    type = 'opd', 
    title = "OPD Billing",
    description = "Consolidated billing for diagnostic laboratory services."
}: DiagnosticBillingFormProps) {
    const router = useRouter()
    const { hasPermission } = usePermissions()
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const { pharmacy } = useSettingsStore()
    const { user } = useAuthStore()

    // Permission check
    const canCreateSale = hasPermission('sale:create') || (
        type === 'pathology' 
            ? hasPermission('pathology:create') 
            : type === 'radiology'
                ? hasPermission('radiology:create')
                : (hasPermission('pathology:create') || hasPermission('radiology:create'))
    )

    // Data Fetching
    const { data: testsRes } = useDiagnosticTests({ 
        branchId: activeStoreId || undefined, 
        limit: 1000,
        type: type === 'emergency' ? 'emergency' : undefined,
    })
    const { data: usersRes, isLoading: loadingUsers } = useUsers({ 
        branchId: activeStoreId || undefined,
        limit: 1000 
    })
    const { data: accountsRes } = useFinanceAccounts({ branchId: activeStoreId || undefined, group: 'hospital', limit: 100, isActive: true })

    // Modal Filters & Pagination
    const [modalSearch, setModalSearch] = useState("")
    const debouncedModalSearch = useDebounce(modalSearch, 500)
    const [modalPage, setModalPage] = useState(1)
    const [modalType, setModalType] = useState<string>(type === 'opd' ? 'hospital' : type)
    const [modalStatus, setModalStatus] = useState<string>("all")
    const [modalPaymentStatus, setModalPaymentStatus] = useState<string>("all")
    const [modalPaymentMethod, setModalPaymentMethod] = useState<string>("all")
    const [modalInvoiceNumber, setModalInvoiceNumber] = useState("")
    const [modalCreatedBy, setModalCreatedBy] = useState("")
    const [modalMinAmount, setModalMinAmount] = useState("")
    const [modalMaxAmount, setModalMaxAmount] = useState("")
    const [modalDateRange, setModalDateRange] = useState<DateRange | undefined>()
    const modalLimit = 8
    
    // HISTORY MODAL STATE
    const [historyOpen, setHistoryOpen] = useState(false)
    const [receiptOpen, setReceiptOpen] = useState(false)
    const [lastSale, setLastSale] = useState<Sale | null>(null)
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null)
    const [initialAddPayment, setInitialAddPayment] = useState(false)

    const { data: recentSalesRes, isLoading: loadingHistory, refetch: refetchSales } = useSales({ 
        branchId: activeStoreId || undefined, 
        type: modalType !== "all" ? modalType : undefined, 
        limit: modalLimit, 
        page: modalPage,
        search: debouncedModalSearch || undefined,
        status: modalStatus !== "all" ? (modalStatus as any) : undefined,
        paymentStatus: modalPaymentStatus !== "all" ? (modalPaymentStatus as any) : undefined,
        paymentMethod: modalPaymentMethod !== "all" ? modalPaymentMethod : undefined,
        invoiceNumber: modalInvoiceNumber || undefined,
        createdBy: modalCreatedBy || undefined,
        minAmount: modalMinAmount ? Number(modalMinAmount) : undefined,
        maxAmount: modalMaxAmount ? Number(modalMaxAmount) : undefined,
        startDate: modalDateRange?.from ? format(modalDateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: modalDateRange?.to ? format(modalDateRange.to, 'yyyy-MM-dd') : undefined,
    })

    const activeFilterCount = (modalStatus !== 'all' ? 1 : 0) + 
                            (modalPaymentStatus !== 'all' ? 1 : 0) + 
                            (modalType !== 'all' ? 1 : 0) +
                            (modalInvoiceNumber ? 1 : 0) +
                            (modalDateRange ? 1 : 0)

    const allTests = testsRes?.data || []
    const users = usersRes?.data || []
    const recentSales = recentSalesRes?.data?.sales || []
    const historyPagination = recentSalesRes?.data?.pagination

    const accounts = accountsRes?.data || []
    const vatPercentage = pharmacy?.vatPercentage || 0

    const createSaleMutation = useCreateSale()

    // Form State
    const [selectedCustomer, setSelectedCustomer] = useState<Patient | null>(null)
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
    const [selectedReferralPersonId, setSelectedReferralPersonId] = useState<string>("")
    const [selectedTestId, setSelectedTestId] = useState<string>("")
    const [roomNumber, setRoomNumber] = useState<string>("")
    const [cart, setCart] = useState<CartItem[]>([])
    
    // Payment State
    const [discount, setDiscount] = useState<number>(0)
    const [discountFixedAmount, setDiscountFixedAmount] = useState<number>(0)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
    const [selectedAccountId, setSelectedAccountId] = useState<string>("")
    const [paidAmount, setPaidAmount] = useState<number>(0)
    const [paymentNote, setPaymentNote] = useState<string>("")
    const [saleNote, setSaleNote] = useState<string>("")
    
    // Auto-fill room based on user
    useEffect(() => {
        if (selectedDoctorId) {
            const user: any = users.find((u: any) => u.id === selectedDoctorId)
            setRoomNumber(user?.employee?.chamberOrRoomNumber || "")
        } else {
            setRoomNumber("")
        }
    }, [selectedDoctorId, users])

    // Automatically select the first account if none is selected or if current one is invalid
    useEffect(() => {
        if (accounts.length > 0) {
            const isCurrentAccountValid = accounts.some(acc => acc.id === selectedAccountId)
            if (!selectedAccountId || !isCurrentAccountValid) {
                setSelectedAccountId(accounts[0].id)
            }
        }
    }, [accounts, selectedAccountId])

    // Handlers
    const handleAddTest = (serviceId?: string) => {
        const testIdToAdd = serviceId || selectedTestId
        if (!testIdToAdd) return
        
        const test = allTests.find(t => t.id === testIdToAdd)
        if (!test) return

        if (cart.some(item => item.testId === test.id)) {
            toast.error("This service is already added to the bill")
            setSelectedTestId("")
            return
        }

        const delivery = new Date()
        delivery.setDate(delivery.getDate() + (test.reportDays || 0))
        const deliveryStr = delivery.toISOString().split('T')[0]

        const newItem: CartItem = {
            id: Math.random().toString(36).substring(7),
            testId: test.id,
            name: test.name,
            price: Number(test.price),
            quantity: 1,
            unit: test.unit || 'procedure',
            reportDays: test.reportDays || 0,
            deliveryDate: deliveryStr,
            discountAmount: 0,
            discountPercentage: 0,
            serviceId: test.id,
            isDiagnosticTest: !!test.isDiagnosticTest
        }

        setCart([...cart, newItem])
        setSelectedTestId("")
    }

    const handleRemoveItem = (id: string) => {
        setCart(cart.filter(item => item.id !== id))
    }

    const updateItemDiscount = (id: string, type: 'percent' | 'amount', val: number) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                if (type === 'percent') return { ...item, discountPercentage: val, discountAmount: 0 }
                return { ...item, discountAmount: val, discountPercentage: 0 }
            }
            return item
        }))
    }

    const updateItemPrice = (id: string, newPrice: number) => {
        setCart(cart.map(item => item.id === id ? { ...item, price: newPrice } : item))
    }

    const updateItemDeliveryDate = (id: string, val: string) => {
        setCart(cart.map(item => item.id === id ? { ...item, deliveryDate: val } : item))
    }

    // Totals
    const subtotal = cart.reduce((sum, item) => {
        const itemDiscountAmount = item.discountAmount || 
            (item.discountPercentage ? (item.price * item.discountPercentage) / 100 : 0)
        return sum + (item.price - itemDiscountAmount)
    }, 0)

    const discountAmount = discountFixedAmount || (subtotal * discount) / 100
    const discountedSubtotal = Math.max(0, subtotal - discountAmount)
    const tax = discountedSubtotal * (vatPercentage / 100)
    const total = discountedSubtotal + tax

    const handleCheckout = async () => {
        if (!selectedCustomer || cart.length === 0 || !selectedAccountId) return

        const payload: SalePayload = {
            branchId: activeStoreId || "",
            patientId: selectedCustomer.id,
            type: "hospital",
            note: saleNote || undefined,
            doctorId: selectedDoctorId || undefined,
            status: paidAmount >= total ? 'completed' : 'pending',
            paymentMethod: paymentMethod,
            referralPersonId: selectedReferralPersonId || undefined,
            chamberOrRoomNumber: roomNumber || undefined,
            paymentStatus: paidAmount >= total ? 'paid' : paidAmount > 0 ? 'partial' : 'due',
            paidAmount: paidAmount,
            dueAmount: Math.max(0, total - paidAmount),
            discountPercentage: discount,
            discountAmount: discountAmount,
            taxPercentage: vatPercentage,
            taxAmount: tax,
            payments: paidAmount > 0 ? [{
                accountId: selectedAccountId,
                amount: paidAmount,
                paymentMethod: paymentMethod,
                note: paymentNote || undefined
            }] : [],
            saleItems: cart.map(item => ({
                itemName: item.name,
                unit: item.unit,
                price: item.price,
                mrp: item.price,
                quantity: item.quantity || 1,
                totalPrice: (item.price * (item.quantity || 1)) - (item.discountAmount || (item.discountPercentage ? ((item.price * (item.quantity || 1)) * item.discountPercentage) / 100 : 0)),
                discountPercentage: item.discountPercentage,
                discountAmount: item.discountAmount,
                deliveryDate: item.deliveryDate,
                testBy: "",
                batchNumber: "",
                expiryDate: "",
                serviceId: item.serviceId,
                isDiagnosticTest: item.isDiagnosticTest
            }))
        }

        try {
            const res = await createSaleMutation.mutateAsync(payload)
            setLastSale(res.data)
            toast.success("Transaction fulfilled successfully!")
            setReceiptOpen(true)
            
            // Reset
            setCart([])
            setSelectedCustomer(null)
            setSelectedDoctorId("")
            setPaidAmount(0)
            setPaymentNote("")
            setSaleNote("")
            setSelectedReferralPersonId("")
            setDiscount(0)
            setDiscountFixedAmount(0)
            setRoomNumber("")
            refetchSales()
        } catch (error) {
            toast.error("Payment authorization failed")
        }
    }

    // Validation Check
    const isReady = !!selectedCustomer && !!selectedDoctorId && !!selectedAccountId && cart.length > 0
    const validationErrors = [
        { key: 'patient', label: 'Patient Identification', valid: !!selectedCustomer },
        { key: 'doctor', label: 'Consultant Selected', valid: !!selectedDoctorId },
        { key: 'account', label: 'Finance Account', valid: !!selectedAccountId },
        { key: 'cart', label: 'Services Added', valid: cart.length > 0 },
    ]

    if (!canCreateSale) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]">
                <div className="text-destructive mb-4">
                    <X className="w-16 h-16" />
                </div>
                <h2 className="text-2xl font-black mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-6">You do not have permission to create {type} bills.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 p-4 lg:p-6 min-h-[calc(100vh-64px)] bg-muted/10 pb-12">
            {/* Header Suite */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/20 animate-pulse-subtle",
                        type === 'pathology' ? "bg-indigo-600" : "bg-emerald-600"
                    )}>
                        {type === 'pathology' ? <Microscope className="h-6 w-6 text-white" /> : <Radiation className="h-6 w-6 text-white" />}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
                        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                           <LayoutGrid className="w-3 h-3 text-primary" /> {description}
                        </p>
                    </div>
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Workflow Column */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    

                    {/* Procedure Inventory & Selection */}
                    <Card className="border-none  overflow-hidden rounded-[2rem]">
                        <CardHeader className="bg-indigo-500/5 border-b p-5 flex flex-row items-center justify-between">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-700 flex items-center gap-2">
                                <TestTube2 className="w-4 h-4" /> Lab Procedure Queue
                            </CardTitle>
                            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 uppercase font-black px-3 py-0.5 rounded-lg">
                                {allTests.length} Valid Services
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-5 md:p-6 space-y-6">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-1 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Search Catalog</Label>
                                    <SearchableSelect 
                                        value={selectedTestId}
                                        onChange={(val) => {
                                            setSelectedTestId(val)
                                            if (val) handleAddTest(val)
                                        }}
                                        options={allTests.map(t => ({ 
                                            id: t.id, 
                                            name: `${t.name} [${t.department?.name || 'N/A'}] - ${formatCurrency(Number(t.price))}` 
                                        }))}
                                        placeholder="Enter Service Code or Name..."
                                        showAll={false}
                                    />
                                </div>
                            </div>

                            {cart.length > 0 ? (
                                <div className="rounded-[2rem] border bg-background shadow-inner max-h-[40vh] overflow-y-auto custom-scrollbar relative">
                                    <Table>
                                        <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                                            <TableRow className="h-12 border-b border-border/50">
                                                <TableHead className="text-[9px] uppercase font-black px-6 tracking-widest">Procedure Detail</TableHead>
                                                <TableHead className="text-[9px] uppercase font-black px-6 tracking-widest w-40">Delivery Projection</TableHead>
                                                <TableHead className="text-[9px] uppercase font-black text-right px-6 tracking-widest">Base Rate</TableHead>
                                                <TableHead className="text-[9px] uppercase font-black px-6 tracking-widest">Item Adjustment</TableHead>
                                                <TableHead className="text-[9px] uppercase font-black text-right px-6 tracking-widest">Subtotal</TableHead>
                                                <TableHead className="w-16 px-6"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cart.map((item) => {
                                                const itemDiscountAmount = item.discountAmount || 
                                                    (item.discountPercentage ? (item.price * item.discountPercentage) / 100 : 0)
                                                const itemTotal = item.price - itemDiscountAmount

                                                return (
                                                <TableRow key={item.id} className="h-20 hover:bg-muted/30 transition-colors border-b border-border/50 group">
                                                    <TableCell className="px-6">
                                                        <div className="flex flex-col gap-1">
                                                            <p className="text-sm font-black text-foreground leading-none">{item.name}</p>
                                                            <div className="flex items-center gap-2">
                                                               <span className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1">
                                                                    <Clock className="w-2.5 h-2.5" /> {item.reportDays} Days TAT
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6">
                                                        <Input 
                                                            type="date" 
                                                            value={item.deliveryDate}
                                                            onChange={(e) => updateItemDeliveryDate(item.id, e.target.value)}
                                                            className="h-9 text-[10px] w-full bg-muted/30 border-none font-bold rounded-lg"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right px-6 text-xs font-black text-muted-foreground/80 tabular-nums">
                                                        {type === 'emergency' ? (
                                                            <SmartNumberInput
                                                                value={item.price}
                                                                onChange={(val) => updateItemPrice(item.id, val || 0)}
                                                                min={0}
                                                                className="h-9 w-24 text-[11px] font-black text-right bg-amber-50 border-amber-200 rounded-lg ml-auto"
                                                            />
                                                        ) : (
                                                            formatCurrency(item.price)
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6">
                                                        <div className="flex items-center gap-1 bg-secondary/10 rounded-xl p-1 border border-border/50 w-fit">
                                                            <div className="relative">
                                                                <SmartNumberInput 
                                                                    placeholder="%"
                                                                    className="h-7 text-[10px] w-12 bg-background border-none px-2 rounded-lg"
                                                                    min={0}
                                                                    max={100}
                                                                    value={item.discountPercentage}
                                                                    onChange={(val) => updateItemDiscount(item.id, 'percent', val || 0)}
                                                                />
                                                            </div>
                                                            <div className="w-px h-4 bg-border/50 mx-1" />
                                                            <div className="relative">
                                                                <SmartNumberInput 
                                                                    placeholder="Amt"
                                                                    className="h-7 text-[10px] w-16 bg-background border-none px-2 rounded-lg"
                                                                    min={0}
                                                                    value={item.discountAmount}
                                                                    onChange={(val) => updateItemDiscount(item.id, 'amount', val || 0)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right px-6 text-sm font-black text-primary tabular-nums">
                                                        {formatCurrency(itemTotal)}
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
                                            )})}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="py-24 text-center border-2 border-dashed rounded-[3rem] bg-muted/5 flex flex-col items-center gap-5 group hover:bg-muted/10 transition-all">
                                    <div className="h-16 w-16 rounded-[2rem] bg-background flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform">
                                        <Plus className="h-7 w-7 text-muted-foreground/40" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Active queue is empty</p>
                                        <p className="text-[10px] text-muted-foreground/50 font-medium italic">Pending service selection from the catalog above</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-4 self-start sticky top-20">
                    <Card className="border-none   overflow-hidden rounded-[2rem] bg-background flex flex-col h-[calc(100vh-140px)] transition-all">
                        <CardHeader className="p-5 border-b bg-muted/30 shrink-0">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4" /> Lab Transaction Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-hidden flex flex-col flex-1">
                            {/* Mini Cart / Summary List */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {cart.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-3 opacity-40">
                                        <div className="p-4 bg-muted rounded-2xl">
                                            <ShoppingCart className="h-8 w-8" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Cart is empty</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {cart.map((item) => {
                                             const itemDiscountAmount = item.discountAmount || 
                                                (item.discountPercentage ? (item.price * item.discountPercentage) / 100 : 0)
                                            const itemTotal = item.price - itemDiscountAmount
                                            
                                            return (
                                                <div key={item.id} className="p-3 bg-muted/20 rounded-2xl border border-border/50 group animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="flex justify-between items-start gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-black text-[11px] text-foreground truncate leading-tight uppercase tracking-tight">
                                                                {item.name}
                                                            </p>
                                                            <p className="text-[9px] text-muted-foreground font-bold flex items-center gap-1.5 mt-1">
                                                                <Clock className="w-2.5 h-2.5" /> Due: {format(new Date(item.deliveryDate), 'MMM dd')}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-black text-xs text-primary">{formatCurrency(itemTotal)}</p>
                                                            {itemDiscountAmount > 0 && (
                                                                <p className="text-[8px] text-rose-500 font-bold">-{formatCurrency(itemDiscountAmount)}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Sticky Settlement Summary & Trigger */}
                            <div className="p-6 bg-secondary/5 border-t shrink-0 space-y-6">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        <span>Items Subtotal</span>
                                        <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                                    </div>
                                    {(discount > 0 || discountFixedAmount > 0) && (
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                            <span>Bulk Discount</span>
                                            <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
                                        </div>
                                    )}
                                    {tax > 0 && (
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            <span>Tax Calculation ({vatPercentage}%)</span>
                                            <span className="tabular-nums">{formatCurrency(tax)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-baseline pt-4 border-t border-dashed mt-4 border-primary/20">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Gross Total</span>
                                        <span className="text-3xl font-black text-primary tabular-nums tracking-tighter">{formatCurrency(total)}</span>
                                    </div>
                                </div>

                                <Sheet open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                                    <SheetTrigger asChild>
                                        <Button 
                                            className="w-full h-16 text-lg font-black uppercase tracking-[0.2em] rounded-3xl shadow-2xl transition-all active:scale-[0.98] bg-primary hover:bg-primary/90 shadow-primary/20 group relative overflow-hidden"
                                            disabled={cart.length === 0}
                                        >
                                            <div className="flex items-center gap-3 relative z-10">
                                                <CreditCard className="w-6 h-6" />
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
                                                Checkout Details
                                            </SheetTitle>
                                        </SheetHeader>

                                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                            {/* Section 1: Personnel Assignment */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="h-1 bg-primary w-6 rounded-full" />
                                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Personnel Assignment</Label>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Patient *</Label>
                                                    <PatientSearch 
                                                        selectedPatient={selectedCustomer} 
                                                        onSelect={setSelectedCustomer} 
                                                    />
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

                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Referred Consultant</Label>
                                                        <SearchableSelect 
                                                            value={selectedDoctorId}
                                                            onChange={setSelectedDoctorId}
                                                            options={users
                                                                .filter((u: any) => u.role?.name?.toLowerCase() === 'doctor')
                                                                .map((u: any) => ({ 
                                                                    id: u.id, 
                                                                    name: u.fullName || u.username 
                                                                }))}
                                                            placeholder="Select Consultant..."
                                                            loading={loadingUsers}
                                                            showAll={false}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Referral (RefBy)</Label>
                                                            <ReferralSearch 
                                                                selectedReferralId={selectedReferralPersonId}
                                                                onSelect={(referral) => setSelectedReferralPersonId(referral?.id || "")}
                                                            />
                                                        </div>
                                                        <div className="space-y-3">
                                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location</Label>
                                                            <Input 
                                                                placeholder="Room/Ward"
                                                                value={roomNumber}
                                                                onChange={(e) => setRoomNumber(e.target.value)}
                                                                className="h-11 rounded-xl bg-muted/20 border-none font-bold text-xs"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator className="bg-muted/50" />

                                            {/* Section 2: Financial Application */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="h-1 bg-primary w-6 rounded-full" />
                                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Financial Application</Label>
                                                </div>

                                                {/* Global Discount */}
                                                <div className="space-y-3">
                                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Incentive</Label>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="relative">
                                                            <SmartNumberInput 
                                                                placeholder="%" 
                                                                className="h-11 text-xs pr-8 rounded-xl bg-muted/20 border-none font-bold" 
                                                                min={0}
                                                                max={100}
                                                                value={discount === 0 ? undefined : discount}
                                                                onChange={(val: number | undefined) => {
                                                                    setDiscount(val || 0)
                                                                    setDiscountFixedAmount(0)
                                                                }}
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-30">%</span>
                                                        </div>
                                                        <div className="relative">
                                                            <SmartNumberInput 
                                                                placeholder="Tk" 
                                                                className="h-11 text-xs pr-8 rounded-xl bg-muted/20 border-none font-bold" 
                                                                min={0}
                                                                value={discountFixedAmount === 0 ? undefined : discountFixedAmount}
                                                                onChange={(val: number | undefined) => {
                                                                    setDiscountFixedAmount(val || 0)
                                                                    setDiscount(0)
                                                                }}
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-30">Tk</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Method</Label>
                                                        <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                                                            <SelectTrigger className="h-11 rounded-xl border-none bg-muted/20 font-bold text-xs">
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
                                                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Amount Paid</Label>
                                                        <SmartNumberInput 
                                                            value={paidAmount}
                                                            onFocus={(e: any) => e.target.select()} 
                                                            onChange={(val: number | undefined) => setPaidAmount(val || 0)}
                                                            className="h-11 text-base font-black border-none bg-primary/5 text-primary rounded-xl tabular-nums"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target Asset Account *</Label>
                                                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                                        <SelectTrigger className="h-11 rounded-xl border-none bg-muted/20 font-bold text-xs">
                                                            <SelectValue placeholder="Choose account..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                            {accounts.map((account: FinanceAccount) => (
                                                                <SelectItem key={account.id} value={account.id} className="text-xs font-bold py-3">
                                                                    {account.name} ({account.type}) - Tk {formatCurrency(Number(account.currentBalance))}
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
                                                            className="h-11 rounded-xl bg-muted/20 border-none font-bold text-xs"
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
                                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Payable Balance</p>
                                                    <p className="text-3xl font-black tabular-nums tracking-tighter">{formatCurrency(total)}</p>
                                                </div>
                                                <div className="text-right space-y-0.5">
                                                    <p className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest",
                                                        paidAmount >= (total - 0.01) ? "text-emerald-400" : "text-rose-400"
                                                    )}>
                                                        {paidAmount >= (total - 0.01) ? "Change Back" : "Ref. Due"}
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
                                                        Complete Payment
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

            {/* Persistence Layer & Dialogs */}
            <DiagnosticReceiptDialog
                open={receiptOpen}
                onOpenChange={setReceiptOpen}
                transaction={lastSale}
            />

            <SaleDetailsDialog 
                sale={selectedSaleForDetails}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                onSuccess={() => refetchSales()}
                initialAddPayment={initialAddPayment}
            />

            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogContent className="sm:max-w-7xl md:max-w-[85vw] lg:max-w-[75vw] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[3rem]">
                    <DialogHeader className="p-8 border-b bg-muted/30">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2 capitalize">
                                    <History className="h-6 w-6 text-primary" />
                                    {type} Audit Logs
                                </DialogTitle>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em]">Financial Transaction History & Retrieval</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setHistoryOpen(false)} className="rounded-full h-10 w-10 bg-muted/50 transition-transform active:scale-75">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden flex flex-col p-8 pt-0 gap-6">
                        {/* Audit Filters */}
                        <div className="flex items-center justify-between gap-4 p-4 bg-muted/10 rounded-3xl border border-border/30">
                            <div className="relative flex-1 min-w-60">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search invoice or patient..." 
                                    className="pl-10 h-11 bg-background rounded-2xl border-none shadow-sm"
                                    value={modalSearch}
                                    onChange={(e) => setModalSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button 
                                            variant="outline" 
                                            className={cn(
                                                "h-11 rounded-2xl gap-2 px-5 border-border/50",
                                                activeFilterCount > 0 && "bg-primary/5 border-primary text-primary"
                                            )}
                                        >
                                            <Filter className="h-4 w-4" />
                                            Filters
                                            {activeFilterCount > 0 && (
                                                <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                                    {activeFilterCount}
                                                </Badge>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-5 rounded-[2rem] shadow-2xl border-none" align="end">
                                        <div className="space-y-5">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Log Filters</h4>
                                                {activeFilterCount > 0 && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => {
                                                            setModalStatus("all")
                                                            setModalPaymentStatus("all")
                                                            setModalDateRange(undefined)
                                                            setModalSearch("")
                                                        }}
                                                        className="h-8 px-2 text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                    >
                                                        Reset
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div className="grid gap-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Date Range</Label>
                                                    <DatePickerWithRange 
                                                        date={modalDateRange} 
                                                        setDate={setModalDateRange}
                                                        className="w-full"
                                                    />
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Audit Status</Label>
                                                    <Select value={modalStatus} onValueChange={setModalStatus}>
                                                        <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-none">
                                                            <SelectValue placeholder="All Status" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-none shadow-2xl">
                                                            <SelectItem value="all">All Status</SelectItem>
                                                            <SelectItem value="pending">Pending</SelectItem>
                                                            <SelectItem value="completed">Completed</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid gap-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Payment Status</Label>
                                                    <Select value={modalPaymentStatus} onValueChange={setModalPaymentStatus}>
                                                        <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-none">
                                                            <SelectValue placeholder="All Payments" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-none shadow-2xl">
                                                            <SelectItem value="all">All Payments</SelectItem>
                                                            <SelectItem value="paid">Fully Paid</SelectItem>
                                                            <SelectItem value="due">Unpaid (Due)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Audit Log Table */}
                        <div className="flex-1 border border-border/50 rounded-[2.5rem] overflow-y-auto custom-scrollbar relative bg-background shadow-xl shadow-muted/20">
                            <Table>
                                <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                                    <TableRow className="hover:bg-transparent border-b-border/30">
                                        <TableHead className="w-44 h-14 text-[10px] font-black uppercase tracking-widest pl-8">Reference</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Patient</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Financials</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Type</TableHead>
                                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingHistory ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i} className="border-b-border/10">
                                                <TableCell className="pl-8 py-6">
                                                    <div className="h-4 w-24 bg-muted animate-pulse rounded-full" />
                                                    <div className="h-3 w-16 bg-muted animate-pulse rounded-full mt-2" />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="h-4 w-32 bg-muted animate-pulse rounded-full" />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="h-4 w-28 bg-muted animate-pulse rounded-full" />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
                                                </TableCell>
                                                <TableCell className="pr-8 text-right">
                                                    <div className="h-8 w-8 bg-muted animate-pulse rounded-full ml-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : recentSales.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-64 text-center">
                                                <div className="flex flex-col items-center gap-3 opacity-20 text-muted-foreground">
                                                    <History className="h-12 w-12" />
                                                    <p className="font-black uppercase tracking-[0.3em] text-[10px]">Audit Logs Empty</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        recentSales.map((sale) => {
                                            const isDue = sale.paymentStatus === 'due' || Number(sale.dueAmount) > 0;
                                            return (
                                                <TableRow key={sale.id} className={cn(
                                                    "border-b-border/10 transition-all group",
                                                    isDue ? "text-rose-500 font-bold hover:bg-rose-500/5" : "hover:bg-muted/20"
                                                )}>
                                                    <TableCell className="pl-8 py-5">
                                                        <div className="text-xs font-black tracking-tight">{sale.invoiceNumber}</div>
                                                        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase mt-1">
                                                            {format(new Date(sale.createdAt), "MMM dd, hh:mm a")}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs font-black">{sale.patient?.name || "Walk-in"}</div>
                                                        <div className="text-[10px] font-bold text-muted-foreground/40">{sale.patient?.patientNumber || "N/A"}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs font-black">{formatCurrency(sale.netPrice)}</div>
                                                        <div className="flex gap-2 mt-1 text-[8px] font-bold uppercase">
                                                            <span className="text-emerald-500">P: {formatCurrency(sale.paidAmount)}</span>
                                                            <span className={cn(isDue ? "text-rose-500" : "text-muted-foreground/40")}>
                                                                D: {formatCurrency(sale.dueAmount)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="rounded-lg text-[8px] font-black uppercase tracking-tighter border-muted-foreground/20">
                                                            {sale.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="pr-8">
                                                        <div className="flex justify-end gap-2">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                onClick={() => {
                                                                    setLastSale(sale)
                                                                    setReceiptOpen(true)
                                                                }}
                                                                className="h-10 w-10 rounded-2xl bg-muted/30 hover:bg-primary hover:text-white transition-all group-hover:bg-primary/10 group-hover:text-primary"
                                                            >
                                                                <Receipt className="h-4 w-4" />
                                                            </Button>
                                                            {isDue && (
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    onClick={() => {
                                                                        setSelectedSaleForDetails(sale)
                                                                        setInitialAddPayment(true)
                                                                        setDetailsOpen(true)
                                                                    }}
                                                                    className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                                >
                                                                    <DollarSign className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {historyPagination && historyPagination.totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 pb-4">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                    Page {modalPage} / {historyPagination.totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        disabled={modalPage === 1 || loadingHistory}
                                        onClick={() => setModalPage(p => p - 1)}
                                        className="rounded-xl h-9 px-4 border-border/50 text-[10px] font-black uppercase"
                                    >
                                        Prev
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        disabled={modalPage === historyPagination.totalPages || loadingHistory}
                                        onClick={() => setModalPage(p => p + 1)}
                                        className="rounded-xl h-9 px-4 border-border/50 text-[10px] font-black uppercase"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

