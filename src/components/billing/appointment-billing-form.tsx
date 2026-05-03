"use client"

import { TimeSlotPicker } from "@/components/appointments/time-slot-picker"
import { PatientSearch } from "@/components/pharmacy/pos/patient-search"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateAppointment } from "@/hooks/appointment-queries"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useAppointments } from "@/hooks/appointment-queries"
import { 
    History, 
    Search, 
    Filter, 
    X,
    Eye,
    CalendarDays,
    Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AppointmentDetailsDialog } from "@/components/appointments/appointment-details-dialog"
import { AppointmentFilters, AppointmentFilterValues } from "@/components/appointments/appointment-filters"
import { usePatients } from "@/hooks/patient-queries"

export function AppointmentBillingForm() {
    const router = useRouter()
    const { hasPermission } = usePermissions()
    const { activeStoreId } = useStoreContext()

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
    
    // History Modal State
    const [historyOpen, setHistoryOpen] = useState(false)
    const [modalSearch, setModalSearch] = useState("")
    const [modalFilters, setModalFilters] = useState<AppointmentFilterValues>({})
    const [modalPage, setModalPage] = useState(1)
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const modalLimit = 10

    const { data: recentAppointmentsRes, isLoading: loadingHistory, refetch: refetchHistory } = useAppointments({ 
        branchId: activeStoreId || undefined, 
        limit: modalLimit, 
        page: modalPage,
        search: modalSearch || undefined,
        doctorId: modalFilters.doctorId,
        departmentId: modalFilters.departmentId,
        patientId: modalFilters.patientId,
        status: modalFilters.status,
        startDate: modalFilters.startDate,
        endDate: modalFilters.endDate,
    })

    const recentAppointments = recentAppointmentsRes?.data || []
    const historyPagination = recentAppointmentsRes?.meta
    
    // Auto-fill room based on user
    useEffect(() => {
        if (selectedDoctorId) {
            const user: any = users.find((u: any) => u.id === selectedDoctorId)
            setChamberOrRoomNumber(user?.employee?.chamberOrRoomNumber || "")
        } else {
            setChamberOrRoomNumber("")
        }
    }, [selectedDoctorId, users])

    const handleCreateAppointment = async () => {
        if (!selectedCustomer || !selectedDoctorId || !appointmentDate || !timeSlot) {
            toast.error("Please fill in all required fields")
            return
        }

        const selectedUser: any = users.find(u => u.id === selectedDoctorId)

        try {
            await createAppointmentMutation.mutateAsync({
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
            })

            toast.success("Appointment successfully scheduled!")
            refetchHistory()
            
            // Reset
            setSelectedCustomer(null)
            setSelectedDoctorId("")
            setTimeSlot("")
            setChamberOrRoomNumber("")
            setNote("")
            setSelectedReferralPersonId("")
        } catch (error) {
            toast.error("Failed to schedule appointment")
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
                    onClick={() => setHistoryOpen(true)}
                >
                    <History className="h-4 w-4 text-primary" />
                    Appointment Logs
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto w-full">
                {/* Left Side - Appointment Form */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <Card className="border-none  overflow-hidden rounded-[2rem]">
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
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Select Time Slot *</Label>
                                <TimeSlotPicker 
                                    value={timeSlot}
                                    onChange={setTimeSlot}
                                    startTime={appointmentConfig?.startTime}
                                    endTime={appointmentConfig?.endTime}
                                    duration={appointmentConfig?.slotDuration}
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
                <div className="lg:col-span-4">
                    <Card className="border-none   overflow-hidden rounded-[2rem] sticky top-24">
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

                            <Button 
                                className="w-full h-16 text-lg font-black uppercase tracking-[0.2em] rounded-2xl   transition-all active:scale-[0.98] group"
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

            {/* History Dialog */}
            <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
                <DialogContent className="sm:max-w-7xl md:max-w-[85vw] lg:max-w-[75vw] w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl rounded-[3rem]">
                    <DialogHeader className="p-4 px-6 border-b bg-muted/30 shrink-0">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                                <DialogTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                                    <History className="h-5 w-5 text-primary" />
                                    Appointment History
                                </DialogTitle>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em]">Registry Logs & Previous Schedules</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setHistoryOpen(false)} className="rounded-full h-8 w-8 bg-muted/50">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden flex flex-col p-4 px-6 gap-4">
                        {/* Search & Advanced Filters */}
                        <div className="flex flex-col gap-4 p-4 bg-muted/10 rounded-2xl border border-border/30 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Quick Search by Patient Name or ID..." 
                                    className="pl-10 h-10 bg-background rounded-xl border-none shadow-sm font-bold"
                                    value={modalSearch}
                                    onChange={(e) => setModalSearch(e.target.value)}
                                />
                            </div>
                            
                            <AppointmentFilters 
                                values={modalFilters}
                                onChange={setModalFilters}
                                doctors={users.filter((u: any) => u.role?.name?.toLowerCase() === 'doctor').map(u => ({ id: u.id, name: u.fullName || u.username }))}
                                departments={departments.map(d => ({ id: d.id, name: d.name }))}
                                patients={patients.map((p: any) => ({ id: p.id, name: p.name }))}
                            />
                        </div>

                        {/* History Table */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-[2rem] border bg-background shadow-inner">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                                    <tr className="h-10 border-b border-border/50">
                                        <th className="px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Schedule Info</th>
                                        <th className="px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Patient</th>
                                        <th className="px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Specialist</th>
                                        <th className="px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Status</th>
                                        <th className="px-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingHistory ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                                <p className="mt-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">Retrieving Registry...</p>
                                            </td>
                                        </tr>
                                    ) : recentAppointments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                                    <CalendarDays className="h-8 w-8 text-muted-foreground/30" />
                                                </div>
                                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No matching records found</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        recentAppointments.map((apt: any) => (
                                            <tr key={apt.id} className="h-14 border-b border-border/50 hover:bg-muted/20 transition-colors group">
                                                <td className="px-6">
                                                    <div className="flex flex-col">
                                                        <p className="font-black text-sm text-foreground">{format(new Date(apt.date), 'MMM dd, yyyy')}</p>
                                                        <p className="text-xs font-bold text-primary flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {apt.timeSlot}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center font-black text-primary">
                                                            {apt.patient?.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-sm text-foreground">{apt.patient?.name}</p>
                                                            <p className="text-[10px] font-bold text-muted-foreground">{apt.patient?.phone}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                                            <Users className="h-4 w-4 text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-xs text-foreground">{apt.doctor?.fullName || apt.doctor?.name || apt.doctor?.username || 'Assigned Doctor'}</p>
                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{apt.department?.name || 'General'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6">
                                                    <div className="flex justify-center">
                                                        <Badge className={cn(
                                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-none",
                                                            apt.status === 'completed' ? "bg-emerald-500/10 text-emerald-600" :
                                                            apt.status === 'cancelled' ? "bg-rose-500/10 text-rose-600" :
                                                            "bg-amber-500/10 text-amber-600"
                                                        )}>
                                                            {apt.status}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-6 text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                                        onClick={() => {
                                                            setSelectedAppointmentId(apt.id)
                                                            setDetailsOpen(true)
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {historyPagination && historyPagination.totalPages > 1 && (
                            <div className="flex items-center justify-between p-4 bg-muted/5 rounded-2xl border border-border/30 shrink-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Page {modalPage} of {historyPagination.totalPages} • Total {historyPagination.totalItems} Records
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        disabled={modalPage === 1}
                                        onClick={() => setModalPage(p => p - 1)}
                                        className="h-8 rounded-lg font-black text-[10px] uppercase"
                                    >
                                        Prev
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        disabled={modalPage === historyPagination.totalPages}
                                        onClick={() => setModalPage(p => p + 1)}
                                        className="h-8 rounded-lg font-black text-[10px] uppercase"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AppointmentDetailsDialog 
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                appointmentId={selectedAppointmentId}
            />
        </div>
    )
}
