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
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useAddSalePayment } from "@/hooks/sales-queries"
import { usePayPharmacyDues, useProcessHospitalPayment } from "@/hooks/patient-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Sale } from "@/types/sales"
import { Loader2, Wallet } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { BulkPaymentReceiptDialog } from "./bulk-payment-receipt-dialog"

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
    const payPharmacyMutation = usePayPharmacyDues()
    const payHospitalMutation = useProcessHospitalPayment()
    const { data: accountsRes } = useFinanceAccounts({ limit: 100 })
    const accounts = accountsRes?.data || []

    const [accountId, setAccountId] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("cash")
    const [note, setNote] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentResult, setPaymentResult] = useState<any>(null)
    
    const totalDue = sales.reduce((sum, s) => sum + Number(s.dueAmount || 0), 0)
    const [payingAmount, setPayingAmount] = useState<number>(0)

    useEffect(() => {
        if (open) {
            setPayingAmount(totalDue)
        }
    }, [open, totalDue])

    useEffect(() => {
        if (open && accounts.length > 0 && !accountId) {
            const activeAccounts = accounts.filter((a: any) => a.isActive)
            const defaultAccount = activeAccounts.find((a: any) => a.name?.toLowerCase().includes('hospital')) || activeAccounts[0]
            if (defaultAccount) {
                setAccountId(defaultAccount.id)
            }
        }
    }, [open, accounts, accountId])


    const handleSubmit = async () => {
        if (!accountId) {
            toast.error("Please select a payment account")
            return
        }

        const patientId = sales[0]?.patientId
        const branchId = sales[0]?.branchId

        if (!patientId || !branchId) {
            toast.error("Critical patient/branch data missing from selected bills")
            return
        }

        setIsProcessing(true)
        try {
            const isPosSale = sales.some(s => s.type === 'pos');
            
            const payload = {
                patientId,
                branchId,
                accountId,
                amount: payingAmount,
                paymentMethod,
                note: note || undefined
            };
            
            const response = isPosSale 
                ? await payPharmacyMutation.mutateAsync(payload)
                : await payHospitalMutation.mutateAsync(payload);
                
            console.log("Bulk Payment Response:", response)
            
            // Inject saleItems from the GET API into the POST API response so the receipt can print item details!
            if (response?.data?.paidSales) {
                response.data.paidSales = response.data.paidSales.map((ps: any) => {
                    const originalSale = sales.find(s => s.id === ps.saleId);
                    return {
                        ...ps,
                        saleItems: originalSale?.saleItems || []
                    };
                });
            }
            
            setPaymentResult(response)
            toast.success(`Successfully collected ${formatCurrency(payingAmount)} for ${sales.length} bills`)
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
        <>
        <Dialog open={open && !paymentResult} onOpenChange={!isProcessing ? onOpenChange : undefined}>
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

                    {/* Paying Amount */}
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Paying Amount *</Label>
                        <SmartNumberInput
                            placeholder="Enter amount..."
                            value={payingAmount}
                            onChange={(val) => setPayingAmount(val || 0)}
                            className="text-lg font-bold text-primary border-primary/20"
                        />
                        {payingAmount > totalDue && (
                            <p className="text-[10px] font-bold text-destructive">Amount cannot exceed total due ({formatCurrency(totalDue)})</p>
                        )}
                        {payingAmount <= 0 && (
                            <p className="text-[10px] font-bold text-destructive">Amount must be greater than 0</p>
                        )}
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
                        disabled={isProcessing || !accountId || payingAmount <= 0 || payingAmount > totalDue}
                        className="gap-2"
                    >
                        {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Wallet className="h-4 w-4" />
                        )}
                        Pay {formatCurrency(payingAmount)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <BulkPaymentReceiptDialog
            open={!!paymentResult}
            onOpenChange={(open) => {
                if (!open) {
                    setPaymentResult(null)
                    onOpenChange(false)
                }
            }}
            data={paymentResult}
            patientName={patientName}
            patientUhid={sales[0]?.patient?.uhid || sales[0]?.patient?.patientNumber || "N/A"}
            isPharmacy={sales.some(s => s.type === 'pos')}
        />
        </>
    )
}
