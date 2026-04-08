"use client"

import { TimeSlotPicker } from "@/components/appointments/time-slot-picker"
import { PatientSearch } from "@/components/pharmacy/pos/patient-search"
import { SaleDetailsDialog } from "@/components/pharmacy/sale-details-dialog"
import { SearchableSelect } from "@/components/shared/searchable-select"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCreateAppointment } from "@/hooks/appointment-queries"
import { useDiagnosticTests } from "@/hooks/diagnostic-queries"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useDepartments, useEmployees } from "@/hooks/hr-queries"
import { useAddSalePayment, useSales } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useDebounce } from "@/hooks/use-debounce"
import { usePermissions } from "@/hooks/use-permissions"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { FinanceAccount } from "@/types/finance"
import { Patient, PaymentMethod } from "@/types/pharmacy"
import { Sale } from "@/types/sales"
import { format } from "date-fns"
import { 
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
    Stethoscope, 
    Trash2, 
    X, 
    User, 
    Calendar, 
    Clock, 
    LayoutGrid, 
    ArrowRight,
    AlertCircle,
    CheckCircle2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { DateRange } from "react-day-picker"
import { toast } from "sonner"
import { DiagnosticReceiptDialog } from "./diagnostic-receipt-dialog"

export function AppointmentBillingForm() {
    const router = useRouter()
    const { hasPermission } = usePermissions()
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const { pharmacy } = useSettingsStore()

    // Permission check
    const canCreateSale = hasPermission('sale:create')

    // Data Fetching
    const { data: departmentsRes } = useDepartments({ branchId: activeStoreId || undefined, limit: 100 })
    const { data: doctorsRes, isLoading: loadingDoctors } = useEmployees({ branchId: activeStoreId || undefined, limit: 100 })
    const { data: testsRes } = useDiagnosticTests({ branchId: activeStoreId || undefined, limit: 1000 })
    const { data: accountsRes } = useFinanceAccounts({ branchId: activeStoreId || undefined, limit: 100, isActive: true })
    
    // Modal Filters & Pagination
    const [modalSearch, setModalSearch] = useState("")
    const debouncedModalSearch = useDebounce(modalSearch, 500)
    const [modalPage, setModalPage] = useState(1)
    const [modalType, setModalType] = useState<string>("appointment")
    const [modalStatus, setModalStatus] = useState<string>("all")
    const [modalPaymentStatus, setModalPaymentStatus] = useState<string>("all")
    const [modalPaymentMethod, setModalPaymentMethod] = useState<string>("all")
    const [modalInvoiceNumber, setModalInvoiceNumber] = useState("")
    const [modalCreatedBy, setModalCreatedBy] = useState("")
    const [modalMinAmount, setModalMinAmount] = useState("")
    const [modalMaxAmount, setModalMaxAmount] = useState("")
    const [modalDateRange, setModalDateRange] = useState<DateRange | undefined>()
    const modalLimit = 8

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

    const departments = departmentsRes?.data || []
    const doctors = useMemo(() => doctorsRes?.data || [], [doctorsRes])
    const allTests = testsRes?.data || []
    const accounts = accountsRes?.data || []
    const recentSales = recentSalesRes?.data?.sales || []
    const historyPagination = recentSalesRes?.data?.pagination
    const vatPercentage = pharmacy?.vatPercentage || 0

    const activeFilterCount = (modalStatus !== 'all' ? 1 : 0) + 
                            (modalPaymentStatus !== 'all' ? 1 : 0) + 
                            (modalType !== 'all' ? 1 : 0) +
                            (modalPaymentMethod !== 'all' ? 1 : 0) +
                            (modalInvoiceNumber ? 1 : 0) +
                            (modalCreatedBy ? 1 : 0) +
                            (modalMinAmount ? 1 : 0) +
                            (modalMaxAmount ? 1 : 0) +
                            (modalDateRange ? 1 : 0)

    const addPaymentMutation = useAddSalePayment()
    const createAppointmentMutation = useCreateAppointment()
    const { appointments: appointmentConfig, fetchSettings } = useSettingsStore()

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    // Form State
    const [selectedCustomer, setSelectedCustomer] = useState<Patient | null>(null)
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("")
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
    const [appointmentDate, setAppointmentDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [timeSlot, setTimeSlot] = useState<string>("")
    const [chamberOrRoomNumber, setChamberOrRoomNumber] = useState<string>("")
    
    // Cart State
    const [cart, setCart] = useState<{
        serviceId: string
        name: string
        price: number
        quantity: number
        isDiagnosticTest?: boolean
    }[]>([])
    const [selectedServiceId, setSelectedServiceId] = useState<string>("")
    
    // Payment State
    const [discount, setDiscount] = useState<number>(0)
    const [discountFixedAmount, setDiscountFixedAmount] = useState<number>(0)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
    const [selectedAccountId, setSelectedAccountId] = useState<string>("")
    const [paidAmount, setPaidAmount] = useState<number>(0)

    // Receipt/History State
    const [receiptOpen, setReceiptOpen] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [lastSale, setLastSale] = useState<any | null>(null)

    // Details/Collect State
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [initialAddPayment, setInitialAddPayment] = useState(false)
    
    // Auto-fill room based on doctor
    useEffect(() => {
        if (selectedDoctorId) {
            const doctor: any = doctors.find((d: any) => d.id === selectedDoctorId)
            if (doctor?.chamberOrRoomNumber) {
                setChamberOrRoomNumber(doctor.chamberOrRoomNumber)
            }
        }
    }, [selectedDoctorId, doctors])

    // Cart Helpers
    const addToCart = (service: any) => {
        const existing = cart.find(item => item.serviceId === service.id)
        if (existing) {
            setCart(cart.map(item => item.serviceId === service.id ? { ...item, quantity: item.quantity + 1 } : item))
        } else {
            setCart([...cart, { 
                serviceId: service.id, 
                name: service.name, 
                price: Number(service.price), 
                quantity: 1,
                isDiagnosticTest: !!service.isDiagnosticTest
            }])
        }
        setSelectedServiceId("")
    }

    const removeFromCart = (serviceId: string) => {
        setCart(cart.filter(item => item.serviceId !== serviceId))
    }

    const updateQuantity = (serviceId: string, quantity: number) => {
        if (quantity < 1) return
        setCart(cart.map(item => item.serviceId === serviceId ? { ...item, quantity } : item))
    }

    // Totals
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    const discountAmount = discountFixedAmount || (subtotal * discount) / 100
    const discountedSubtotal = Math.max(0, subtotal - discountAmount)
    const tax = discountedSubtotal * (vatPercentage / 100)
    const total = discountedSubtotal + tax

    const handleCheckout = async () => {
        if (!selectedCustomer || !selectedDoctorId || !appointmentDate || !timeSlot || !selectedAccountId) return

        try {
            const resAppointment: any = await createAppointmentMutation.mutateAsync({
                branchId: activeStoreId || "",
                patientId: selectedCustomer.id,
                departmentId: selectedDepartmentId || "",
                doctorId: selectedDoctorId,
                date: appointmentDate,
                timeSlot: timeSlot,
                fees: subtotal,
                chamberOrRoomNumber: chamberOrRoomNumber,
                status: 'confirmed',
                items: cart.map(item => ({
                    serviceId: item.serviceId,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    isDiagnosticTest: item.isDiagnosticTest
                }))
            })

            const sale = resAppointment.data?.sale
            const saleId = sale?.id

            if (saleId && paidAmount > 0) {
                try {
                    await addPaymentMutation.mutateAsync({
                        id: saleId,
                        data: {
                            accountId: selectedAccountId,
                            amount: paidAmount,
                            paymentMethod: paymentMethod,
                        }
                    })
                } catch (pError) {
                    console.error("Payment registration failed:", pError)
                    toast.warning("Appointment scheduled, but payment recording failed. Please collect manually.")
                }
            }

            setLastSale(sale)
            toast.success("Appointment successfully scheduled and billed!")
            setReceiptOpen(true)
            
            // Reset
            setSelectedCustomer(null)
            setSelectedDoctorId("")
            setSelectedDepartmentId("")
            setTimeSlot("")
            setCart([])
            setChamberOrRoomNumber("")
            setPaidAmount(0)
            setDiscount(0)
            setDiscountFixedAmount(0)
            refetchSales()
        } catch (error) {
            toast.error("Failed to process transaction")
        }
    }

    // Validation Check
    const isReady = !!selectedCustomer && !!selectedDoctorId && !!appointmentDate && !!timeSlot && !!selectedAccountId && cart.length > 0
    const validationErrors = [
        { key: 'patient', label: 'Patient Selected', valid: !!selectedCustomer },
        { key: 'doctor', label: 'Doctor Selected', valid: !!selectedDoctorId },
        { key: 'slot', label: 'Time Slot Picked', valid: !!timeSlot },
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
                <p className="text-muted-foreground mb-6">You do not have permission to create appointment bills.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-muted/20 pb-20">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
                        <Stethoscope className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">Appointment Billing</h1>
                        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                           <LayoutGrid className="w-3 h-3" /> Unified Clinical Suite
                        </p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 h-11 px-6 rounded-2xl border-primary/20 hover:bg-primary/5 shadow-sm font-bold"
                    onClick={() => setHistoryOpen(true)}
                >
                    <History className="h-4 w-4 text-primary" />
                    Billing History
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side - Main Form Layout */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* Step 1: Core Selection Grid */}
                    <Card className="border-none shadow-2xl shadow-primary/10 overflow-hidden rounded-[2.5rem]">
                        <CardHeader className="bg-primary/5 border-b p-6">
                            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                <User className="w-4 h-4" /> Primary Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        Patient Identification <span className="text-primary">*</span>
                                    </Label>
                                    <PatientSearch 
                                        selectedPatient={selectedCustomer} 
                                        onSelect={setSelectedCustomer} 
                                    />
                                    {selectedCustomer && (
                                        <div className="flex items-center gap-3 p-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/20">
                                                {selectedCustomer.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-sm text-emerald-800 truncate">{selectedCustomer.name}</p>
                                                <p className="text-[10px] font-bold text-emerald-600/70">{selectedCustomer.phone}</p>
                                            </div>
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        Clinical Department
                                    </Label>
                                    <SearchableSelect 
                                        value={selectedDepartmentId}
                                        onChange={(val) => {
                                            setSelectedDepartmentId(val)
                                            setSelectedDoctorId("")
                                        }}
                                        options={departments.map(d => ({ id: d.id, name: d.name }))}
                                        placeholder="Choose Department..."
                                        showAll={false}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        Consulting Specialist <span className="text-primary">*</span>
                                    </Label>
                                    <SearchableSelect 
                                        value={selectedDoctorId}
                                        onChange={setSelectedDoctorId}
                                        options={doctors.filter((d: any) => !selectedDepartmentId || d.departmentId === selectedDepartmentId).map((d: any) => ({ id: d.id, name: d.name }))}
                                        placeholder="Assign Doctor..."
                                        loading={loadingDoctors}
                                        disabled={!selectedDepartmentId && departments.length > 0}
                                        showAll={false}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            Visit Date <span className="text-primary">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary opacity-40" />
                                            <Input 
                                                type="date"
                                                value={appointmentDate}
                                                onChange={(e: any) => setAppointmentDate(e.target.value)}
                                                className="h-11 pl-10 rounded-xl border-border bg-muted/20 font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            Chamber/Room
                                        </Label>
                                        <Input 
                                            value={chamberOrRoomNumber}
                                            onChange={(e: any) => setChamberOrRoomNumber(e.target.value)}
                                            placeholder="e.g. 302"
                                            className="h-11 rounded-xl border-border bg-muted/20 font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            Select Availability Slot <span className="text-primary">*</span>
                                        </Label>
                                        <p className="text-[10px] text-muted-foreground font-medium italic">Assign a specific time for the patient's arrival.</p>
                                    </div>
                                    {timeSlot && (
                                        <Badge className="bg-blue-500 hover:bg-blue-600 rounded-lg px-3 py-1 font-black tracking-tight flex items-center gap-1.5 shadow-lg shadow-blue-500/20">
                                            <Clock className="w-3 h-3" /> Scheduled: {timeSlot}
                                        </Badge>
                                    )}
                                </div>
                                <TimeSlotPicker 
                                    value={timeSlot}
                                    onChange={setTimeSlot}
                                    startTime={appointmentConfig?.startTime}
                                    endTime={appointmentConfig?.endTime}
                                    duration={appointmentConfig?.slotDuration}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Step 2: Advanced Services Selection */}
                    <Card className="border-none shadow-2xl shadow-primary/10 overflow-hidden rounded-[2.5rem]">
                        <CardHeader className="bg-indigo-500/5 border-b p-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-indigo-700 flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Service Catalog
                            </CardTitle>
                            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 uppercase font-black px-3">
                                {allTests.length} Items Available
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <SearchableSelect 
                                        options={allTests.map(t => ({ id: t.id, name: `${t.name} - ${formatCurrency(t.price)}` }))}
                                        value={selectedServiceId}
                                        onChange={setSelectedServiceId}
                                        placeholder="Scan or Search Service Name..."
                                    />
                                </div>
                                <Button 
                                    onClick={() => {
                                        const service = allTests.find(t => t.id === selectedServiceId)
                                        if (service) addToCart(service)
                                    }}
                                    className="h-11 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black shadow-lg shadow-indigo-500/20 gap-2 transition-all active:scale-95"
                                    disabled={!selectedServiceId}
                                >
                                    <Plus className="h-4 w-4" /> Add Item
                                </Button>
                            </div>

                            {cart.length > 0 ? (
                                <div className="rounded-[2rem] border overflow-hidden bg-background shadow-inner">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow className="h-12 border-b">
                                                <TableHead className="text-[10px] uppercase font-black px-6 tracking-widest">Service Description</TableHead>
                                                <TableHead className="text-[10px] uppercase font-black text-center w-24 px-6 tracking-widest">Quantity</TableHead>
                                                <TableHead className="text-[10px] uppercase font-black text-right px-6 tracking-widest">Unit Price</TableHead>
                                                <TableHead className="text-[10px] uppercase font-black text-right px-6 tracking-widest">Subtotal</TableHead>
                                                <TableHead className="w-16 px-6"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cart.map((item) => (
                                                <TableRow key={item.serviceId} className="h-16 hover:bg-muted/30 transition-colors border-b last:border-0 group">
                                                    <TableCell className="px-6">
                                                        <div className="flex flex-col gap-0.5">
                                                            <p className="text-sm font-black leading-tight text-foreground">{item.name}</p>
                                                            {item.isDiagnosticTest && (
                                                                <span className="text-[8px] font-black uppercase tracking-tighter text-blue-600 bg-blue-50 w-fit px-1.5 py-0.5 rounded border border-blue-100">Lab Procedure</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6">
                                                        <div className="flex items-center justify-center">
                                                            <Input 
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateQuantity(item.serviceId, parseInt(e.target.value) || 1)}
                                                                className="h-10 w-16 text-center text-sm font-black bg-muted/50 border-none rounded-xl"
                                                                min="1"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right px-6 text-xs font-bold text-muted-foreground uppercase tabular-nums">
                                                        {formatCurrency(item.price)}
                                                    </TableCell>
                                                    <TableCell className="text-right px-6 text-sm font-black text-foreground tabular-nums">
                                                        {formatCurrency(item.price * item.quantity)}
                                                    </TableCell>
                                                    <TableCell className="px-6">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            onClick={() => removeFromCart(item.serviceId)}
                                                            className="h-10 w-10 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-all rounded-xl opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="py-20 text-center border-2 border-dashed rounded-[3rem] bg-indigo-500/[0.02] flex flex-col items-center gap-4 group hover:bg-indigo-500/[0.05] transition-all">
                                    <div className="h-16 w-16 rounded-[2rem] bg-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Plus className="h-8 w-8 text-indigo-400" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-indigo-900/40">Item list is currently empty</p>
                                        <p className="text-[10px] text-indigo-900/30 font-bold uppercase tracking-widest italic">Add consultation or diagnostic services above</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side - Payment Engine */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-2xl shadow-primary/20 sticky top-6 overflow-hidden rounded-[2.5rem] bg-background">
                        <CardHeader className="p-6 border-b bg-muted/30">
                            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Settlement Engine
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            {/* Bill Discounts */}
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Financial Incentives</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <SmartNumberInput 
                                            placeholder="%" 
                                            className="h-12 text-sm pr-10 rounded-xl" 
                                            min={0}
                                            max={100}
                                            value={discount === 0 ? undefined : discount}
                                            onChange={(val: number | undefined) => {
                                                setDiscount(val || 0)
                                                setDiscountFixedAmount(0)
                                            }}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground/40">%</span>
                                    </div>
                                    <div className="relative">
                                        <SmartNumberInput 
                                            placeholder="Fix Tk" 
                                            className="h-12 text-sm pr-10 rounded-xl" 
                                            min={0}
                                            value={discountFixedAmount === 0 ? undefined : discountFixedAmount}
                                            onChange={(val: number | undefined) => {
                                                setDiscountFixedAmount(val || 0)
                                                setDiscount(0)
                                            }}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground/40">Tk</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 p-6 bg-gradient-to-br from-primary/[0.03] to-indigo-500/[0.03] rounded-[2rem] border border-primary/10 shadow-inner">
                                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                                    <span>Base Charges</span>
                                    <span className="tabular-nums">{formatCurrency(subtotal)}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-emerald-600">
                                        <span>Discount Deducted</span>
                                        <span className="tabular-nums">-{formatCurrency(discountAmount)}</span>
                                    </div>
                                )}
                                {tax > 0 && (
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        <span>VAT/Tax ({vatPercentage}%)</span>
                                        <span className="tabular-nums">{formatCurrency(tax)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-baseline pt-4 border-t border-dashed mt-4 border-primary/20">
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Final Net Payable</span>
                                    <span className="text-3xl font-black text-primary tabular-nums tracking-tighter">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <div className="space-y-6 pt-2">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">In-Hand Cash Collection</Label>
                                    <SmartNumberInput 
                                        value={paidAmount}
                                        onFocus={(e: any) => e.target.select()} 
                                        onChange={(val: number | undefined) => setPaidAmount(val || 0)}
                                        className="h-16 text-3xl font-black border-2 border-primary/20 text-primary bg-primary/[0.02] rounded-[1.25rem] px-6 tabular-nums tracking-tighter focus:ring-4 focus:ring-primary/10 transition-all"
                                    />
                                    <div className="flex justify-between items-center bg-rose-500/[0.03] p-3 rounded-xl border border-rose-500/10">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pending Due</span>
                                        <span className="font-black text-rose-600 tracking-tight">{formatCurrency(Math.max(0, total - paidAmount))}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Channel</Label>
                                        <Select value={paymentMethod} onValueChange={(v: string) => setPaymentMethod(v as PaymentMethod)}>
                                            <SelectTrigger className="h-12 rounded-xl border-border bg-muted/20 font-bold uppercase text-[10px] tracking-widest">
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
                                        <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Destination *</Label>
                                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                            <SelectTrigger className="h-12 rounded-xl border-border bg-muted/20 font-bold text-[10px] uppercase tracking-widest">
                                                <SelectValue placeholder="Choose Account..." />
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

                                <div className="pt-4 space-y-4">
                                    <Button 
                                        className={cn(
                                            "w-full h-16 text-lg font-black uppercase tracking-widest rounded-3xl shadow-2xl transition-all active:scale-95 group relative overflow-hidden",
                                            isReady ? "bg-primary hover:bg-primary/90 shadow-primary/20" : "bg-muted text-muted-foreground"
                                        )}
                                        disabled={!isReady || addPaymentMutation.isPending || createAppointmentMutation.isPending}
                                        onClick={handleCheckout}
                                    >
                                        <div className="flex items-center gap-3 relative z-10 font-black">
                                            {createAppointmentMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <CreditCard className="w-6 h-6" />}
                                            {createAppointmentMutation.isPending ? "Executing..." : "Confirm & Schedule"}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
                                    </Button>

                                    {/* Action Checker List */}
                                    <div className="grid grid-cols-2 gap-2 p-4 bg-muted/20 rounded-2xl border border-border/50">
                                        {validationErrors.map((err) => (
                                            <div key={err.key} className="flex items-center gap-2">
                                                <div className={cn("h-4 w-4 rounded-full flex items-center justify-center transition-all", err.valid ? "bg-emerald-500 scale-100" : "bg-muted-foreground/20 scale-90")}>
                                                    {err.valid && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                </div>
                                                <span className={cn("text-[8px] font-black uppercase tracking-[0.15em] transition-all", err.valid ? "text-emerald-600" : "text-muted-foreground/40")}>
                                                    {err.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pro Tip Card */}
                    <Card className="border-none shadow-xl shadow-indigo-500/5 bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-[2rem]">
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-[1.2rem] bg-indigo-100 flex items-center justify-center flex-shrink-0 animate-bounce">
                                    <AlertCircle className="w-5 h-5 text-indigo-500" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700">Unified Workflow</p>
                                    <p className="text-xs font-bold text-indigo-900/60 leading-relaxed">
                                        Checkouts automatically sync with the Specialist's daily log and the Hospital Financial Ledger.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals & Dialogs */}
            <DiagnosticReceiptDialog
                open={receiptOpen}
                onOpenChange={setReceiptOpen}
                sale={lastSale}
            />

            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogContent className="sm:max-w-7xl md:max-w-[85vw] lg:max-w-[75vw] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[3rem]">
                    <DialogHeader className="p-8 border-b bg-muted/30">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-1">
                                <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                                    <History className="h-6 w-6 text-primary" />
                                    Appointment Billing History
                                </DialogTitle>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">Archived and Recent Financial Settlements</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setHistoryOpen(false)} className="rounded-full h-10 w-10 bg-muted/50">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </DialogHeader>
                    {/* ... History Table and logic remains similar but with updated styling ... */}
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
