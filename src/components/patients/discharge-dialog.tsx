"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDischargeInitiate, useCompleteDischarge } from "@/hooks/patient-queries"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useCreateSale } from "@/hooks/sales-queries"
import { format } from "date-fns"
import { 
    AlertCircle,
    CheckCircle2,
    ClipboardCheck,
    CreditCard, 
    FileText, 
    Loader2, 
    Pill, 
    Plus,
    Receipt, 
    User,
    Wallet
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { Admission, PaymentMethod } from "@/types/patient"
import { SalePayload } from "@/types/sales"
import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { useStoreContext } from "@/store/use-store-context"
import { AddAdmissionServiceDialog } from "./add-service-dialog"

interface DischargeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    admission: Admission | null
    onSuccess?: () => void
}

export function DischargeDialog({ open, onOpenChange, admission, onSuccess }: DischargeDialogProps) {
    const { activeStoreId } = useStoreContext()
    const { data: res, isLoading, isError, refetch: refetchDischarge } = useDischargeInitiate(admission?.patientId || "")
    const { mutate: completeDischarge, isPending: isCompleting } = useCompleteDischarge()
    const { data: accountsRes } = useFinanceAccounts({ branchId: activeStoreId, isActive: true, limit: 100 })
    const { mutateAsync: createSale, isPending: isCreatingExtra } = useCreateSale()
    
    // Extra Charge State
    const [extraChargeOpen, setExtraChargeOpen] = useState(false)
    
    // Form State
    const [note, setNote] = useState("")
    const [paidAmount, setPaidAmount] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
    const [selectedAccountId, setSelectedAccountId] = useState("")

    const data = res?.data
    const hospitalBills = useMemo(() => data?.hospital?.bills || [], [data?.hospital?.bills])
    const pharmacyTotals = useMemo(() => data?.pharmacy?.totals || { totalBill: 0, totalPaid: 0, totalDue: 0 }, [data?.pharmacy?.totals])

    // Calculate Hospital Totals
    const hospitalTotals = useMemo(() => hospitalBills.reduce((acc: any, sale: any) => {
        acc.totalBill += Number(sale.netPrice) || 0
        acc.totalPaid += Number(sale.paidAmount) || 0
        acc.totalDue += Number(sale.dueAmount) || 0
        return acc
    }, { totalBill: 0, totalPaid: 0, totalDue: 0 }), [hospitalBills])

    const grandTotalBill = hospitalTotals.totalBill + (Number(pharmacyTotals.totalBill) || 0)
    const grandTotalPaid = hospitalTotals.totalPaid + (Number(pharmacyTotals.totalPaid) || 0)
    const grandTotalDue = hospitalTotals.totalDue + (Number(pharmacyTotals.totalDue) || 0)

    // Initialize paid amount when data is loaded
    useEffect(() => {
        if (open && grandTotalDue > 0 && paidAmount === 0) {
            setPaidAmount(grandTotalDue)
        }
    }, [open, grandTotalDue])

    const handleComplete = () => {
        if (!admission) return

        if (grandTotalDue > 0 && paidAmount > 0 && !selectedAccountId) {
            toast.error("Please select a finance account for the pending payment")
            return
        }

        completeDischarge({
            admissionId: admission.id,
            dischargeDate: new Date().toISOString(),
            note,
            status: "discharged",
            paidAmount,
            paymentMethod,
            accountId: selectedAccountId
        }, {
            onSuccess: (res: any) => {
                toast.success(res.message || "Patient discharged successfully")
                onSuccess?.()
                onOpenChange(false)
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.message || "Failed to discharge patient")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-225 max-h-[95vh] overflow-hidden p-0 border-none shadow-2xl rounded-3xl">
                <DialogHeader className="p-8 pb-4 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-black tracking-tight text-primary flex items-center gap-3">
                            <ClipboardCheck className="h-7 w-7" />
                            Initiate Patient Discharge
                        </DialogTitle>
                        {admission && (
                            <Badge className="bg-emerald-500 font-black uppercase text-[10px] tracking-widest px-4">
                                {admission.status}
                            </Badge>
                        )}
                    </div>
                    <DialogDescription className="text-sm font-medium opacity-70">
                        Review billing summary and clinical notes before finalizing the discharge.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[75vh]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse leading-none">Fetching Unified Billing Record</span>
                        </div>
                    ) : isError ? (
                        <div className="p-20 text-center flex flex-col items-center gap-4">
                            <AlertCircle className="h-12 w-12 text-destructive opacity-50" />
                            <span className="text-sm font-black text-destructive uppercase tracking-widest">Failed to load discharge details</span>
                            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
                        </div>
                    ) : (
                        <div className="p-8 pt-4 pb-12 space-y-8">
                            {/* Patient Summary Card */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-3 bg-muted/30 p-5 rounded-2xl border border-white/5 shadow-inner">
                                    <div className="flex items-center gap-2 text-primary opacity-60">
                                        <User className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Patient</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-lg font-black leading-tight">{admission?.patient?.name}</span>
                                        <span className="text-xs font-bold text-muted-foreground">{admission?.patient?.uhid}</span>
                                    </div>
                                </div>
                                <div className="space-y-3 bg-muted/30 p-5 rounded-2xl border border-white/5 shadow-inner">
                                    <div className="flex items-center gap-2 text-primary opacity-60">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Admission</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black leading-tight">
                                            {admission?.admissionDate ? format(new Date(admission.admissionDate), "dd MMM yyyy") : 'N/A'}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-tighter">Joined Hospital</span>
                                    </div>
                                </div>
                                <div className="space-y-3 bg-blue-500/5 p-5 rounded-2xl border border-blue-500/10 shadow-inner">
                                    <div className="flex items-center gap-2 text-blue-500 opacity-60">
                                        <CreditCard className="h-4 w-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Current Bed</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-blue-600 leading-tight">{admission?.bed?.bedNumber}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-tighter">{admission?.bed?.bedType?.name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Billing Sections */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Hospital Charges */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-primary">
                                        <div className="flex items-center gap-2">
                                            <Receipt className="h-4 w-4" />
                                            <h3 className="text-xs font-black uppercase tracking-widest">Hospital Charges Summary</h3>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 px-2.5 text-[9px] font-black uppercase tracking-widest gap-1.5 border-primary/20 hover:bg-primary/10 hover:text-primary transition-all"
                                            onClick={() => setExtraChargeOpen(true)}
                                        >
                                            <Plus className="h-3 w-3" />
                                            Add Bill
                                        </Button>
                                    </div>
                                    <div className="bg-card border border-white/5 rounded-2xl shadow-sm overflow-hidden">
                                        <ScrollArea className={`${hospitalBills.length > 5 ? 'h-70' : ''} w-full`}>
                                            <div className="p-4 space-y-2">
                                                {hospitalBills.length > 0 ? (
                                                    hospitalBills.map((bill: any) => (
                                                        <div key={bill.id} className="flex justify-between items-center bg-muted/20 p-2.5 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-white/10 group">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[11px] font-black group-hover:text-primary transition-colors leading-tight">
                                                                    {bill.type === 'admission' ? 'Admission & Bed Service' : bill.type?.toUpperCase()}
                                                                </span>
                                                                <div className="flex items-center gap-1.5 opacity-60">
                                                                    <span className="text-[8px] font-bold text-muted-foreground uppercase">{bill.invoiceNumber}</span>
                                                                    <Badge variant="outline" className={`text-[7px] h-3 px-1 font-black uppercase border-none ${bill.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                                                        {bill.paymentStatus}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-xs font-black tabular-nums">{formatCurrency(bill.netPrice)}</span>
                                                                {Number(bill.dueAmount) > 0 && <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">Due: {formatCurrency(bill.dueAmount)}</span>}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-12 text-center text-[10px] font-black uppercase opacity-20 tracking-widest">No Hospital Charges Recorded</div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                        
                                        {hospitalBills.length > 0 && (
                                            <div className="p-4 bg-primary/5 border-t border-dashed border-primary/10 flex justify-between items-center">
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Charges Subtotal</span>
                                                <span className="text-sm font-black text-primary tabular-nums">{formatCurrency(hospitalTotals.totalBill)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Pharmacy Charges */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <Pill className="h-4 w-4" />
                                        <h3 className="text-xs font-black uppercase tracking-widest">Pharmacy Billing Summary</h3>
                                    </div>
                                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl space-y-4 shadow-inner relative overflow-hidden group">
                                        <Pill className="absolute -right-4 -bottom-4 h-24 w-24 opacity-[0.03] group-hover:scale-110 transition-transform" />
                                        
                                        <div className="grid grid-cols-2 gap-4 relative">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black text-emerald-600/60 uppercase">Total Bill</span>
                                                <span className="text-xl font-black block tabular-nums text-foreground/80">{formatCurrency(pharmacyTotals.totalBill)}</span>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <span className="text-[9px] font-black text-emerald-600/60 uppercase">Paid Amount</span>
                                                <span className="text-xl font-black block tabular-nums text-emerald-600">{formatCurrency(pharmacyTotals.totalPaid)}</span>
                                            </div>
                                        </div>
                                        
                                        <Separator className="bg-emerald-500/10" />
                                        
                                        <div className="flex justify-between items-center relative">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50">Pending Dues</span>
                                                <span className="text-sm font-black text-rose-500 tabular-nums">{formatCurrency(pharmacyTotals.totalDue)}</span>
                                            </div>
                                            {Number(pharmacyTotals.totalDue) === 0 && (
                                                <Badge className="bg-emerald-500/20 text-emerald-600 border-none px-2 h-5 text-[9px] font-black uppercase">Cleared</Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Additional Discharge Notes */}
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Discharge Notes / Clinical Summary</Label>
                                        <Textarea 
                                            placeholder="Enter any discharge notes or final instructions..."
                                            className="resize-none h-24 text-xs font-medium rounded-xl bg-muted/20 border-white/5 focus-visible:ring-primary/20"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Final Financial Settlement */}
                            <div className="mt-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 p-8 shadow-inner overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <Wallet className="h-32 w-32" />
                                </div>
                                
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Final Financial Settlement
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-muted-foreground/60 uppercase text-[10px]">Total Hospital Charges</span>
                                            <span className="font-black tabular-nums">{formatCurrency(hospitalTotals.totalBill)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs px-1">
                                            <span className="text-muted-foreground font-medium uppercase min-w-12.5">To be Due</span>
                                            <span className="font-bold text-rose-500">{formatCurrency(Math.max(0, grandTotalDue - paidAmount))}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm py-2 border-y border-dashed border-primary/10">
                                            <span className="font-bold text-muted-foreground/80 uppercase text-[11px]">Gross Total Bill</span>
                                            <span className="font-black text-lg tabular-nums text-primary">{formatCurrency(grandTotalBill)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-emerald-600/60 uppercase text-[10px]">Total Amount Paid</span>
                                            <span className="font-black text-emerald-600 tabular-nums">-{formatCurrency(grandTotalPaid)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-4 bg-primary/10 rounded-2xl border border-primary/5 mt-4 group">
                                            <span className="font-black text-primary uppercase text-[11px] tracking-widest">Net Payable Due</span>
                                            <span className="text-3xl font-black text-primary tabular-nums tracking-tighter group-hover:scale-105 transition-transform">{formatCurrency(grandTotalDue)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {grandTotalDue > 0 ? (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black text-muted-foreground uppercase">Collect Final Due Payment</Label>
                                                    <SmartNumberInput 
                                                        value={paidAmount}
                                                        onChange={(val) => setPaidAmount(val || 0)}
                                                        className="h-11 text-xl font-black bg-background border-primary/20 shadow-inner text-primary"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black text-muted-foreground uppercase">Method</Label>
                                                        <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                                                            <SelectTrigger className="h-9 bg-background border-primary/5 text-xs font-bold">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {['cash', 'card', 'online', 'cheque', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer'].map(m => (
                                                                    <SelectItem key={m} value={m} className="capitalize text-xs font-bold">{m}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-black text-muted-foreground uppercase">Target Account</Label>
                                                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                                            <SelectTrigger className="h-9 bg-background border-primary/5 text-xs font-bold">
                                                                <SelectValue placeholder="Select Account" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {accountsRes?.data?.map((acc: any) => (
                                                                    <SelectItem key={acc.id} value={acc.id} className="text-xs font-bold">
                                                                        {acc.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10 space-y-4">
                                                <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-emerald-600">Account Settled</h4>
                                                    <p className="text-[10px] font-medium text-emerald-600/60 leading-tight">Patient has no pending dues for this hospitalization period.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </ScrollArea>

                <DialogFooter className="p-8 border-t border-primary/10 bg-muted/30">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCompleting} className="rounded-xl px-6 h-11 font-black uppercase text-xs">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleComplete} 
                        disabled={isCompleting || isLoading} 
                        className="rounded-xl px-8 h-11 font-black uppercase text-xs gap-2 shadow-lg shadow-primary/20"
                    >
                        {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                        Finalize & Discharge
                    </Button>
                </DialogFooter>
            </DialogContent>

            <AddAdmissionServiceDialog 
                open={extraChargeOpen}
                onOpenChange={setExtraChargeOpen}
                admission={admission}
                onSuccess={() => refetchDischarge()}
            />
        </Dialog>
    )
}
