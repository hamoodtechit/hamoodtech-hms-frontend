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
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useDepartments, useEmployees } from "@/hooks/hr-queries"
import { useCreateSale, useSales } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { FinanceAccount } from "@/types/finance"
import { Patient, PaymentMethod } from "@/types/pharmacy"
import { Sale, SalePayload } from "@/types/sales"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, CreditCard, DollarSign, Eye, Filter, History, Receipt, Search, Stethoscope, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { toast } from "sonner"
import { DiagnosticReceiptDialog } from "./diagnostic-receipt-dialog"

export function AppointmentBillingForm() {
    const router = useRouter()
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const { pharmacy } = useSettingsStore()

    // Data Fetching
    const { data: departmentsRes } = useDepartments({ branchId: activeStoreId, limit: 100 })
    const { data: doctorsRes, isLoading: loadingDoctors } = useEmployees({ branchId: activeStoreId, employeeType: "doctor", limit: 100 })
    const { data: accountsRes } = useFinanceAccounts({ branchId: activeStoreId, limit: 100, isActive: true })
    
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
    const doctors = doctorsRes?.data || []
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

    const createSaleMutation = useCreateSale()
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
    const [consultationFee, setConsultationFee] = useState<number>(500) // Default fee
    
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


    // Totals
    const subtotal = consultationFee
    const discountAmount = discountFixedAmount || (subtotal * discount) / 100
    const discountedSubtotal = Math.max(0, subtotal - discountAmount)
    const tax = discountedSubtotal * (vatPercentage / 100)
    const total = discountedSubtotal + tax

    const handleCheckout = async () => {
        if (!selectedCustomer) {
            toast.error("Please select a patient")
            return
        }
        if (!selectedDoctorId) {
            toast.error("Please select a consulting doctor")
            return
        }
        if (!appointmentDate || !timeSlot) {
            toast.error("Please select appointment date and time slot first")
            return
        }
        if (!selectedAccountId) {
            toast.error("Please select a target finance account")
            return
        }
        if (consultationFee < 0) {
            toast.error("Consultation fee cannot be negative")
            return
        }

        try {
            // 1. Create Appointment Record first
            await createAppointmentMutation.mutateAsync({
                branchId: activeStoreId || "",
                patientId: selectedCustomer.id,
                departmentId: selectedDepartmentId || "",
                doctorId: selectedDoctorId,
                date: appointmentDate,
                timeSlot: timeSlot,
                fees: consultationFee,
                status: 'confirmed'
            })

            // 2. Process Billing 
            const payload: SalePayload = {
                branchId: activeStoreId || "",
                patientId: selectedCustomer.id,
                type: 'appointment',
                doctorId: selectedDoctorId,
                status: paidAmount >= total ? 'completed' : 'pending',
                paymentMethod: paymentMethod,
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
                saleItems: [{
                    itemName: 'Consultation Charge',
                    unit: 'Item',
                    price: consultationFee,
                    mrp: consultationFee,
                    quantity: 1,
                    discountPercentage: discount,
                    discountAmount: discountAmount,
                    deliveryDate: new Date().toISOString().split('T')[0],
                    medicineId: "",
                    batchNumber: "",
                    expiryDate: ""
                }]
            }

            const res: any = await createSaleMutation.mutateAsync(payload)
            setLastSale(res.data)
            toast.success("Appointment successfully scheduled and billed!")
            
            // Generate Receipt
            setReceiptOpen(true)

            // Reset
            setSelectedCustomer(null)
            setSelectedDoctorId("")
            setSelectedDepartmentId("")
            setTimeSlot("")
            setConsultationFee(500)
            setPaidAmount(0)
            setDiscount(0)
            setDiscountFixedAmount(0)
            refetchSales()
            // Optionally router.push('/sales') to see receipt
        } catch (error) {
            toast.error("Failed to process transaction")
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-primary">Appointment Billing</h1>
                    <p className="text-muted-foreground text-sm font-medium">Record and collect consultation fees for doctor appointments.</p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-primary/20 hover:bg-primary/5 shadow-sm"
                    onClick={() => setHistoryOpen(true)}
                >
                    <History className="h-4 w-4 text-primary" />
                    Billing History
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side - Selection & Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl shadow-primary/5">
                        <CardHeader className="p-4 border-b bg-muted/30">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Consultation Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Patient Selection *
                                    </Label>
                                    <PatientSearch 
                                        selectedPatient={selectedCustomer} 
                                        onSelect={setSelectedCustomer} 
                                    />
                                    {selectedCustomer && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 p-2 rounded border border-primary/10 mt-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {selectedCustomer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{selectedCustomer.name}</p>
                                                <p className="text-[10px]">{selectedCustomer.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Department
                                    </Label>
                                    <SearchableSelect 
                                        value={selectedDepartmentId}
                                        onChange={(val) => {
                                            setSelectedDepartmentId(val)
                                            setSelectedDoctorId("") // Reset doctor on dept change
                                        }}
                                        options={departments.map(d => ({ id: d.id, name: d.name }))}
                                        placeholder="Select Department"
                                        showAll={false}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Consulting Doctor *
                                    </Label>
                                    <SearchableSelect 
                                        value={selectedDoctorId}
                                        onChange={setSelectedDoctorId}
                                        options={doctors.filter((d: any) => !selectedDepartmentId || d.departmentId === selectedDepartmentId).map((d: any) => ({ id: d.id, name: d.name }))}
                                        placeholder="Select Doctor"
                                        loading={loadingDoctors}
                                        disabled={!selectedDepartmentId && doctors.length === 0}
                                        showAll={false}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Appointment Date *
                                    </Label>
                                    <Input 
                                        type="date"
                                        value={appointmentDate}
                                        onChange={(e: any) => setAppointmentDate(e.target.value)}
                                        className="h-10 border-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Consultation Fee *
                                    </Label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-2 text-muted-foreground font-semibold">Tk</div>
                                        <SmartNumberInput 
                                            value={consultationFee}
                                            onChange={(val) => setConsultationFee(val || 0)}
                                            className="h-10 pl-10 text-lg font-bold border-primary/20 bg-primary/5"
                                            min={0}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Time Slot *
                                </Label>
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

                    <Card className="border-none shadow-xl shadow-primary/5 bg-primary/5">
                         <CardContent className="p-6 flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <Stethoscope className="h-6 w-6 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-primary">Integrated Appointment Booking</h3>
                                <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                                    This form allows you to both <strong className="text-foreground">schedule the patient's appointment</strong> on the calendar and collect the consultation fees simultaneously. The appointment status will automatically be set to 'Confirmed' upon payment.
                                </p>
                            </div>
                         </CardContent>
                    </Card>
                </div>

                {/* Right Side - Payment Summary */}
                <div className="space-y-6">
                    <Card className="border-none shadow-xl shadow-primary/5 sticky top-6">
                        <CardHeader className="p-4 border-b bg-muted/30">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Payment Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            {/* Bill Discounts */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Discount
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <SmartNumberInput 
                                            placeholder="%" 
                                            className="h-9 text-sm pr-8" 
                                            min={0}
                                            max={100}
                                            value={discount === 0 ? undefined : discount}
                                            onChange={(val: number | undefined) => {
                                                setDiscount(val || 0)
                                                setDiscountFixedAmount(0)
                                            }}
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
                                    </div>
                                    <div className="relative">
                                        <SmartNumberInput 
                                            placeholder="Fixed Amount" 
                                            className="h-9 text-sm pr-8" 
                                            min={0}
                                            value={discountFixedAmount === 0 ? undefined : discountFixedAmount}
                                            onChange={(val: number | undefined) => {
                                                setDiscountFixedAmount(val || 0)
                                                setDiscount(0)
                                            }}
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">Tk</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                    <span>Consultation Charge</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-xs font-medium text-emerald-600">
                                        <span>Discount Apply</span>
                                        <span>-{formatCurrency(discountAmount)}</span>
                                    </div>
                                )}
                                {tax > 0 && (
                                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                        <span>Tax ({vatPercentage}%)</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-baseline pt-2 border-t mt-2">
                                    <span className="text-sm font-bold uppercase">Total Bill</span>
                                    <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Amount Paid</Label>
                                    <SmartNumberInput 
                                        value={paidAmount}
                                        onFocus={(e: any) => e.target.select()} 
                                        onChange={(val: number | undefined) => setPaidAmount(val || 0)}
                                        className="h-12 text-xl font-bold border-primary/20 text-primary bg-primary/5"
                                    />
                                    <div className="flex justify-between items-center text-xs px-1">
                                        <span className="text-muted-foreground font-medium uppercase min-w-[50px]">Due</span>
                                        <span className="font-bold text-rose-500">{formatCurrency(Math.max(0, total - paidAmount))}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Method</Label>
                                        <Select value={paymentMethod} onValueChange={(v: string) => setPaymentMethod(v as PaymentMethod)}>
                                            <SelectTrigger className="h-9 text-xs font-medium">
                                                <SelectValue placeholder="Method" />
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
                                                <SelectValue placeholder="Select Account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accounts.map((account: FinanceAccount) => (
                                                    <SelectItem key={account.id} value={account.id}>
                                                        {account.name} ({account.type})
                                                    </SelectItem>
                                                ))}
                                                {accounts.length === 0 && (
                                                    <div className="p-2 text-xs text-muted-foreground text-center italic">No accounts</div>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button 
                                    className="w-full h-14 text-lg font-black shadow-xl"
                                    disabled={!selectedCustomer || !selectedDoctorId || !appointmentDate || !timeSlot || !selectedAccountId || createSaleMutation.isPending || createAppointmentMutation.isPending}
                                    onClick={handleCheckout}
                                >
                                    <CreditCard className="mr-2 h-5 w-5" />
                                    {createSaleMutation.isPending || createAppointmentMutation.isPending ? "Processing..." : "Confirm & Schedule"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Billing History Modal */}
            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogContent className="sm:max-w-7xl md:max-w-[85vw] lg:max-w-[75vw] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
                    <DialogHeader className="p-6 border-b bg-muted/30">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-8">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                Appointment Billing History
                            </DialogTitle>
                            
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search invoice or patient..."
                                        value={modalSearch}
                                        onChange={(e) => {
                                            setModalSearch(e.target.value)
                                            setModalPage(1)
                                        }}
                                        className="pl-9 h-9 bg-background/50 border-primary/20 focus:border-primary transition-all text-xs"
                                    />
                                    {modalSearch && (
                                        <button 
                                            onClick={() => setModalSearch("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className={cn("h-9 border-primary/20 text-xs", activeFilterCount > 0 && "bg-primary/5 border-primary text-primary")}>
                                            <Filter className="h-3 w-3 mr-2 text-primary" />
                                            Filters
                                            {activeFilterCount > 0 && (
                                                <Badge variant="default" className="ml-1.5 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]">
                                                    {activeFilterCount}
                                                </Badge>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[450px] p-4" align="end">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-sm">Advanced Filters</h4>
                                                {activeFilterCount > 0 && (
                                                    <Button variant="ghost" size="sm" onClick={() => { 
                                                        setModalStatus("all"); 
                                                        setModalPaymentStatus("all"); 
                                                        setModalType("all"); 
                                                        setModalPaymentMethod("all");
                                                        setModalInvoiceNumber("");
                                                        setModalCreatedBy("");
                                                        setModalMinAmount("");
                                                        setModalMaxAmount("");
                                                        setModalDateRange(undefined);
                                                    }} className="h-8 text-xs text-muted-foreground hover:text-destructive">
                                                        Reset
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="grid gap-1.5 col-span-2">
                                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Date Range</Label>
                                                    <DatePickerWithRange 
                                                        date={modalDateRange} 
                                                        setDate={setModalDateRange}
                                                        className="w-full text-xs"
                                                    />
                                                </div>

                                                <div className="grid gap-1.5">
                                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Invoice Number</Label>
                                                    <Input 
                                                        placeholder="SALE-..."
                                                        value={modalInvoiceNumber}
                                                        onChange={(e) => setModalInvoiceNumber(e.target.value)}
                                                        className="h-9 text-xs"
                                                    />
                                                </div>

                                                <div className="grid gap-1.5">
                                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Created By</Label>
                                                    <Input 
                                                        placeholder="User name"
                                                        value={modalCreatedBy}
                                                        onChange={(e) => setModalCreatedBy(e.target.value)}
                                                        className="h-9 text-xs"
                                                    />
                                                </div>

                                                <div className="grid gap-1.5 col-span-2">
                                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Sale Type</Label>
                                                    <Select value={modalType} onValueChange={(v: string) => { setModalType(v); setModalPage(1); }}>
                                                        <SelectTrigger className="h-9 text-xs">
                                                            <SelectValue placeholder="Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Types</SelectItem>
                                                            <SelectItem value="appointment">Appointment</SelectItem>
                                                            <SelectItem value="pathology">Pathology</SelectItem>
                                                            <SelectItem value="radiology">Radiology</SelectItem>
                                                            <SelectItem value="pos">POS</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Sale Status</Label>
                                                    <Select value={modalStatus} onValueChange={(v: string) => { setModalStatus(v); setModalPage(1); }}>
                                                        <SelectTrigger className="h-9 text-xs">
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Status</SelectItem>
                                                            <SelectItem value="completed">Completed</SelectItem>
                                                            <SelectItem value="pending">Pending</SelectItem>
                                                            <SelectItem value="rejected">Rejected</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment Status</Label>
                                                    <Select value={modalPaymentStatus} onValueChange={(v: string) => { setModalPaymentStatus(v); setModalPage(1); }}>
                                                        <SelectTrigger className="h-9 text-xs">
                                                            <SelectValue placeholder="Payment" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Payment</SelectItem>
                                                            <SelectItem value="paid">Paid</SelectItem>
                                                            <SelectItem value="partial">Partial</SelectItem>
                                                            <SelectItem value="due">Due</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid gap-1.5">
                                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Payment Method</Label>
                                                    <Select value={modalPaymentMethod} onValueChange={(v: string) => { setModalPaymentMethod(v); setModalPage(1); }}>
                                                        <SelectTrigger className="h-9 text-xs">
                                                            <SelectValue placeholder="Method" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="all">All Methods</SelectItem>
                                                            <SelectItem value="cash">Cash</SelectItem>
                                                            <SelectItem value="card">Card</SelectItem>
                                                            <SelectItem value="online">Online</SelectItem>
                                                            <SelectItem value="cheque">Cheque</SelectItem>
                                                            <SelectItem value="bKash">bKash</SelectItem>
                                                            <SelectItem value="Nagad">Nagad</SelectItem>
                                                            <SelectItem value="Rocket">Rocket</SelectItem>
                                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="grid gap-1.5">
                                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Min Amount</Label>
                                                    <Input 
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={modalMinAmount}
                                                        onChange={(e) => setModalMinAmount(e.target.value)}
                                                        className="h-9 text-xs"
                                                    />
                                                </div>
                                                
                                                <div className="grid gap-1.5">
                                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Amount</Label>
                                                    <Input 
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={modalMaxAmount}
                                                        onChange={(e) => setModalMaxAmount(e.target.value)}
                                                        className="h-9 text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                <Button variant="ghost" size="sm" onClick={() => router.push('/sales')} className="text-xs h-9 px-3">Full Report</Button>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto p-0">
                        <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-xs uppercase font-bold h-12 pl-6">Invoice</TableHead>
                                    <TableHead className="text-xs uppercase font-bold h-12">Type</TableHead>
                                    <TableHead className="text-xs uppercase font-bold h-12">Patient</TableHead>
                                    <TableHead className="text-xs uppercase font-bold h-12">Date</TableHead>
                                    <TableHead className="text-xs uppercase font-bold h-12">Total</TableHead>
                                    <TableHead className="text-xs uppercase font-bold h-12 text-emerald-600">Paid</TableHead>
                                    <TableHead className="text-xs uppercase font-bold h-12 text-rose-600">Due</TableHead>
                                    <TableHead className="text-xs uppercase font-bold h-12 text-center">Status</TableHead>
                                    <TableHead className="text-xs uppercase font-bold h-12 text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingHistory ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-48 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                <p className="text-sm text-muted-foreground animate-pulse font-medium">Loading transactions...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : recentSales.map((sale) => (
                                    <TableRow key={sale.id} className="group hover:bg-primary/5 transition-colors border-b-primary/5">
                                        <TableCell className="py-3 font-medium pl-6">{sale.invoiceNumber}</TableCell>
                                        <TableCell className="py-3">
                                            <Badge variant="outline" className="capitalize text-[10px] font-bold bg-orange-50 text-orange-600 border-orange-200">
                                                {sale.type || 'Appointment'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{sale.patient?.name || "Walk-in"}</span>
                                                <span className="text-[10px] text-muted-foreground">{sale.patient?.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 text-muted-foreground text-xs whitespace-nowrap">{format(new Date(sale.createdAt), "dd MMM yy, hh:mm a")}</TableCell>
                                        <TableCell className="py-3 font-bold text-primary">{formatCurrency(Number(sale.netPrice || sale.totalPrice))}</TableCell>
                                        <TableCell className="py-3 font-medium text-emerald-600">{formatCurrency(Number(sale.paidAmount || 0))}</TableCell>
                                        <TableCell className="py-3 font-bold text-rose-600">{formatCurrency(Number(sale.dueAmount || 0))}</TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex flex-col gap-1 items-center">
                                                <Badge 
                                                    variant={sale.status === 'completed' ? 'success' : sale.status === 'pending' ? 'warning' : 'destructive'}
                                                    className="justify-center w-20 text-[10px] px-2 py-0 capitalize"
                                                >
                                                    {sale.status}
                                                </Badge>
                                                <Badge 
                                                    variant="outline"
                                                    className={cn(
                                                        "justify-center w-20 text-[10px] px-2 py-0 capitalize border-none",
                                                        sale.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-600" :
                                                        sale.paymentStatus === 'partial' ? "bg-amber-50 text-amber-600" :
                                                        "bg-rose-50 text-rose-600"
                                                    )}
                                                >
                                                    {sale.paymentStatus}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 text-right pr-6">
                                            <div className="flex justify-end gap-1.5 transition-opacity">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all"
                                                    title="View Details"
                                                    onClick={() => {
                                                        setSelectedSale(sale)
                                                        setInitialAddPayment(false)
                                                        setDetailsOpen(true)
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {Number(sale.dueAmount) > 0 && (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-rose-600 hover:bg-rose-50 transition-all"
                                                        title="Collect Payment"
                                                        onClick={() => {
                                                            setSelectedSale(sale)
                                                            setInitialAddPayment(true)
                                                            setDetailsOpen(true)
                                                        }}
                                                    >
                                                        <DollarSign className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-all"
                                                    title="Print Receipt"
                                                    onClick={() => {
                                                        setLastSale(sale)
                                                        setReceiptOpen(true)
                                                    }}
                                                >
                                                    <Receipt className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {recentSales.length === 0 && !loadingHistory && (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-48 text-center">
                                            <div className="flex flex-col items-center gap-1.5 opacity-50">
                                                <Search className="h-8 w-8 text-muted-foreground" />
                                                <p className="text-sm font-medium">No appointment transactions found matching your criteria.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground italic">
                            Strictly filtered by <strong>Appointment</strong> category.
                        </p>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0" 
                                disabled={modalPage === 1}
                                onClick={() => setModalPage(p => p - 1)}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-1 min-w-[60px] justify-center text-xs font-bold">
                                <span>{modalPage}</span>
                                {recentSalesRes?.data?.pagination?.totalPages && (
                                    <>
                                        <span className="text-muted-foreground">/</span>
                                        <span className="text-muted-foreground">{recentSalesRes.data.pagination.totalPages}</span>
                                    </>
                                )}
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 w-8 p-0" 
                                disabled={modalPage >= (recentSalesRes?.data?.pagination?.totalPages || 1)}
                                onClick={() => setModalPage(p => p + 1)}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <SaleDetailsDialog 
                sale={selectedSale}
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                initialAddPayment={initialAddPayment}
                onSuccess={() => {
                    refetchSales()
                }}
            />

            <DiagnosticReceiptDialog 
                open={receiptOpen}
                onOpenChange={setReceiptOpen}
                transaction={lastSale}
                doctors={doctors}
            />
        </div>
    )
}
