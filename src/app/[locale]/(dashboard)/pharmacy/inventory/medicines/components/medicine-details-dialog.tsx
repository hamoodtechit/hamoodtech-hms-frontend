"use client"

import { pharmacyService } from "@/services/pharmacy-service"
import { useEffect, useState } from "react"
import { toast } from "sonner"

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
import { Medicine } from "@/types/pharmacy"
import { format } from "date-fns"
import { Activity, Archive, Barcode, Box, Layers, Tag } from "lucide-react"

interface MedicineDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  medicine: Medicine | null
}

export function MedicineDetailsDialog({ open, onOpenChange, medicine }: MedicineDetailsDialogProps) {
  const { formatCurrency } = useCurrency()
  const [fullMedicine, setFullMedicine] = useState<Medicine | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && medicine?.id) {
        setIsLoading(true)
        // Reset full medicine when opening new one to avoid showing old data
        setFullMedicine(null) 
        
        pharmacyService.getMedicine(medicine.id)
            .then(async (res) => {
                // The API returns { data: Medicine }, so we need res.data
                setFullMedicine(res.data)
            })
            .catch((error) => {
                console.error("Failed to fetch medicine details:", error)
                toast.error("Failed to load items details")
            })
            .finally(() => setIsLoading(false))
    }
  }, [open, medicine])

  if (!medicine) return null

  // Use fullMedicine if available, otherwise fall back to passed medicine (for initial render)
  // We prefer fullMedicine because it has the relations (category, brand, etc.)
  const displayMedicine = fullMedicine || medicine

  // Calculate totals
  const totalStock = displayMedicine.stocks?.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0) || (Number(displayMedicine.stock) || 0)
  const stockValue = totalStock * (Number(displayMedicine.unitPrice) || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mr-4">
            <div className="space-y-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                {displayMedicine.name}
                {displayMedicine.isActive ? (
                  <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 ml-2">Active</Badge>
                ) : (
                  <Badge variant="secondary" className="ml-2">Inactive</Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                  {displayMedicine.unit || 'Unit'}
                </span>
                {displayMedicine.genericName && <span className="text-muted-foreground">{displayMedicine.genericName}</span>}
              </DialogDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{totalStock}</div>
              <div className="text-xs text-muted-foreground">Total Stock</div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-2">
          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Tag className="h-3.5 w-3.5" /> Category
            </div>
            <div className="font-medium text-sm truncate" title={displayMedicine.category?.name}>
              {displayMedicine.category?.name || "N/A"}
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5" /> Strength
            </div>
            <div className="font-medium text-sm truncate">
              {displayMedicine.strength || "N/A"}
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Archive className="h-3.5 w-3.5" /> Dosage Form
            </div>
            <div className="font-medium text-sm truncate">
              {displayMedicine.dosageForm || "N/A"}
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Box className="h-3.5 w-3.5" /> Brand
            </div>
            <div className="font-medium text-sm truncate" title={displayMedicine.brand?.name}>
              {displayMedicine.brand?.name || "N/A"}
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers className="h-3.5 w-3.5" /> Rack / Shelf
            </div>
            <div className="font-medium text-sm truncate">
              {displayMedicine.rackNumber || "Not Set"}
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Barcode className="h-3.5 w-3.5" /> Barcode
            </div>
            <div className="font-medium text-sm truncate font-mono">
              {displayMedicine.barcode || "N/A"}
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Box className="h-3.5 w-3.5" /> Manufacturer
            </div>
            <div className="font-medium text-sm truncate" title={displayMedicine.medicineManufacturer?.name}>
              {displayMedicine.medicineManufacturer?.name || "N/A"}
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg space-y-1">
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Layers className="h-3.5 w-3.5" /> Group
            </div>
            <div className="font-medium text-sm truncate" title={displayMedicine.group?.name}>
              {displayMedicine.group?.name || "N/A"}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
           <h3 className="font-semibold text-sm flex items-center gap-2">
             <Activity className="h-4 w-4" /> Pricing & Valuation
           </h3>
           <div className="grid grid-cols-3 gap-4 border rounded-lg p-4">
              <div>
                 <div className="text-xs text-muted-foreground mb-1">Unit Price (Buy)</div>
                 <div className="font-semibold">{formatCurrency(Number(displayMedicine.unitPrice) || 0)}</div>
              </div>
              <div>
                 <div className="text-xs text-muted-foreground mb-1">MRP</div>
                 <div className="font-semibold">{formatCurrency(Number(displayMedicine.mrp) || 0)}</div>
              </div>
              <div>
                 <div className="text-xs text-muted-foreground mb-1">Total Value</div>
                 <div className="font-semibold text-emerald-600">{formatCurrency(stockValue || 0)}</div>
              </div>
           </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Archive className="h-4 w-4" /> Batch Inventory
          </h3>
          <div className="rounded-md border max-h-[200px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead className="h-8 text-xs">Batch #</TableHead>
                  <TableHead className="h-8 text-xs">Expiry</TableHead>
                  <TableHead className="h-8 text-xs text-right">Qty</TableHead>
                  <TableHead className="h-8 text-xs">Branch</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayMedicine.stocks && displayMedicine.stocks.length > 0 ? (
                  displayMedicine.stocks.map((stock, i) => (
                    <TableRow key={stock.id || i} className="h-10">
                      <TableCell className="font-mono text-xs">{stock.batchNumber}</TableCell>
                      <TableCell className="text-xs">{format(new Date(stock.expiryDate), "PP")}</TableCell>
                      <TableCell className="text-right font-medium text-xs">
                        {stock.quantity}
                      </TableCell>
                       <TableCell className="text-xs truncate max-w-[120px]" title={stock.branch?.name}>
                        {stock.branch?.name || stock.branchId}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                   <TableRow>
                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-xs">
                        No batch data available.
                      </TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
