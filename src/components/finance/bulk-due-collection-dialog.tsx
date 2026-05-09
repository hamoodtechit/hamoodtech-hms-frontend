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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useAddSalePayment } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Sale } from "@/types/sales"
import { Loader2, Wallet } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface BulkDueCollectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    sales: Sale[]
    patientName: string
    onSuccess?: () => void
}

export function BulkDueCollectionDialog({
    open,
    onOpenChange,
    sales,
    patientName,
    onSuccess,
}: BulkDueCollectionDialogProps) {
    const { formatCurrency } = useCurrency()
    const payMutation = useAddSalePayment()
    const { data: accountsRes } = useFinanceAccounts({ limit: 100 })
    const accounts = accountsRes?.data || []

    const [accountId, setAccountId] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("cash")
    const [note, setNote] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        if (open && accounts.length > 0 && !accountId) {
            const activeAccounts = accounts.filter((a: any) => a.isActive)
            const defaultAccount = activeAccounts.find((a: any) => a.name?.toLowerCase().includes('hospital')) || activeAccounts[0]
            if (defaultAccount) {
                setAccountId(defaultAccount.id)
            }
        }
    }, [open, accounts, accountId])

    const totalDue = sales.reduce((sum, s) => sum + Number(s.dueAmount || 0), 0)

    const handleSubmit = async () => {
        if (!accountId) {
            toast.error("Please select a payment account")
            return
        }

        setIsProcessing(true)
        try {
            // Process payments sequentially
            for (const sale of sales) {
                const amount = Number(sale.dueAmount || 0)
                if (amount > 0) {
                    await payMutation.mutateAsync({
                        id: sale.id,
                        data: {
                            amount,
                            paymentMethod,
                            accountId,
                            note: note || undefined
                        }
                    })
                }
            }
            
            toast.success(`Successfully collected dues for ${sales.length} bills`)
            onOpenChange(false)
            setAccountId("")
            setNote("")
            onSuccess?.()
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to process bulk payment")
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={!isProcessing ? onOpenChange : undefined}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Wallet className="h-5 w-5 text-primary" />
                        Bulk Due Collection
                    </DialogTitle>
                    <DialogDescription>
                        Process bulk payment for patient: {patientName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Summary */}
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Patient</span>
                            <span className="font-bold">{patientName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Selected Bills</span>
                            <span className="font-bold">{sales.length} items</span>
                        </div>
                        <div className="border-t border-primary/10 pt-2 mt-2 flex justify-between">
                            <span className="font-bold text-primary">Total Payable Due</span>
                            <span className="text-xl font-black text-primary">{formatCurrency(totalDue)}</span>
                        </div>
                    </div>

                    {/* Account */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Account *</Label>
                        <SearchableSelect
                            value={accountId}
                            onChange={setAccountId}
                            options={accounts.filter((a: any) => a.isActive).map((a: any) => ({
                                id: a.id,
                                name: `${a.name} (${formatCurrency(Number(a.currentBalance))})`
                            }))}
                            placeholder="Select account..."
                        />
                    </div>

                    {/* Method */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Method *</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                            <SelectTrigger>
                                <SelectValue />
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

                    {/* Note */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Note (Optional)</Label>
                        <Input
                            placeholder="Payment reference or memo..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isProcessing || !accountId}
                        className="gap-2"
                    >
                        {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Wallet className="h-4 w-4" />
                        )}
                        Pay {formatCurrency(totalDue)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
