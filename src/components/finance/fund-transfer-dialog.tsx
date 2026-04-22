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
import { useTransferFunds } from "@/hooks/finance-queries"
import { useCurrency } from "@/hooks/use-currency"
import { FinanceAccount } from "@/types/finance"
import { AlertTriangle, ArrowRight, Loader2, Repeat2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface FundTransferDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    accounts: FinanceAccount[]
    onSuccess?: () => void
}

type Step = 'form' | 'confirm'

export function FundTransferDialog({ open, onOpenChange, accounts, onSuccess }: FundTransferDialogProps) {
    const { formatCurrency } = useCurrency()
    const transferMutation = useTransferFunds()

    const [step, setStep] = useState<Step>('form')
    const [fromAccountId, setFromAccountId] = useState("")
    const [toAccountId, setToAccountId] = useState("")
    const [amount, setAmount] = useState(0)
    const [note, setNote] = useState("")

    useEffect(() => {
        if (open) {
            setStep('form')
            setFromAccountId("")
            setToAccountId("")
            setAmount(0)
            setNote("")
        }
    }, [open])

    const fromAccount = accounts.find(a => a.id === fromAccountId)
    const toAccount = accounts.find(a => a.id === toAccountId)
    const fromBalance = fromAccount ? Number(fromAccount.currentBalance) : 0

    const isSelfTransfer = fromAccountId && toAccountId && fromAccountId === toAccountId
    const isInsufficientBalance = amount > 0 && fromBalance > 0 && amount > fromBalance
    const isFormValid = fromAccountId && toAccountId && !isSelfTransfer && amount > 0 && !isInsufficientBalance

    const groupLabel = (g?: string) => {
        if (!g) return ''
        return ` · ${g.charAt(0).toUpperCase() + g.slice(1)}`
    }

    const handleNext = () => {
        if (!isFormValid) return
        setStep('confirm')
    }

    const handleConfirm = async () => {
        try {
            await transferMutation.mutateAsync({ fromAccountId, toAccountId, amount, note: note || undefined })
            toast.success("Fund transfer completed successfully")
            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Fund transfer failed")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Repeat2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>Fund Transfer</DialogTitle>
                            <DialogDescription>
                                {step === 'form' ? 'Move funds between financial accounts.' : 'Review transfer details before confirming.'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {step === 'form' && (
                    <div className="grid gap-4 py-2">
                        {/* From Account */}
                        <div className="grid gap-2">
                            <Label htmlFor="fromAccount">Transfer From *</Label>
                            <Select value={fromAccountId} onValueChange={setFromAccountId}>
                                <SelectTrigger id="fromAccount">
                                    <SelectValue placeholder="Select source account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.filter(a => a.isActive).map(a => (
                                        <SelectItem key={a.id} value={a.id}>
                                            <span className="font-medium">{a.name}</span>
                                            <span className="text-muted-foreground text-xs ml-2 capitalize">
                                                {a.type}{groupLabel(a.group)} — {formatCurrency(Number(a.currentBalance))}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fromAccount && (
                                <p className="text-xs text-muted-foreground">
                                    Available balance: <span className="font-semibold text-foreground">{formatCurrency(fromBalance)}</span>
                                </p>
                            )}
                        </div>

                        {/* To Account */}
                        <div className="grid gap-2">
                            <Label htmlFor="toAccount">Transfer To *</Label>
                            <Select value={toAccountId} onValueChange={setToAccountId}>
                                <SelectTrigger id="toAccount">
                                    <SelectValue placeholder="Select destination account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.filter(a => a.isActive).map(a => (
                                        <SelectItem key={a.id} value={a.id}>
                                            <span className="font-medium">{a.name}</span>
                                            <span className="text-muted-foreground text-xs ml-2 capitalize">
                                                {a.type}{groupLabel(a.group)}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {isSelfTransfer && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Source and destination cannot be the same account.
                                </p>
                            )}
                        </div>

                        {/* Amount */}
                        <div className="grid gap-2">
                            <Label htmlFor="transferAmount">Transfer Amount *</Label>
                            <SmartNumberInput
                                id="transferAmount"
                                value={amount}
                                onChange={(v) => setAmount(v || 0)}
                                placeholder="0.00"
                            />
                            {isInsufficientBalance && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" /> Amount exceeds available balance of {formatCurrency(fromBalance)}.
                                </p>
                            )}
                        </div>

                        {/* Note */}
                        <div className="grid gap-2">
                            <Label htmlFor="transferNote">Note / Remarks</Label>
                            <Textarea
                                id="transferNote"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Optional note about this transfer..."
                                rows={2}
                            />
                        </div>
                    </div>
                )}

                {step === 'confirm' && fromAccount && toAccount && (
                    <div className="py-4 space-y-4">
                        <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide text-xs">Transfer Summary</p>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 p-3 bg-background rounded-lg border text-center">
                                    <p className="text-xs text-muted-foreground mb-1 capitalize">{fromAccount.type}{groupLabel(fromAccount.group)}</p>
                                    <p className="font-semibold text-sm">{fromAccount.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(fromBalance)}</p>
                                </div>
                                <div className="flex flex-col items-center gap-1 shrink-0">
                                    <ArrowRight className="h-5 w-5 text-primary" />
                                    <span className="text-xs font-bold text-primary">{formatCurrency(amount)}</span>
                                </div>
                                <div className="flex-1 p-3 bg-background rounded-lg border text-center">
                                    <p className="text-xs text-muted-foreground mb-1 capitalize">{toAccount.type}{groupLabel(toAccount.group)}</p>
                                    <p className="font-semibold text-sm">{toAccount.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(Number(toAccount.currentBalance))}</p>
                                </div>
                            </div>
                            {note && (
                                <div className="text-sm text-muted-foreground border-t pt-3">
                                    <span className="font-medium text-foreground">Note:</span> {note}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            This action will deduct <strong>{formatCurrency(amount)}</strong> from <strong>{fromAccount.name}</strong> and add it to <strong>{toAccount.name}</strong>.
                        </p>
                    </div>
                )}

                <DialogFooter>
                    {step === 'form' ? (
                        <>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button onClick={handleNext} disabled={!isFormValid}>
                                Review Transfer
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={() => setStep('form')} disabled={transferMutation.isPending}>
                                Back
                            </Button>
                            <Button onClick={handleConfirm} disabled={transferMutation.isPending}>
                                {transferMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Transfer
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
