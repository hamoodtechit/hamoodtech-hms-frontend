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
import { usePayConsultationCharges } from "@/hooks/finance-queries"
import { useStoreContext } from "@/store/use-store-context"
import { useCurrency } from "@/hooks/use-currency"
import { ConsultationCharge } from "@/types/finance"
import { Loader2, Wallet } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface DoctorPaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    charges: ConsultationCharge[]
    doctorName: string
    doctorId: string
    onSuccess?: () => void
}

export function DoctorPaymentDialog({
    open,
    onOpenChange,
    charges,
    doctorName,
    doctorId,
    onSuccess,
}: DoctorPaymentDialogProps) {
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const payMutation = usePayConsultationCharges()
    const { data: accountsRes } = useFinanceAccounts({ limit: 100 })
    const accounts = accountsRes?.data || []

    const [accountId, setAccountId] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("cash")
    const [note, setNote] = useState("")

    useEffect(() => {
        if (open && accounts.length > 0 && !accountId) {
            const activeAccounts = accounts.filter((a: any) => a.isActive)
            const defaultAccount = activeAccounts.find((a: any) => a.name?.toLowerCase().includes('hospital')) || activeAccounts[0]
            if (defaultAccount) {
                setAccountId(defaultAccount.id)
            }
        }
    }, [open, accounts, accountId])

    const totalPayable = charges.reduce((sum, c) => sum + Number(c.commissionAmount || (c as any).chargeAmount || 0), 0)

   

    const handleSubmit = async () => {
        if (!accountId) {
            toast.error("Please select a payment account")
            return
        }

        try {
            const payload = {
                branchId: activeStoreId || "",
                doctorId,
                chargeIds: charges.map(c => c.id),
                accountId,
                paymentMethod,
                note: note || undefined,
            };
           

            await payMutation.mutateAsync(payload)
            toast.success(`${charges.length} consultation charges paid successfully`)
            onOpenChange(false)
            setAccountId("")
            setNote("")
            onSuccess?.()
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to process payment")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Wallet className="h-5 w-5 text-primary" />
                        Pay Doctor Commission
                    </DialogTitle>
                    <DialogDescription>
                        Process bulk payment for {doctorName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Summary */}
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Doctor</span>
                            <span className="font-bold">{doctorName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground font-medium">Selected Charges</span>
                            <span className="font-bold">{charges.length} items</span>
                        </div>
                        <div className="border-t border-primary/10 pt-2 mt-2 flex justify-between">
                            <span className="font-bold text-primary">Total Payable</span>
                            <span className="text-xl font-black text-primary">{formatCurrency(totalPayable)}</span>
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
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                                <SelectItem value="mfs">Mobile Banking</SelectItem>
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
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={payMutation.isPending || !accountId}
                        className="gap-2"
                    >
                        {payMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Wallet className="h-4 w-4" />
                        )}
                        Pay {formatCurrency(totalPayable)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
