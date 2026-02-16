"use client"

import { MedicineDetailsDialog } from "@/app/[locale]/(dashboard)/pharmacy/inventory/medicines/components/medicine-details-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useCurrency } from "@/hooks/use-currency"
import { useDebounce } from "@/hooks/use-debounce"
import { pharmacyService } from "@/services/pharmacy-service"
import { useStoreContext } from "@/store/use-store-context"
import { PharmacyMeta, Stock } from "@/types/pharmacy"
import { Eye, MoreHorizontal, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function StockTable() {
  const { activeStoreId } = useStoreContext()
  const { formatCurrency } = useCurrency()
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 500)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PharmacyMeta | null>(null)
  const [detailsItem, setDetailsItem] = useState<any | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const handleViewDetails = (item: Stock) => {
    // Construct a proper Medicine object from Stock data
    const medicineData = {
      ...item.medicine,
      unitPrice: item.unitPrice,  // Add pricing from stock
      mrp: item.mrp,              // Add MRP from stock
      stock: item.quantity,        // Add current stock quantity
      stocks: [                    // Add stocks array with batch info
        {
          id: item.id,
          medicineId: item.medicineId,
          branchId: item.branchId,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          expiryDate: item.expiryDate,
          sku: item.sku,
          unitPrice: item.unitPrice,
          mrp: item.mrp,
          unit: item.unit,
          branch: item.branch
        }
      ]
    }
    setDetailsItem(medicineData)
    setDetailsOpen(true)
  }

  const loadStock = async () => {
    try {
      setLoading(true)
      const response = await pharmacyService.getStocks({
        page,
        limit: 10,
        search: debouncedSearch,
        branchId: activeStoreId || undefined
      })
      if (response.success) {
        setStocks(response.data)
        setMeta(response.meta)
      }
    } catch (error) {
      toast.error("Failed to load inventory data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStock()
  }, [page, debouncedSearch, activeStoreId])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search stocks (SKU, batch, medicine)..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                }}
            />
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Medicine</TableHead>
              <TableHead>Batch / SKU</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price (MRP)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-[120px]" /><Skeleton className="h-3 w-[80px] mt-1" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /><Skeleton className="h-3 w-[60px] mt-1" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[40px]" /><Skeleton className="h-3 w-[30px] mt-1" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[60px]" /><Skeleton className="h-3 w-[80px] mt-1" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-[80px] rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </TableRow>
                ))
            ) : stocks.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No stocks found.
                    </TableCell>
                </TableRow>
            ) : (
                stocks.map((item) => {
                    const quantity = Number(item.quantity)
                    const isOut = quantity === 0
                    const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date()

                    return (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{item.medicine?.name}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">{item.medicine?.genericName}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">{item.batchNumber}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">{item.sku}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className={`text-sm ${isExpired ? 'text-destructive font-bold' : ''}`}>
                                    {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-bold">{quantity}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">{item.unit}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col text-sm">
                                    <span className="text-emerald-600 font-medium">{formatCurrency(item.unitPrice)}</span>
                                    <span className="text-[10px] text-muted-foreground line-through">MRP: {formatCurrency(item.mrp)}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {isExpired ? (
                                    <Badge variant="destructive">Expired</Badge>
                                ) : isOut ? (
                                    <Badge variant="destructive">Out of Stock</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">Available</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleViewDetails(item)}>
                                            <Eye className="mr-2 h-4 w-4" /> View Medicine
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive" disabled>Report Issue</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between py-2">
            <p className="text-xs text-muted-foreground">
                Showing {(meta.page - 1) * meta.pageSize + 1} to {Math.min(meta.page * meta.pageSize, meta.totalItems)} of {meta.totalItems} items
            </p>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!meta.hasPreviousPage}
                >
                    Previous
                </Button>
                <div className="text-xs font-medium px-4">
                    Page {meta.page} of {meta.totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                    disabled={!meta.hasNextPage}
                >
                    Next
                </Button>
            </div>
        </div>
      )}
      
      <MedicineDetailsDialog 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
        medicine={detailsItem}
      />
    </div>
  )
}
