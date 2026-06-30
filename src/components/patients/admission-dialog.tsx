"use client"

import { ReferralSearch } from "@/components/hr/referral-search"
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
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useCreateAdmission, useUpdateAdmission, useUpdatePatient } from "@/hooks/patient-queries"
import { useAddSalePayment, useUpdateSale } from "@/hooks/sales-queries"
import { useDiagnosticTests } from "@/hooks/diagnostic-queries"
import { useUsers } from "@/hooks/user-queries"
import { useDepartments } from "@/hooks/hr-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { FinanceAccount } from "@/types/finance"
import { Admission, AdmissionStatus, Patient } from "@/types/patient"
import { PaymentMethod } from "@/types/pharmacy"
import { SalePayload } from "@/types/sales"
import { Loader2, Trash2, Wallet } from "lucide-react"
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
    const updatePatientMutation = useUpdatePatient()
    const updateSaleMutation = useUpdateSale()

    const { data: testsRes } = useDiagnosticTests({ limit: 1000 })
    const tests = testsRes?.data || []

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
        referralPersonId: "",
        doctorId: "",
        refDoctorName: "",
        departmentId: "",
        admissionCharge: "0",
    })

    const [saleItems, setSaleItems] = useState<any[]>([])

    const [patientExtData, setPatientExtData] = useState({
        village: "",
        union: "",
        postOffice: "",
        thana: "",
        district: "",
        religion: "",
        occupation: "",
        maritalStatus: "" as any,
        nationality: "",
        title: ""
    })

    // Payment State
    const [discount, setDiscount] = useState<number>(0)
    const [discountFixedAmount, setDiscountFixedAmount] = useState<number>(0)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
    const [selectedAccountId, setSelectedAccountId] = useState<string>("")
    const [paidAmount, setPaidAmount] = useState<number>(0)


    const { formatCurrency } = useCurrency()
    const { pharmacy, fetchSettings } = useSettingsStore()
    const vatPercentage = pharmacy?.vatPercentage || 0

    const addPaymentMutation = useAddSalePayment()
    const { data: accountsRes } = useFinanceAccounts({ branchId: activeStoreId, group: 'hospital', isActive: true, limit: 100 })
    const accounts = accountsRes?.data || []

    // Automatically select the first account if none is selected or if current one is invalid
    useEffect(() => {
        if (open && accounts.length > 0) {
            const isCurrentAccountValid = accounts.some(acc => acc.id === selectedAccountId)
            if (!selectedAccountId || !isCurrentAccountValid) {
                setSelectedAccountId(accounts[0].id)
            }
        }
    }, [open, accounts, selectedAccountId])
    const { data: usersRes } = useUsers({ limit: 1000 })
    const { data: deptsRes } = useDepartments({ limit: 1000 })

    const doctors = usersRes?.data?.filter(u => u.role?.name?.toLowerCase() === 'doctor') || []
    const departments = deptsRes?.data || []

    useEffect(() => {
        if (open) {
            fetchSettings()
        }
    }, [open, fetchSettings])

    // Data Fetching
    const { data: bedsRes } = useBeds({ limit: 100,
        status: 'available'
     })
    
    

    

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
                    referralPersonId: admission.referralPersonId || "",
                    doctorId: admission.doctorId || "",
                    refDoctorName: admission.refDoctorName || "",
                    departmentId: admission.departmentId || "",
                    admissionCharge: "0",
                })
                setSelectedPatient(admission.patient || null)
                setSaleItems([]) // Reset for now
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
                    referralPersonId: "",
                    doctorId: "",
                    refDoctorName: "",
                    departmentId: "",
                    admissionCharge: "0",
                })
                setSelectedPatient(null)
                setSaleItems([])
            }
        }
    }, [open, admission, activeStoreId])
    

    useEffect(() => {
        if (selectedPatient) {
            setFormData(prev => ({ ...prev, patientId: selectedPatient.id }))
            setPatientExtData({
                village: selectedPatient.village || "",
                union: selectedPatient.union || "",
                postOffice: selectedPatient.postOffice || "",
                thana: selectedPatient.thana || "",
                district: selectedPatient.district || "",
                religion: selectedPatient.religion || "",
                occupation: selectedPatient.occupation || "",
                maritalStatus: selectedPatient.maritalStatus || "",
                nationality: selectedPatient.nationality || "Bangladeshi",
                title: (selectedPatient as any).title || ""
            })
        } else {
            setPatientExtData({
                village: "",
                union: "",
                postOffice: "",
                thana: "",
                district: "",
                religion: "",
                occupation: "",
                maritalStatus: "",
                nationality: "Bangladeshi",
                title: ""
            })
        }
    }, [selectedPatient])

    const updateItemDiscount = (index: number, field: 'discountPercentage' | 'discountAmount', val: number) => {
        setSaleItems(prev => {
            const next = [...prev];
            const item = { ...next[index] };
            if (field === 'discountPercentage') {
                item.discountPercentage = val;
                item.discountAmount = 0;
            } else {
                item.discountAmount = val;
                item.discountPercentage = 0;
            }
            next[index] = item;
            return next;
        });
    }

    const removeItem = (index: number) => {
        setSaleItems(prev => prev.filter((_, i) => i !== index));
    }

    // Totals logic
    const subtotal = saleItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0)
    const totalItemDiscount = saleItems.reduce((sum, item) => {
        const amt = Number(item.discountAmount) || (Number(item.discountPercentage || 0) ? (Number(item.price) * Number(item.quantity) * Number(item.discountPercentage)) / 100 : 0);
        return sum + amt;
    }, 0)
    
    const discountedSubtotal = Math.max(0, subtotal - totalItemDiscount)
    const discountAmount = discountFixedAmount || (discountedSubtotal * discount) / 100
    const finalSubtotal = Math.max(0, discountedSubtotal - discountAmount)
    const tax = finalSubtotal * (vatPercentage / 100)
    const total = finalSubtotal + tax
    const dueAmount = Math.max(0, total - paidAmount)

    // Bed rent is now automatically calculated and injected by the backend upon admission creation.

    // Update paid amount when total changes (for new admission only)
    useEffect(() => {
        if (!admission && open) {
            setPaidAmount(total)
        }
    }, [total, admission, open])

    const handleSave = async () => {
        if (!formData.patientId || !formData.bedId) {
            toast.error("Please fill in required fields (Patient, Bed)")
            return
        }

        const finalBranchId = (activeStoreId === "all" ? stores[0]?.id : activeStoreId) || formData.branchId;
        if (!finalBranchId) {
            toast.error("Branch ID is required. Please select a valid branch or ensure your store context is loaded.")
            return
        }

        setLoading(true)
        try {
            // 1. Check if patient data needs updating
            const hasPatientChanges = selectedPatient && (
                patientExtData.village !== (selectedPatient.village || "") ||
                patientExtData.union !== (selectedPatient.union || "") ||
                patientExtData.postOffice !== (selectedPatient.postOffice || "") ||
                patientExtData.thana !== (selectedPatient.thana || "") ||
                patientExtData.district !== (selectedPatient.district || "") ||
                patientExtData.religion !== (selectedPatient.religion || "") ||
                patientExtData.occupation !== (selectedPatient.occupation || "") ||
                patientExtData.maritalStatus !== (selectedPatient.maritalStatus || "") ||
                patientExtData.maritalStatus !== (selectedPatient.maritalStatus || "") ||
                patientExtData.nationality !== (selectedPatient.nationality || "") ||
                patientExtData.title !== ((selectedPatient as any).title || "")
            );

            if (hasPatientChanges && selectedPatient) {
                const cleanedPatientData = Object.fromEntries(
                    Object.entries({
                        ...selectedPatient,
                        ...patientExtData,
                        age: selectedPatient.age ? Number(selectedPatient.age) : undefined
                    }).filter(([_, v]) => v !== null && v !== undefined)
                );

                try {
                    await updatePatientMutation.mutateAsync({
                        id: selectedPatient.id,
                        data: cleanedPatientData as any
                    });
                } catch (pe) {
                    console.error("Failed to update patient demographics:", pe);
                    // We continue anyway, but warn the user
                    toast.warning("Admission will proceed, but patient demographic update failed.");
                }
            }

            let resAdmission: any;
            if (admission?.id) {
                // Update
                resAdmission = await updateMutation.mutateAsync({
                    id: admission.id,
                    data: {
                        branchId: finalBranchId,
                        patientId: formData.patientId,
                        bedId: formData.bedId,
                        admissionDate: formData.admissionDate,
                        reason: formData.reason,
                        note: formData.note,
                        status: formData.status,
                        guardianName: formData.guardianName,
                        guardianPhone: formData.guardianPhone,
                        guardianRelation: formData.guardianRelation,
                        refDoctorName: formData.refDoctorName,
                        departmentId: formData.departmentId || undefined,
                        doctorId: formData.doctorId || undefined,
                        referralPersonId: formData.referralPersonId || undefined,
                    }
                })
                toast.success("Admission updated successfully")
            } else {
                // Create
                if (paidAmount > 0 && !selectedAccountId) {
                    toast.error("Please select a target finance account for the payment")
                    setLoading(false)
                    return
                }

                resAdmission = await createMutation.mutateAsync({
                    ...formData,
                    departmentId: formData.departmentId || undefined,
                    doctorId: formData.doctorId || undefined,
                    referralPersonId: formData.referralPersonId || undefined,
                    admissionCharge: Number(formData.admissionCharge),
                    branchId: finalBranchId,
                    saleItems: saleItems.map(item => ({
                        ...item,
                        price: Number(item.price),
                        mrp: Number(item.mrp),
                        quantity: Number(item.quantity)
                    })),
                    discountPercentage: discount,
                    discountAmount: discountAmount,
                    taxPercentage: vatPercentage,
                    taxAmount: tax,
                    type: 'hospital'
                })

                // Extract Sale ID from the response (Backend auto-creates the Sale)
                const saleId = resAdmission?.data?.sale?.id

                // 3. Process Payment if amount exists
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
                        toast.success("Patient admitted and payment processed!")
                    } catch (pError) {
                        console.error("Payment registration failed:", pError)
                        toast.warning("Admission confirmed, but payment recording failed. Please collect manually via Sales.")
                    }
                } else {
                    toast.success("Patient admitted successfully!")
                }
            }
            onSuccess?.(resAdmission.data)
            onOpenChange(false)
        } catch (error: any) {
            // Backend error message is shown automatically by the global API interceptor
            // Only show a fallback if there's no backend message
            if (!error?.response?.data?.message) {
                toast.error(admission?.id ? "Failed to update admission" : "Failed to admit patient")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{admission ? "Edit Admission" : "New Patient Admission (IPD)"}</DialogTitle>
                    <DialogDescription>
                        Complete the fields below to admit a patient to a bed.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh] px-6" type="always">
                    <div className="grid gap-6 py-4">
                        {/* Branch and Status are handled automatically */}

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
                                                name: `[CURRENT] ${admission.bed.bedNumber} - ${admission.bed.bedType?.name} (${admission.bed.section?.name}) - Tk ${admission.bed.bedType?.pricePerDay}`,
                                                disabled: false
                                            }] : []),
                                            ...(bedsRes?.data?.filter(b => b.id !== admission?.bedId).map(b => ({ 
                                                id: b.id, 
                                                name: `[${b.status.toUpperCase()}] ${b.bedNumber} - ${b.bedType?.name} (${b.section?.name}) - Tk ${b.bedType?.pricePerDay}`,
                                                disabled: b.status !== 'available'
                                            })) || [])
                                        ]}
                                        placeholder="Available beds"
                                    />
                                </div>
                            </div>

                            {/* Service Selection Section - Only for New Admissions */}
                            {!admission && (
                                <div className="space-y-4 p-4 bg-muted/30 rounded-2xl border border-border">
                                    <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2 col-span-2">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2 mb-2">
                                            Services
                                        </h4>
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Select Additional Services</Label>
                                        <SearchableSelect 
                                        value=""
                                        onChange={(val) => {
                                            const service = tests.find(t => t.id === val)
                                            if (service && !saleItems.find(s => s.serviceId === val)) {
                                                setSaleItems(prev => [...prev, {
                                                    serviceId: service.id,
                                                    itemName: service.name,
                                                    unit: service.unit || "unit",
                                                    price: service.price,
                                                    mrp: service.price,
                                                    quantity: 1,
                                                    isDiagnosticTest: service.isDiagnosticTest || false,
                                                    discountPercentage: 0,
                                                    discountAmount: 0
                                                }])
                                            }
                                        }}
                                        options={tests.map(t => ({ id: t.id, name: `${t.name} - ${formatCurrency(t.price)}` }))}
                                        placeholder="Search and add service..."
                                    />
                                </div>
                                </div>

                                {saleItems.length > 0 && (
                                    <div className="space-y-3">
                                        {saleItems.map((item, idx) => (
                                            <div key={idx} className="p-3 bg-background rounded-2xl border border-border/60 shadow-sm group">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-foreground">{item.itemName}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{item.unit} | {formatCurrency(item.price)}</span>
                                                    </div>
                                                    {!item.isBedCharge && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10"
                                                            onClick={() => removeItem(idx)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center gap-4 pt-3 border-t border-border/40">
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Disc %</Label>
                                                        <div className="relative">
                                                            <SmartNumberInput 
                                                                value={item.discountPercentage}
                                                                onChange={(v) => updateItemDiscount(idx, 'discountPercentage', v || 0)}
                                                                className="h-8 text-xs font-bold pl-7"
                                                                min={0}
                                                                max={100}
                                                            />
                                                            <span className="absolute left-2.5 top-2 text-[10px] font-black text-muted-foreground">%</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Disc Amt</Label>
                                                        <div className="relative">
                                                            <SmartNumberInput 
                                                                value={item.discountAmount}
                                                                onChange={(v) => updateItemDiscount(idx, 'discountAmount', v || 0)}
                                                                className="h-8 text-xs font-bold pl-7"
                                                                min={0}
                                                            />
                                                            <span className="absolute left-2.5 top-2 text-[10px] font-black text-muted-foreground">Tk</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 text-right">
                                                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-70 block mb-1">Final</Label>
                                                        <span className="text-sm font-black text-primary">{formatCurrency(Number(item.price) - (Number(item.discountAmount) || (Number(item.discountPercentage || 0) ? (Number(item.price) * Number(item.discountPercentage)) / 100 : 0)))}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between px-3 pt-2 border-t mt-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subtotal</span>
                                            <span className="text-sm font-black text-foreground">{formatCurrency(subtotal)}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Items Discount</span>
                                            <span className="text-sm font-black text-emerald-600">-{formatCurrency(totalItemDiscount)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            )}

                            {selectedPatient && (
                                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        Patient Identification & Demographics
                                    </h4>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="grid gap-1.5">
                                            <Label className="text-[10px]">Title</Label>
                                            <Select 
                                                value={patientExtData.title} 
                                                onValueChange={(val) => setPatientExtData(p => ({ ...p, title: val }))}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Title" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Mr.">Mr.</SelectItem>
                                                    <SelectItem value="Mrs.">Mrs.</SelectItem>
                                                    <SelectItem value="Ms.">Ms.</SelectItem>
                                                    <SelectItem value="Dr.">Dr.</SelectItem>
                                                    <SelectItem value="Prof.">Prof.</SelectItem>
                                                    <SelectItem value="Master">Master</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5 col-span-1">
                                            <Label className="text-[10px]">District</Label>
                                            <Input 
                                                className="h-8 text-xs" 
                                                value={patientExtData.district} 
                                                onChange={(e) => setPatientExtData(p => ({ ...p, district: e.target.value }))}
                                                placeholder="e.g. Dhaka"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[10px]">Thana</Label>
                                            <Input 
                                                className="h-8 text-xs" 
                                                value={patientExtData.thana} 
                                                onChange={(e) => setPatientExtData(p => ({ ...p, thana: e.target.value }))}
                                                placeholder="e.g. Uttara"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[10px]">Post Office</Label>
                                            <Input 
                                                className="h-8 text-xs" 
                                                value={patientExtData.postOffice} 
                                                onChange={(e) => setPatientExtData(p => ({ ...p, postOffice: e.target.value }))}
                                                placeholder="e.g. Sector 4"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <div className="grid gap-1.5">
                                            <Label className="text-[10px]">Union/Ward</Label>
                                            <Input 
                                                className="h-8 text-xs" 
                                                value={patientExtData.union} 
                                                onChange={(e) => setPatientExtData(p => ({ ...p, union: e.target.value }))}
                                                placeholder="e.g. Ward 1"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[10px]">Village/Area</Label>
                                            <Input 
                                                className="h-8 text-xs" 
                                                value={patientExtData.village} 
                                                onChange={(e) => setPatientExtData(p => ({ ...p, village: e.target.value }))}
                                                placeholder="e.g. Uttara Sector 4"
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[10px]">Nationality</Label>
                                            <Select 
                                                value={patientExtData.nationality} 
                                                onValueChange={(val) => setPatientExtData(p => ({ ...p, nationality: val }))}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Bangladeshi">Bangladeshi</SelectItem>
                                                    <SelectItem value="Indian">Indian</SelectItem>
                                                    <SelectItem value="Pakistani">Pakistani</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        <div className="grid gap-1.5">
                                            <Label className="text-[10px]">Religion</Label>
                                            <Select 
                                                value={patientExtData.religion} 
                                                onValueChange={(val) => setPatientExtData(p => ({ ...p, religion: val }))}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Islam">Islam</SelectItem>
                                                    <SelectItem value="Hinduism">Hinduism</SelectItem>
                                                    <SelectItem value="Christianity">Christianity</SelectItem>
                                                    <SelectItem value="Buddhism">Buddhism</SelectItem>
                                                    <SelectItem value="Sikhism">Sikhism</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[10px]">Occupation</Label>
                                            <Input 
                                                className="h-8 text-xs" 
                                                value={patientExtData.occupation} 
                                                onChange={(e) => setPatientExtData(p => ({ ...p, occupation: e.target.value }))}
                                            />
                                        </div>
                                        <div className="grid gap-1.5">
                                            <Label className="text-[10px]">Marital Status</Label>
                                            <Select 
                                                value={patientExtData.maritalStatus} 
                                                onValueChange={(val) => setPatientExtData(p => ({ ...p, maritalStatus: val }))}
                                            >
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="single">Single</SelectItem>
                                                    <SelectItem value="married">Married</SelectItem>
                                                    <SelectItem value="divorced">Divorced</SelectItem>
                                                    <SelectItem value="widowed">Widowed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                    <Label>Total Bill Summary (After Items Discount)</Label>
                                    <div className="h-10 px-4 rounded-xl bg-muted/50 flex items-center font-black text-sm text-primary border border-primary/10">
                                        {formatCurrency(discountedSubtotal)}
                                    </div>
                                </div>
                            </div>
                            
                            <Separator className="my-2" />
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Assignment & Consultation</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Assigned Doctor</Label>
                                        <SearchableSelect 
                                            value={formData.doctorId}
                                            onChange={(val) => setFormData(prev => ({ ...prev, doctorId: val }))}
                                            options={doctors.map(d => ({ 
                                                id: d.id, 
                                                name: `${d.fullName} ${d.designation ? `(${d.designation})` : ''}` 
                                            }))}
                                            placeholder="Select Doctor"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Reference Doctor</Label>
                                        <Input 
                                            value={formData.refDoctorName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, refDoctorName: e.target.value }))}
                                            placeholder="Write doctor name manually"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Department</Label>
                                    <Select 
                                        value={formData.departmentId} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, departmentId: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map((dept: any) => (
                                                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
                                    <ReferralSearch 
                                        selectedReferralId={formData.referralPersonId}
                                        onSelect={(referral) => setFormData(prev => ({ ...prev, referralPersonId: referral?.id || "" }))}
                                    />
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

                            {!admission && (
                                <div className="space-y-6 pt-6 border-t mt-4">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="h-5 w-5 text-primary" />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-primary">Billing & Initial Payment</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/30 p-4 rounded-xl border border-primary/5">
                                        {/* Left: Discounts */}
                                        <div className="space-y-4">
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
                                                            onChange={(val) => {
                                                                setDiscount(val || 0)
                                                                setDiscountFixedAmount(0)
                                                            }}
                                                        />
                                                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
                                                    </div>
                                                    <div className="relative">
                                                        <SmartNumberInput 
                                                            placeholder="Fixed" 
                                                            className="h-9 text-sm pr-8" 
                                                            min={0}
                                                            value={discountFixedAmount === 0 ? undefined : discountFixedAmount}
                                                            onChange={(val) => {
                                                                setDiscountFixedAmount(val || 0)
                                                                setDiscount(0)
                                                            }}
                                                        />
                                                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">Tk</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 p-3 bg-background rounded-lg border shadow-sm">
                                                <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase">
                                                    <span>Gross Amount</span>
                                                    <span>{formatCurrency(subtotal)}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-medium text-emerald-600 uppercase">
                                                    <span>Total Items Discount</span>
                                                    <span>-{formatCurrency(totalItemDiscount)}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px] font-black text-primary uppercase border-t pt-1 mt-1">
                                                    <span>Subtotal</span>
                                                    <span>{formatCurrency(subtotal)}</span>
                                                </div>
                                                {discountAmount > 0 && (
                                                    <div className="flex justify-between text-[10px] font-bold text-amber-600 uppercase italic">
                                                        <span>Additional Discount</span>
                                                        <span>-{formatCurrency(discountAmount)}</span>
                                                    </div>
                                                )}
                                                {tax > 0 && (
                                                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground uppercase">
                                                        <span>Tax ({vatPercentage}%)</span>
                                                        <span>{formatCurrency(tax)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-baseline pt-2 border-t mt-2">
                                                    <span className="text-xs font-black uppercase">Total Bill</span>
                                                    <span className="text-xl font-black text-primary">{formatCurrency(total)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Payment Method & Amount */}
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Amount Paid</Label>
                                                <SmartNumberInput 
                                                    value={paidAmount}
                                                    onFocus={(e: any) => e.target.select()} 
                                                    onChange={(val) => setPaidAmount(val || 0)}
                                                    className="h-10 text-lg font-black border-primary/20 text-primary bg-background shadow-inner"
                                                />
                                                <div className="flex justify-between items-center text-[10px] px-1">
                                                    <span className="text-muted-foreground font-black uppercase tracking-wider">Due Amount</span>
                                                    <span className="font-black text-rose-500">{formatCurrency(dueAmount)}</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Method</Label>
                                                    <Select value={paymentMethod} onValueChange={(v: string) => setPaymentMethod(v as PaymentMethod)}>
                                                        <SelectTrigger className="h-9 text-xs font-medium bg-background">
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
                                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Account *</Label>
                                                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                                        <SelectTrigger className="h-9 text-xs font-medium bg-background">
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
                                    </div>
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
