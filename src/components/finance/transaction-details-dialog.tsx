"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useFinanceTransaction, useUpdateFinanceTransaction } from "@/hooks/finance-queries"
import { useCurrency } from "@/hooks/use-currency"
import { cn } from "@/lib/utils"
import {
    ArrowDownLeft,
    ArrowUpRight,
    Calendar,
    ChevronRight,
    CreditCard,
    DollarSign,
    Edit,
    FileText,
    Hash,
    History,
    Info,
    Loader2,
    Monitor,
    Package,
    Receipt,
    RotateCcw,
    Save,
    Wallet,
    X
} from "lucide-react"
import { toast } from "sonner"

import { PurchaseDetailsDialog } from "@/components/pharmacy/inventory/purchase-details-dialog"
import { SaleDetailsDialog } from "@/components/pharmacy/sale-details-dialog"
import { SaleReturnDetailsDialog } from "@/components/pharmacy/sale-return-details-dialog"
import { useEffect, useState } from "react"
import { ExpenseDialog } from "./expense-dialog"

interface TransactionDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transactionId: string | null
}

export function TransactionDetailsDialog({ open, onOpenChange, transactionId }: TransactionDetailsDialogProps) {
    const { formatCurrency } = useCurrency()
    const { data: response, isLoading } = useFinanceTransaction(transactionId || "")
    // Handle both wrapped and unwrapped responses for robustness
    const txn = (response as any)?.data || response

    const updateTxnMutation = useUpdateFinanceTransaction()
    const [isEditing, setIsEditing] = useState(false)
    const [editNote, setEditNote] = useState("")
    const [editPaymentMethod, setEditPaymentMethod] = useState("")

    useEffect(() => {
        if (txn) {
            setEditNote(txn.note || "")
            setEditPaymentMethod(txn.paymentMethod || "cash")
        }
    }, [txn])

    const handleUpdate = async () => {
        if (!transactionId) return
        try {
            await updateTxnMutation.mutateAsync({
                id: transactionId,
                data: {
                    note: editNote,
                    paymentMethod: editPaymentMethod
                }
            })
            toast.success("Transaction updated successfully")
            setIsEditing(false)
        } catch (error) {
            toast.error("Failed to update transaction")
        }
    }

    const [isSaleOpen, setIsSaleOpen] = useState(false)
    const [isExpenseOpen, setIsExpenseOpen] = useState(false)
    const [isPurchaseOpen, setIsPurchaseOpen] = useState(false)
    const [isReturnOpen, setIsReturnOpen] = useState(false)

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle className="flex items-center justify-between text-xl">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                Transaction Details
                            </div>
                            {!isLoading && txn && (
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <>
                                            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setIsEditing(false)}>
                                                <X className="h-4 w-4 mr-1" />
                                                Cancel
                                            </Button>
                                            <Button size="sm" className="h-8 px-2" disabled={updateTxnMutation.isPending} onClick={handleUpdate}>
                                                {updateTxnMutation.isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                ) : (
                                                    <Save className="h-4 w-4 mr-1" />
                                                )}
                                                Save
                                            </Button>
                                        </>
                                    ) : (
                                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => setIsEditing(true)}>
                                            <Edit className="h-4 w-4 mr-1" />
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="h-[400px] flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-muted-foreground text-center">Loading transaction details...</p>
                        </div>
                    ) : !txn ? (
                        <div className="p-12 text-center space-y-2">
                            <Hash className="h-8 w-8 text-muted-foreground mx-auto opacity-20" />
                            <p className="font-medium">Transaction not found</p>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Transaction ID and Category */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-bold tracking-tight text-primary uppercase">{txn.txnId}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="capitalize">
                                            {txn.txnType.replace("-", " ")}
                                        </Badge>
                                        <div className={cn(
                                            "flex items-center gap-1 font-bold text-sm",
                                            txn.flowType === 'in' ? "text-emerald-600" : "text-destructive"
                                        )}>
                                            {txn.flowType === 'in' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                            {txn.flowType === 'in' ? "CASH IN" : "CASH OUT"}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-muted-foreground flex items-center justify-end gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(txn.createdAt).toLocaleDateString("en-US", { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </p>
                                </div>
                            </div>

                            {/* Amount Card */}
                            <div className={cn(
                                "rounded-xl p-5 border-2 flex items-center justify-between shadow-sm",
                                txn.flowType === 'in' ? "bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/50" : "bg-destructive/5 border-destructive/10 dark:bg-destructive/10 dark:border-destructive/20"
                            )}>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaction Amount</p>
                                    <p className={cn(
                                        "text-3xl font-black mt-1",
                                        txn.flowType === 'in' ? "text-emerald-600 dark:text-emerald-400" : "text-destructive dark:text-red-400"
                                    )}>
                                        {txn.flowType === 'in' ? '+' : '-'}{formatCurrency(Number(txn.amount))}
                                    </p>
                                </div>
                                <div className={cn(
                                    "p-3 rounded-full",
                                    txn.flowType === 'in' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40" : "bg-destructive/10 text-destructive dark:bg-destructive/20"
                                )}>
                                    <DollarSign className="h-6 w-6" />
                                </div>
                            </div>

                            {/* Balance Impact */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Balance Before</p>
                                    <p className="text-sm font-semibold mt-1">{formatCurrency(Number(txn.accountBalanceBefore))}</p>
                                </div>
                                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Balance After</p>
                                    <p className="text-sm font-semibold mt-1">{formatCurrency(Number(txn.accountBalanceNow))}</p>
                                </div>
                            </div>

                            <Separator />

                            {/* Account and Source Details */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold flex items-center gap-2">
                                    <Info className="h-4 w-4 text-primary" />
                                    Payment & Account Info
                                </h4>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                                    <DetailItem 
                                        icon={txn.account?.type === 'cash' ? Wallet : CreditCard} 
                                        label="Target Account" 
                                        value={txn.account?.name || "N/A"} 
                                    />
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Payment Method</p>
                                        {isEditing ? (
                                            <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
                                                <SelectTrigger className="h-8 text-xs font-semibold capitalize mt-1">
                                                    <SelectValue placeholder="Select method" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="cash">Cash</SelectItem>
                                                    <SelectItem value="bank">Bank</SelectItem>
                                                    <SelectItem value="mfs">MFS</SelectItem>
                                                    <SelectItem value="cheque">Cheque</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="p-1.5 rounded-md bg-primary/5 text-primary">
                                                    <Monitor className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="text-xs font-semibold capitalize">{txn.paymentMethod || "N/A"}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Transaction Note</p>
                                        {isEditing ? (
                                            <Input 
                                                className="h-9 text-xs mt-1" 
                                                value={editNote} 
                                                onChange={(e) => setEditNote(e.target.value)}
                                                placeholder="Write a note..."
                                            />
                                        ) : (
                                            <div className="flex items-start gap-2 mt-1">
                                                <div className="p-1.5 rounded-md bg-primary/5 text-primary mt-0.5">
                                                    <FileText className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="text-xs font-semibold leading-relaxed">{txn.note || "No notes provided."}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Related Entity Links */}
                            {(txn.sale || txn.purchase || txn.expense || txn.saleReturn) && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold flex items-center gap-2">
                                            <Package className="h-4 w-4 text-primary" />
                                            Related Record
                                        </h4>
                                        
                                        {txn.sale && (
                                            <RecordLink 
                                                icon={Receipt}
                                                title="View Pharmacy Sale"
                                                subtitle={txn.sale.invoiceNumber}
                                                onClick={() => setIsSaleOpen(true)}
                                            />
                                        )}

                                        {txn.expense && (
                                            <RecordLink 
                                                icon={FileText}
                                                title="View Expense Details"
                                                subtitle={txn.expense.expenseNumber}
                                                onClick={() => setIsExpenseOpen(true)}
                                            />
                                        )}

                                        {txn.purchase && (
                                            <RecordLink 
                                                icon={Package}
                                                title="View Purchase Record"
                                                subtitle={txn.purchase.poNumber || txn.purchase.purchaseNumber}
                                                onClick={() => setIsPurchaseOpen(true)}
                                            />
                                        )}

                                        {txn.saleReturn && (
                                            <RecordLink 
                                                icon={RotateCcw}
                                                title="View Sale Return"
                                                subtitle={txn.saleReturn.invoiceNumber}
                                                onClick={() => setIsReturnOpen(true)}
                                            />
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Drill-down Dialogs */}
            {txn?.sale && (
                <SaleDetailsDialog 
                    open={isSaleOpen}
                    onOpenChange={setIsSaleOpen}
                    sale={txn.sale}
                />
            )}

            {txn?.expense && (
                <ExpenseDialog 
                    open={isExpenseOpen}
                    onOpenChange={setIsExpenseOpen}
                    expense={txn.expense}
                />
            )}

            {txn?.purchase && (
                <PurchaseDetailsDialog 
                    open={isPurchaseOpen}
                    onOpenChange={setIsPurchaseOpen}
                    purchase={txn.purchase}
                />
            )}

            {txn?.saleReturn && (
                <SaleReturnDetailsDialog 
                    open={isReturnOpen}
                    onOpenChange={setIsReturnOpen}
                    saleReturn={txn.saleReturn}
                />
            )}
        </>
    )
}

function DetailItem({ icon: Icon, label, value, className }: { icon: any, label: string, value: string, className?: string }) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
            <div className="flex items-center gap-2 mt-1">
                <div className="p-1.5 rounded-md bg-primary/5 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <span className={cn("text-xs font-semibold", className)}>{value}</span>
            </div>
        </div>
    )
}

function RecordLink({ icon: Icon, title, subtitle, onClick }: { icon: any, title: string, subtitle: string, onClick: () => void }) {
    return (
        <Button 
            variant="outline" 
            className="w-full justify-between h-auto py-3 px-4 group hover:border-primary/50 transition-all hover:bg-primary/5"
            onClick={onClick}
        >
            <div className="flex items-center gap-3 text-left">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <p className="text-xs font-bold">{title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tighter mt-0.5">{subtitle}</p>
                </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
        </Button>
    )
}
