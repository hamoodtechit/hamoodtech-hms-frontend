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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useCurrency } from "@/hooks/use-currency"
import { Purchase } from "@/types/pharmacy"
import { format } from "date-fns"
import { Building2, FileText, MapPin, Phone, User } from "lucide-react"

interface PurchaseDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase: Purchase | null
}

export function PurchaseDetailsDialog({ open, onOpenChange, purchase }: PurchaseDetailsDialogProps) {
  const { formatCurrency } = useCurrency()
  if (!purchase) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mr-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {purchase.poNumber || "Purchase Order"}
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

        {/* Footer Totals */}
        <div className="flex justify-end pt-4 border-t mt-2">
          <div className="bg-muted p-4 rounded-lg min-w-[200px] space-y-2">
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Items:</span>
                <span className="font-medium">{purchase.purchaseItems?.length || 0}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold text-primary">
                <span>Grand Total:</span>
                <span>{formatCurrency(purchase.totalPrice || 0)}</span>
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
