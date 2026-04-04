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
import { useDepartments, useEmployees, useCommissionAgents } from "@/hooks/hr-queries"
import { useCreateSale, useSales } from "@/hooks/sales-queries"
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
import { CalendarDays, ChevronLeft, ChevronRight, CreditCard, DollarSign, Eye, Filter, History, Plus, Receipt, Search, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { toast } from "sonner"

import { PatientSearch } from "@/components/pharmacy/pos/patient-search"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { CommissionAgentSearch } from "@/components/hr/agent-search"
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
    reportDays: number
    deliveryDate: string
    staffId: string
    staffName: string
    discountAmount: number
    discountPercentage: number
    diagnosticTestId: string
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
    const { data: testsRes, isLoading: loadingTests } = useDiagnosticTests({ branchId: activeStoreId || undefined, limit: 1000 })
    const { data: doctorsRes, isLoading: loadingDoctors } = useEmployees({ branchId: activeStoreId || undefined, limit: 1000 })
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

    const allStaff = staffRes?.data || []
    const allTests = testsRes?.data || []
    const doctors = doctorsRes?.data || []
    const staffs = staffRes?.data || []
    const recentSales = recentSalesRes?.data?.sales || []
    const historyPagination = recentSalesRes?.data?.pagination

    const activeFilterCount = (modalStatus !== 'all' ? 1 : 0) + 
                            (modalPaymentStatus !== 'all' ? 1 : 0) + 
                            (modalType !== 'all' && modalType !== type ? 1 : 0) +
                            (modalPaymentMethod !== 'all' ? 1 : 0) +
                            (modalInvoiceNumber ? 1 : 0) +
                            (modalCreatedBy ? 1 : 0) +
                            (modalMinAmount ? 1 : 0) +
                            (modalMaxAmount ? 1 : 0) +
                            (modalDateRange ? 1 : 0)

    // Filtration: Only show tests relevant to the current page (Pathology vs Radiology)
    const filteredTests = allTests.filter(t => {
        const dept = (t.department?.name || "").toLowerCase()
        if (type === 'pathology') return dept.includes('pathology') || dept.includes('lab')
        if (type === 'radiology') return dept.includes('radiology') || dept.includes('imaging') || dept.includes('x-ray')
        return true
    })

    // Fallback: If no tests match the strict criteria, show all tests for that branch
    const availableTests = filteredTests.length > 0 ? filteredTests : allTests

    const accounts = accountsRes?.data || []
    const vatPercentage = pharmacy?.vatPercentage || 0

    const createSaleMutation = useCreateSale()

    // Form State
    const [selectedCustomer, setSelectedCustomer] = useState<Patient | null>(null)
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
    const [selectedCommissionAgentId, setSelectedCommissionAgentId] = useState<string>("")
    const [selectedTestId, setSelectedTestId] = useState<string>("")
    const [selectedStaffId, setSelectedStaffId] = useState<string>("") // Global assigned staff default
    const [roomNumber, setRoomNumber] = useState<string>("")
    const [cart, setCart] = useState<CartItem[]>([])
    
    // Payment State
    const [discount, setDiscount] = useState<number>(0)
    const [discountFixedAmount, setDiscountFixedAmount] = useState<number>(0)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
    const [selectedAccountId, setSelectedAccountId] = useState<string>("")
    const [paidAmount, setPaidAmount] = useState<number>(0)
    
    // Receipt State
    const [receiptOpen, setReceiptOpen] = useState(false)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [lastSale, setLastSale] = useState<any | null>(null)
    
    // Details/Collect State
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [initialAddPayment, setInitialAddPayment] = useState(false)

    // Set default staff to currently logged in user if they are in the staff list
    useEffect(() => {
        if (user && staffs.length > 0 && !selectedStaffId) {
            const currentStaff = staffs.find(s => s.id === user.id || (s as any).userId === user.id)
            if (currentStaff) {
                setSelectedStaffId(currentStaff.id)
            }
        }
    }, [user, staffs, selectedStaffId])

    // Handlers
    const handleAddTest = () => {
        if (!selectedTestId) return
        
        const test = availableTests.find(t => t.id === selectedTestId)
        if (!test) return

        if (cart.some(item => item.testId === test.id)) {
            toast.error("Test is already added to bill")
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
            reportDays: test.reportDays || 0,
            deliveryDate: deliveryStr,
            staffId: staff?.id || "",
            staffName: staff?.name || "",
            discountAmount: 0,
            discountPercentage: 0,
            diagnosticTestId: test.id
        }

        setCart([...cart, newItem])
        setSelectedTestId("")
        // setSelectedStaffId("") // Keep global staff selection
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
        if (!selectedCustomer) {
            toast.error("Please select a patient")
            return
        }
        if (cart.length === 0) {
            toast.error("No tests added to the bill")
            return
        }
        if (!selectedAccountId) {
            toast.error("Please select a target finance account")
            return
        }

        const payload: SalePayload = {
            branchId: activeStoreId || "",
            patientId: selectedCustomer.id,
            type: type,
            doctorId: selectedDoctorId || undefined,
            staffId: cart.find(c => c.staffId)?.staffId,
            status: paidAmount >= total ? 'completed' : 'pending',
            paymentMethod: paymentMethod,
            commissionAgentId: selectedCommissionAgentId || undefined,
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
                unit: 'test',
                price: item.price,
                mrp: item.price,
                quantity: 1,
                totalPrice: (item.price - (item.discountAmount || (item.discountPercentage ? (item.price * item.discountPercentage) / 100 : 0))),
                discountPercentage: item.discountPercentage,
                discountAmount: item.discountAmount,
                deliveryDate: item.deliveryDate,
                testBy: item.staffName || "",
                medicineId: "",
                batchNumber: "",
                expiryDate: "",
                diagnosticTestId: item.diagnosticTestId
            }))
        }

        try {
            const res = await createSaleMutation.mutateAsync(payload)
            setLastSale(res.data)
            toast.success("Billing processed successfully!")
            
            // Generate Receipt
            setReceiptOpen(true)
            
            // Reset
            setCart([])
            setSelectedCustomer(null)
            setSelectedDoctorId("")
            setPaidAmount(0)
            setSelectedCommissionAgentId("")
            setDiscount(0)
            refetchSales()
            setDiscountFixedAmount(0)
        } catch (error) {
            toast.error("Failed to create bill")
        }
    }

    if (!canCreateSale) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]">
                <div className="text-destructive mb-4">
                    <X className="w-16 h-16" />
                </div>
                <h2 className="text-2xl font-black mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-6">You do not have permission to create diagnostic bills.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-muted/20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-primary capitalize">{type} Billing</h1>
                    <p className="text-muted-foreground text-sm font-medium">Record and collect payments for {type} diagnostic services.</p>
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
                {/* Left Side - Selection & Cart */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-xl shadow-primary/5">
                        <CardHeader className="p-4 border-b bg-muted/30">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Order Details</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Referred By Doctor
                                    </Label>
                                    <SearchableSelect 
                                        value={selectedDoctorId}
                                        onChange={setSelectedDoctorId}
                                        options={doctors.map((d: any) => ({ id: d.id, name: d.name }))}
                                        placeholder="Select Doctor"
                                        loading={loadingDoctors}
                                        showAll={false}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Commission Agent
                                    </Label>
                                    <CommissionAgentSearch 
                                        selectedAgentId={selectedCommissionAgentId}
                                        onSelect={(agent) => setSelectedCommissionAgentId(agent?.id || "")}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Room / Chamber Number
                                    </Label>
                                    <Input 
                                        placeholder="e.g. Room 101"
                                        value={roomNumber}
                                        onChange={(e) => setRoomNumber(e.target.value)}
                                        className="h-9 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                    Add Tests
                                </Label>
                                <div className="flex gap-2">
                                    <div className="flex-[2]">
                                        <SearchableSelect 
                                            value={selectedTestId}
                                            onChange={setSelectedTestId}
                                            options={availableTests.map(t => ({ id: t.id, name: `${t.name} - ${formatCurrency(Number(t.price))}` }))}
                                            placeholder="Search Diagnostic Test..."
                                            showAll={false}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <SearchableSelect 
                                            value={selectedStaffId}
                                            onChange={setSelectedStaffId}
                                            options={staffRes?.data?.map(s => ({ id: s.id, name: s.name })) || []}
                                            placeholder="Assigned To"
                                            loading={loadingStaff}
                                            showAll={false}
                                        />
                                    </div>
                                    <Button onClick={handleAddTest} disabled={!selectedTestId}>
                                        <Plus className="h-4 w-4 mr-2" /> Add
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {cart.length > 0 && (
                        <Card className="border-none shadow-xl shadow-primary/5">
                            <CardHeader className="p-4 border-b bg-muted/30">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Test List ({cart.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="pl-4">Test Name</TableHead>
                                            <TableHead>Delivery Date</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Discount</TableHead>
                                            <TableHead className="text-right pr-4">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cart.map((item) => {
                                            const itemDiscountAmount = item.discountAmount || 
                                                (item.discountPercentage ? (item.price * item.discountPercentage) / 100 : 0)
                                            const itemTotal = item.price - itemDiscountAmount

                                            return (
                                            <TableRow key={item.id}>
                                                <TableCell className="pl-4 font-medium">
                                                    {item.name}
                                                    <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays className="h-3 w-3" /> {item.reportDays} days
                                                        </span>
                                                        {item.staffId && (() => {
                                                            const staffName = allStaff.find(s => s.id === item.staffId)?.name || "Unknown Staff"
                                                            return (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1 font-semibold text-primary/70">
                                                                         By: {staffName}
                                                                    </span>
                                                                </>
                                                            )
                                                        })()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input 
                                                        type="date" 
                                                        value={item.deliveryDate}
                                                        onChange={(e) => updateItemDeliveryDate(item.id, e.target.value)}
                                                        className="h-8 text-xs w-[130px]"
                                                    />
                                                </TableCell>
                                                <TableCell className="font-bold text-muted-foreground">
                                                    {formatCurrency(item.price)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 bg-secondary/20 rounded-md p-0.5 border w-min">
                                                        <SmartNumberInput 
                                                            placeholder="%"
                                                            className="h-6 text-[10px] w-12 bg-background border-none px-1"
                                                            min={0}
                                                            max={100}
                                                            value={item.discountPercentage}
                                                            onChange={(val) => updateItemDiscount(item.id, 'percent', val || 0)}
                                                        />
                                                        <span className="text-[10px] text-muted-foreground px-1 border-l">Tk</span>
                                                        <SmartNumberInput 
                                                            placeholder="Amt"
                                                            className="h-6 text-[10px] w-16 bg-background border-none px-1"
                                                            min={0}
                                                            value={item.discountAmount}
                                                            onChange={(val) => updateItemDiscount(item.id, 'amount', val || 0)}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-4 flex items-center justify-end gap-3 h-[60.5px]">
                                                    <span className="font-bold text-primary">{formatCurrency(itemTotal)}</span>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 rounded-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )})}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
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
                                    Overall Bill Discount
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
                                    <span>Subtotal</span>
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
                                    disabled={cart.length === 0 || !selectedCustomer || !selectedAccountId || createSaleMutation.isPending}
                                    onClick={handleCheckout}
                                >
                                    <CreditCard className="mr-2 h-5 w-5" />
                                    {createSaleMutation.isPending ? "Processing..." : "Confirm Final Bill"}
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
                            <DialogTitle className="text-xl font-bold flex items-center gap-2 capitalize">
                                <History className="h-5 w-5 text-primary" />
                                {type} Billing History
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
                                                        setModalType(type); 
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
                                            <Badge variant="outline" className={cn(
                                                "capitalize text-[10px] font-bold",
                                                sale.type === 'pathology' ? "bg-purple-50 text-purple-600 border-purple-200" :
                                                sale.type === 'radiology' ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                                                "bg-gray-50 text-gray-600 border-gray-200"
                                            )}>
                                                {sale.type || type}
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
                                                <p className="text-sm font-medium">No {type} transactions found matching your criteria.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground italic">
                            Showing <span className="font-bold text-foreground">{recentSales.length}</span> of <span className="font-bold text-foreground">{historyPagination?.total || 0}</span> sales
                        </p>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 shadow-sm"
                                disabled={modalPage <= 1}
                                onClick={() => setModalPage(p => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                                Prev
                            </Button>
                            <div className="h-8 px-4 flex items-center justify-center font-medium border bg-background rounded-md shadow-sm text-xs">
                                Page {modalPage} of {historyPagination?.totalPages || 1}
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm"
                                className="h-8 shadow-sm"
                                disabled={modalPage >= (historyPagination?.totalPages || 1)}
                                onClick={() => setModalPage(p => p + 1)}
                            >
                                Next
                                <ChevronRight className="h-3.5 w-3.5 ml-1" />
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
                patient={selectedCustomer}
                doctor={doctors.find(d => d.id === selectedDoctorId)}
                staffs={staffs}
            />
        </div>
    )
}
