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
import { cn } from "@/lib/utils"
import { pharmacyService } from "@/services/pharmacy-service"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { Sale } from "@/types/pharmacy"
import { ChevronLeft, ChevronRight, Eye, History, Printer, RotateCcw, Search, ShoppingBag, ShoppingCart } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { CreateReturnDialog } from "@/components/pharmacy/pos/create-return-dialog"
import { SaleDetailsDialog } from "@/components/pharmacy/sale-details-dialog"

type UnifiedTransaction = {
    id: string;
    type: 'sale' | 'purchase' | 'return';
    number: string;
    party: string;
    total: number;
    status: string;
    date: string;
    original: any;
}

export function TransactionHistory() {
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 500)
  const { formatCurrency } = useCurrency()
  const { general } = useSettingsStore()
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { activeStoreId } = useStoreContext()
  const [isOpen, setIsOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'sale' | 'purchase' | 'return'>('all')

  const fetchTransactions = async () => {
    if (!activeStoreId) return
    
    try {
        setLoading(true)
        
        // Prepare promises based on active tab or fetch all
        // Note: For "All" we fetch everything and merge. Ideally backend should support unified history.
        const promises = []
        
        if (activeTab === 'all' || activeTab === 'sale') {
            promises.push(pharmacyService.getSales({
                branchId: activeStoreId,
                limit: 10,
                page,
                search: debouncedSearch
            }).then(res => ({ type: 'sale', data: res.data.sales, meta: res.data.pagination })))
        } else {
            promises.push(Promise.resolve({ type: 'sale', data: [], meta: { totalPages: 0 } }))
        }

        if (activeTab === 'all' || activeTab === 'purchase') {
            promises.push(pharmacyService.getPurchases({
                branchId: activeStoreId,
                limit: 10,
                page,
                search: debouncedSearch // Backend might not support search yet for POs same way, but let's pass it
            }).then(res => ({ type: 'purchase', data: res.data.purchases, meta: res.data.pagination })))
        } else {
             promises.push(Promise.resolve({ type: 'purchase', data: [], meta: { totalPages: 0 } }))
        }

        if (activeTab === 'all' || activeTab === 'return') {
            // Note: Search for returns might need specific implementation if not supported by getSaleReturns generic 'params'
            promises.push(pharmacyService.getSaleReturns({
                branchId: activeStoreId,
                limit: 10,
                page,
            }).then(res => ({ type: 'return', data: res.data.saleReturns, meta: res.data.pagination })))
        } else {
             promises.push(Promise.resolve({ type: 'return', data: [], meta: { totalPages: 0 } }))
        }

        const results = await Promise.all(promises)
        
        const salesData = results.find(r => r.type === 'sale')
        const purchasesData = results.find(r => r.type === 'purchase')
        const returnsData = results.find(r => r.type === 'return')

        const formattedSales: UnifiedTransaction[] = (salesData?.data || []).map((s: any) => ({
            id: s.id,
            type: 'sale',
            number: s.invoiceNumber,
            party: s.patient?.name || 'Walk-in',
            total: Number(s.netPrice || s.totalPrice || 0),
            status: s.status,
            date: s.createdAt,
            original: s
        }))

        const formattedPurchases: UnifiedTransaction[] = (purchasesData?.data || []).map((p: any) => ({
            id: p.id,
            type: 'purchase',
            number: p.poNumber || 'PO-N/A',
            party: p.supplier?.name || 'Unknown Supplier',
            total: Number(p.netPrice || p.totalPrice || 0),
            status: p.status,
            date: p.createdAt,
            original: p
        }))

        const formattedReturns: UnifiedTransaction[] = (returnsData?.data || []).map((r: any) => ({
            id: r.id,
            type: 'return',
            number: r.invoiceNumber,
            party: r.patient?.name || 'Walk-in',
            total: Number(r.netPrice || r.totalPrice || 0),
            status: r.status,
            date: r.createdAt,
            original: r
        }))

        const combined = [...formattedSales, ...formattedPurchases, ...formattedReturns]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        
        setTransactions(combined)
        
        const maxPages = Math.max(
            salesData?.meta?.totalPages || 1,
            purchasesData?.meta?.totalPages || 1,
            returnsData?.meta?.totalPages || 1
        )
        setTotalPages(maxPages)

    } catch (error) {
        console.error("Failed to fetch transactions", error)
        toast.error("Failed to load transaction history")
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && activeStoreId) {
        fetchTransactions()
    }
  }, [isOpen, activeStoreId, debouncedSearch, page, activeTab])

  const handleReprint = (tx: UnifiedTransaction) => {
    if (tx.type === 'return') {
        toast.info("Return receipt printing coming soon")
        return
    }
    if (tx.type !== 'sale') {
        toast.info("Purchase order printing integration coming soon")
        return
    }
    const sale = tx.original as Sale
    
    // Calculate totals matching ReceiptDialog logic
    const grossTotal = sale.saleItems.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0)
    const totalItemDiscount = sale.saleItems.reduce((sum, item) => {
        const itemSubtotal = Number(item.price) * Number(item.quantity)
        return sum + (Number(item.discountAmount) || (Number(item.discountPercentage) ? (itemSubtotal * Number(item.discountPercentage)) / 100 : 0))
    }, 0)
    
    const receiptWindow = window.open('', '_blank', 'width=450,height=600');
    if (receiptWindow) {
        receiptWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Receipt ${sale.invoiceNumber}</title>
                    <style>
                        @page { size: 80mm auto; margin: 0; }
                        body { 
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; 
                            width: 80mm; margin: 0; padding: 10px; color: black; background: white;
                            font-size: 10px; line-height: 1.2;
                        }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .bold { font-weight: bold; }
                        .uppercase { text-transform: uppercase; }
                        .separator { border-top: 1px solid #e5e7eb; margin: 8px 0; }
                        .separator-dashed { border-top: 1px dashed #e5e7eb; margin: 8px 0; }
                        .header h2 { font-size: 16px; margin: 0; }
                        .header p { font-size: 9px; margin: 2px 0; color: #4b5563; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 9px; }
                        .items-table { width: 100%; border-collapse: collapse; }
                        .items-header { border-bottom: 1px solid #e5e7eb; font-weight: bold; font-size: 8px; }
                        .items-header td { padding-bottom: 4px; }
                        .item-row td { padding: 4px 0; vertical-align: top; }
                        .totals-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                        .paid-row { font-weight: bold; margin-top: 4px; }
                        .footer { margin-top: 15px; text-align: center; font-size: 8px; color: #6b7280; }
                    </style>
                </head>
                <body>
                    <div class="header text-center">
                        <h2 class="bold uppercase">${general?.hospitalName || "MediCare Pharmacy"}</h2>
                        <p class="bold">${sale.branch?.name || 'Main Branch'}</p>
                        <p>${general?.address || "Hospital Road, Dhaka"}</p>
                    </div>

                    <div class="separator"></div>

                    <div class="info-grid">
                        <div>
                            <span style="color:#6b7280">Patient:</span><br/>
                            <span class="bold uppercase">${sale.patient?.name || 'Walk-in'}</span>
                        </div>
                        <div class="text-right">
                            <span style="color:#6b7280">Invoice #:</span> <span class="bold">${sale.invoiceNumber}</span><br/>
                            <span style="color:#6b7280">Date:</span> <span class="bold">${new Date(sale.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div class="separator-dashed"></div>

                    <table class="items-table">
                        <thead>
                            <tr class="items-header uppercase">
                                <td style="width:45%">Item</td>
                                <td class="text-center" style="width:15%">Qty</td>
                                <td class="text-right" style="width:15%">Rate</td>
                                <td class="text-right" style="width:25%">Amt</td>
                            </tr>
                        </thead>
                        <tbody>
                            ${(sale.saleItems || []).map(item => {
                                const itemTotal = Number(item.price) * Number(item.quantity)
                                const itemDisc = Number(item.discountAmount) || (Number(item.discountPercentage) ? (itemTotal * Number(item.discountPercentage)) / 100 : 0)
                                const netItemTotal = itemTotal - itemDisc
                                return `
                                    <tr class="item-row">
                                        <td>
                                            <span class="bold">${item.itemName}</span>
                                            ${item.dosageForm ? `<span style="font-size:8px; color:#6b7280"> (${item.dosageForm})</span>` : ''}
                                            ${item.batchNumber ? `<br/><span style="font-size:7px; color:#9ca3af">B: ${item.batchNumber}</span>` : ''}
                                        </td>
                                        <td class="text-center">${item.quantity}</td>
                                        <td class="text-right">${Number(item.price).toFixed(2)}</td>
                                        <td class="text-right bold">${formatCurrency(netItemTotal)}</td>
                                    </tr>
                                `
                            }).join('')}
                        </tbody>
                    </table>

                    <div class="separator-dashed"></div>

                    <div class="totals-section">
                        <div class="totals-row">
                            <span>Gross Total</span>
                            <span>${formatCurrency(grossTotal)}</span>
                        </div>
                        ${(totalItemDiscount + (Number(sale.discountAmount) || 0)) > 0 ? `
                            <div class="totals-row" style="color:#4b5563">
                                <span>Total Discount</span>
                                <span>-${formatCurrency(totalItemDiscount + (Number(sale.discountAmount) || 0))}</span>
                            </div>
                        ` : ''}
                        ${Number(sale.taxAmount) > 0 ? `
                            <div class="totals-row" style="color:#4b5563">
                                <span>VAT (${sale.taxPercentage}%)</span>
                                <span>+${formatCurrency(Number(sale.taxAmount))}</span>
                            </div>
                        ` : ''}
                        
                        <div class="separator" style="margin:4px 0"></div>
                        
                        <div class="totals-row bold" style="font-size:12px">
                            <span>Net Payable</span>
                            <span>${formatCurrency(Number(sale.netPrice || sale.totalPrice))}</span>
                        </div>
                        
                        <div class="totals-row paid-row">
                            <span>Paid Amount</span>
                            <span>${formatCurrency(Number(sale.paidAmount || 0))}</span>
                        </div>

                        ${Number(sale.dueAmount) > 0 ? `
                            <div class="totals-row bold" style="color:#dc2626">
                                <span>Due Amount</span>
                                <span>${formatCurrency(Number(sale.dueAmount))}</span>
                            </div>
                        ` : `
                            <div class="totals-row" style="color:#4b5563">
                                <span>Change Return</span>
                                <span>${formatCurrency(Math.max(0, Number(sale.paidAmount || 0) - Number(sale.netPrice || sale.totalPrice)))}</span>
                            </div>
                        `}
                    </div>

                    <div class="separator"></div>

                    <div class="footer">
                        <p>Thank you for visiting ${general?.hospitalName || "MediCare Pharmacy"}!</p>
                        <p style="font-style:italic">Note: Medicines once sold cannot be returned without receipt.</p>
                        <div style="margin-top:20px; border-top:1px solid #e5e7eb; width:50%; margin-left:25%; padding-top:4px">
                            Authorized Signatory
                        </div>
                    </div>

                    <script>
                        window.addEventListener('load', function() {
                            setTimeout(function() {
                                window.print();
                                setTimeout(function() { window.close(); }, 500);
                            }, 500);
                        });
                    </script>
                </body>
            </html>
        `);
        receiptWindow.document.close();
    } else {
        toast.error("Popup blocked. Please allow popups to print receipts.");
    }
  }

  const handleRefund = (tx: UnifiedTransaction) => {
    if (tx.type !== 'sale') {
        toast.info("Purchase returns are managed in the Inventory module")
        return
    }
    setSelectedSale(tx.original)
    setReturnDialogOpen(true)
  }

  const handleViewDetails = (tx: UnifiedTransaction) => {
    if (tx.type !== 'sale') {
        toast.info("Detailed Purchase view coming to POS soon. Please use Inventory module.")
        return
    }
    setSelectedSaleForDetails(tx.original)
    setDetailsDialogOpen(true)
  }

  return (
    <>
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <History className="mr-2 h-4 w-4" />
          Register History
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-none sm:w-[50vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Transaction History</SheetTitle>
          <SheetDescription>
            View latest sales and purchases recorded in the system.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4 space-y-4">
            <div className="flex items-center gap-2">
                <Button 
                    variant={activeTab === 'all' ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => { setActiveTab('all'); setPage(1); }}
                    className="h-7 text-xs"
                >
                    All
                </Button>
                <Button 
                    variant={activeTab === 'sale' ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => { setActiveTab('sale'); setPage(1); }}
                    className="h-7 text-xs"
                >
                    Sales
                </Button>
                <Button 
                    variant={activeTab === 'return' ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => { setActiveTab('return'); setPage(1); }}
                    className="h-7 text-xs"
                >
                    Returns
                </Button>
                <Button 
                    variant={activeTab === 'purchase' ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => { setActiveTab('purchase'); setPage(1); }}
                    className="h-7 text-xs"
                >
                    Purchases
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by Invoice/PO..." 
                    className="pl-9" 
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                    }}
                />
            </div>

            <div className="border rounded-md h-[calc(100vh-240px)] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type/ID</TableHead>
                            <TableHead>Party</TableHead>
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
                        ) : transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No transactions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((tx) => (
                                <TableRow key={`${tx.type}-${tx.id}`}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {tx.type === 'sale' && <ShoppingCart className="h-3 w-3 text-emerald-500" />}
                                            {tx.type === 'purchase' && <ShoppingBag className="h-3 w-3 text-orange-500" />}
                                            {tx.type === 'return' && <RotateCcw className="h-3 w-3 text-red-500" />}
                                            {tx.number}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(tx.date).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {tx.party}
                                        <div className="mt-1">
                                            <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'} className={cn(
                                                "text-[10px] h-5 capitalize",
                                                tx.type === 'purchase' && tx.status === 'completed' && "bg-orange-500 hover:bg-orange-600",
                                                tx.type === 'return' && "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                            )}>
                                                {tx.type}: {tx.status}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className={cn(
                                        "font-semibold",
                                        tx.type === 'sale' ? "text-emerald-600" : 
                                        tx.type === 'purchase' ? "text-orange-600" :
                                        "text-red-600" // return
                                    )}>
                                        {tx.type === 'sale' ? '+' : '-'}{formatCurrency(tx.total)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8" 
                                                title="View Details"
                                                onClick={() => handleViewDetails(tx)}
                                                disabled={tx.type !== 'sale'}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8" 
                                                title="Reprint Receipt"
                                                onClick={() => handleReprint(tx)}
                                                disabled={tx.type !== 'sale'}
                                            >
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-destructive hover:text-destructive" 
                                                title="Refund"
                                                onClick={() => handleRefund(tx)}
                                                disabled={tx.type !== 'sale'}
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
                            onClick={() => {
                                setPage(p => Math.max(1, p - 1))
                                fetchTransactions()
                            }}
                            disabled={page === 1 || loading}
                         >
                             <ChevronLeft className="h-4 w-4" />
                         </Button>
                         <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                                setPage(p => Math.min(totalPages, p + 1))
                                fetchTransactions()
                            }}
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
            fetchTransactions()
        }}
    />

    <SaleDetailsDialog
        sale={selectedSaleForDetails}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onSuccess={() => {
            fetchTransactions()
            setDetailsDialogOpen(false)
        }}
    />
    </>
  )
}
