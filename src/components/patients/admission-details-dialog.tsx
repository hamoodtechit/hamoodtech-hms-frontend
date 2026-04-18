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
import { useAdmission, useDischargeInitiate } from "@/hooks/patient-queries"
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
    Plus,
    Printer,
    ClipboardCheck
} from "lucide-react"
import { useSales, SALES_KEYS } from "@/hooks/sales-queries"
import { ReceiptDialog } from "@/components/pharmacy/receipt-dialog"
import { DischargeDialog } from "./discharge-dialog"
import { DischargeReceiptDialog } from "./discharge-receipt-dialog"
import { useQueryClient } from "@tanstack/react-query"
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
    const queryClient = useQueryClient()
    const { data: res, isLoading, refetch } = useAdmission(admissionId || "")
    const { data: salesRes, isLoading: isLoadingSales } = useSales({ 
        patientAdmissionId: admissionId || "",
        limit: 100 
    }, { enabled: !!admissionId })
    const { data: initDataRes } = useDischargeInitiate(res?.data?.patientAdmission?.patientId || "")

    const [addServiceOpen, setAddServiceOpen] = useState(false)
    const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false)
    const [dischargeReceiptOpen, setDischargeReceiptOpen] = useState(false)
    const [selectedSaleForPrint, setSelectedSaleForPrint] = useState<any>(null)
    const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
    
    const admission = res?.data?.patientAdmission
    const baseSalesRaw = salesRes?.data?.sales || salesRes?.data?.data || []
    const baseSales = baseSalesRaw.filter((s: any) => s.patientAdmissionId === admission?.id)
    const admissionSale = res?.data?.sale
    const sales = (res?.data?.allSales?.length ?? 0) > 0 
        ? res?.data?.allSales 
        : (admissionSale 
            ? [admissionSale, ...baseSales.filter((s: any) => s.id !== admissionSale.id)]
            : baseSales)

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
                    {(() => {
                        if (isLoading) {
                            return (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">Fetching Patient Record</span>
                                </div>
                            )
                        }

                        if (!admission) {
                            return (
                                <div className="p-20 text-center opacity-50 text-xs font-bold uppercase tracking-widest">
                                    No record found for ID: {admissionId}
                                </div>
                            )
                        }

                        return (
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

                            {/* Row 2: Admission Details & Guardian */}
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

                                    <div className="flex items-center gap-2 text-blue-500 pt-2">
                                        {admission?.status === 'admitted' && (
                                            <>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-8 px-3 rounded-xl border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5 gap-2 text-[10px] font-black uppercase tracking-widest"
                                                    onClick={() => setDischargeDialogOpen(true)}
                                                >
                                                    <ClipboardCheck className="h-3.5 w-3.5" />
                                                    Discharge Patient
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-8 px-3 rounded-xl border-blue-500/20 text-blue-600 hover:bg-blue-500/5 gap-2 text-[10px] font-black uppercase tracking-widest"
                                                    onClick={() => setAddServiceOpen(true)}
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Add Service
                                                </Button>
                                            </>
                                        )}
                                        {admission?.status === 'discharged' && (
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-8 px-3 rounded-xl border-blue-500/20 text-blue-600 hover:bg-blue-500/5 gap-2 text-[10px] font-black uppercase tracking-widest"
                                                onClick={() => setDischargeReceiptOpen(true)}
                                            >
                                                <Printer className="h-3.5 w-3.5" />
                                                Print Discharge Summary
                                            </Button>
                                        )}
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
                                </div>
                                {isLoadingSales ? (
                                    <div className="flex justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
                                    </div>
                                ) : sales && sales.length > 0 ? (
                                    <div className="space-y-4">
                                        {sales.map((s: any) => (
                                            <div key={s.id} className="bg-blue-500/5 p-5 rounded-2xl border border-blue-500/10 overflow-hidden relative group hover:bg-blue-500/[0.08] transition-all">
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 flex-grow">
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase block opacity-50 leading-none">Invoice No.</span>
                                                            <span className="text-xs font-black text-blue-600 block tabular-nums leading-none mt-1">{s.invoiceNumber}</span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase block opacity-50 leading-none">Status</span>
                                                            <div className="flex gap-1.5 mt-1">
                                                                <Badge className={s.paymentStatus === 'paid' ? 'bg-emerald-500 h-4 text-[9px] px-1.5 font-black uppercase' : 'bg-orange-500 h-4 text-[9px] px-1.5 font-black uppercase'}>
                                                                    {s.paymentStatus}
                                                                </Badge>
                                                                <span className="text-[9px] font-black uppercase text-foreground/40 mt-0.5">{s.type}</span>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1 text-right md:text-left">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase block opacity-50 leading-none">Net Amount</span>
                                                            <span className="text-sm font-black text-primary tracking-tighter tabular-nums leading-none mt-1">{formatCurrency(s.netPrice)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <Button 
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-10 w-full md:w-auto px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
                                                        onClick={() => {
                                                            setSelectedSaleForPrint(s)
                                                            setReceiptDialogOpen(true)
                                                        }}
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                        Print Bill
                                                    </Button>
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-blue-500/10 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {s.saleItems?.map((item: any) => (
                                                        <div key={item.id} className="flex justify-between items-center py-1 opacity-70 group-hover/item:opacity-100 transition-opacity">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-foreground/90 leading-tight">{item.itemName}</span>
                                                                <span className="text-[8px] font-bold text-muted-foreground uppercase opacity-40">Qty: {item.quantity}</span>
                                                            </div>
                                                            <span className="text-[10px] font-black text-foreground tabular-nums">{formatCurrency(item.totalPrice)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
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
                        )
                    })()}
                </ScrollArea>

                <AddAdmissionServiceDialog 
                    open={addServiceOpen}
                    onOpenChange={setAddServiceOpen}
                    admission={admission || null}
                    onSuccess={() => {
                        refetch()
                        queryClient.invalidateQueries({ queryKey: SALES_KEYS.all })
                    }}
                />

                <ReceiptDialog 
                    open={receiptDialogOpen}
                    onOpenChange={setReceiptDialogOpen}
                    transaction={selectedSaleForPrint}
                />

                <DischargeDialog 
                    open={dischargeDialogOpen}
                    onOpenChange={setDischargeDialogOpen}
                    admission={admission || null}
                    onSuccess={() => {
                        refetch()
                        onOpenChange(false)
                    }}
                />

                <DischargeReceiptDialog
                    open={dischargeReceiptOpen}
                    onOpenChange={setDischargeReceiptOpen}
                    admission={admission || null}
                    data={(initDataRes?.data || res?.data || null) as any}
                    finalPaidAmount={0}
                    overallDiscount={admission?.discountAmount || 0}
                />
            </DialogContent>
        </Dialog>
    )
}
