"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
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
import { Sale } from "@/types/pharmacy"
import { ChevronLeft, ChevronRight, Eye, History, Printer, RotateCcw, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { CreateReturnDialog } from "@/components/pharmacy/pos/create-return-dialog"
import { SaleDetailsDialog } from "@/components/pharmacy/sale-details-dialog"

export function TransactionHistory() {
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 500)
  const { formatCurrency } = useCurrency()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { activeStoreId } = useStoreContext()
  const [isOpen, setIsOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null)

  const fetchSales = async () => {
    if (!activeStoreId) return
    
    try {
        setLoading(true)
        const response = await pharmacyService.getSales({
            branchId: activeStoreId,
            limit: 10,
            page,
            // Assuming search logic is handled or we rely on page/sort for now.
            // If backend supports search param in future, we add: search: debouncedSearch
        })
        if (response.success) {
            setSales(response.data.sales)
            if (response.data.pagination) {
                setTotalPages(response.data.pagination.totalPages)
            }
        }
    } catch (error) {
        console.error("Failed to fetch sales", error)
        toast.error("Failed to load transaction history")
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && activeStoreId) {
        fetchSales()
    }
  }, [isOpen, activeStoreId, debouncedSearch, page])

  const handleReprint = (sale: Sale) => {
    // Calculate breakdown
    const subtotal = sale.saleItems.reduce((sum, item) => sum + Number(item.totalPrice), 0)
    const discount = Number(sale.discountAmount) || 0
    // Assuming VAT is calculated on (subtotal - discount)
    const taxableAmount = subtotal - discount
    const vatPercentage = 5 // TODO: Get from settings
    const vat = (taxableAmount * vatPercentage) / 100
    const total = Number(sale.totalPrice)
    
    // Format currency values before using in template
    const formattedItems = sale.saleItems.map(item => ({
      ...item,
      formattedPrice: formatCurrency(item.totalPrice)
    }));
    const formattedSubtotal = formatCurrency(subtotal);
    const formattedDiscount = formatCurrency(discount);
    const formattedVAT = formatCurrency(vat);
    const formattedTotal = formatCurrency(total);
    
    const receiptWindow = window.open('', '_blank', 'width=400,height=600');
    if (receiptWindow) {
        receiptWindow.document.write(`
            <html>
                <head>
                    <title>Receipt ${sale.invoiceNumber}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; padding: 20px; text-align: center; }
                        .header { margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                        .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
                        .breakdown { margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px; }
                        .breakdown-item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
                        .breakdown-item.discount { color: #ff6b00; }
                        .breakdown-item.total { margin-top: 10px; border-top: 1px solid #000; padding-top: 10px; font-weight: bold; font-size: 16px; }
                        .footer { margin-top: 30px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>MediCare Pharmacy</h2>
                        <p>${sale.branch?.name || 'Pharmacy Branch'}</p>
                        <p>Date: ${new Date(sale.createdAt).toLocaleString()}</p>
                        <p>Invoice: ${sale.invoiceNumber}</p>
                    </div>
                    <div>
                        ${formattedItems.map(item => `
                            <div class="item">
                                <span>${item.itemName} x${item.quantity}</span>
                                <span>${item.formattedPrice}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="breakdown">
                        <div class="breakdown-item">
                            <span>Subtotal</span>
                            <span>${formattedSubtotal}</span>
                        </div>
                        ${discount > 0 ? `
                        <div class="breakdown-item discount">
                            <span>Discount</span>
                            <span>-${formattedDiscount}</span>
                        </div>
                        ` : ''}
                        ${vat > 0 ? `
                        <div class="breakdown-item">
                            <span>VAT (${vatPercentage}%)</span>
                            <span>${formattedVAT}</span>
                        </div>
                        ` : ''}
                        <div class="breakdown-item total">
                            <span>TOTAL</span>
                            <span>${formattedTotal}</span>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Thank you for your purchase!</p>
                        <p>Customer: ${sale.patient?.name || 'Walk-in'}</p>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        receiptWindow.document.close();
    } else {
        toast.error("Popup blocked. Please allow popups to print receipts.");
    }
  }

  const handleRefund = (sale: Sale) => {
    setSelectedSale(sale)
    setReturnDialogOpen(true)
  }

  const handleViewDetails = (sale: Sale) => {
    setSelectedSaleForDetails(sale)
    setDetailsDialogOpen(true)
  }

  return (
    <>
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <History className="mr-2 h-4 w-4" />
          Recent Sales
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Transaction History</SheetTitle>
          <SheetDescription>
            View recent sales, reprint receipts, or process refunds.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4 space-y-4">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by Invoice..." 
                    className="pl-9" 
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                    }}
                />
            </div>

            <div className="border rounded-md h-[calc(100vh-200px)] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <Skeleton className="h-4 w-[100px]" />
                                        <Skeleton className="h-3 w-[60px] mt-1" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-[120px]" />
                                        <Skeleton className="h-4 w-[60px] mt-1 rounded-full" />
                                    </TableCell>
                                    <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Skeleton className="h-8 w-8" />
                                            <Skeleton className="h-8 w-8" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : sales.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No transactions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-medium">
                                        {sale.invoiceNumber}
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(sale.createdAt).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {sale.patient?.name || 'Walk-in'}
                                        <div className="mt-1">
                                            <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                                {sale.status}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>{formatCurrency(sale.totalPrice)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8" 
                                                title="View Details"
                                                onClick={() => handleViewDetails(sale)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8" 
                                                title="Reprint Receipt"
                                                onClick={() => handleReprint(sale)}
                                            >
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-destructive hover:text-destructive" 
                                                title="Refund"
                                                onClick={() => handleRefund(sale)}
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
            
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                     <div className="flex gap-2">
                         <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                         >
                             <ChevronLeft className="h-4 w-4" />
                         </Button>
                         <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                         >
                             <ChevronRight className="h-4 w-4" />
                         </Button>
                     </div>
                </div>
            )}
        </div>
      </SheetContent>
    </Sheet>

    <CreateReturnDialog 
        open={returnDialogOpen} 
        onOpenChange={setReturnDialogOpen}
        sale={selectedSale}
        onSuccess={() => {
            fetchSales()
        }}
    />

    <SaleDetailsDialog
        sale={selectedSaleForDetails}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onSuccess={() => {
            fetchSales()
            setDetailsDialogOpen(false)
        }}
    />
    </>
  )
}
