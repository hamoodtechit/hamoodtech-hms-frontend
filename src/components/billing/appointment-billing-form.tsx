"use client"

import { TimeSlotPicker } from "@/components/appointments/time-slot-picker"
import { PatientSearch } from "@/components/pharmacy/pos/patient-search"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateAppointment, useAppointments } from "@/hooks/appointment-queries"
import { useDepartments } from "@/hooks/hr-queries"
import { useUsers } from "@/hooks/user-queries"
import { usePermissions } from "@/hooks/use-permissions"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { Patient } from "@/types/pharmacy"
import { format } from "date-fns"
import { 
    Calendar, 
    Clock, 
    DollarSign,
    History,
    LayoutGrid, 
    Stethoscope, 
    User, 
    Loader2,
    CheckCircle2,
    PlusCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { ReferralSearch } from "@/components/hr/referral-search"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useCurrency } from "@/hooks/use-currency"
import { usePatients } from "@/hooks/patient-queries"
import { AppointmentSaleDialog } from "@/components/appointments/appointment-sale-dialog"
import { AppointmentPaymentDialog } from "@/components/appointments/appointment-payment-dialog"
import { Appointment } from "@/types/appointment"
import { Sale } from "@/types/sales"

export function AppointmentBillingForm() {
    const router = useRouter()
    const { hasPermission } = usePermissions()
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()

    // Sale & Payment dialog state for auto-open after appointment creation
    const [saleDialogOpen, setSaleDialogOpen] = useState(false)
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null)
    const [lastCreatedSale, setLastCreatedSale] = useState<Sale | any | null>(null)

    // Permission check
    const canCreateAppointment = hasPermission('appointment:create')

    // Data Fetching
    const { data: departmentsRes } = useDepartments({ branchId: activeStoreId || undefined, limit: 100 })
    const { data: usersRes, isLoading: loadingUsers } = useUsers({ 
        branchId: activeStoreId || undefined,
        limit: 1000 
    })
    const { data: patientsRes } = usePatients({ 
        limit: 1000 
    })
    
    const departments = departmentsRes?.data || []
    const users = useMemo(() => usersRes?.data || [], [usersRes])
    const patients = useMemo(() => patientsRes?.data || [], [patientsRes])

    const createAppointmentMutation = useCreateAppointment()
    const { appointments: appointmentConfig, fetchSettings } = useSettingsStore()

    useEffect(() => {
        fetchSettings()
    }, [fetchSettings])

    // Form State
    const [selectedCustomer, setSelectedCustomer] = useState<Patient | null>(null)
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
    const [appointmentDate, setAppointmentDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [timeSlot, setTimeSlot] = useState<string>("")
    const [selectedReferralPersonId, setSelectedReferralPersonId] = useState<string>("")
    const [chamberOrRoomNumber, setChamberOrRoomNumber] = useState<string>("")
    const [note, setNote] = useState<string>("")
    const [visitType, setVisitType] = useState<'new' | 'repeat' | 'report'>('new')
    
    // Auto-fill room and duty times based on selected doctor
    const [doctorStartTime, setDoctorStartTime] = useState<string>("")
    const [doctorEndTime, setDoctorEndTime] = useState<string>("")

    // Fetch existing appointments for this doctor+date to find booked slots
    const selectedUser: any = useMemo(() => users.find((u: any) => u.id === selectedDoctorId), [users, selectedDoctorId])
    const doctorEmployeeId = selectedUser?.employeeId || selectedDoctorId
    const { data: existingApptsRes, isLoading: loadingExistingAppts } = useAppointments({
        doctorId: doctorEmployeeId || undefined,
        startDate: appointmentDate || undefined,
        endDate: appointmentDate || undefined,
        limit: 200,
    })

    const bookedSlots = useMemo(() => {
        if (!existingApptsRes?.data) return []
        return existingApptsRes.data
            .filter((a: any) => a.status !== 'cancelled')
            .map((a: any) => a.timeSlot)
            .filter(Boolean)
    }, [existingApptsRes])

    useEffect(() => {
        if (selectedDoctorId) {
            const user: any = users.find((u: any) => u.id === selectedDoctorId)
            setChamberOrRoomNumber(user?.employee?.chamberOrRoomNumber || "")
            setDoctorStartTime(user?.employee?.dutyStartTime || "")
            setDoctorEndTime(user?.employee?.dutyEndTime || "")
            setTimeSlot("") // Reset so auto-select picks next available
        } else {
            setChamberOrRoomNumber("")
            setDoctorStartTime("")
            setDoctorEndTime("")
            setTimeSlot("")
        }
    }, [selectedDoctorId, users])

    // Reset time slot when date changes
    useEffect(() => {
        setTimeSlot("")
    }, [appointmentDate])

    // Use doctor's duty time if available, otherwise fall back to system config
    const effectiveStartTime = useMemo(() => {
        if (doctorStartTime) {
            // If it looks like an ISO date, extract HH:mm
            if (doctorStartTime.includes('T')) {
                return new Date(doctorStartTime).toISOString().slice(11, 16)
            }
            return doctorStartTime
        }
        return appointmentConfig?.startTime || "08:00"
    }, [doctorStartTime, appointmentConfig])

    const effectiveEndTime = useMemo(() => {
        if (doctorEndTime) {
            if (doctorEndTime.includes('T')) {
                return new Date(doctorEndTime).toISOString().slice(11, 16)
            }
            return doctorEndTime
        }
        return appointmentConfig?.endTime || "21:00"
    }, [doctorEndTime, appointmentConfig])

    // Compute fee based on visit type and selected doctor
    const selectedDoctor = selectedUser
    const appointmentFee = useMemo(() => {
        if (!selectedDoctor?.employee) return 0
        const emp = selectedDoctor.employee
        switch (visitType) {
            case 'new': return Number(emp.visitCharge || 0)
            case 'repeat': return Number(emp.repeatVisitCharge || 0)
            case 'report': return Number(emp.reportCharge || 0)
            default: return 0
        }
    }, [selectedDoctor, visitType])

    const handleCreateAppointment = async () => {
        if (!selectedCustomer || !selectedDoctorId || !appointmentDate || !timeSlot) {
            toast.error("Please fill in all required fields")
            return
        }

        const selectedUser: any = users.find(u => u.id === selectedDoctorId)

        try {
            const res: any = await createAppointmentMutation.mutateAsync({
                branchId: activeStoreId || "",
                patientId: selectedCustomer.id,
                departmentId: selectedUser?.employee?.departmentId || "",
                doctorId: selectedUser?.employeeId || selectedDoctorId,
                date: appointmentDate,
                timeSlot: timeSlot,
                note: note || undefined,
                status: 'pending',
                chamberOrRoomNumber: chamberOrRoomNumber || undefined,
                referralPersonId: selectedReferralPersonId || undefined,
                fees: appointmentFee || undefined,
            })

            toast.success("Appointment successfully scheduled!")
            
            // Capture the created appointment and auto-open sale dialog for payment
            const appointmentData = res?.data || res
            if (appointmentData?.id && appointmentFee > 0) {
                // Merge patient and doctor data for the sale dialog
                const enrichedAppointment = {
                    ...appointmentData,
                    fees: appointmentData.fees || appointmentFee,
                    patient: selectedCustomer,
                    doctor: selectedUser?.employee || selectedUser,
                    department: departments.find(d => d.id === (selectedUser?.employee?.departmentId || '')),
                }
                setCreatedAppointment(enrichedAppointment as any)
                setTimeout(() => {
                    setSaleDialogOpen(true)
                }, 300)
            }

            // Reset form
            setSelectedCustomer(null)
            setSelectedDoctorId("")
            setTimeSlot("")
            setChamberOrRoomNumber("")
            setNote("")
            setSelectedReferralPersonId("")
        } catch (error: any) {
            if (!error?.response?.data?.message) {
                toast.error("Failed to schedule appointment")
            }
        }
    }

    if (!canCreateAppointment) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]">
                <div className="text-destructive mb-4">
                    <PlusCircle className="w-16 h-16" />
                </div>
                <h2 className="text-2xl font-black mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-6">You do not have permission to create appointments.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 p-4 lg:p-6 min-h-[calc(100vh-64px)] bg-muted/10 pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/20">
                        <Stethoscope className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">Schedule Appointment</h1>
                        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                           <LayoutGrid className="w-3 h-3" /> Clinical Registry
                        </p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 h-11 px-6 rounded-2xl border-primary/20 hover:bg-primary/5 shadow-sm font-black text-xs uppercase tracking-widest"
                    asChild
                >
                    <Link href="/billing/appointment">
                        <History className="h-4 w-4 text-primary" />
                        Appointment History
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
                {/* Left Side - Appointment Form */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                    <Card className="border-none overflow-hidden rounded-xl">
                        <CardHeader className="bg-primary/5 border-b p-6">
                            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                <User className="w-4 h-4" /> Patient & Doctor Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                            {/* Patient Selection */}
                            <div className="space-y-4">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Select Patient *</Label>
                                <PatientSearch 
                                    selectedPatient={selectedCustomer} 
                                    onSelect={setSelectedCustomer} 
                                />
                                {selectedCustomer && (
                                    <div className="flex items-center gap-4 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-500/20">
                                            {selectedCustomer.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-lg text-foreground">{selectedCustomer.name}</p>
                                            <p className="text-xs font-bold text-muted-foreground">Patient ID: {selectedCustomer.patientNumber || 'N/A'} • {selectedCustomer.phone}</p>
                                        </div>
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500 ml-auto" />
                                    </div>
                                )}
                            </div>

                            <Separator className="opacity-50" />

                            {/* Clinical Assignment */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Specialist Doctor *</Label>
                                    <SearchableSelect 
                                        value={selectedDoctorId}
                                        onChange={setSelectedDoctorId}
                                        options={users
                                            .filter((u: any) => u.role?.name?.toLowerCase() === 'doctor')
                                            .map((u: any) => ({ 
                                                id: u.id, 
                                                name: u.fullName || u.username 
                                            }))}
                                        placeholder="Assign Specialist..."
                                        loading={loadingUsers}
                                        showAll={false}
                                    />
                                </div>
                            </div>

                            {/* Visit Type */}
                            {selectedDoctorId && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Visit Type *</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {[
                                            { key: 'new' as const, label: 'New Visit', desc: 'First consultation', charge: Number(selectedDoctor?.employee?.visitCharge || 0) },
                                            { key: 'repeat' as const, label: 'Repeat Visit', desc: `Within ${selectedDoctor?.employee?.repeatVisitDayGap || 7} days`, charge: Number(selectedDoctor?.employee?.repeatVisitCharge || 0) },
                                            { key: 'report' as const, label: 'Report', desc: 'Report collection', charge: Number(selectedDoctor?.employee?.reportCharge || 0) },
                                        ].map((vt) => (
                                            <button
                                                key={vt.key}
                                                type="button"
                                                onClick={() => setVisitType(vt.key)}
                                                className={cn(
                                                    "relative flex flex-col items-center gap-1 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer",
                                                    visitType === vt.key
                                                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.02]"
                                                        : "border-muted/50 bg-muted/10 hover:border-primary/30 hover:bg-primary/[0.02]"
                                                )}
                                            >
                                                <span className={cn(
                                                    "text-xs font-black uppercase tracking-wider",
                                                    visitType === vt.key ? "text-primary" : "text-muted-foreground"
                                                )}>{vt.label}</span>
                                                <span className="text-[10px] font-medium text-muted-foreground/60">{vt.desc}</span>
                                                <span className={cn(
                                                    "text-lg font-black mt-1",
                                                    visitType === vt.key ? "text-primary" : "text-foreground/70"
                                                )}>{formatCurrency(vt.charge)}</span>
                                                {visitType === vt.key && (
                                                    <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                                        <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Date & Time */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Appointment Date *</Label>
                                    <div className="relative">
                                        <Input 
                                            type="date"
                                            value={appointmentDate}
                                            onChange={(e) => setAppointmentDate(e.target.value)}
                                            className="h-14 rounded-2xl bg-muted/20 border-none font-bold text-base pl-12"
                                        />
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Chamber / Room</Label>
                                    <Input 
                                        placeholder="e.g. 302, OPD Wing"
                                        value={chamberOrRoomNumber}
                                        onChange={(e) => setChamberOrRoomNumber(e.target.value)}
                                        className="h-14 rounded-2xl bg-muted/20 border-none font-bold text-base"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Time Slot</Label>
                                {doctorStartTime && (
                                    <p className="text-[10px] font-bold text-primary/60">Doctor duty hours: {effectiveStartTime} — {effectiveEndTime} • Slot: {appointmentConfig?.slotDuration || 30} min</p>
                                )}
                                <TimeSlotPicker 
                                    value={timeSlot}
                                    onChange={setTimeSlot}
                                    startTime={effectiveStartTime}
                                    endTime={effectiveEndTime}
                                    duration={appointmentConfig?.slotDuration}
                                    bookedSlots={bookedSlots}
                                    autoSelect={!!selectedDoctorId}
                                    loading={loadingExistingAppts && !!selectedDoctorId}
                                />
                            </div>

                            <Separator className="opacity-50" />

                            {/* Additional Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Referral Person (Optional)</Label>
                                    <ReferralSearch 
                                        selectedReferralId={selectedReferralPersonId}
                                        onSelect={(referral) => setSelectedReferralPersonId(referral?.id || "")}
                                        className="h-14 rounded-2xl bg-muted/20 border-none font-bold text-base hover:bg-muted/30"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Clinical Note</Label>
                                    <Input 
                                        placeholder="Chief complaints or instructions..."
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        className="h-14 rounded-2xl bg-muted/20 border-none font-bold text-base"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Side - Summary & Action */}
                <div className="xl:col-span-4">
                    <Card className="border-none overflow-hidden rounded-xl sticky top-24">
                        <CardHeader className="bg-primary/5 border-b p-6">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Booking Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8 bg-background">
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Calendar className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Schedule</p>
                                        <p className="font-black text-foreground">
                                            {appointmentDate ? format(new Date(appointmentDate), 'MMMM dd, yyyy') : 'Date not selected'}
                                        </p>
                                        <p className="text-xs font-bold text-primary">{timeSlot || 'Select time slot'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Patient</p>
                                        <p className="font-black text-foreground">{selectedCustomer?.name || 'No patient selected'}</p>
                                        <p className="text-xs font-bold text-muted-foreground">{selectedCustomer?.phone || 'Select patient'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Stethoscope className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Specialist</p>
                                        <p className="font-black text-foreground">
                                            {users.find(u => u.id === selectedDoctorId)?.fullName || users.find(u => u.id === selectedDoctorId)?.username || 'Specialist not assigned'}
                                        </p>
                                        <p className="text-xs font-bold text-muted-foreground">
                                            {(users.find(u => u.id === selectedDoctorId) as any)?.employee?.designation?.name || 
                                             users.find(u => u.id === selectedDoctorId)?.designation || 
                                             'Specialist Consultant'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Fee Summary */}
                            <div className="flex items-start gap-4">
                                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                    <DollarSign className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Consultation Fee</p>
                                    <p className="text-2xl font-black text-emerald-600 tracking-tighter">
                                        {selectedDoctorId ? formatCurrency(appointmentFee) : '—'}
                                    </p>
                                    <p className="text-[10px] font-bold text-muted-foreground capitalize">
                                        {visitType === 'new' ? 'New Visit' : visitType === 'repeat' ? 'Repeat Visit' : 'Report Collection'}
                                    </p>
                                </div>
                            </div>

                            <Button 
                                className="w-full h-16 text-base font-black uppercase tracking-widest rounded-2xl transition-all active:scale-[0.98] group"
                                onClick={handleCreateAppointment}
                                disabled={createAppointmentMutation.isPending || !selectedCustomer || !selectedDoctorId || !appointmentDate || !timeSlot}
                            >
                                {createAppointmentMutation.isPending ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        Confirm Booking
                                        <CheckCircle2 className="w-5 h-5 ml-2 group-hover:scale-125 transition-transform" />
                                    </>
                                )}
                            </Button>

                            <p className="text-[10px] text-center font-bold text-muted-foreground/60 uppercase tracking-widest">
                                Proceeding will record this schedule in the clinical registry
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Auto-open Sale Dialog after Appointment Creation */}
            <AppointmentSaleDialog
                open={saleDialogOpen}
                onOpenChange={setSaleDialogOpen}
                appointment={createdAppointment}
                onSaleCreated={(sale) => {
                    setLastCreatedSale(sale)
                    // If there's due, open payment dialog
                    if (Number(sale.dueAmount) > 0) {
                        setPaymentDialogOpen(true)
                    }
                    setCreatedAppointment(null)
                }}
            />

            <AppointmentPaymentDialog
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
                sale={lastCreatedSale}
                onPaymentSuccess={() => {
                    setLastCreatedSale(null)
                }}
            />
        </div>
    )
}
