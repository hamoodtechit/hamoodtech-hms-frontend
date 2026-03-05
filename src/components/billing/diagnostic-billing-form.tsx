"use client"

import { PatientSearch } from "@/components/pharmacy/pos/patient-search"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useDiagnosticTests } from "@/hooks/diagnostic-queries"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useEmployees } from "@/hooks/hr-queries"
import { useCreateSale } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { FinanceAccount } from "@/types/finance"
import { Patient, PaymentMethod } from "@/types/pharmacy"
import { SalePayload } from "@/types/sales"
import { CalendarDays, CreditCard, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
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
}

export function DiagnosticBillingForm({ type, title, description }: DiagnosticBillingFormProps) {
    const router = useRouter()
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const { pharmacy } = useSettingsStore()

    // Data Fetching
    const { data: testsRes } = useDiagnosticTests({ branchId: activeStoreId, limit: 500 })
    const { data: doctorsRes, isLoading: loadingDoctors } = useEmployees({ branchId: activeStoreId, employeeType: "doctor", limit: 100 })
    const { data: staffRes, isLoading: loadingStaff } = useEmployees({ branchId: activeStoreId, employeeType: "staff", limit: 500 })
    const { data: accountsRes } = useFinanceAccounts({ branchId: activeStoreId, limit: 100, isActive: true })

    const allStaff = staffRes?.data || []
    const allTests = testsRes?.data || []
    // Filter tests by keyword in department name (basic heuristic since test schema doesn't strictly enforce type)
    const filteredTests = allTests.filter(t => 
        type === 'pathology' ? t.department?.name?.toLowerCase().includes('pathology') 
        : type === 'radiology' ? t.department?.name?.toLowerCase().includes('radiology') || t.department?.name?.toLowerCase().includes('imaging')
        : true
    )
    
    // If no specific tests found by department name filter, show all (fallback)
    const availableTests = filteredTests.length > 0 ? filteredTests : allTests

    const accounts = accountsRes?.data || []
    const vatPercentage = pharmacy?.vatPercentage || 0

    const createMutation = useCreateSale()

    // Form State
    const [selectedCustomer, setSelectedCustomer] = useState<Patient | null>(null)
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
    const [selectedTestId, setSelectedTestId] = useState<string>("")
    const [selectedStaffId, setSelectedStaffId] = useState<string>("")
    const [cart, setCart] = useState<CartItem[]>([])
    
    // Payment State
    const [discount, setDiscount] = useState<number>(0)
    const [discountFixedAmount, setDiscountFixedAmount] = useState<number>(0)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
    const [selectedAccountId, setSelectedAccountId] = useState<string>("")
    const [paidAmount, setPaidAmount] = useState<number>(0)
    
    // Receipt State
    const [receiptOpen, setReceiptOpen] = useState(false)
    const [completedSale, setCompletedSale] = useState<any | null>(null)

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

        const staff = allStaff.find(s => s.id === (selectedStaffId || test.staffId))
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
            discountPercentage: 0
        }

        setCart([...cart, newItem])
        setSelectedTestId("")
        setSelectedStaffId("")
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
                expiryDate: ""
            }))
        }

        try {
            const result = await createMutation.mutateAsync(payload)
            toast.success("Bill created successfully")
            setCompletedSale(result.data || result)
            setReceiptOpen(true)
            setCart([])
            setSelectedCustomer(null)
            setSelectedDoctorId("")
            setPaidAmount(0)
            setDiscount(0)
            setDiscountFixedAmount(0)
        } catch (error) {
            toast.error("Failed to create bill")
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-primary">{title}</h1>
                <p className="text-muted-foreground text-sm font-medium">{description}</p>
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
                                        options={doctorsRes?.data?.map(d => ({ id: d.id, name: d.name })) || []}
                                        placeholder="Select Referring Doctor"
                                        loading={loadingDoctors}
                                        showAll={false}
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
                                        <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
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
                                    disabled={cart.length === 0 || !selectedCustomer || !selectedAccountId || createMutation.isPending}
                                    onClick={handleCheckout}
                                >
                                    <CreditCard className="mr-2 h-5 w-5" />
                                    {createMutation.isPending ? "Processing..." : "Confirm Final Bill"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
            <DiagnosticReceiptDialog 
                open={receiptOpen}
                onOpenChange={setReceiptOpen}
                transaction={completedSale}
                doctors={doctorsRes?.data || []}
                staffs={staffRes?.data || []}
            />
        </div>
    )
}
