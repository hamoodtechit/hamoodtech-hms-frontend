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
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { Textarea } from "@/components/ui/textarea"
import { useCurrency } from "@/hooks/use-currency"
import { financeService } from "@/services/finance-service"
import { FinanceAccount } from "@/types/finance"
import { useMutation } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface WithdrawDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    account: FinanceAccount | null
    onSuccess?: () => void
}

export function WithdrawDialog({
    open,
    onOpenChange,
    account,
    onSuccess
}: WithdrawDialogProps) {
    const { formatCurrency } = useCurrency()
    const [amount, setAmount] = useState<number | undefined>(undefined)
    const [note, setNote] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("cash")

    useEffect(() => {
        if (open) {
            setAmount(undefined)
            setNote("")
            setPaymentMethod("cash") // Default or maybe dynamic?
        }
    }, [open, account])

    const withdrawMutation = useMutation({
        mutationFn: financeService.withdraw,
        onSuccess: () => {
            toast.success("Withdrawal successful")
            onSuccess?.()
            onOpenChange(false)
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Failed to withdraw")
        }
    })

    const handleWithdraw = () => {
        if (!account) return
        if (!amount || amount <= 0) {
            toast.error("Please enter a valid amount")
            return
        }
        if (amount > Number(account.currentBalance)) {
             toast.error("Insufficient balance")
             return
        }

        withdrawMutation.mutate({
            accountId: account.id,
            amount: amount,
            paymentMethod: paymentMethod, // 'cash' or other? usually withdraw is TO cash?
            note: note
        })
    }

    if (!account) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                        Withdraw funds from <strong>{account.name}</strong>.
                        <br />
                        Current Balance: <span className="font-semibold text-primary">{formatCurrency(Number(account.currentBalance))}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Amount</Label>
                        <SmartNumberInput
                            id="amount"
                            value={amount}
                            onChange={setAmount}
                            placeholder="0.00"
                            className="text-lg font-semibold"
                        />
                    </div>
                    
                    <div className="grid gap-2">
                         <Label htmlFor="method">Withdraw Method</Label>
                         <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                                <SelectItem value="bKash">bKash</SelectItem>
                                <SelectItem value="Nagad">Nagad</SelectItem>
                                <SelectItem value="Rocket">Rocket</SelectItem>
                                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                            </SelectContent>
                         </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="note">Note (Optional)</Label>
                        <Textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Reason for withdrawal..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleWithdraw} disabled={withdrawMutation.isPending}>
                        {withdrawMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Withdraw
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
