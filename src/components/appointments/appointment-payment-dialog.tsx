"use client"

import { Sale } from "@/types/sales"
import { PaymentMethod } from "@/types/pharmacy"
import { useAddSalePayment } from "@/hooks/sales-queries"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useStoreContext } from "@/store/use-store-context"
import { useCurrency } from "@/hooks/use-currency"
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
    Banknote,
    CreditCard,
    Loader2,
    CheckCircle2,
    Receipt,
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface AppointmentPaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sale: Sale | null
    onPaymentSuccess?: () => void
}

export function AppointmentPaymentDialog({
    open,
    onOpenChange,
    sale,
    onPaymentSuccess,
}: AppointmentPaymentDialogProps) {
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const addPaymentMutation = useAddSalePayment()

    const { data: accountsRes } = useFinanceAccounts({
        branchId: activeStoreId || undefined,
        group: "hospital",
        limit: 100,
        isActive: true,
    })
    const accounts = accountsRes?.data || []

    const [selectedAccountId, setSelectedAccountId] = useState<string>("")
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
    const [amount, setAmount] = useState<number>(0)
    const [note, setNote] = useState("")

    const dueAmount = Number(sale?.dueAmount || 0)
    const paidAmount = Number(sale?.paidAmount || 0)
    const totalPrice = Number(sale?.netPrice || sale?.totalPrice || 0)

    // Reset on open
    useEffect(() => {
        if (open && sale) {
            setAmount(dueAmount)
            setSelectedAccountId("")
            setPaymentMethod("cash")
            setNote("")
        }
    }, [open, sale, dueAmount])

    // Auto-select first account
    useEffect(() => {
        if (accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id)
        }
    }, [accounts, selectedAccountId])

    useEffect(() => {
        if (open && sale) {
            console.log("Appointment Payment Dialog — Sale Data:", sale);
            console.log("Appointment Payment Dialog — Due Amount:", dueAmount);
        }
    }, [open, sale, dueAmount]);

    const handleAddPayment = async () => {
        if (!sale || !selectedAccountId || amount <= 0) {
            toast.error("Please fill in all required fields")
            return
        }

        try {
            const payload = {
                id: sale.id,
                data: {
                    accountId: selectedAccountId,
                    amount: amount,
                    paymentMethod: paymentMethod,
                    note: note || undefined,
                },
            };
            console.log("Appointment Payment Dialog — Submission Payload:", payload);

            await addPaymentMutation.mutateAsync(payload)

            toast.success("Payment recorded successfully!")
            onOpenChange(false)
            onPaymentSuccess?.()
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message || "Failed to record payment"
            )
        }
    }

    if (!sale) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-emerald-500/5 border-b border-emerald-500/10">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/5">
                            <Banknote className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight">
                                Record Payment
                            </DialogTitle>
                            <DialogDescription className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mt-0.5">
                                Invoice #{sale.invoiceNumber}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-col max-h-[80vh]">
                    <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                        {/* Sale Summary */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2.5 bg-muted/20 rounded-xl">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 mb-0.5">
                                    Total
                                </p>
                                <p className="text-base font-black text-foreground tracking-tighter">
                                    {formatCurrency(totalPrice)}
                                </p>
                            </div>
                            <div className="text-center p-2.5 bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                                <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600/50 mb-0.5">
                                    Paid
                                </p>
                                <p className="text-base font-black text-emerald-600 tracking-tighter">
                                    {formatCurrency(paidAmount)}
                                </p>
                            </div>
                            <div className="text-center p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/10">
                                <p className="text-[8px] font-black uppercase tracking-widest text-amber-600/50 mb-0.5">
                                    Due
                                </p>
                                <p className="text-base font-black text-amber-600 tracking-tighter">
                                    {formatCurrency(dueAmount)}
                                </p>
                            </div>
                        </div>

                        <Separator className="opacity-50" />

                        {/* Payment Form */}
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <CreditCard className="h-3 w-3" />
                                Payment Info
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

                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold uppercase text-muted-foreground/70">
                                    Amount *
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={dueAmount}
                                    value={amount}
                                    onChange={(e) =>
                                        setAmount(
                                            Math.min(
                                                Number(e.target.value) || 0,
                                                dueAmount
                                            )
                                        )
                                    }
                                    className="h-12 rounded-lg bg-muted/20 border-none font-black text-lg text-center"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-[9px] font-bold uppercase text-muted-foreground/70">
                                    Note (Optional)
                                </Label>
                                <Input
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Payment note"
                                    className="h-10 rounded-lg bg-muted/20 border-none font-bold text-xs"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 border-t border-muted/10 space-y-3">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
                            <span>After Payment</span>
                            <Badge
                                className={`pointer-events-none font-black text-[9px] h-5 px-2 ${
                                    amount >= dueAmount
                                        ? "bg-emerald-50 text-emerald-600 border-none"
                                        : "bg-amber-50 text-amber-600 border-none"
                                }`}
                            >
                                {amount >= dueAmount ? (
                                    <>
                                        <CheckCircle2 className="w-3 h-3 mr-1" />{" "}
                                        FULLY PAID
                                    </>
                                ) : (
                                    `${formatCurrency(dueAmount - amount)} DUE`
                                )}
                            </Badge>
                        </div>

                        <Button
                            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-[0.1em] text-xs shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2"
                            onClick={handleAddPayment}
                            disabled={
                                addPaymentMutation.isPending ||
                                amount <= 0 ||
                                !selectedAccountId
                            }
                        >
                            {addPaymentMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Receipt className="w-3.5 h-3.5" />
                                    Record Payment — {formatCurrency(amount)}
                                </>
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full rounded-lg font-bold text-muted-foreground h-9 text-xs"
                            onClick={() => onOpenChange(false)}
                        >
                            Skip for Now
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
