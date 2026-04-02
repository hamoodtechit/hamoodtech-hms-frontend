"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useCurrency } from "@/hooks/use-currency"
import { cn } from "@/lib/utils"
import { PaymentMethod, Purchase } from "@/types/pharmacy"
import { format } from "date-fns"
import { Building2, CreditCard, DollarSign, FileText, Loader2, MapPin, Phone, User, X } from "lucide-react"
import { useEffect, useState } from "react"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useAddPurchasePayment } from "@/hooks/pharmacy-queries"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface PurchaseDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: Purchase | null
  initialAddPayment?: boolean
  onSuccess?: () => void
}

export function PurchaseDetailsDialog({ open, onOpenChange, purchase, initialAddPayment = false, onSuccess }: PurchaseDetailsDialogProps) {
  const { formatCurrency } = useCurrency()
  
  // Payment UI state
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentAccountId, setPaymentAccountId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [paymentNote, setPaymentNote] = useState('')

  const { data: accountsRes } = useFinanceAccounts()
  const accounts = accountsRes?.data || []
  const { mutate: addPayment, isPending: submittingPayment } = useAddPurchasePayment()

  const paymentMethods: PaymentMethod[] = ['cash', 'card', 'online', 'cheque', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer']

  // Auto-open payment section if requested
  useEffect(() => {
    if (open && purchase && initialAddPayment) {
        setIsAddingPayment(true)
        setPaymentAmount(Number(purchase.dueAmount || 0))
    } else if (!open) {
        setIsAddingPayment(false)
    }
  }, [open, purchase, initialAddPayment])

  if (!purchase) return null

  const handlePaymentSubmit = () => {
    if (!purchase || !paymentAccountId || paymentAmount <= 0) return

    addPayment({
        id: purchase.id,
        data: {
            accountId: paymentAccountId,
            amount: paymentAmount,
            paymentMethod: paymentMethod,
            note: paymentNote || undefined
        }
    }, {
        onSuccess: () => {
            setIsAddingPayment(false)
            setPaymentAmount(0)
            setPaymentNote('')
            onSuccess?.()
        }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mr-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {purchase.poNumber || "Purchase Order"}
                {purchase.type && (
                  <Badge variant="outline" className="ml-2 text-[10px] uppercase font-bold text-primary border-primary/20">
                    {purchase.type}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Created on {format(new Date(purchase.createdAt), "PPP p")}
              </DialogDescription>
            </div>
            <Badge variant={
              purchase.status === 'completed' ? 'default' : 
              purchase.status === 'pending' ? 'secondary' : 'destructive'
            } className="text-sm px-3 py-1 capitalize">
              {purchase.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Supplier Details */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
            <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
              <User className="h-4 w-4" /> Supplier
            </h3>
            <div className="space-y-1">
              <p className="font-medium text-base">{purchase.supplier?.name || "N/A"}</p>
              {purchase.supplier?.email && (
                <p className="text-sm text-muted-foreground">{purchase.supplier.email}</p>
              )}
              {purchase.supplier?.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" /> {purchase.supplier.phone}
                </div>
              )}
              {purchase.supplier?.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {purchase.supplier.address}
                </div>
              )}
            </div>
          </div>

          {/* Branch Details */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
             <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
              <Building2 className="h-4 w-4" /> Destination Branch
            </h3>
            <div className="space-y-1">
              <p className="font-medium text-base">{purchase.branch?.name || "N/A"}</p>
              {purchase.branch?.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3 w-3" /> {purchase.branch.phone}
                </div>
              )}
              {purchase.branch?.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {purchase.branch.address}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Order Items</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Batch / Expiry</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.purchaseItems?.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell>
                      <div className="font-medium">{item.itemName}</div>
                      <div className="text-xs text-muted-foreground">{item.itemDescription}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div>Batch: {item.batchNumber || "N/A"}</div>
                        <div className="text-muted-foreground">Exp: {format(new Date(item.expiryDate), "PP")}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="space-y-0.5">
                        <div>{formatCurrency(item.price)}</div>
                        <div className="text-xs text-muted-foreground">MRP: {formatCurrency(item.mrp)}</div>
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(item.quantity).toLocaleString()} {item.unit}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(item.price) * Number(item.quantity))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Payment Details */}
        {(purchase.paymentMethod || purchase.paidAmount !== undefined) && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-sm text-primary uppercase tracking-wider">
                  <DollarSign className="h-4 w-4" /> Payment Information
                </h3>
                {Number(purchase.dueAmount || 0) > 0 && !isAddingPayment && (
                    <Button 
                        type="button"
                        size="sm" 
                        variant="ghost" 
                        className="text-primary hover:text-primary hover:bg-primary/10 font-bold"
                        onClick={() => {
                            setIsAddingPayment(true)
                            setPaymentAmount(Number(purchase.dueAmount))
                        }}
                    >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Settle Balance
                    </Button>
                )}
             </div>
             
             {isAddingPayment && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-2 border-dashed border-primary/20 rounded-xl bg-background animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest">Amount to Pay</Label>
                        <Input 
                            type="number" 
                            className="h-8"
                            value={paymentAmount} 
                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                            max={Number(purchase.dueAmount)}
                            min={0.01}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest">Account</Label>
                        <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                            <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id} className="text-xs">
                                        {acc.name} ({formatCurrency(acc.currentBalance)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest">Method</Label>
                        <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                            <SelectTrigger className="h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentMethods.map((method) => (
                                    <SelectItem key={method} value={method} className="text-xs">
                                        <span className="capitalize">{method}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest">Note (Optional)</Label>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Payment note..." 
                                className="h-8 flex-1"
                                value={paymentNote} 
                                onChange={(e) => setPaymentNote(e.target.value)}
                            />
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setIsAddingPayment(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="sm:col-span-2 pt-2">
                        <Button 
                            type="button"
                            className="w-full h-9 bg-primary hover:bg-primary/90" 
                            onClick={handlePaymentSubmit}
                            disabled={submittingPayment || paymentAmount <= 0 || !paymentAccountId}
                        >
                            {submittingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Payment & Update Balance
                        </Button>
                    </div>
                </div>
             )}

             {!isAddingPayment && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-0.5">
                        <span className="text-xs text-muted-foreground block text-primary/70 font-bold uppercase tracking-tighter">Method</span>
                        <span className="font-bold capitalize">{purchase.paymentMethod || "N/A"}</span>
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-xs text-muted-foreground block text-emerald-600/70 font-bold uppercase tracking-tighter">Paid Amount</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(Number(purchase.paidAmount || 0))}</span>
                    </div>
                    <div className="space-y-0.5">
                        <span className="text-xs text-muted-foreground block text-destructive/70 font-bold uppercase tracking-tighter">Balance Due</span>
                        <span className={cn(
                            "font-bold",
                            Number(purchase.dueAmount || 0) > 0 ? "text-destructive" : "text-emerald-600"
                        )}>
                            {Number(purchase.dueAmount || 0) > 0 
                                ? formatCurrency(Number(purchase.dueAmount)) 
                                : "Fully Paid"
                            }
                        </span>
                    </div>
                </div>
             )}

             {purchase.note && (
                <div className="pt-3 border-t border-primary/10">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest block mb-1">Purchase Note</span>
                    <p className="text-xs italic text-muted-foreground bg-muted/50 p-2 rounded border border-dashed">
                        {purchase.note}
                    </p>
                </div>
             )}
          </div>
        )}

        {/* Transactions Table */}
        {purchase.transactions && purchase.transactions.length > 0 && (
            <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" /> Transaction History
                </h3>
                <div className="rounded-md border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="text-[10px] uppercase font-bold">Date</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold">TXN ID</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold">Method</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchase.transactions.map((txn: any) => (
                                <TableRow key={txn.id} className="hover:bg-muted/30">
                                    <TableCell className="text-xs">
                                        {format(new Date(txn.createdAt), "dd MMM yyyy")}
                                    </TableCell>
                                    <TableCell className="text-xs font-mono text-muted-foreground">
                                        {txn.txnId}
                                    </TableCell>
                                    <TableCell className="text-xs capitalize">
                                        {txn.paymentMethod}
                                    </TableCell>
                                    <TableCell className="text-xs text-right font-medium text-emerald-600">
                                        {formatCurrency(Number(txn.amount))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )}

        {/* Footer Totals */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t mt-2">
          <div className="text-xs text-muted-foreground italic">
            * All prices are in local currency
          </div>
          <div className="bg-muted p-4 rounded-lg min-w-[280px] space-y-2 ml-auto shadow-sm border">
            <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground uppercase font-bold tracking-tighter">Subtotal (Items):</span>
                <span className="font-medium">{formatCurrency(Number(purchase.totalPrice || 0))}</span>
            </div>
            {Number(purchase.discountAmount || 0) > 0 && (
                <div className="flex justify-between items-center text-xs text-blue-600">
                    <span className="uppercase font-bold tracking-tighter">Global Discount:</span>
                    <span className="font-bold">-{formatCurrency(Number(purchase.discountAmount))}</span>
                </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold text-primary pt-2 border-t border-primary/20">
                <span>Net Payable:</span>
                <span>{formatCurrency(Number(purchase.totalPrice || 0) - Number(purchase.discountAmount || 0))}</span>
            </div>
            
            <Separator className="my-1 bg-primary/10" />

            <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center text-xs text-emerald-600">
                    <span className="uppercase font-bold tracking-tighter">Total Amount Paid:</span>
                    <span className="font-bold">{formatCurrency(Number(purchase.paidAmount || 0))}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-black border-t pt-1.5 mt-1">
                    <span className="uppercase tracking-tighter">Outstanding Due:</span>
                    <span className={cn(
                        Number(purchase.dueAmount || 0) > 0 ? "text-destructive" : "text-emerald-600"
                    )}>
                        {formatCurrency(Number(purchase.dueAmount || 0))}
                    </span>
                </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
