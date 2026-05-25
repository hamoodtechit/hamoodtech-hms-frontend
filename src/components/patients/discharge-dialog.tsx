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
import { DischargeReceiptDialog } from "./discharge-receipt-dialog"

interface DischargeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    admission: Admission | null
    onSuccess?: () => void
}

function BillItemRow({ bill }: { bill: any; refetch: () => void }) {
    return (
        <div className="flex justify-between items-center bg-muted/20 p-2.5 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-white/10 group">
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[11px] font-black group-hover:text-primary transition-colors leading-tight">
                    {bill.type === 'admission' ? 'Admission & Bed Service' : bill.type?.toUpperCase()}
                </span>
                
                <div className="flex flex-col gap-0.5 mb-1">
                    {bill.saleItems?.map((item: any) => {
                        const itemDiscAmt = Number(item.discountAmount) || (Number(item.discountPercentage || 0) ? (Number(item.price) * Number(item.quantity || 1) * Number(item.discountPercentage)) / 100 : 0)
                        const hasDiscount = Number(item.discountPercentage) > 0 || Number(item.discountAmount) > 0
                        return (
                            <div key={item.id} className="flex items-center gap-1.5 text-[8px] font-bold text-muted-foreground/70">
                                <span className="bg-muted-foreground/10 px-1.5 py-0.5 rounded text-[7.5px] font-black text-foreground/60 uppercase leading-none">
                                    {item.itemName}
                                </span>
                                <span className="tabular-nums">{formatCurrency(Number(item.price))} × {item.quantity || 1}</span>
                                {hasDiscount && (
                                    <span className="text-amber-600/80 font-black italic">
                                        Disc: {Number(item.discountPercentage) > 0 ? `${item.discountPercentage}%` : formatCurrency(Number(item.discountAmount))}
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>

                <div className="flex items-center gap-1.5 opacity-60">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">{bill.invoiceNumber}</span>
                    <span className="text-[8px] font-bold text-muted-foreground">{bill.saleItems?.length || 0} service(s)</span>
                    <Badge variant="outline" className={`text-[7px] h-3 px-1 font-black uppercase border-none ${bill.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                        {bill.paymentStatus}
                    </Badge>
                </div>
            </div>
            
            <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex flex-col items-end">
                    <span className="text-xs font-black tabular-nums">{formatCurrency(Number(bill.netPrice))}</span>
                    {Number(bill.dueAmount) > 0 && <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">Due: {formatCurrency(Number(bill.dueAmount))}</span>}
                </div>
            </div>
        </div>
    )
}

export function DischargeDialog({ open, onOpenChange, admission, onSuccess }: DischargeDialogProps) {
    const { activeStoreId } = useStoreContext()
    const { data: res, isLoading, isError, refetch: refetchDischarge } = useDischargeInitiate(admission?.patientId || "")
    const { mutate: completeDischarge, isPending: isCompleting } = useCompleteDischarge()
    const { data: accountsRes } = useFinanceAccounts({ branchId: activeStoreId, group: 'hospital', isActive: true, limit: 100 })
    const accounts = useMemo(() => accountsRes?.data || [], [accountsRes])
    const { mutateAsync: createSale, isPending: isCreatingExtra } = useCreateSale()
    
    // Receipt State
    const [receiptOpen, setReceiptOpen] = useState(false)
    // Extra Charge State
    const [extraChargeOpen, setExtraChargeOpen] = useState(false)
    const [isDraftPrint, setIsDraftPrint] = useState(false)
    // Global Discount State
    const [overallDiscountFixed, setOverallDiscountFixed] = useState(0)
    const [overallDiscountPercent, setOverallDiscountPercent] = useState(0)
    const [overallDiscountNote, setOverallDiscountNote] = useState("")
    
    // Form State
    const [note, setNote] = useState("")
    const [paidAmount, setPaidAmount] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
    const [selectedAccountId, setSelectedAccountId] = useState("")
    const [paymentNote, setPaymentNote] = useState("")

    const data = res?.data
    const hospitalBills = useMemo(() => data?.hospital?.bills || [], [data?.hospital?.bills])
    const pharmacyTotals = useMemo(() => {
        const t = data?.pharmacy?.totals
        return {
            totalBill: Number(t?.totalBill || t?.totalPrice || t?.netPrice || 0),
            totalPaid: Number(t?.totalPaid || t?.paidAmount || 0),
            totalDue: Number(t?.totalDue || t?.dueAmount || 0)
        }
    }, [data?.pharmacy?.totals])

    const hospitalTotals = useMemo(() => {
        const t = data?.hospital?.totals
        return {
            totalBill: Number(t?.netPrice || t?.totalBill || t?.totalPrice || 0),
            totalPaid: Number(t?.paidAmount || t?.totalPaid || 0),
            totalDue: Number(t?.dueAmount || t?.totalDue || 0)
        }
    }, [data?.hospital?.totals])

    // Use grandTotal directly from API (includes both hospital + pharmacy)
    const grandTotalBill = Number(data?.grandTotal?.netPrice || data?.grandTotal?.totalBill || data?.grandTotal?.totalPrice || (hospitalTotals.totalBill + pharmacyTotals.totalBill))
    const grandTotalPaid = Number(data?.grandTotal?.paidAmount || data?.grandTotal?.totalPaid || (hospitalTotals.totalPaid + pharmacyTotals.totalPaid))
    const grandTotalDue = Number(data?.grandTotal?.dueAmount || data?.grandTotal?.totalDue || (hospitalTotals.totalDue + pharmacyTotals.totalDue))

    // ── Bed Rent Calculation ──────────────────────────────────────────
    const [additionalBedRentAdded, setAdditionalBedRentAdded] = useState(false)
    const [isAddingBedRent, setIsAddingBedRent] = useState(false)

    const bedRentCalculation = useMemo(() => {
        const bedType = admission?.bed?.bedType
        if (!bedType?.pricePerDay || !admission?.admissionDate) return null

        const pricePerDay = Number(bedType.pricePerDay)
        const admissionDate = new Date(admission.admissionDate)
        const today = new Date()
        const diffMs = today.getTime() - admissionDate.getTime()
        const stayDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

        const totalBedRent = stayDays * pricePerDay

        let alreadyCharged = 0
        hospitalBills.forEach((bill: any) => {
            bill.saleItems?.forEach((item: any) => {
                if (item.isBedCharge || item.itemName?.toLowerCase().includes('bed') || item.itemName?.toLowerCase().includes('cabin')) {
                    alreadyCharged += Number(item.price || 0) * Number(item.quantity || 1)
                }
            })
        })

        const additionalBedRent = Math.max(0, totalBedRent - alreadyCharged)

        return {
            stayDays,
            pricePerDay,
            totalBedRent,
            alreadyCharged,
            additionalBedRent,
        }
    }, [admission?.bed?.bedType, admission?.admissionDate, hospitalBills])

    const handleAddBedRentToBill = async () => {
        if (!bedRentCalculation || !admission) return
        const { additionalBedRent, pricePerDay, stayDays, alreadyCharged } = bedRentCalculation
        if (additionalBedRent <= 0) return

        const additionalDays = stayDays - Math.floor(alreadyCharged / pricePerDay)
        if (additionalDays <= 0) return

        setIsAddingBedRent(true)
        try {
            await createSale({
                branchId: activeStoreId || "",
                patientId: admission.patientId,
                type: "admission",
                status: "pending",
                paymentMethod: "cash",
                paymentStatus: "due",
                paidAmount: 0,
                dueAmount: additionalBedRent,
                discountPercentage: 0,
                discountAmount: 0,
                taxPercentage: 0,
                taxAmount: 0,
                isIndoorSale: true,
                patientAdmissionId: admission.id,
                saleItems: [{
                    itemName: `Bed/Cabin Charge (Additional ${additionalDays} day${additionalDays > 1 ? 's' : ''})`,
                    unit: "day",
                    price: pricePerDay,
                    mrp: pricePerDay,
                    quantity: additionalDays,
                    discountPercentage: 0,
                    discountAmount: 0,
                    totalPrice: additionalBedRent,
                    isDiagnosticTest: false,
                }],
                note: "Auto-generated additional bed rent at discharge",
            } as any)
            toast.success(`Additional bed rent of ${formatCurrency(additionalBedRent)} added to bill`)
            setAdditionalBedRentAdded(true)
            refetchDischarge()
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to add bed rent")
        } finally {
            setIsAddingBedRent(false)
        }
    }

    // Calculate Overall Discount Amount
    const overallDiscountAmount = useMemo(() => {
        if (overallDiscountPercent > 0) {
            return (grandTotalDue * overallDiscountPercent) / 100
        }
        return overallDiscountFixed
    }, [grandTotalDue, overallDiscountPercent, overallDiscountFixed])

    const netPayableDue = Math.max(0, grandTotalDue - overallDiscountAmount)

    // Initialize paid amount when data is loaded OR when discount changes
    useEffect(() => {
        if (open && netPayableDue >= 0) {
            setPaidAmount(netPayableDue)
        }
    }, [open, netPayableDue])

    // Automatically select the first account if none is selected or if current one is invalid
    useEffect(() => {
        if (open && accounts.length > 0) {
            const isCurrentAccountValid = accounts.some(acc => acc.id === selectedAccountId)
            if (!selectedAccountId || !isCurrentAccountValid) {
                setSelectedAccountId(accounts[0].id)
            }
        }
    }, [open, accounts, selectedAccountId])

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
            note: paymentNote || undefined,
        }] : []

        const currentPaymentTotal = payments.reduce((acc, p) => acc + p.amount, 0)
        const finalTotalPaid = Number(hospitalTotals.totalPaid) + currentPaymentTotal
        const finalRemainingDue = Math.max(0, Number(hospitalTotals.totalDue) - overallDiscountAmount - currentPaymentTotal)

        completeDischarge({
            patientId: admission.patientId,
            discountPercentage: overallDiscountPercent || 0,
            discountAmount: overallDiscountAmount || 0,
            totalAmount: Number(hospitalTotals.totalBill),
            paidAmount: finalTotalPaid,
            dueAmount: finalRemainingDue,
            note: note || undefined,
            payments,
        }, {
            onSuccess: (res: any) => {
                toast.success(res.message || "Patient discharged successfully")
                onSuccess?.()
                setIsDraftPrint(false)
                setReceiptOpen(true)
            },
            onError: (err: any) => {
                toast.error(err?.response?.data?.message || "Failed to discharge patient")
            }
        })
    }

    return (
        <>
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

                            {/* ── Bed Rent Calculation ────────────────────────────── */}
                            {bedRentCalculation && (
                                <div className="bg-amber-500/5 p-5 rounded-2xl border border-amber-500/10 shadow-inner space-y-3">
                                    <div className="flex items-center gap-2 text-amber-600">
                                        <Wallet className="h-4 w-4" />
                                        <h3 className="text-[10px] font-black uppercase tracking-widest">Bed Rent Calculation</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Stay Days</span>
                                            <span className="text-sm font-black">{bedRentCalculation.stayDays} days</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Daily Rate</span>
                                            <span className="text-sm font-black">{formatCurrency(bedRentCalculation.pricePerDay)}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Total Bed Rent</span>
                                            <span className="text-sm font-black text-primary">{formatCurrency(bedRentCalculation.totalBedRent)}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Already Charged</span>
                                            <span className="text-sm font-black text-emerald-600">-{formatCurrency(bedRentCalculation.alreadyCharged)}</span>
                                        </div>
                                    </div>
                                    {bedRentCalculation.additionalBedRent > 0 && (
                                        <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-amber-500/20">
                                            <div className="space-y-0.5">
                                                <span className="text-[10px] font-black uppercase text-amber-600">Additional Bed Rent Due</span>
                                                <span className="text-lg font-black text-amber-600">{formatCurrency(bedRentCalculation.additionalBedRent)}</span>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-9 px-4 text-[10px] font-black uppercase bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20"
                                                onClick={handleAddBedRentToBill}
                                                disabled={isAddingBedRent || additionalBedRentAdded}
                                            >
                                                {isAddingBedRent ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                                ) : additionalBedRentAdded ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                                ) : (
                                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                                )}
                                                {additionalBedRentAdded ? 'Added to Bill' : 'Add to Bill'}
                                            </Button>
                                        </div>
                                    )}
                                    {bedRentCalculation.additionalBedRent <= 0 && !additionalBedRentAdded && (
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 p-2 bg-emerald-500/5 rounded-lg">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Bed rent is fully settled — no additional charges needed.
                                        </div>
                                    )}
                                </div>
                            )}

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
                                                        <BillItemRow key={bill.id} bill={bill} refetch={refetchDischarge} />
                                                    ))
                                                ) : (
                                                    <div className="py-12 text-center text-[10px] font-black uppercase opacity-20 tracking-widest">No Hospital Charges Recorded</div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                        
                                        {hospitalBills.length > 0 && (
                                            <div className="p-4 bg-primary/5 border-t border-dashed border-primary/10 flex justify-between items-center">
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Charges Subtotal</span>
                                                <span className="text-sm font-black text-primary tabular-nums">{formatCurrency(Number(hospitalTotals.totalBill || 0))}</span>
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
                                                <span className="text-xl font-black block tabular-nums text-foreground/80">{formatCurrency(Number(pharmacyTotals.totalBill || 0))}</span>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <span className="text-[9px] font-black text-emerald-600/60 uppercase">Paid Amount</span>
                                                <span className="text-xl font-black block tabular-nums text-emerald-600">{formatCurrency(Number(pharmacyTotals.totalPaid || 0))}</span>
                                            </div>
                                        </div>
                                        
                                        <Separator className="bg-emerald-500/10" />
                                        
                                        <div className="flex justify-between items-center relative">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50">Pending Dues</span>
                                                <span className="text-sm font-black text-rose-500 tabular-nums">{formatCurrency(Number(pharmacyTotals.totalDue || 0))}</span>
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
                                            <Label className="text-[10px] font-black uppercase text-amber-600">Overall Discount</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="relative">
                                                    <SmartNumberInput 
                                                        placeholder="Percentage (%)" 
                                                        className="h-9 text-sm font-black bg-amber-500/5 border-amber-500/20 text-amber-600 pr-8"
                                                        min={0}
                                                        max={100}
                                                        value={overallDiscountPercent === 0 ? undefined : overallDiscountPercent}
                                                        onChange={(val: number | undefined) => {
                                                            setOverallDiscountPercent(val || 0)
                                                            setOverallDiscountFixed(0)
                                                        }}
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-xs text-amber-500/50">%</span>
                                                </div>
                                                <div className="relative">
                                                    <SmartNumberInput 
                                                        placeholder="Fixed (Tk)" 
                                                        className="h-9 text-sm font-black bg-amber-500/5 border-amber-500/20 text-amber-600 pr-8"
                                                        min={0}
                                                        value={overallDiscountFixed === 0 ? undefined : overallDiscountFixed}
                                                        onChange={(val: number | undefined) => {
                                                            setOverallDiscountFixed(val || 0)
                                                            setOverallDiscountPercent(0)
                                                        }}
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-[10px] font-black text-amber-500/50">BDT</span>
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
                                                                {accounts.map((acc: any) => (
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
                                        
                                        <div className="space-y-1.5 mt-4">
                                            <Label className="text-[10px] font-black text-muted-foreground uppercase">Remarks (Optional)</Label>
                                            <Textarea 
                                                placeholder="Add remarks..."
                                                value={paymentNote}
                                                onChange={(e) => setPaymentNote(e.target.value)}
                                                className="min-h-[60px] bg-background border-primary/5 text-xs font-bold resize-none"
                                            />
                                        </div>
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
                    <div className="flex gap-2">
                        <Button 
                            variant="secondary"
                            onClick={() => { setIsDraftPrint(true); setReceiptOpen(true); }} 
                            disabled={isCompleting || isLoading} 
                            className="rounded-xl px-6 h-11 font-black uppercase text-xs gap-2"
                        >
                            <Receipt className="h-4 w-4" />
                            Print Draft Bill
                        </Button>
                        <Button 
                            onClick={handleComplete} 
                            disabled={isCompleting || isLoading} 
                            className="rounded-xl px-8 h-11 font-black uppercase text-xs gap-2 shadow-lg shadow-primary/20 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                            Finalize & Discharge
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>

            <AddAdmissionServiceDialog 
                open={extraChargeOpen}
                onOpenChange={setExtraChargeOpen}
                admission={admission}
                onSuccess={() => refetchDischarge()}
            />

        </Dialog>

        <DischargeReceiptDialog 
            open={receiptOpen}
            onOpenChange={(v) => {
                setReceiptOpen(v)
                if (!v) {
                    setIsDraftPrint(false)
                    if (!isDraftPrint) {
                        onOpenChange(false)
                    }
                }
            }}
            admission={admission}
            data={data || null}
            finalPaidAmount={isDraftPrint ? 0 : paidAmount}
            overallDiscount={overallDiscountAmount}
            remarks={paymentNote}
        />
        </>
    )
}
