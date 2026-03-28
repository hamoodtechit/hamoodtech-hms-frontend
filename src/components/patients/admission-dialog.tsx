"use client"

import { CommissionAgentSearch } from "@/components/hr/agent-search"
import { PatientSearch } from "@/components/pharmacy/pos/patient-search"
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
import { useBeds } from "@/hooks/facility-queries"
import { useCreateAdmission, useUpdateAdmission } from "@/hooks/patient-queries"
import { useStoreContext } from "@/store/use-store-context"
import { Admission, AdmissionStatus, Patient } from "@/types/patient"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface AdmissionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    admission?: Admission | null
    onSuccess?: (admission: Admission) => void
}

export function AdmissionDialog({ open, onOpenChange, admission, onSuccess }: AdmissionDialogProps) {
    const [loading, setLoading] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    
    const { activeStoreId, stores } = useStoreContext()
    
    const activeBranchName = stores.find(s => s.id === (admission?.branchId || activeStoreId))?.name || "N/A"

    const createMutation = useCreateAdmission()
    const updateMutation = useUpdateAdmission()

    // Form State
    const [formData, setFormData] = useState({
        branchId: "",
        patientId: "",
        bedId: "",
        admissionDate: new Date().toISOString().split('T')[0],
        reason: "",
        note: "",
        status: "admitted" as AdmissionStatus,
        guardianName: "",
        guardianPhone: "",
        guardianRelation: "",
        fees: 0,
        commissionAgentId: ""
    })

    // Data Fetching
    const { data: bedsRes } = useBeds({ limit: 100 })
    
    

    useEffect(() => {
        if (bedsRes) {
            console.log('Available Beds for Admission:', bedsRes.data);
        }
    }, [bedsRes]);

    useEffect(() => {
        if (open) {
            if (admission) {
                setFormData({
                    branchId: admission.branchId || activeStoreId || "",
                    patientId: admission.patientId || "",
                    bedId: admission.bedId || "",
                    admissionDate: admission.admissionDate ? admission.admissionDate.split('T')[0] : new Date().toISOString().split('T')[0],
                    reason: admission.reason || "",
                    note: admission.note || "",
                    status: admission.status || "admitted",
                    guardianName: admission.guardianName || "",
                    guardianPhone: admission.guardianPhone || "",
                    guardianRelation: admission.guardianRelation || "",
                    fees: Number(admission.fees) || 0,
                    commissionAgentId: admission.commissionAgentId || ""
                })
                setSelectedPatient(admission.patient || null)
            } else {
                setFormData({
                    branchId: activeStoreId || "",
                    patientId: "",
                    bedId: "",
                    admissionDate: new Date().toISOString().split('T')[0],
                    reason: "",
                    note: "",
                    status: "admitted",
                    guardianName: "",
                    guardianPhone: "",
                    guardianRelation: "",
                    fees: 0,
                    commissionAgentId: ""
                })
                setSelectedPatient(null)
            }
        }
    }, [open, admission, activeStoreId])
    

    useEffect(() => {
        if (selectedPatient) {
            setFormData(prev => ({ ...prev, patientId: selectedPatient.id }))
        }
    }, [selectedPatient])

    useEffect(() => {
        if (formData.bedId && bedsRes?.data) {
            const selectedBed = bedsRes.data.find(b => b.id === formData.bedId)
            if (selectedBed?.bedType?.pricePerDay) {
                setFormData(prev => ({ ...prev, fees: Number(selectedBed.bedType?.pricePerDay) || 0 }))
            }
        }
    }, [formData.bedId, bedsRes])

    const handleSave = async () => {
        if (!formData.patientId || !formData.bedId) {
            toast.error("Please fill in required fields (Patient, Bed)")
            return
        }

        setLoading(true)
        try {
            if (admission?.id) {
                // Update
                const res = await updateMutation.mutateAsync({
                    id: admission.id,
                    data: {
                        ...formData,
                        branchId: activeStoreId || formData.branchId
                    }
                })
                toast.success("Admission updated successfully")
                onSuccess?.(res.data)
            } else {
                // Create
                const res = await createMutation.mutateAsync({
                    ...formData,
                    branchId: activeStoreId || formData.branchId
                })
                toast.success("Patient admitted successfully")
                onSuccess?.(res.data)
            }
            onOpenChange(false)
        } catch (error) {
            toast.error(admission?.id ? "Failed to update admission" : "Failed to admit patient")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{admission ? "Edit Admission" : "New Patient Admission (IPD)"}</DialogTitle>
                    <DialogDescription>
                        Complete the fields below to admit a patient to a bed.
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
                                        <SelectItem value="admitted">Admitted</SelectItem>
                                        <SelectItem value="discharged">Discharged</SelectItem>
                                        <SelectItem value="transferred">Transferred</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Search Patient *</Label>
                                    <PatientSearch 
                                        selectedPatient={selectedPatient as any}
                                        onSelect={(p) => setSelectedPatient(p as any)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Select Bed *</Label>
                                    <SearchableSelect 
                                        value={formData.bedId}
                                        onChange={(val) => setFormData(prev => ({ ...prev, bedId: val }))}
                                        options={[
                                            ...(admission?.bed ? [{ 
                                                id: admission.bedId, 
                                                name: `${admission.bed.bedNumber} - ${admission.bed.bedType?.name} (${admission.bed.section?.name}) - Tk ${admission.bed.bedType?.pricePerDay}` 
                                            }] : []),
                                            ...(bedsRes?.data?.filter(b => b.id !== admission?.bedId).map(b => ({ 
                                                id: b.id, 
                                                name: `${b.bedNumber} - ${b.bedType?.name} (${b.section?.name}) - Tk ${b.bedType?.pricePerDay}` 
                                            })) || [])
                                        ]}
                                        placeholder="Available beds"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Admission Date *</Label>
                                    <Input 
                                        type="date"
                                        value={formData.admissionDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, admissionDate: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Admission Fees (Tk)</Label>
                                    <SmartNumberInput 
                                        value={formData.fees}
                                        onChange={(val) => setFormData(prev => ({ ...prev, fees: val || 0 }))}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <Separator className="my-2" />
                            <h3 className="text-sm font-bold text-primary">Guardian Information</h3>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>Guardian Name</Label>
                                    <Input 
                                        value={formData.guardianName}
                                        onChange={(e) => setFormData(prev => ({ ...prev, guardianName: e.target.value }))}
                                        placeholder="Full Name"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Guardian Phone</Label>
                                    <Input 
                                        value={formData.guardianPhone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, guardianPhone: e.target.value }))}
                                        placeholder="017..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Relationship</Label>
                                    <Input 
                                        value={formData.guardianRelation}
                                        onChange={(e) => setFormData(prev => ({ ...prev, guardianRelation: e.target.value }))}
                                        placeholder="e.g. Spouse, Parent"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Admission Reason / Diagnosis</Label>
                                <Input 
                                    value={formData.reason}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                    placeholder="Enter the primary reason for admission"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="grid gap-2">
                                    <Label>Commission Agent (Optional)</Label>
                                    <CommissionAgentSearch 
                                        selectedAgentId={formData.commissionAgentId}
                                        onSelect={(agent) => setFormData(prev => ({ ...prev, commissionAgentId: agent?.id || "" }))}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Clinical Notes</Label>
                                <Textarea 
                                    placeholder="Any special instructions or background notes..."
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
                        {admission ? "Update Admission" : "Confirm Admission"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function Separator({ className }: { className?: string }) {
    return <div className={`h-px bg-border ${className}`} />
}
