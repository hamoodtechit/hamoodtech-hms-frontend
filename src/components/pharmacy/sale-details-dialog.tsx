"use client"

import { Badge } from "@/components/ui/badge"
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
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useAddSalePayment, useUpdateSale } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { usePermissions } from "@/hooks/use-permissions"
import { salesService } from "@/services/sales-service"
import { useAuthStore } from "@/store/use-auth-store"
import { Patient, PaymentMethod } from "@/types/pharmacy"
import { Sale, SaleReturn } from "@/types/sales"
import { CreditCard, Edit, Loader2, RotateCcw, Save, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PatientSearch } from "./pos/patient-search"

interface SaleDetailsDialogProps {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialAddPayment?: boolean
}

export function SaleDetailsDialog({
  sale,
  open,
  onOpenChange,
  onSuccess,
  initialAddPayment = false,
}: SaleDetailsDialogProps) {
  const { formatCurrency } = useCurrency()
  const { user } = useAuthStore()
  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(false)

  // Edit form state
  const [status, setStatus] = useState<'pending' | 'completed' | 'rejected' | 'returned'>('pending')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [saleReturns, setSaleReturns] = useState<SaleReturn[]>([])
  const [fetchingReturns, setFetchingReturns] = useState(false)

  // Payment UI state
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentAccountId, setPaymentAccountId] = useState<string>('')
  const [paymentNote, setPaymentNote] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'due' | 'partial'>('due')

  const { data: accountsRes } = useFinanceAccounts()
  const accounts = accountsRes?.data || []

  const { mutate: addPayment, isPending: submitttingPayment } = useAddSalePayment()
  const { mutate: updateSale, isPending: updatingSale } = useUpdateSale()

  const paymentMethods: PaymentMethod[] = ['cash', 'card', 'online', 'cheque', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer']

  const { hasPermission } = usePermissions()
  const canEditSales = hasPermission('medicine:sell')

  // Reset form when sale changes
  useEffect(() => {
    if (sale) {
      setStatus(sale.status)
      setPaymentMethod(sale.paymentMethod || 'cash')
      setDiscountPercentage(Number(sale.discountPercentage) || 0)
      setDiscountAmount(Number(sale.discountAmount) || 0)
      setIsEditMode(false)
      fetchSaleReturns()
      
      if (initialAddPayment && Number(sale.dueAmount) > 0) {
        setIsAddingPayment(true)
        setPaymentAmount(Number(sale.dueAmount))
      } else {
        setIsAddingPayment(false)
      }
    }
  }, [sale, initialAddPayment])

  const fetchSaleReturns = async () => {
    if (!sale) return
    try {
      setFetchingReturns(true)
      const res = await salesService.getSaleReturns({ search: sale.invoiceNumber, limit: 100 })
      // Filter returns that belong to this sale specifically if invoiceNumber is shared or search by saleId if supported
      // Usually invoiceNumber search for sale-returns will return returns for that invoice.
      setSaleReturns(res.data.data || [])
    } catch (error) {
      console.error("Failed to fetch sale returns", error)
    } finally {
      setFetchingReturns(false)
    }
  }
  const handlePaymentSubmit = () => {
    if (!sale || !paymentAccountId || paymentAmount <= 0) {
        toast.error("Please select an account and enter a valid amount")
        return
    }

    addPayment({
        id: sale.id,
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

  const handleSave = async () => {
    if (!sale) return

    setLoading(true)
    try {
      updateSale({
        id: sale.id,
        data: {
            status,
            paymentMethod,
            discountPercentage: discountPercentage || undefined,
            discountAmount: discountAmount || undefined,
            paymentStatus: paymentStatus,
            patientId: selectedPatient?.id,
        }
      }, {
        onSuccess: () => {
            setIsEditMode(false)
            onSuccess?.()
        }
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to update sale')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset to original values
    if (sale) {
      setStatus(sale.status)
      setPaymentMethod(sale.paymentMethod || 'cash')
      setDiscountPercentage(Number(sale.discountPercentage) || 0)
      setDiscountAmount(Number(sale.discountAmount) || 0)
      setPaymentStatus(sale.paymentStatus || 'due')
    }
    setIsEditMode(false)
  }

  if (!sale) return null
  
  // Use existing netPrice/totalPrice if available, or calculate from items if they exist
  const items = sale?.saleItems || []
  const subtotal = items.length > 0 
    ? items.reduce((sum, item) => sum + Number(item.totalPrice), 0)
    : Number(sale.totalPrice || 0)
    
  const discount = discountAmount || (subtotal * discountPercentage) / 100
  const total = subtotal - discount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Sale Details - {sale.invoiceNumber}</span>
              {Number(sale.dueAmount) > 0 && (
                <Badge variant="destructive" className="animate-pulse bg-red-600">
                  Unpaid Balance
                </Badge>
              )}
            </div>
            {!isEditMode && canEditSales && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Edit sale information' : 'View sale details'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sale Header Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/10 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{new Date(sale.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Branch</p>
              <p className="font-medium">{sale.branch?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{sale.patient?.name || 'Walk-in'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Session ID</p>
              <p className="font-mono text-xs truncate max-w-[150px]" title={sale.cashRegisterSessionId}>
                {sale.cashRegisterSessionId || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {!isEditMode ? (
                <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                  {sale.status}
                </Badge>
              ) : (
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            {sale.note && (
              <div className="col-span-2 mt-2 pt-2 border-t border-black/5">
                <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">Note:</p>
                <p className="text-xs font-bold text-primary italic leading-tight">"{sale.note}"</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Sale Items */}
          <div>
            <h3 className="font-semibold mb-2">Items</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(sale.saleItems || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            {item.itemName}
                            {item.dosageForm && <span className="text-[12px] font-bold text-primary ml-1 uppercase">({item.dosageForm})</span>}
                            {item.saleReturnId && (
                                <Badge variant="outline" className="text-[10px] h-4 border-red-200 text-red-600 bg-red-50">
                                    Returned
                                </Badge>
                            )}
                        </div>
                        {(Number(item.discountAmount) > 0 || Number(item.discountPercentage) > 0) && (
                          <div className="text-[10px] text-emerald-600">
                            Disc: {Number(item.discountPercentage) > 0 ? `${item.discountPercentage}%` : formatCurrency(Number(item.discountAmount))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          {/* Payment & Discount Info */}
          <div className="space-y-3">
            <div>
              <Label>Payment Method</Label>
              {!isEditMode ? (
                <p className="font-medium capitalize">{sale.paymentMethod || 'N/A'}</p>
              ) : (
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        <span className="capitalize">{method}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {isEditMode && (
              <>
                <div>
                  <Label>Patient (Optional)</Label>
                  <PatientSearch
                    selectedPatient={selectedPatient}
                    onSelect={setSelectedPatient}
                  />
                </div>

                <div>
                  <Label>Sale Discount</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="% off"
                      min="0"
                      max="100"
                      value={discountPercentage || ''}
                      onChange={(e) => {
                        setDiscountPercentage(Number(e.target.value) || 0)
                        setDiscountAmount(0)
                      }}
                    />
                    <span className="text-sm self-center text-muted-foreground">or</span>
                    <Input
                      type="number"
                      placeholder="Fixed amount"
                      min="0"
                      value={discountAmount || ''}
                      onChange={(e) => {
                        setDiscountAmount(Number(e.target.value) || 0)
                        setDiscountPercentage(0)
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Related Returns Section */}
          {saleReturns.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="font-semibold flex items-center gap-2 text-red-600">
                <RotateCcw className="h-4 w-4" />
                Return History
              </h3>
              <div className="border rounded-lg bg-red-50/20">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Return ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saleReturns.map((sr) => (
                      <TableRow key={sr.id}>
                        <TableCell className="font-medium text-xs">{sr.invoiceNumber}</TableCell>
                        <TableCell className="text-xs">{new Date(sr.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right text-xs font-semibold">{formatCurrency(sr.totalPrice)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={sr.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] h-4">
                            {sr.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {(discountPercentage > 0 || discountAmount > 0) && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Sale Discount {discountPercentage > 0 ? `(${discountPercentage}%)` : ''}</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            {Number(sale.taxAmount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({sale.taxPercentage}%)</span>
                <span>{formatCurrency(sale.taxAmount || 0)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(sale.totalPrice)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid Amount</span>
                    <span className="font-semibold text-emerald-600">{formatCurrency(sale.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm p-2 bg-red-50 rounded-lg border border-red-100">
                    <span className="text-red-600 font-bold uppercase tracking-wider text-xs">Total Due</span>
                    <span className="font-black text-red-600 text-lg">{formatCurrency(sale.dueAmount || 0)}</span>
                </div>
            </div>
          </div>

          {/* Add Payment UI */}
          {Number(sale.dueAmount) > 0 && !isEditMode && (
            <div className="mt-4 p-4 border-2 border-dashed border-primary/20 rounded-xl bg-primary/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary flex items-center gap-2">
                   <CreditCard className="h-4 w-4" />
                   Add Payment
                </h3>
                {!isAddingPayment ? (
                  <Button size="sm" onClick={() => {
                    setIsAddingPayment(true)
                    setPaymentAmount(Number(sale.dueAmount))
                  }}>
                    Settlement
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setIsAddingPayment(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {isAddingPayment && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label>Amount to Pay</Label>
                    <Input 
                      type="number" 
                      value={paymentAmount} 
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      max={Number(sale.dueAmount)}
                      min={0.01}
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account</Label>
                    <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.currentBalance)})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            <span className="capitalize">{method}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Note (Optional)</Label>
                    <Input 
                      placeholder="Payment note..." 
                      value={paymentNote} 
                      onChange={(e) => setPaymentNote(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2 pt-2">
                    <Button 
                      className="w-full" 
                      onClick={handlePaymentSubmit}
                      disabled={submitttingPayment || paymentAmount <= 0 || !paymentAccountId}
                    >
                      {submitttingPayment && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirm Payment
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit Mode Actions */}
          {isEditMode && (
             <div className="grid grid-cols-2 gap-4 pt-4 border-t">
               <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="due">Due</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
             </div>
          )}
        </div>

        {isEditMode && (
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
