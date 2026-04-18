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
import { useCreateSale, useUpdateSale } from "@/hooks/sales-queries"
import { format } from "date-fns"
import { 
    AlertCircle,
    CheckCircle2,
    ClipboardCheck,
    CreditCard, 
    FileText, 
    Loader2, 
    Pencil,
    Pill, 
    Plus,
    Receipt, 
    User,
    Wallet
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/utils"
import { Admission, PaymentMethod } from "@/types/patient"
import { Sale, SalePayload } from "@/types/sales"
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
    const { mutateAsync: updateSale, isPending: isUpdatingSale } = useUpdateSale()
    
    // Extra Charge State
    const [extraChargeOpen, setExtraChargeOpen] = useState(false)
    // Edit Sale State
    const [editingSaleId, setEditingSaleId] = useState<string | null>(null)
    const [discountAmount, setDiscountAmount] = useState(0)
    const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount')
    const [discountPercent, setDiscountPercent] = useState(0)

    // Global Discount State
    const [overallDiscountValue, setOverallDiscountValue] = useState(0)
    const [overallDiscountType, setOverallDiscountType] = useState<'amount' | 'percent'>('amount')
    const [overallDiscountNote, setOverallDiscountNote] = useState("")
    
    // Form State
    const [note, setNote] = useState("")
    const [paidAmount, setPaidAmount] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
    const [selectedAccountId, setSelectedAccountId] = useState("")

    const data = res?.data
    const hospitalBills = useMemo(() => data?.hospital?.bills || [], [data?.hospital?.bills])
    const pharmacyTotals = useMemo(() => data?.pharmacy?.totals || { totalBill: 0, totalPaid: 0, totalDue: 0 }, [data?.pharmacy?.totals])
    const hospitalTotals = useMemo(() => data?.hospital?.totals || { totalBill: 0, totalPaid: 0, totalDue: 0 }, [data?.hospital?.totals])
    const editingSale = useMemo(() => hospitalBills.find((b: any) => b.id === editingSaleId) as Sale | undefined, [hospitalBills, editingSaleId])

    // Use grandTotal directly from API (includes both hospital + pharmacy)
    const grandTotalBill = Number(data?.grandTotal?.totalBill) || (Number(hospitalTotals.totalBill) + (Number(pharmacyTotals.totalBill) || 0))
    const grandTotalPaid = Number(data?.grandTotal?.totalPaid) || (Number(hospitalTotals.totalPaid) + (Number(pharmacyTotals.totalPaid) || 0))
    const grandTotalDue = Number(data?.grandTotal?.totalDue) || (Number(hospitalTotals.totalDue) + (Number(pharmacyTotals.totalDue) || 0))

    // Calculate Overall Discount Amount
    const overallDiscountAmount = useMemo(() => {
        if (overallDiscountType === 'percent') {
            return (grandTotalDue * overallDiscountValue) / 100
        }
        return overallDiscountValue
    }, [grandTotalDue, overallDiscountType, overallDiscountValue])

    const netPayableDue = Math.max(0, grandTotalDue - overallDiscountAmount)

    // Initialize paid amount when data is loaded OR when discount changes
    useEffect(() => {
        if (open && netPayableDue >= 0) {
            setPaidAmount(netPayableDue)
        }
    }, [open, netPayableDue])

    const handleComplete = () => {
        if (!admission) return

        if (grandTotalDue > 0 && paidAmount > 0 && !selectedAccountId) {
            toast.error("Please select a finance account for the pending payment")
            return
        }

        const payments = paidAmount > 0 ? [{
            accountId: selectedAccountId,
            amount: paidAmount,
            paymentMethod: paymentMethod as string,
            note: note || undefined,
        }] : []

        completeDischarge({
            patientId: admission.patientId,
            payments,
            discountAmount: overallDiscountAmount,
            discountNote: overallDiscountNote || undefined,
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
            <DialogContent className="sm:max-w-225 max-h-[95vh] overflow-hidden p-0 border-none shadow-2xl rounded-3xl flex flex-col">
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

                <ScrollArea className="flex-1 overflow-y-auto">
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
                                                                
                                                                {/* Display Item Names */}
                                                                <div className="flex flex-wrap gap-1 mb-1">
                                                                    {bill.saleItems?.map((item: any) => (
                                                                        <Badge key={item.id} variant="outline" className="text-[7.5px] py-0 h-3.5 bg-background font-bold text-muted-foreground/80 leading-none">
                                                                            {item.itemName}
                                                                        </Badge>
                                                                    ))}
                                                                </div>

                                                                <div className="flex items-center gap-1.5 opacity-60">
                                                                    <span className="text-[8px] font-bold text-muted-foreground uppercase">{bill.invoiceNumber}</span>
                                                                    <span className="text-[8px] font-bold text-muted-foreground">{bill.saleItems?.length || 0} service(s)</span>
                                                                    <Badge variant="outline" className={`text-[7px] h-3 px-1 font-black uppercase border-none ${bill.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                                                        {bill.paymentStatus}
                                                                    </Badge>
                                                                    {Number(bill.discountAmount) > 0 && (
                                                                        <Badge variant="outline" className="text-[7px] h-3 px-1 font-black uppercase border-none bg-amber-500/10 text-amber-600">
                                                                            -{formatCurrency(Number(bill.discountAmount))} disc
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-xs font-black tabular-nums">{formatCurrency(Number(bill.netPrice))}</span>
                                                                    {Number(bill.dueAmount) > 0 && <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">Due: {formatCurrency(Number(bill.dueAmount))}</span>}
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-lg"
                                                                    title="Apply bill-level discount"
                                                                    onClick={() => {
                                                                        setEditingSaleId(bill.id)
                                                                        // Pre-fill with current bill discount
                                                                        if (Number(bill.discountPercentage) > 0) {
                                                                            setDiscountType('percent')
                                                                            setDiscountPercent(Number(bill.discountPercentage))
                                                                        } else {
                                                                            setDiscountType('amount')
                                                                            setDiscountAmount(Number(bill.discountAmount) || 0)
                                                                        }
                                                                    }}
                                                                >
                                                                    <Pencil className="h-3 w-3" />
                                                                </Button>
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
                                            <span className="font-black tabular-nums">{formatCurrency(Number(hospitalTotals.totalBill))}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs px-1">
                                            <span className="text-muted-foreground font-medium uppercase min-w-12.5">To be Due</span>
                                            <span className="font-bold text-rose-500">{formatCurrency(Math.max(0, Number(grandTotalDue) - paidAmount))}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm py-2 border-y border-dashed border-primary/10">
                                            <span className="font-bold text-muted-foreground/80 uppercase text-[11px]">Gross Total Bill</span>
                                            <span className="font-black text-lg tabular-nums text-primary">{formatCurrency(Number(grandTotalBill))}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold text-emerald-600/60 uppercase text-[10px]">Total Amount Paid</span>
                                            <span className="font-black text-emerald-600 tabular-nums">-{formatCurrency(Number(grandTotalPaid))}</span>
                                        </div>

                                        {/* Global Discount Section */}
                                        <div className="pt-2 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-black uppercase text-amber-600">Overall Discount</Label>
                                                <div className="flex bg-muted/50 rounded-lg p-0.5 border border-white/5">
                                                    <button 
                                                        className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${overallDiscountType === 'amount' ? 'bg-amber-500 text-white shadow-sm' : 'text-muted-foreground'}`}
                                                        onClick={() => setOverallDiscountType('amount')}
                                                    >
                                                        Fixed
                                                    </button>
                                                    <button 
                                                        className={`px-2 py-0.5 text-[8px] font-black uppercase rounded ${overallDiscountType === 'percent' ? 'bg-amber-500 text-white shadow-sm' : 'text-muted-foreground'}`}
                                                        onClick={() => setOverallDiscountType('percent')}
                                                    >
                                                        %
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <SmartNumberInput 
                                                    value={overallDiscountValue}
                                                    onChange={(v) => setOverallDiscountValue(v || 0)}
                                                    className="h-9 text-sm font-black bg-amber-500/5 border-amber-500/20 text-amber-600 pr-10"
                                                    placeholder="0.00"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500/40">
                                                    {overallDiscountType === 'percent' ? '%' : 'BDT'}
                                                </div>
                                            </div>
                                            {overallDiscountAmount > 0 && (
                                                <p className="text-[9px] font-bold text-amber-600 flex justify-between px-1">
                                                    <span>Applied Discount:</span>
                                                    <span>-{formatCurrency(overallDiscountAmount)}</span>
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center p-4 bg-primary/10 rounded-2xl border border-primary/5 mt-4 group">
                                            <span className="font-black text-primary uppercase text-[11px] tracking-widest">Net Payable Due</span>
                                            <span className="text-3xl font-black text-primary tabular-nums tracking-tighter group-hover:scale-105 transition-transform">{formatCurrency(netPayableDue)}</span>
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
                                                        max={netPayableDue}
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

            {/* Edit Sale Discount Dialog */}
            <Dialog open={!!editingSaleId} onOpenChange={(o) => { if (!o) { setEditingSaleId(null); setDiscountAmount(0); setDiscountPercent(0) } }}>
                <DialogContent className="sm:max-w-sm rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-4 bg-amber-500/5 border-b border-amber-500/10">
                        <DialogTitle className="text-base font-black text-amber-600 flex items-center gap-2">
                            <Pencil className="h-4 w-4" />
                            Apply Discount
                        </DialogTitle>
                        <DialogDescription className="text-xs font-medium opacity-60">
                            {editingSale?.invoiceNumber} · {editingSale?.saleItems?.length || 0} service(s) · Total: {formatCurrency(Number(editingSale?.totalPrice) || 0)}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={discountType === 'amount' ? 'default' : 'outline'}
                                size="sm"
                                className="rounded-xl text-xs font-black"
                                onClick={() => setDiscountType('amount')}
                            >
                                Fixed Amount
                            </Button>
                            <Button
                                variant={discountType === 'percent' ? 'default' : 'outline'}
                                size="sm"
                                className="rounded-xl text-xs font-black"
                                onClick={() => setDiscountType('percent')}
                            >
                                Percentage
                            </Button>
                        </div>

                        {discountType === 'amount' ? (
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase opacity-60">Discount Amount</Label>
                                <SmartNumberInput
                                    value={discountAmount}
                                    onChange={(v) => setDiscountAmount(v || 0)}
                                    className="h-11 text-lg font-black"
                                />
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase opacity-60">Discount %</Label>
                                <SmartNumberInput
                                    value={discountPercent}
                                    onChange={(v) => setDiscountPercent(v || 0)}
                                    className="h-11 text-lg font-black"
                                />
                                {discountPercent > 0 && (
                                    <p className="text-[10px] font-bold text-amber-600">
                                        = {formatCurrency((Number(editingSale?.totalPrice || 0) * discountPercent) / 100)} off
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter className="p-6 pt-0 gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl font-black text-xs" onClick={() => { setEditingSaleId(null); setDiscountAmount(0); setDiscountPercent(0) }}>
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            className="rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-600 text-white"
                            disabled={isUpdatingSale}
                            onClick={async () => {
                                if (!editingSaleId) return
                                const finalDiscountAmount = discountType === 'percent'
                                    ? (Number(editingSale?.totalPrice || 0) * discountPercent) / 100
                                    : discountAmount
                                const finalDiscountPercent = discountType === 'percent' ? discountPercent : 0
                                try {
                                    await updateSale({ id: editingSaleId, data: { discountAmount: finalDiscountAmount, discountPercentage: finalDiscountPercent } })
                                    toast.success('Discount applied successfully')
                                    setEditingSaleId(null)
                                    setDiscountAmount(0)
                                    setDiscountPercent(0)
                                    refetchDischarge()
                                } catch (err: any) {
                                    toast.error(err?.response?.data?.message || 'Failed to apply discount')
                                }
                            }}
                        >
                            {isUpdatingSale ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Apply Discount
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Dialog>
    )
}
