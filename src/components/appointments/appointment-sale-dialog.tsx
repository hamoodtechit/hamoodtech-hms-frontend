"use client"

import { Appointment } from "@/types/appointment"
import { PaymentMethod } from "@/types/pharmacy"
import { useUpdateAppointment } from "@/hooks/appointment-queries"
import { useCreateSale } from "@/hooks/sales-queries"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useStoreContext } from "@/store/use-store-context"
import { useCurrency } from "@/hooks/use-currency"
import { Sale } from "@/types/sales"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
    ShoppingCart,
    User,
    Stethoscope,
    CreditCard,
    Wallet,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { toast } from "sonner"

interface AppointmentSaleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointment: Appointment | null
    onSaleCreated?: (sale: Sale) => void
}

export function AppointmentSaleDialog({
    open,
    onOpenChange,
    appointment,
    onSaleCreated,
}: AppointmentSaleDialogProps) {
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const createSaleMutation = useCreateSale()
    const updateAppointmentMutation = useUpdateAppointment()

    const { data: accountsRes } = useFinanceAccounts({
        branchId: activeStoreId || undefined,
        group: "hospital",
        limit: 100,
        isActive: true,
    })
    const accounts = accountsRes?.data || []

    // Form state
    const [selectedAccountId, setSelectedAccountId] = useState<string>("")
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
    const [paidAmount, setPaidAmount] = useState<number>(0)
    const [discountPercentage, setDiscountPercentage] = useState<number>(0)
    const [discountAmount, setDiscountAmount] = useState<number>(0)
    const [paymentNote, setPaymentNote] = useState("")

    // Derived
    const fees = useMemo(() => {
        if (!appointment?.fees) return 0
        return Number(appointment.fees) || 0
    }, [appointment])

    const netAmount = useMemo(() => {
        const discountVal = discountAmount > 0 ? discountAmount : (fees * discountPercentage) / 100
        return Math.max(0, fees - discountVal)
    }, [fees, discountAmount, discountPercentage])

    // Update discount amount when percentage changes
    const handleDiscountPercentageChange = (p: number) => {
        setDiscountPercentage(p)
        setDiscountAmount(0)
        const amount = (fees * p) / 100
        setPaidAmount(Math.max(0, fees - amount))
    }

    // Update discount percentage when amount changes
    const handleDiscountAmountChange = (a: number) => {
        setDiscountAmount(a)
        setDiscountPercentage(0)
        setPaidAmount(Math.max(0, fees - a))
    }

    // Auto-set paid amount to full fee when dialog opens
    useEffect(() => {
        if (open && fees > 0) {
            setDiscountPercentage(0)
            setDiscountAmount(0)
            setPaidAmount(fees)
            setSelectedAccountId("")
            setPaymentMethod("cash")
            setPaymentNote("")
        }
    }, [open, fees])

    // Auto-select first account
    useEffect(() => {
        if (accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id)
        }
    }, [accounts, selectedAccountId])

    const dueAmount = Math.max(0, netAmount - paidAmount)

    const handleRecordSale = async () => {
        if (!appointment || !selectedAccountId) {
            toast.error("Please select a payment account")
            return
        }

        if (fees <= 0) {
            toast.error("No fee set for this appointment")
            return
        }

        try {
            const res = await createSaleMutation.mutateAsync({
                branchId: activeStoreId || "",
                patientId: appointment.patientId,
                appointmentId: appointment.id,
                type: "appointment",
                doctorId: appointment.doctorId,
                referralPersonId: appointment.referralPersonId || undefined,
                chamberOrRoomNumber: appointment.chamberOrRoomNumber || undefined,
                status: paidAmount >= netAmount ? "completed" : "pending",
                paymentMethod: paymentMethod,
                paymentStatus: paidAmount >= netAmount ? "paid" : paidAmount > 0 ? "partial" : "due",
                paidAmount: paidAmount,
                dueAmount: dueAmount,
                discountPercentage: discountPercentage,
                discountAmount: discountAmount,
                taxPercentage: 0,
                taxAmount: 0,
                payments: paidAmount > 0
                    ? [
                          {
                              accountId: selectedAccountId,
                              amount: paidAmount,
                              paymentMethod: paymentMethod,
                              note: paymentNote || undefined,
                          },
                      ]
                    : [],
                saleItems: [
                    {
                        itemName: "Consultation Fee",
                        unit: "service",
                        price: fees,
                        mrp: fees,
                        quantity: 1,
                        discountPercentage: 0,
                        discountAmount: 0,
                        totalPrice: fees
                    },
                ],
            })

            // Update appointment status to confirmed
            await updateAppointmentMutation.mutateAsync({
                id: appointment.id,
                data: {
                    status: 'confirmed'
                }
            })

            toast.success("Sale recorded and appointment confirmed!")
            onOpenChange(false)
            onSaleCreated?.(res.data)
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to record sale")
        }
    }

    if (!appointment) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                            <ShoppingCart className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight">
                                Record Sale
                            </DialogTitle>
                            <DialogDescription className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mt-0.5">
                                Appointment #{appointment.serialNumber}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-col max-h-[85vh]">
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                        {/* Appointment Info - Read Only */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                    <User className="h-4 w-4 text-emerald-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                        Patient
                                    </p>
                                    <p className="text-xs font-black text-foreground truncate">
                                        {appointment.patient?.name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Stethoscope className="h-4 w-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                        Doctor
                                    </p>
                                    <p className="text-xs font-black text-foreground truncate">
                                        {appointment.doctor?.fullName ||
                                            appointment.doctor?.name ||
                                            appointment.doctor?.username}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Fee & Discount Display */}
                        <div className="p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest mb-0.5">
                                        Subtotal (Fee)
                                    </p>
                                    <p className="text-xl font-black text-foreground tracking-tighter">
                                        {formatCurrency(fees)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest mb-0.5">
                                        Net Amount
                                    </p>
                                    <p className="text-2xl font-black text-primary tracking-tighter">
                                        {formatCurrency(netAmount)}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-primary/10">
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase text-muted-foreground/60">Discount (%)</Label>
                                    <Input 
                                        type="number" 
                                        min={0} 
                                        max={100}
                                        value={discountPercentage}
                                        onChange={(e) => handleDiscountPercentageChange(Number(e.target.value) || 0)}
                                        className="h-8 rounded-lg bg-background/50 border-primary/10 font-bold text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[8px] font-black uppercase text-muted-foreground/60">Discount (Fixed)</Label>
                                    <Input 
                                        type="number" 
                                        min={0} 
                                        max={fees}
                                        value={discountAmount}
                                        onChange={(e) => handleDiscountAmountChange(Number(e.target.value) || 0)}
                                        className="h-8 rounded-lg bg-background/50 border-primary/10 font-bold text-xs"
                                    />
                                </div>
                            </div>

                            {fees <= 0 && (
                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold text-[9px] gap-1 pointer-events-none">
                                    <AlertCircle className="h-3 w-3" />
                                    No Fee Set
                                </Badge>
                            )}
                        </div>

                        <Separator className="opacity-50" />

                        {/* Payment Section */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <CreditCard className="h-3 w-3" />
                                Payment Details
                            </Label>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-bold uppercase text-muted-foreground/70">
                                        Account *
                                    </Label>
                                    <Select
                                        value={selectedAccountId}
                                        onValueChange={setSelectedAccountId}
                                    >
                                        <SelectTrigger className="h-10 rounded-lg bg-muted/20 border-none font-bold text-xs">
                                            <SelectValue placeholder="Select Account" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {accounts.map((acc: any) => (
                                                <SelectItem
                                                    key={acc.id}
                                                    value={acc.id}
                                                    className="font-bold text-xs"
                                                >
                                                    {acc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-bold uppercase text-muted-foreground/70">
                                        Method
                                    </Label>
                                    <Select
                                        value={paymentMethod}
                                        onValueChange={(v) =>
                                            setPaymentMethod(v as PaymentMethod)
                                        }
                                    >
                                        <SelectTrigger className="h-10 rounded-lg bg-muted/20 border-none font-bold text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            {[
                                                "cash",
                                                "card",
                                                "online",
                                                "bKash",
                                                "Nagad",
                                                "Rocket",
                                                "Bank Transfer",
                                                "cheque",
                                            ].map((m) => (
                                                <SelectItem
                                                    key={m}
                                                    value={m}
                                                    className="font-bold capitalize text-xs"
                                                >
                                                    {m}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-bold uppercase text-muted-foreground/70">
                                        Paid Amount
                                    </Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={netAmount}
                                        value={paidAmount}
                                        onChange={(e) =>
                                            setPaidAmount(
                                                Math.min(
                                                    Number(e.target.value) || 0,
                                                    netAmount
                                                )
                                            )
                                        }
                                        className="h-10 rounded-lg bg-muted/20 border-none font-bold text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[9px] font-bold uppercase text-muted-foreground/70">
                                        Due Amount
                                    </Label>
                                    <div className="h-10 rounded-lg bg-muted/10 border border-dashed border-muted-foreground/20 flex items-center px-3">
                                        <span
                                            className={`text-sm font-black ${
                                                dueAmount > 0
                                                    ? "text-amber-600"
                                                    : "text-emerald-600"
                                            }`}
                                        >
                                            {formatCurrency(dueAmount)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold uppercase text-muted-foreground/70">
                                    Payment Note (Optional)
                                </Label>
                                <Input
                                    value={paymentNote}
                                    onChange={(e) => setPaymentNote(e.target.value)}
                                    placeholder="e.g. Cash received"
                                    className="h-10 rounded-lg bg-muted/20 border-none font-bold text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Summary + Action - Fixed at bottom */}
                    <div className="p-5 bg-muted/5 border-t border-muted/10 space-y-3">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                            <span>Status After Sale</span>
                            <Badge
                                className={`pointer-events-none font-black text-[9px] h-5 px-2 ${
                                    paidAmount >= netAmount
                                        ? "bg-emerald-50 text-emerald-600 border-none"
                                        : paidAmount > 0
                                        ? "bg-amber-50 text-amber-600 border-none"
                                        : "bg-red-50 text-red-600 border-none"
                                }`}
                            >
                                {paidAmount >= netAmount
                                    ? "PAID"
                                    : paidAmount > 0
                                    ? "PARTIAL"
                                    : "DUE"}
                            </Badge>
                        </div>

                        <Button
                            className="w-full h-12 rounded-xl font-black uppercase tracking-[0.1em] text-xs shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center justify-center gap-2"
                            onClick={handleRecordSale}
                            disabled={
                                createSaleMutation.isPending ||
                                fees <= 0 ||
                                !selectedAccountId
                            }
                        >
                            {createSaleMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Wallet className="w-3.5 h-3.5" />
                                    Confirm Sale — {formatCurrency(netAmount)}
                                    <CheckCircle2 className="w-3.5 h-3.5 ml-0.5" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
