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
    Radiation
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
    type: 'pathology' | 'radiology'
    title: string
    description: string
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
    staffId: string
    staffName: string
    discountAmount: number
    discountPercentage: number
    serviceId: string
    isDiagnosticTest: boolean
}

export function DiagnosticBillingForm({ type, title, description }: DiagnosticBillingFormProps) {
    const router = useRouter()
    const { hasPermission } = usePermissions()
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const { pharmacy } = useSettingsStore()
    const { user } = useAuthStore()

    // Permission check
    const canCreateSale = type === 'pathology' 
        ? hasPermission('pathology:create') 
        : hasPermission('radiology:create')

    // Data Fetching
    const { data: testsRes } = useDiagnosticTests({ 
        branchId: activeStoreId || undefined, 
        limit: 1000,
    })
    const { data: usersRes, isLoading: loadingUsers } = useUsers({ 
        branchId: activeStoreId || undefined,
        limit: 1000 
    })
    const { data: staffRes, isLoading: loadingStaff } = useEmployees({ branchId: activeStoreId || undefined, limit: 1000 })
    const { data: accountsRes } = useFinanceAccounts({ branchId: activeStoreId || undefined, limit: 10, isActive: true })

    // Modal Filters & Pagination
    const [modalSearch, setModalSearch] = useState("")
    const debouncedModalSearch = useDebounce(modalSearch, 500)
    const [modalPage, setModalPage] = useState(1)
    const [modalType, setModalType] = useState<string>(type)
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

    const allStaff = staffRes?.data || []
    const allTests = testsRes?.data || []
    const users = usersRes?.data || []
    const staffs = useMemo(() => staffRes?.data || [], [staffRes])
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
    const [selectedStaffId, setSelectedStaffId] = useState<string>("") 
    const [roomNumber, setRoomNumber] = useState<string>("")
    const [cart, setCart] = useState<CartItem[]>([])
    
    // Payment State
    const [discount, setDiscount] = useState<number>(0)
    const [discountFixedAmount, setDiscountFixedAmount] = useState<number>(0)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
    const [selectedAccountId, setSelectedAccountId] = useState<string>("")
    const [paidAmount, setPaidAmount] = useState<number>(0)
    
    // Set default staff to currently logged in user
    useEffect(() => {
        if (user && staffs.length > 0 && !selectedStaffId) {
            const currentStaff = staffs.find(s => s.id === user.id || (s as any).userId === user.id)
            if (currentStaff) {
                setTimeout(() => setSelectedStaffId(currentStaff.id), 0)
            }
        }
    }, [user, staffs, selectedStaffId])

    // Handlers
    const handleAddTest = () => {
        if (!selectedTestId) return
        
        const test = allTests.find(t => t.id === selectedTestId)
        if (!test) return

        if (cart.some(item => item.testId === test.id)) {
            toast.error("This service is already added to the bill")
            return
        }

        const delivery = new Date()
        delivery.setDate(delivery.getDate() + (test.reportDays || 0))
        const deliveryStr = delivery.toISOString().split('T')[0]

        const staff = allStaff.find(s => s.id === selectedStaffId)
        const newItem: CartItem = {
            id: Math.random().toString(36).substring(7),
            testId: test.id,
            name: test.name,
            price: Number(test.price),
            quantity: 1,
            unit: test.unit || 'procedure',
            reportDays: test.reportDays || 0,
            deliveryDate: deliveryStr,
            staffId: staff?.id || "",
            staffName: staff?.name || "",
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
            doctorId: selectedDoctorId || undefined,
            staffId: cart.find(c => c.staffId)?.staffId,
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
                testBy: item.staffName || "",
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
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-muted/20 pb-20">
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
                    
                    {/* Patient & Consultant Settings */}
                    <Card className="border-none shadow-2xl shadow-primary/10 overflow-hidden rounded-[2.5rem]">
                        <CardHeader className="bg-primary/3 border-b p-6">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2">
                                <User className="w-4 h-4" /> Personnel Assignment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Patient Registry *</Label>
                                    <PatientSearch 
                                        selectedPatient={selectedCustomer} 
                                        onSelect={setSelectedCustomer} 
                                    />
                                    {selectedCustomer && (
                                        <div className="flex items-center gap-3 p-3 bg-emerald-500/3 rounded-2xl border border-emerald-500/20 animate-in fade-in slide-in-from-left-2 duration-300">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20">
                                                {selectedCustomer.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-sm text-foreground truncate">{selectedCustomer.name}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground">{selectedCustomer.phone}</p>
                                            </div>
                                            <div className="ml-auto flex flex-col items-end">
                                                <Badge className="bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-lg">ID: {selectedCustomer.patientNumber}</Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Referred Consultant</Label>
                                    <SearchableSelect 
                                        value={selectedDoctorId}
                                        onChange={setSelectedDoctorId}
                                        options={users.map((u: any) => ({ 
                                            id: u.id, 
                                            name: u.fullName || u.username 
                                        }))}
                                        placeholder="Select Consultant..."
                                        loading={loadingUsers}
                                        showAll={false}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Facilitator / Agent</Label>
                                    <ReferralSearch 
                                        selectedReferralId={selectedReferralPersonId}
                                        onSelect={(referral) => setSelectedReferralPersonId(referral?.id || "")}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location Reference</Label>
                                    <div className="relative">
                                        <DoorOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-30" />
                                        <Input 
                                            placeholder="Room or Ward Number"
                                            value={roomNumber}
                                            onChange={(e) => setRoomNumber(e.target.value)}
                                            className="h-11 pl-10 rounded-xl bg-muted/20 border-border focus:ring-primary/10 transition-all font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Procedure Inventory & Selection */}
                    <Card className="border-none shadow-2xl shadow-primary/10 overflow-hidden rounded-[2.5rem]">
                        <CardHeader className="bg-indigo-500/3 border-b p-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-700 flex items-center gap-2">
                                <TestTube2 className="w-4 h-4" /> Lab Procedure Queue
                            </CardTitle>
                            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 uppercase font-black px-3 rounded-lg">
                                {allTests.length} Valid Services
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-3 space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Search Catalog</Label>
                                    <SearchableSelect 
                                        value={selectedTestId}
                                        onChange={setSelectedTestId}
                                        options={allTests.map(t => ({ id: t.id, name: `${t.name} - ${formatCurrency(Number(t.price))}` }))}
                                        placeholder="Enter Service Code or Name..."
                                        showAll={false}
                                    />
                                </div>
                                <div className="flex-[2] space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Operator Assign</Label>
                                    <SearchableSelect 
                                        value={selectedStaffId}
                                        onChange={setSelectedStaffId}
                                        options={staffs.map(s => ({ id: s.id, name: s.name }))}
                                        placeholder="Select Technician..."
                                        loading={loadingStaff}
                                        showAll={false}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button 
                                        onClick={handleAddTest} 
                                        disabled={!selectedTestId}
                                        className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-lg shadow-indigo-500/20 gap-2 transition-all active:scale-95 w-full lg:w-auto"
                                    >
                                        <Plus className="h-4 w-4" /> Add Item
                                    </Button>
                                </div>
                            </div>

                            {cart.length > 0 ? (
                                <div className="rounded-[2rem] border overflow-hidden bg-background shadow-inner">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
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
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                                                    By: {item.staffName || "Auto"}
                                                                </span>
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
                                                        {formatCurrency(item.price)}
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

                {/* Vertical Settlement Engine */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-2xl shadow-primary/20 sticky top-6 overflow-hidden rounded-[2.5rem] bg-background">
                        <CardHeader className="p-6 border-b bg-muted/30">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Settlement Parameters
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            
                            {/* Global Incentive Application */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Bulk Discount Factor</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <SmartNumberInput 
                                            placeholder="Percent %" 
                                            className="h-12 text-sm pr-10 rounded-2xl bg-muted/5 focus:ring-primary/10 transition-all font-bold" 
                                            min={0}
                                            max={100}
                                            value={discount === 0 ? undefined : discount}
                                            onChange={(val: number | undefined) => {
                                                setDiscount(val || 0)
                                                setDiscountFixedAmount(0)
                                            }}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground/30">%</span>
                                    </div>
                                    <div className="relative">
                                        <SmartNumberInput 
                                            placeholder="Fixed TK" 
                                            className="h-12 text-sm pr-10 rounded-2xl bg-muted/5 focus:ring-primary/10 transition-all font-bold" 
                                            min={0}
                                            value={discountFixedAmount === 0 ? undefined : discountFixedAmount}
                                            onChange={(val: number | undefined) => {
                                                setDiscountFixedAmount(val || 0)
                                                setDiscount(0)
                                            }}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground/30">Tk</span>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Visualizer */}
                            <div className="space-y-4 p-6 bg-linear-to-br from-primary/4 to-indigo-500/4 rounded-[2rem] border border-primary/10 shadow-inner">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                    <span>Gross Aggregate</span>
                                    <span className="tabular-nums font-bold">{formatCurrency(subtotal)}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                        <span>Discount Correction</span>
                                        <span className="tabular-nums font-bold">-{formatCurrency(discountAmount)}</span>
                                    </div>
                                )}
                                {tax > 0 && (
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        <span>Consolidated Tax ({vatPercentage}%)</span>
                                        <span className="tabular-nums font-bold">{formatCurrency(tax)}</span>
                                    </div>
                                )}
                                <div className="pt-5 border-t border-dashed border-primary/20 flex flex-col gap-1 items-end">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 text-right">Adjusted Net Total</span>
                                    <span className="text-4xl font-black text-primary tabular-nums tracking-tighter decoration-primary/10 underline underline-offset-8 decoration-4">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            {/* Payment Matrix */}
                            <div className="space-y-6 pt-4">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Received Cash/Credit</Label>
                                    <SmartNumberInput 
                                        value={paidAmount}
                                        onFocus={(e: any) => e.target.select()} 
                                        onChange={(val: number | undefined) => setPaidAmount(val || 0)}
                                        className="h-20 text-4xl font-black border-2 border-primary/20 text-primary bg-primary/3 rounded-[1.5rem] px-8 tabular-nums tracking-tighter focus:ring-8 focus:ring-primary/5 transition-all outline-none"
                                    />
                                    <div className="flex justify-between items-center bg-rose-500/4 px-4 py-3 rounded-xl border border-rose-500/10">
                                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">Residual Bal.</span>
                                        <span className="font-black text-rose-600 text-lg tabular-nums">{formatCurrency(Math.max(0, total - paidAmount))}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Instrument</Label>
                                        <Select value={paymentMethod} onValueChange={(v: string) => setPaymentMethod(v as PaymentMethod)}>
                                            <SelectTrigger className="h-12 rounded-xl border-border bg-muted/10 font-black text-[10px] uppercase tracking-widest focus:ring-primary/10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                {['cash', 'card', 'online', 'cheque', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer'].map(method => (
                                                    <SelectItem key={method} value={method} className="text-[10px] font-black uppercase tracking-widest py-3">
                                                        {method}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Bank/Vault *</Label>
                                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                            <SelectTrigger className="h-12 rounded-xl border-border bg-muted/10 font-black text-[10px] uppercase tracking-widest focus:ring-primary/10">
                                                <SelectValue placeholder="Source..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                {accounts.map((account: FinanceAccount) => (
                                                    <SelectItem key={account.id} value={account.id} className="text-[10px] font-black uppercase tracking-widest py-3">
                                                        {account.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="pt-6 space-y-5">
                                    <Button 
                                        className={cn(
                                            "w-full h-20 text-xl font-black uppercase tracking-[0.2em] rounded-[1.75rem] shadow-2xl transition-all active:scale-95 group relative overflow-hidden",
                                            isReady ? "bg-primary hover:bg-primary/95 shadow-primary/30" : "bg-muted text-muted-foreground"
                                        )}
                                        disabled={!isReady || createSaleMutation.isPending}
                                        onClick={handleCheckout}
                                    >
                                        <div className="flex items-center gap-4 relative z-10 font-black">
                                            {createSaleMutation.isPending ? <Loader2 className="w-7 h-7 animate-spin" /> : <CreditCard className="w-7 h-7" />}
                                            {createSaleMutation.isPending ? "Syncing..." : "Finalize Order"}
                                        </div>
                                        {isReady && <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1500" />}
                                    </Button>

                                    {/* Action Checker Matrix */}
                                    <div className="grid grid-cols-1 gap-1 p-5 bg-muted/30 rounded-[1.5rem] border border-border/50 shadow-inner">
                                        {validationErrors.map((err) => (
                                            <div key={err.key} className="flex items-center gap-3 py-1">
                                                <div className={cn(
                                                    "h-5 w-5 rounded-full flex items-center justify-center transition-all duration-500", 
                                                    err.valid ? "bg-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-muted-foreground/10 outline outline-1 outline-muted-foreground/20"
                                                )}>
                                                    {err.valid && <CheckCircle2 className="w-3.5 h-3.5 text-white animate-in zoom-in duration-300" />}
                                                </div>
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-500", 
                                                    err.valid ? "text-emerald-700 opacity-100" : "text-muted-foreground/30"
                                                )}>
                                                    {err.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Operational Support Card */}
                    <Card className="border-none shadow-xl shadow-primary/5 bg-indigo-50 dark:bg-indigo-900/5 rounded-[2rem]">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center flex-shrink-0">
                                    <AlertCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Financial Integrity</p>
                                    <p className="text-[10px] font-bold text-indigo-900/40 dark:text-indigo-100/40 leading-relaxed uppercase">
                                        All transactions are immutable once finalized and automatically reconciled with branch ledgers.
                                    </p>
                                </div>
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
                        <div className="flex-1 border border-border/50 rounded-[2.5rem] overflow-hidden bg-background shadow-xl shadow-muted/20">
                            <Table>
                                <TableHeader className="bg-muted/30">
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

function Loader2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
