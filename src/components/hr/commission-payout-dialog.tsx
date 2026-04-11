"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Commission } from "@/types/hr"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useProcessCommissionPayment } from "@/hooks/hr-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Loader2, Wallet, CreditCard, Banknote } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface CommissionPayoutDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    referralId: string
    selectedCommissions: Commission[]
    onSuccess?: () => void
}

export function CommissionPayoutDialog({ 
    open, 
    onOpenChange, 
    referralId,
    selectedCommissions, 
    onSuccess 
}: CommissionPayoutDialogProps) {
    const [loading, setLoading] = useState(false)
    const [accountId, setAccountId] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("Cash")
    const [note, setNote] = useState("")
    
    const { formatCurrency } = useCurrency()
    const { data: accountsRes, isLoading: accountsLoading } = useFinanceAccounts({ limit: 100 })
    const processPayment = useProcessCommissionPayment()

    const totalAmount = selectedCommissions.reduce((sum, c) => sum + (Number(c.commissionAmount) || 0), 0)

    useEffect(() => {
        if (open) {
            setNote(`Payout for ${selectedCommissions.length} commission items.`)
            // Auto select first account if available
            if (accountsRes?.data?.[0]) {
                setAccountId(accountsRes.data[0].id)
            }
        }
    }, [open, selectedCommissions, accountsRes])

    const handlePayout = async () => {
        if (!accountId) {
            toast.error("Please select a payment account")
            return
        }

        const selectedAccount = accountsRes?.data?.find(acc => acc.id === accountId)
        if (selectedAccount && Number(selectedAccount.currentBalance) < totalAmount) {
            toast.error(`Insufficient balance in ${selectedAccount.name}. Available: ${formatCurrency(selectedAccount.currentBalance)}`)
            return
        }

        setLoading(true)
        try {
            await processPayment.mutateAsync({
                referralId,
                accountId,
                commissionIds: selectedCommissions.map(c => c.id),
                paymentMethod,
                note
            })
            toast.success(`Successfully processed payout of ${formatCurrency(totalAmount)}`)
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            toast.error("Failed to process payout")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-[2rem] p-0 overflow-hidden">
                <DialogHeader className="p-8 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight">Process Payout</DialogTitle>
                            <DialogDescription className="text-xs font-medium text-muted-foreground/70 uppercase tracking-widest">
                                Settle commission with agent
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-8">
                    {/* Summary Card */}
                    <div className="p-6 rounded-[1.5rem] bg-muted/30 border border-border/50 space-y-4">
                        <div className="flex justify-between items-center text-sm font-bold text-muted-foreground">
                            <span>Selected Items</span>
                            <span className="text-foreground">{selectedCommissions.length} Commissions</span>
                        </div>
                        <div className="h-px bg-border/50" />
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Total Amount</span>
                            <span className="text-3xl font-black text-primary tracking-tighter">
                                {formatCurrency(totalAmount)}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Payment Source Account</Label>
                            <Select value={accountId} onValueChange={setAccountId} disabled={accountsLoading}>
                                <SelectTrigger className="h-12 rounded-2xl border-muted bg-background hover:border-primary/30 transition-all font-bold">
                                    <div className="flex items-center gap-3">
                                        <Banknote className="h-4 w-4 text-primary opacity-50" />
                                        <SelectValue placeholder="Select Financial Account" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-2xl border-muted">
                                    {accountsRes?.data?.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id} className="font-bold py-3 focus:bg-primary/5">
                                            {acc.name} ({formatCurrency(acc.currentBalance)})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="h-12 rounded-2xl border-muted bg-background hover:border-primary/30 transition-all font-bold">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="h-4 w-4 text-primary opacity-50" />
                                        <SelectValue placeholder="Select Method" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-2xl border-muted">
                                    {["Cash", "Bank", "Bkash", "Nagad", "Rocket", "Cheque"].map(method => (
                                        <SelectItem key={method} value={method} className="font-bold py-3 focus:bg-primary/5">
                                            {method}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2.5">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Optional Notes</Label>
                            <Textarea 
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Details about this payout..."
                                className="min-h-[100px] rounded-2xl border-muted bg-background hover:border-primary/30 transition-all resize-none p-4"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-0 flex flex-col gap-3">
                    <Button 
                        onClick={handlePayout} 
                        disabled={loading || selectedCommissions.length === 0}
                        className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.15em] text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all border-none"
                    >
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirm Payout"}
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)} 
                        disabled={loading}
                        className="w-full h-12 rounded-2xl font-bold text-muted-foreground hover:bg-muted/50"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
