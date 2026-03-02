"use client"

import { PatientDialog } from "@/components/patients/patient-dialog"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateAppointment, useUpdateAppointment } from "@/hooks/appointment-queries"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useDepartments, useEmployees } from "@/hooks/hr-queries"
import { usePatients } from "@/hooks/patient-queries"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { Appointment, AppointmentStatus } from "@/types/appointment"
import { PaymentMethod } from "@/types/pharmacy"
import { Banknote, Loader2, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { TimeSlotPicker } from "./time-slot-picker"

interface AppointmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointment?: Appointment | null
    onSuccess?: () => void
}

export function AppointmentDialog({ open, onOpenChange, appointment, onSuccess }: AppointmentDialogProps) {
    const [loading, setLoading] = useState(false)
    const [patientDialogOpen, setPatientDialogOpen] = useState(false)
    
    const { activeStoreId, stores } = useStoreContext()
    const activeBranchName = stores.find(s => s.id === activeStoreId)?.name || "N/A"

    const createMutation = useCreateAppointment()
    const updateMutation = useUpdateAppointment()
    const { appointments: appointmentConfig, finance, fetchSettings } = useSettingsStore()

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
    const [selectedAccountId, setSelectedAccountId] = useState("")
    const [paidAmount, setPaidAmount] = useState(0)

    const isEdit = !!appointment

    const { data: accountsRes } = useFinanceAccounts({ isActive: true, limit: 100 })
    const accounts = accountsRes?.data || []

    useEffect(() => {
        if (open) {
            fetchSettings()
        }
    }, [open, fetchSettings])

    useEffect(() => {
        if (!isEdit) {
            const defaultAccountId = finance?.paymentMethodAccounts?.[paymentMethod]?.id || ""
            setSelectedAccountId(defaultAccountId)
        }
    }, [paymentMethod, finance, isEdit])

    // Form State
    const [formData, setFormData] = useState({
        branchId: "",
        patientId: "",
        doctorId: "",
        departmentId: "",
        date: new Date().toISOString().split('T')[0],
        timeSlot: "",
        note: "",
        fees: 0,
        status: "pending" as AppointmentStatus
    })

    // Data Fetching
    const { data: departmentsRes } = useDepartments({ branchId: activeStoreId, limit: 100 })
    const { data: doctorsRes } = useEmployees({ branchId: activeStoreId, employeeType: "doctor", limit: 100 })
    const { data: patientsRes } = usePatients({ limit: 100 })

    useEffect(() => {
        if (open) {
            if (appointment) {
                setFormData({
                    branchId: appointment.branchId,
                    patientId: appointment.patientId,
                    doctorId: appointment.doctorId,
                    departmentId: appointment.departmentId,
                    date: appointment.date.split('T')[0],
                    timeSlot: appointment.timeSlot,
                    note: appointment.note || "",
                    fees: Number(appointment.fees) || 0,
                    status: appointment.status
                })
            } else {
                setFormData({
                    branchId: activeStoreId || "",
                    patientId: "",
                    doctorId: "",
                    departmentId: "",
                    date: new Date().toISOString().split('T')[0],
                    timeSlot: "",
                    note: "",
                    fees: 0,
                    status: "pending"
                })
            }
        }
    }, [open, appointment, activeStoreId])

    const handleSave = async () => {
        if (!formData.patientId || !formData.doctorId || !formData.date || !formData.timeSlot) {
            toast.error("Please fill in all required fields (Patient, Doctor, Date, Time Slot)")
            return
        }

        setLoading(true)
        try {
            if (isEdit && appointment) {
                await updateMutation.mutateAsync({
                    id: appointment.id,
                    data: formData
                })
                toast.success("Appointment updated successfully")
            } else {
                const dueAmount = Math.max(0, formData.fees - paidAmount)
                const payload = {
                    ...formData,
                    branchId: activeStoreId || formData.branchId,
                    paymentMethod,
                    paidAmount,
                    dueAmount,
                    payments: paidAmount > 0 ? [{
                        accountId: selectedAccountId || finance?.paymentMethodAccounts?.[paymentMethod]?.id || "",
                        amount: paidAmount,
                        paymentMethod,
                        note: "Appointment fee payment"
                    }] : []
                }
                await createMutation.mutateAsync(payload)
                toast.success("Appointment scheduled successfully")
            }
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            toast.error(isEdit ? "Failed to update appointment" : "Failed to schedule appointment")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle>{isEdit ? "Edit Appointment" : "Schedule New Appointment"}</DialogTitle>
                        <DialogDescription>
                            Enter the details to {isEdit ? "update" : "schedule"} a patient appointment.
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="max-h-[80vh] px-6">
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Active Branch</Label>
                                    <Input value={activeBranchName} disabled className="bg-muted" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <Select 
                                        value={formData.status} 
                                        onValueChange={(val: any) => setFormData(prev => ({ ...prev, status: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="confirmed">Confirmed</SelectItem>
                                            <SelectItem value="in-progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                            <SelectItem value="no-show">No Show</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <Label>Patient *</Label>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-7 text-[10px] gap-1 px-2"
                                            onClick={() => setPatientDialogOpen(true)}
                                        >
                                            <Plus className="h-3 w-3" /> New Patient
                                        </Button>
                                    </div>
                                    <SearchableSelect 
                                        value={formData.patientId}
                                        onChange={(val) => setFormData(prev => ({ ...prev, patientId: val }))}
                                        options={patientsRes?.data?.map(p => ({ id: p.id, name: `${p.name} (${p.phone})` })) || []}
                                        placeholder="Search and select patient"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Department *</Label>
                                        <SearchableSelect 
                                            value={formData.departmentId}
                                            onChange={(val) => setFormData(prev => ({ ...prev, departmentId: val, doctorId: "" }))}
                                            options={departmentsRes?.data?.map(d => ({ id: d.id, name: d.name })) || []}
                                            placeholder="Select Department"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Doctor *</Label>
                                        <SearchableSelect 
                                            value={formData.doctorId}
                                            onChange={(val) => setFormData(prev => ({ ...prev, doctorId: val }))}
                                            options={doctorsRes?.data?.filter(d => !formData.departmentId || d.departmentId === formData.departmentId).map(d => ({ id: d.id, name: d.name })) || []}
                                            placeholder="Select Doctor"
                                            disabled={!formData.departmentId}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Appointment Date *</Label>
                                    <Input 
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <TimeSlotPicker 
                                        value={formData.timeSlot}
                                        onChange={(time) => setFormData(prev => ({ ...prev, timeSlot: time }))}
                                        startTime={appointmentConfig?.startTime}
                                        endTime={appointmentConfig?.endTime}
                                        duration={appointmentConfig?.slotDuration}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Consultation Fees (Tk)</Label>
                                        <SmartNumberInput 
                                            placeholder="600"
                                            value={formData.fees}
                                            onChange={(val) => {
                                                const newFees = val || 0
                                                setFormData(prev => ({ ...prev, fees: newFees }))
                                                if (!isEdit) setPaidAmount(newFees)
                                            }}
                                            className="rounded-xl border-primary/10 h-10"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Amount Paid (Tk)</Label>
                                        <div className="relative">
                                            <SmartNumberInput 
                                                value={paidAmount}
                                                onChange={(val) => setPaidAmount(val || 0)}
                                                className="h-10 pl-8 font-bold border-primary/10"
                                                disabled={isEdit}
                                            />
                                            <Banknote className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>

                                {!isEdit && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Payment Method</Label>
                                            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                                                <SelectTrigger className="h-10">
                                                    <SelectValue placeholder="Select method" />
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
                                        <div className="grid gap-2">
                                            <Label>Target Account</Label>
                                            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                                <SelectTrigger className="h-10">
                                                    <SelectValue placeholder="Select account" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {accounts.map(acc => (
                                                        <SelectItem key={acc.id} value={acc.id}>
                                                            {acc.name} ({acc.type})
                                                        </SelectItem>
                                                    ))}
                                                    {accounts.length === 0 && (
                                                        <SelectItem value="none" disabled>No accounts found</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label>Notes</Label>
                                    <Textarea 
                                        placeholder="Any special instructions or symptoms..."
                                        value={formData.note}
                                        onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 border-t">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Update Appointment" : "Confirm Appointment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <PatientDialog 
                open={patientDialogOpen}
                onOpenChange={setPatientDialogOpen}
                onSuccess={(newPatient) => {
                    setFormData(prev => ({ ...prev, patientId: newPatient.id }))
                    setPatientDialogOpen(false)
                }}
            />
        </>
    )
}
