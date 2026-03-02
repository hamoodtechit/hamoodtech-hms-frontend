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
import { SaleReturn } from "@/types/sales"
import { X } from "lucide-react"

import { salesService } from "@/services/sales-service"
import { useSettingsStore } from "@/store/use-settings-store"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface SaleReturnDetailsProps {
  saleReturn: SaleReturn | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaleReturnDetailsDialog({ saleReturn: initialSaleReturn, open, onOpenChange }: SaleReturnDetailsProps) {
  const [saleReturn, setSaleReturn] = useState<SaleReturn | null>(initialSaleReturn)
  const [loading, setLoading] = useState(false)
  const { formatCurrency } = useCurrency()
  const { general } = useSettingsStore()

  useEffect(() => {
    if (open && initialSaleReturn?.id) {
        fetchReturnDetails(initialSaleReturn.id)
    } else if (!open) {
        // Reset saleReturn when dialog closes to show initial data next time
        setSaleReturn(initialSaleReturn)
    }
  }, [open, initialSaleReturn])

  const fetchReturnDetails = async (id: string) => {
    try {
        setLoading(true)
        const res = await salesService.getSaleReturn(id)
        if (res.success) {
            setSaleReturn(res.data as any)
        }
    } catch (error) {
        console.error("Failed to fetch sale return details", error)
        toast.error("Failed to load return details")
    } finally {
        setLoading(false)
    }
  }

  if (!saleReturn && !loading) return null
  if (loading) return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-center h-48">
                Loading return details...
            </div>
        </DialogContent>
    </Dialog>
  )

  if (!saleReturn) return null

  const subtotal = (saleReturn.saleReturnItems || []).reduce((sum, item) => sum + Number(item.totalPrice), 0)
  const discount = Number(saleReturn.discountAmount) || 0
  const total = subtotal - discount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Return Details - {saleReturn.invoiceNumber}</span>
          </DialogTitle>
          <DialogDescription>
            View details of the processed return.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Return Header Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/10 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{saleReturn.createdAt ? new Date(saleReturn.createdAt).toLocaleString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Branch</p>
              <p className="font-medium">{saleReturn.branch?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{saleReturn.patient?.name || 'Walk-in'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={saleReturn.status === 'completed' ? 'default' : 'secondary'}>
                {saleReturn.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Return Items */}
          <div>
            <h3 className="font-semibold mb-2">Returned Items</h3>
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
                  {(saleReturn.saleReturnItems || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>
                            {item.itemName}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                            Batch: {item.batchNumber}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.totalPrice)}</TableCell>
                    </TableRow>
                  ))}
                  {(!saleReturn.saleReturnItems || saleReturn.saleReturnItems.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            No items found in this return.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Adjustment Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total Refund</span>
              <span className="text-primary">{formatCurrency(saleReturn.totalPrice)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
