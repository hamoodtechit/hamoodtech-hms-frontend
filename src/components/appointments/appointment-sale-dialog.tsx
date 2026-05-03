"use client"

import { Appointment } from "@/types/appointment"
import { PaymentMethod } from "@/types/pharmacy"
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
    const [paymentNote, setPaymentNote] = useState("")

    // Derived
    const fees = useMemo(() => {
        if (!appointment?.fees) return 0
        return Number(appointment.fees) || 0
    }, [appointment])

    // Auto-set paid amount to full fee when dialog opens
    useEffect(() => {
        if (open && fees > 0) {
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

    const dueAmount = Math.max(0, fees - paidAmount)

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
                status: paidAmount >= fees ? "completed" : "pending",
                paymentMethod: paymentMethod,
                paymentStatus: paidAmount >= fees ? "paid" : paidAmount > 0 ? "partial" : "due",
                paidAmount: paidAmount,
                dueAmount: dueAmount,
                discountPercentage: 0,
                discountAmount: 0,
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
                    },
                ],
            })

            toast.success("Sale recorded successfully!")
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
                <DialogHeader className="p-8 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                            <ShoppingCart className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight">
                                Record Sale
                            </DialogTitle>
                            <DialogDescription className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mt-1">
                                Appointment #{appointment.serialNumber}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Appointment Info - Read Only */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-2xl">
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                    Patient
                                </p>
                                <p className="text-sm font-black text-foreground truncate">
                                    {appointment.patient?.name}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-muted/20 rounded-2xl">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Stethoscope className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                    Doctor
                                </p>
                                <p className="text-sm font-black text-foreground truncate">
                                    {appointment.doctor?.fullName ||
                                        appointment.doctor?.name ||
                                        appointment.doctor?.username}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Fee Display */}
                    <div className="flex items-center justify-between p-5 bg-gradient-to-r from-primary/10 to-transparent rounded-2xl border border-primary/20">
                        <div>
                            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest mb-1">
                                Consultation Fee
                            </p>
                            <p className="text-3xl font-black text-primary tracking-tighter">
                                {formatCurrency(fees)}
                            </p>
                        </div>
                        {fees <= 0 && (
                            <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold text-[10px] gap-1 pointer-events-none">
                                <AlertCircle className="h-3 w-3" />
                                No Fee Set
                            </Badge>
                        )}
                    </div>

                    <Separator className="opacity-50" />

                    {/* Payment Section */}
                    <div className="space-y-4">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5" />
                            Payment Details
                        </Label>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground/70">
                                    Account *
                                </Label>
                                <Select
                                    value={selectedAccountId}
                                    onValueChange={setSelectedAccountId}
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold">
                                        <SelectValue placeholder="Select Account" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {accounts.map((acc: any) => (
                                            <SelectItem
                                                key={acc.id}
                                                value={acc.id}
                                                className="font-bold"
                                            >
                                                {acc.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground/70">
                                    Method
                                </Label>
                                <Select
                                    value={paymentMethod}
                                    onValueChange={(v) =>
                                        setPaymentMethod(v as PaymentMethod)
                                    }
                                >
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold">
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
                                                className="font-bold capitalize"
                                            >
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground/70">
                                    Paid Amount
                                </Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={fees}
                                    value={paidAmount}
                                    onChange={(e) =>
                                        setPaidAmount(
                                            Math.min(
                                                Number(e.target.value) || 0,
                                                fees
                                            )
                                        )
                                    }
                                    className="h-12 rounded-xl bg-muted/20 border-none font-bold text-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase text-muted-foreground/70">
                                    Due Amount
                                </Label>
                                <div className="h-12 rounded-xl bg-muted/10 border border-dashed border-muted-foreground/20 flex items-center px-4">
                                    <span
                                        className={`text-lg font-black ${
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

                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground/70">
                                Payment Note (Optional)
                            </Label>
                            <Input
                                value={paymentNote}
                                onChange={(e) => setPaymentNote(e.target.value)}
                                placeholder="e.g. Cash received at counter"
                                className="h-12 rounded-xl bg-muted/20 border-none font-bold"
                            />
                        </div>
                    </div>

                    {/* Summary + Action */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                            <span>Status After Sale</span>
                            <Badge
                                className={`pointer-events-none font-black text-[10px] ${
                                    paidAmount >= fees
                                        ? "bg-emerald-50 text-emerald-600 border-none"
                                        : paidAmount > 0
                                        ? "bg-amber-50 text-amber-600 border-none"
                                        : "bg-red-50 text-red-600 border-none"
                                }`}
                            >
                                {paidAmount >= fees
                                    ? "PAID"
                                    : paidAmount > 0
                                    ? "PARTIAL"
                                    : "DUE"}
                            </Badge>
                        </div>

                        <Button
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.15em] text-xs shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
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
                                    <Wallet className="w-4 h-4" />
                                    Confirm Sale — {formatCurrency(fees)}
                                    <CheckCircle2 className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
