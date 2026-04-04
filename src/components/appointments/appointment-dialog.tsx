"use client"

import { PatientDialog } from "@/components/patients/patient-dialog"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { CommissionAgentSearch } from "@/components/hr/agent-search"
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
import { useDepartments, useEmployees } from "@/hooks/hr-queries"
import { usePatients } from "@/hooks/patient-queries"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useAddSalePayment } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { Appointment, AppointmentStatus } from "@/types/appointment"
import { FinanceAccount } from "@/types/finance"
import { Loader2, Plus, Wallet } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { TimeSlotPicker } from "./time-slot-picker"
import { PaymentMethod } from "@/types/pharmacy"

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
    const addPaymentMutation = useAddSalePayment()
    const { appointments: appointmentConfig, fetchSettings } = useSettingsStore()
    const { formatCurrency } = useCurrency()

    const { data: accountsRes } = useFinanceAccounts({ branchId: activeStoreId, isActive: true, limit: 100 })
    const accounts = accountsRes?.data || []

    const isEdit = !!appointment

    useEffect(() => {
        if (open) {
            fetchSettings()
        }
    }, [open, fetchSettings])

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
        status: "pending" as AppointmentStatus,
        purpose: "consultation",
        chamberOrRoomNumber: "",
        commissionAgentId: ""
    })

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
    const [selectedAccountId, setSelectedAccountId] = useState<string>("")
    const [paidAmount, setPaidAmount] = useState<number>(0)
    const [showPayment, setShowPayment] = useState(false)

    // Data Fetching
    const { data: departmentsRes } = useDepartments({ branchId: activeStoreId || undefined, limit: 100 })
    const { data: doctorsRes } = useEmployees({ branchId: activeStoreId || undefined, limit: 100 })
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
                    status: appointment.status,
                    purpose: appointment.purpose || "consultation",
                    chamberOrRoomNumber: appointment.chamberOrRoomNumber || "",
                    commissionAgentId: appointment.commissionAgentId || ""
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
                    status: "pending",
                    purpose: "consultation",
                    chamberOrRoomNumber: "",
                    commissionAgentId: ""
                })
            }
        }
    }, [open, appointment, activeStoreId])

    // Auto-fill room based on doctor
    useEffect(() => {
        if (formData.doctorId) {
            const doctor = doctorsRes?.data?.find(d => d.id === formData.doctorId)
            if (doctor?.chamberOrRoomNumber) {
                setFormData(prev => ({ ...prev, chamberOrRoomNumber: doctor.chamberOrRoomNumber || "" }))
            }
        }
    }, [formData.doctorId, doctorsRes])

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
                const res: any = await createMutation.mutateAsync({
                    ...formData,
                    branchId: activeStoreId || formData.branchId
                })

                // Extract Sale ID from the response (Backend auto-creates the Sale)
                const saleId = res?.data?.sale?.id

                // 2. Process Payment if amount exists
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
                        toast.success("Appointment scheduled and payment processed!")
                    } catch (pError) {
                        console.error("Payment registration failed:", pError)
                        toast.warning("Appointment scheduled, but payment recording failed. Please collect manually.")
                    }
                } else {
                    toast.success("Appointment scheduled successfully")
                }
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
                                <div className="grid gap-2">
                                    <Label>Room / Chamber</Label>
                                    <Input 
                                        value={formData.chamberOrRoomNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, chamberOrRoomNumber: e.target.value }))}
                                        placeholder="e.g. Room 302"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Purpose</Label>
                                    <Select 
                                        value={formData.purpose} 
                                        onValueChange={(val: any) => setFormData(prev => ({ ...prev, purpose: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Purpose" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="consultation">Consultation</SelectItem>
                                            <SelectItem value="follow-up">Follow-up</SelectItem>
                                            <SelectItem value="emergency">Emergency</SelectItem>
                                            <SelectItem value="treatment">Treatment</SelectItem>
                                            <SelectItem value="report">Report Show</SelectItem>
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

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Consultation Fees (Tk)</Label>
                                        <SmartNumberInput 
                                            placeholder="600"
                                            value={formData.fees}
                                            onChange={(val) => setFormData(prev => ({ ...prev, fees: val || 0 }))}
                                            className="rounded-xl border-primary/10"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Commission Agent</Label>
                                        <CommissionAgentSearch 
                                            selectedAgentId={formData.commissionAgentId}
                                            onSelect={(agent) => setFormData(prev => ({ ...prev, commissionAgentId: agent?.id || "" }))}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Notes</Label>
                                    <Textarea 
                                        placeholder="Any special instructions or symptoms..."
                                        value={formData.note}
                                        onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                        rows={3}
                                    />
                                </div>

                                {!isEdit && (
                                    <div className="pt-4 border-t border-dashed">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Wallet className="h-4 w-4 text-primary" />
                                                <h4 className="text-sm font-bold uppercase tracking-wider">Payment Details</h4>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className={`h-8 px-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${showPayment ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground hover:bg-primary/5"}`}
                                                onClick={() => {
                                                    setShowPayment(!showPayment)
                                                    if (!showPayment) setPaidAmount(formData.fees)
                                                }}
                                            >
                                                {showPayment ? "Cancel Payment" : "Add Payment Now"}
                                            </Button>
                                        </div>

                                        {showPayment && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-1.5 p-3 bg-primary/5 rounded-xl border border-primary/10">
                                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">Total Fees</Label>
                                                        <span className="text-lg font-black text-primary">{formatCurrency(formData.fees)}</span>
                                                    </div>
                                                    <div className="grid gap-1.5 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                                        <Label className="text-[10px] font-bold text-emerald-600 uppercase opacity-70">Amount to Pay *</Label>
                                                        <SmartNumberInput 
                                                            value={paidAmount}
                                                            onChange={(val) => setPaidAmount(val || 0)}
                                                            className="h-8 py-0 border-none bg-transparent font-black text-lg focus-visible:ring-0 text-emerald-700"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment Method *</Label>
                                                        <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                                                            <SelectTrigger className="h-9 text-xs font-medium">
                                                                <SelectValue placeholder="Select Method" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {['cash', 'card', 'online', 'cheque', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer'].map((method) => (
                                                                    <SelectItem key={method} value={method}>
                                                                        <span className="capitalize">{method}</span>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Account *</Label>
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
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
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
