"use client"

import { useState, useEffect } from "react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAdmission } from "@/hooks/patient-queries"
import { format } from "date-fns"
import { 
    Bed, 
    Calendar, 
    CreditCard, 
    FileText, 
    Loader2, 
    Phone, 
    User, 
    UserCheck,
    MapPin,
    Hash,
    Receipt,
    Plus
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { AdmissionStatus } from "@/types/patient"
import { AddAdmissionServiceDialog } from "./add-service-dialog"
import { Button } from "@/components/ui/button"

interface AdmissionDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    admissionId: string | null
}

export function AdmissionDetailsDialog({ open, onOpenChange, admissionId }: AdmissionDetailsDialogProps) {
    const { data: res, isLoading, refetch } = useAdmission(admissionId || "")
    const [addServiceOpen, setAddServiceOpen] = useState(false)
    
    const admission = res?.data?.patientAdmission
    const sale = res?.data?.sale

    const getStatusBadge = (status: AdmissionStatus) => {
        switch (status) {
            case "admitted":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 uppercase text-[10px] font-black tracking-widest px-3">Admitted</Badge>
            case "discharged":
                return <Badge variant="secondary" className="uppercase text-[10px] font-black tracking-widest px-3">Discharged</Badge>
            case "transferred":
                return <Badge className="bg-blue-500 uppercase text-[10px] font-black tracking-widest px-3">Transferred</Badge>
            case "cancelled":
                return <Badge variant="destructive" className="uppercase text-[10px] font-black tracking-widest px-3">Cancelled</Badge>
            default:
                return <Badge variant="outline" className="uppercase text-[10px] font-black tracking-widest px-3">{status}</Badge>
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl bg-card/95 backdrop-blur-xl">
                <DialogHeader className="p-8 pb-4 bg-primary/5">
                    <div className="flex items-center justify-between mb-4">
                        <DialogTitle className="text-2xl font-black tracking-tight text-primary">Admission Details</DialogTitle>
                        {admission && getStatusBadge(admission.status)}
                    </div>
                    <DialogDescription className="text-sm font-medium opacity-70">
                        Complete clinical and financial record for the hospitalization.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[85vh]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Fetching Patient Record</span>
                        </div>
                    ) : admission ? (
                        <div className="p-8 pt-2 grid gap-8">
                            {/* Patient & Location Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary">
                                        <User className="h-4 w-4" />
                                        <h3 className="text-xs font-black uppercase tracking-widest">Patient Information</h3>
                                    </div>
                                    <div className="bg-muted/30 p-4 rounded-xl space-y-3 border border-white/5">
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-foreground/90">{admission.patient?.name}</span>
                                                {admission.patient?.nameBangla && (
                                                    <span className="text-[10px] font-bold text-primary/60 font-serif">{admission.patient.nameBangla}</span>
                                                )}
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <span className="text-[10px] font-black bg-primary/10 px-2 py-0.5 rounded text-primary border border-primary/20 tracking-tighter">
                                                    {admission.patient?.uhid || admission.patient?.patientNumber || 'N/A'}
                                                </span>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-40">Identifier</span>
                                            </div>
                                        </div>

                                        <Separator className="bg-white/5 opacity-50" />

                                        <div className="grid grid-cols-3 gap-2 py-1">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Age / Gender</span>
                                                <span className="text-xs font-black opacity-80">{admission.patient?.age || 'N/A'} Y / {(admission.patient?.gender || 'N/A').toUpperCase()}</span>
                                            </div>
                                            <div className="flex flex-col border-x border-white/5 px-2">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Blood Group</span>
                                                <Badge variant="outline" className="w-fit text-[10px] font-black border-red-500/20 text-red-500 bg-red-500/5 h-5 px-1.5">
                                                    {admission.patient?.bloodGroup || 'N/A'}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-col text-right">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Contact</span>
                                                <span className="text-[11px] font-black opacity-80">{admission.patient?.phone}</span>
                                            </div>
                                        </div>

                                        <Separator className="bg-white/5 opacity-50" />

                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-3 w-3 mt-0.5 opacity-40 text-primary" />
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50">Resident Address</span>
                                                <span className="text-xs font-extrabold opacity-70 leading-tight">{admission.patient?.address || 'Address not provided'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Bed className="h-4 w-4" />
                                        <h3 className="text-xs font-black uppercase tracking-widest">Facility Assignment</h3>
                                    </div>
                                    <div className="bg-muted/30 p-4 rounded-xl space-y-3 border border-white/5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Bed Number</span>
                                            <span className="text-sm font-black text-blue-500 tracking-tighter tabular-nums">{admission.bed?.bedNumber}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Bed Type</span>
                                            <span className="text-xs font-extrabold text-foreground/80">{admission.bed?.bedType?.name}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Location</span>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase opacity-60 tracking-widest">
                                                <MapPin className="h-3 w-3 opacity-40" />
                                                {admission.bed?.section?.name} {admission.bed?.section?.floor?.name && `, ${admission.bed.section.floor.name}`}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-white/5" />

                            {/* Admission Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Calendar className="h-4 w-4" />
                                        <h3 className="text-xs font-black uppercase tracking-widest">Hospitalization Info</h3>
                                    </div>
                                    <div className="bg-muted/20 p-5 rounded-2xl space-y-4 border border-white/5 shadow-inner">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase block opacity-50">Admission Date</span>
                                            <span className="text-sm font-black text-foreground/90">{format(new Date(admission.admissionDate), "PPPP")}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase block opacity-50">Primary Reason / Diagnosis</span>
                                            <p className="text-xs font-medium leading-relaxed bg-white/5 p-3 rounded-lg italic opacity-80">
                                                {admission.reason || "No reason specified."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <UserCheck className="h-4 w-4" />
                                        <h3 className="text-xs font-black uppercase tracking-widest">Guardian / Contact</h3>
                                    </div>
                                    <div className="bg-emerald-500/5 p-5 rounded-2xl space-y-4 border border-emerald-500/10 shadow-inner">
                                        <div className="flex justify-between">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase block opacity-50">Guardian Name</span>
                                                <span className="text-sm font-black text-foreground/90">{admission.guardianName}</span>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase block opacity-50">Relation</span>
                                                <Badge variant="outline" className="text-[10px] font-black uppercase border-emerald-500/30 text-emerald-600">
                                                    {admission.guardianRelation}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase block opacity-50">Guardian Phone</span>
                                            <div className="flex items-center gap-2 text-sm font-black opacity-80">
                                                <Phone className="h-3.5 w-3.5 opacity-40 text-emerald-500" />
                                                {admission.guardianPhone}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Details / Sale Information */}
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-blue-500">
                                        <Receipt className="h-4 w-4" />
                                        <h3 className="text-xs font-black uppercase tracking-widest font-black tracking-tight">Financial Record (Indoor Sale)</h3>
                                    </div>
                                    {admission?.status === 'admitted' && (
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="h-8 px-3 rounded-xl border-blue-500/20 text-blue-600 hover:bg-blue-500/5 gap-2 text-[10px] font-black uppercase tracking-widest"
                                            onClick={() => setAddServiceOpen(true)}
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add Service
                                        </Button>
                                    )}
                                </div>
                                {sale ? (
                                    <div className="bg-blue-500/5 p-6 rounded-3xl border border-blue-500/10 overflow-hidden relative group">
                                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform">
                                            <Receipt className="h-24 w-24" />
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase block opacity-50">Invoice No.</span>
                                                <span className="text-xs font-black text-blue-600 block tabular-nums">{sale.invoiceNumber}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase block opacity-50">Payment Status</span>
                                                <Badge className={sale.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-orange-500'}>
                                                    {sale.paymentStatus}
                                                </Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase block opacity-50">Billing Type</span>
                                                <span className="text-xs font-black uppercase tracking-widest text-foreground/70">{sale.type}</span>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase block opacity-50">Net Amount</span>
                                                <span className="text-lg font-black text-primary tracking-tighter tabular-nums">{formatCurrency(sale.netPrice)}</span>
                                            </div>
                                        </div>

                                        <Separator className="my-6 bg-blue-500/10" />

                                        <div className="space-y-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500/70">Billable Items / Fees</span>
                                            <div className="space-y-2">
                                                {sale.saleItems?.map((item: any) => (
                                                    <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 group/item hover:bg-white/10 transition-colors">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-foreground/90">{item.itemName}</span>
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-40">Unit: {item.unit}</span>
                                                        </div>
                                                        <div className="text-right flex items-center gap-4">
                                                            <span className="text-[9px] font-black tabular-nums opacity-60">QTY: {item.quantity}</span>
                                                            <span className="text-xs font-black text-foreground tabular-nums group-hover/item:text-blue-500 transition-colors">{formatCurrency(item.totalPrice)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-muted/10 border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3">
                                        <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center text-muted-foreground/30">
                                            <Receipt className="h-6 w-6" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">No service charges recorded yet</p>
                                            <p className="text-[9px] font-bold text-muted-foreground/40 italic">Add bed charges or diagnostic tests to manage IPD bill</p>
                                        </div>
                                        {admission?.status === 'admitted' && (
                                            <Button 
                                                size="sm" 
                                                variant="secondary" 
                                                className="mt-2 h-9 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2"
                                                onClick={() => setAddServiceOpen(true)}
                                            >
                                                <Plus className="h-4 w-4" /> Add First Service
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Institutional Notes */}
                            <div className="space-y-4 pb-4">
                                <div className="flex items-center gap-2 opacity-50">
                                    <FileText className="h-4 w-4" />
                                    <h3 className="text-xs font-black uppercase tracking-widest">Administrative / Clinical Notes</h3>
                                </div>
                                <div className="bg-muted/10 p-4 rounded-xl text-xs font-medium leading-relaxed opacity-60 italic">
                                    {admission.note || "No additional notes for this hospitalization record."}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-20 text-center opacity-50 text-xs font-bold uppercase tracking-widest">
                            No record found for ID: {admissionId}
                        </div>
                    )}
                </ScrollArea>

                <AddAdmissionServiceDialog 
                    open={addServiceOpen}
                    onOpenChange={setAddServiceOpen}
                    admission={admission || null}
                    onSuccess={() => refetch()}
                />
            </DialogContent>
        </Dialog>
    )
}
