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
    
    const departments = departmentsRes?.data || []
    const users = useMemo(() => usersRes?.data || [], [usersRes])

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
    const [selectedReferralPersonId, setSelectedReferralPersonId] = useState<string>("")
    const [chamberOrRoomNumber, setChamberOrRoomNumber] = useState<string>("")
    const [note, setNote] = useState<string>("")
    
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

        try {
            await createAppointmentMutation.mutateAsync({
                branchId: activeStoreId || "",
                patientId: selectedCustomer.id,
                departmentId: selectedDepartmentId || "",
                doctorId: selectedDoctorId,
                date: appointmentDate,
                timeSlot: timeSlot,
                note: note || undefined,
                status: 'pending',
                chamberOrRoomNumber: chamberOrRoomNumber || undefined,
                referralPersonId: selectedReferralPersonId || undefined,
            })

            toast.success("Appointment successfully scheduled!")
            
            // Reset
            setSelectedCustomer(null)
            setSelectedDoctorId("")
            setSelectedDepartmentId("")
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto w-full">
                {/* Left Side - Appointment Form */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <Card className="border-none shadow-2xl shadow-primary/10 overflow-hidden rounded-[2rem]">
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
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Department *</Label>
                                    <SearchableSelect 
                                        value={selectedDepartmentId}
                                        onChange={(val) => {
                                            setSelectedDepartmentId(val)
                                            setSelectedDoctorId("")
                                        }}
                                        options={departments.map(d => ({ id: d.id, name: d.name }))}
                                        placeholder="Choose Clinical Department..."
                                        showAll={false}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Specialist Doctor *</Label>
                                    <SearchableSelect 
                                        value={selectedDoctorId}
                                        onChange={setSelectedDoctorId}
                                        options={users
                                            .filter((u: any) => 
                                                u.role?.name?.toLowerCase() === 'doctor' && 
                                                (!selectedDepartmentId || u.employee?.departmentId === selectedDepartmentId)
                                            )
                                            .map((u: any) => ({ 
                                                id: u.id, 
                                                name: u.fullName || u.username 
                                            }))}
                                        placeholder="Assign Specialist..."
                                        loading={loadingUsers}
                                        disabled={!selectedDepartmentId}
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
                    <Card className="border-none shadow-2xl shadow-primary/20 overflow-hidden rounded-[2rem] sticky top-24">
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
                                            {users.find(u => u.id === selectedDoctorId)?.fullName || 'Specialist not assigned'}
                                        </p>
                                        <p className="text-xs font-bold text-muted-foreground">
                                            {departments.find(d => d.id === selectedDepartmentId)?.name || 'Select department'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button 
                                className="w-full h-16 text-lg font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] group"
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
        </div>
    )
}
