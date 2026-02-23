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
import { useCurrency } from "@/hooks/use-currency"
import { usePermissions } from "@/hooks/use-permissions"
import { pharmacyService } from "@/services/pharmacy-service"
import { useAuthStore } from "@/store/use-auth-store"
import { Patient, PaymentMethod, Sale, SaleReturn } from "@/types/pharmacy"
import { Edit, RotateCcw, Save, X } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PatientSearch } from "./pos/patient-search"

interface SaleDetailsDialogProps {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function SaleDetailsDialog({
  sale,
  open,
  onOpenChange,
  onSuccess,
}: SaleDetailsDialogProps) {
  const { formatCurrency } = useCurrency()
  const { user } = useAuthStore()
  const [isEditMode, setIsEditMode] = useState(false)
  const [loading, setLoading] = useState(false)

  // Edit form state
  const [status, setStatus] = useState<'pending' | 'completed' | 'rejected'>('pending')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [saleReturns, setSaleReturns] = useState<SaleReturn[]>([])
  const [fetchingReturns, setFetchingReturns] = useState(false)

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
    }
  }, [sale])

  const fetchSaleReturns = async () => {
    if (!sale) return
    try {
      setFetchingReturns(true)
      const res = await pharmacyService.getSaleReturns({ search: sale.invoiceNumber, limit: 100 })
      // Filter returns that belong to this sale specifically if invoiceNumber is shared or search by saleId if supported
      // Usually invoiceNumber search for sale-returns will return returns for that invoice.
      setSaleReturns(res.data.data)
    } catch (error) {
      console.error("Failed to fetch sale returns", error)
    } finally {
      setFetchingReturns(false)
    }
  }

  const handleSave = async () => {
    if (!sale) return

    setLoading(true)
    try {
      await pharmacyService.updateSale(sale.id, {
        status,
        paymentMethod,
        discountPercentage: discountPercentage || undefined,
        discountAmount: discountAmount || undefined,
        patientId: selectedPatient?.id,
      })

      toast.success('Sale updated successfully')
      setIsEditMode(false)
      onSuccess?.()
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
    }
    setIsEditMode(false)
  }

  if (!sale) return null

  const subtotal = sale.saleItems.reduce((sum, item) => sum + Number(item.totalPrice), 0)
  const discount = discountAmount || (subtotal * discountPercentage) / 100
  const total = subtotal - discount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Sale Details - {sale.invoiceNumber}</span>
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
                  {sale.saleItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            {item.itemName}
                            {item.dosageForm && <span className="text-[10px] text-muted-foreground">({item.dosageForm})</span>}
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
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Due Amount</span>
                    <span className="font-semibold text-destructive">{formatCurrency(sale.dueAmount || 0)}</span>
                </div>
            </div>
          </div>
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
