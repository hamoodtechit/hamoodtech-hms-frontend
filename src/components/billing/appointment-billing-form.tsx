"use client"

import { TimeSlotPicker } from "@/components/appointments/time-slot-picker"
import { PatientSearch } from "@/components/pharmacy/pos/patient-search"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { useCreateAppointment } from "@/hooks/appointment-queries"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useDepartments, useEmployees } from "@/hooks/hr-queries"
import { useCreateSale } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { FinanceAccount } from "@/types/finance"
import { Patient, PaymentMethod } from "@/types/pharmacy"
import { SalePayload } from "@/types/sales"
import { CreditCard, Stethoscope } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function AppointmentBillingForm() {
    const router = useRouter()
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const { pharmacy } = useSettingsStore()

    // Data Fetching
    const { data: departmentsRes } = useDepartments({ branchId: activeStoreId, limit: 100 })
    const { data: doctorsRes, isLoading: loadingDoctors } = useEmployees({ branchId: activeStoreId, employeeType: "doctor", limit: 100 })
    const { data: accountsRes } = useFinanceAccounts({ branchId: activeStoreId, limit: 100, isActive: true })

    const departments = departmentsRes?.data || []
    const doctors = doctorsRes?.data || []
    const accounts = accountsRes?.data || []
    const vatPercentage = pharmacy?.vatPercentage || 0

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

            await createSaleMutation.mutateAsync(payload)
            toast.success("Appointment successfully scheduled and billed!")
            setSelectedCustomer(null)
            setSelectedDoctorId("")
            setSelectedDepartmentId("")
            setTimeSlot("")
            setConsultationFee(500)
            setPaidAmount(0)
            setDiscount(0)
            setDiscountFixedAmount(0)
            // Optionally router.push('/sales') to see receipt
        } catch (error) {
            toast.error("Failed to process transaction")
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-primary">Appointment Billing</h1>
                <p className="text-muted-foreground text-sm font-medium">Record and collect consultation fees for doctor appointments.</p>
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
        </div>
    )
}
