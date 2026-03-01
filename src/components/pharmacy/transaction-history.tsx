"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { Sale, SaleReturn } from "@/types/pharmacy"
import { ChevronLeft, ChevronRight, Eye, Filter, History, Printer, RotateCcw, Search, ShoppingBag, ShoppingCart, X } from "lucide-react"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { toast } from "sonner"

import { CreateReturnDialog } from "@/components/pharmacy/pos/create-return-dialog"
import { ReceiptDialog } from "@/components/pharmacy/receipt-dialog"
import { SaleDetailsDialog } from "@/components/pharmacy/sale-details-dialog"
import { SaleReturnDetailsDialog } from "@/components/pharmacy/sale-return-details-dialog"

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
  const [returnDetailsDialogOpen, setReturnDetailsDialogOpen] = useState(false)
  const [selectedReturnForDetails, setSelectedReturnForDetails] = useState<SaleReturn | null>(null)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [selectedTransactionForReceipt, setSelectedTransactionForReceipt] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'sale' | 'purchase' | 'return'>('all')
  const [filters, setFilters] = useState<{
    dateRange: DateRange | undefined;
    status: string;
    paymentMethod: string;
  }>({
    dateRange: undefined,
    status: "all",
    paymentMethod: "all"
  })

  const activeFilterCount = (filters.status !== "all" ? 1 : 0) + 
                            (filters.paymentMethod !== "all" ? 1 : 0) +
                            (filters.dateRange ? 1 : 0)

  const fetchTransactions = async () => {
    if (!activeStoreId) return
    
    try {
        setLoading(true)
        
        const promises = []
        
        const baseParams: any = {
            branchId: activeStoreId,
            limit: 10,
            page,
            search: debouncedSearch || undefined,
            status: filters.status !== "all" ? filters.status : undefined,
            startDate: filters.dateRange?.from ? filters.dateRange.from.toISOString().split('T')[0] : undefined,
            endDate: filters.dateRange?.to ? filters.dateRange.to.toISOString().split('T')[0] : undefined,
            paymentMethod: filters.paymentMethod !== "all" ? filters.paymentMethod : undefined
        }
        
        if (activeTab === 'all' || activeTab === 'sale') {
            promises.push(pharmacyService.getSales(baseParams).then(res => ({ type: 'sale', data: res.data.sales, meta: res.data.pagination })))
        } else {
            promises.push(Promise.resolve({ type: 'sale', data: [], meta: { totalPages: 0 } }))
        }

        if (activeTab === 'all' || activeTab === 'purchase') {
            promises.push(pharmacyService.getPurchases(baseParams).then(res => ({ type: 'purchase', data: res.data.purchases, meta: res.data.pagination })))
        } else {
             promises.push(Promise.resolve({ type: 'purchase', data: [], meta: { totalPages: 0 } }))
        }

        if (activeTab === 'all' || activeTab === 'return') {
            promises.push(pharmacyService.getSaleReturns(baseParams).then(res => ({ type: 'return', data: res.data.data, meta: res.data.pagination })))
        } else {
             promises.push(Promise.resolve({ type: 'return', data: [], meta: { totalPages: 0 } }))
        }

        const results = await Promise.all(promises)
        // ... rest of fetchTransactions (mapping and state update)
        
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
    
    setSelectedTransactionForReceipt(tx.original)
    setReceiptDialogOpen(true)
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
    if (tx.type === 'sale') {
        setSelectedSaleForDetails(tx.original)
        setDetailsDialogOpen(true)
        return
    }
    if (tx.type === 'return') {
        setSelectedReturnForDetails(tx.original)
        setReturnDetailsDialogOpen(true)
        return
    }
    
    toast.info("Detailed Purchase view coming to POS soon. Please use Inventory module.")
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

            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by Invoice/PO..." 
                        className="pl-9 pr-9" 
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                    />
                    {search && (
                        <button 
                            className="absolute right-2.5 top-2.5"
                            onClick={() => setSearch("")}
                        >
                            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                    )}
                </div>
                
                <Popover>
                    <PopoverTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className={cn("h-10 px-3 gap-2", activeFilterCount > 0 && "bg-primary/5 border-primary text-primary")}
                        >
                            <Filter className="h-4 w-4" />
                            <span className="hidden sm:inline">Filters</span>
                            {activeFilterCount > 0 && (
                                <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                                    {activeFilterCount}
                                </Badge>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4" align="end">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium leading-none">Advanced Filters</h4>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setFilters({ dateRange: undefined, status: "all", paymentMethod: "all" })}
                                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
                                >
                                    <X className="h-3 w-3" />
                                    Reset
                                </Button>
                            </div>
                            
                            <div className="grid gap-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date Range</Label>
                                <DatePickerWithRange 
                                    date={filters.dateRange} 
                                    setDate={(range: DateRange | undefined) => setFilters(f => ({ ...f, dateRange: range }))}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
                                <Select 
                                    value={filters.status} 
                                    onValueChange={(val) => setFilters(f => ({ ...f, status: val }))}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Payment Method</Label>
                                <Select 
                                    value={filters.paymentMethod} 
                                    onValueChange={(val) => setFilters(f => ({ ...f, paymentMethod: val }))}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="All Methods" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Methods</SelectItem>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Card">Card</SelectItem>
                                        <SelectItem value="bKash">bKash</SelectItem>
                                        <SelectItem value="Nagad">Nagad</SelectItem>
                                        <SelectItem value="Rocket">Rocket</SelectItem>
                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
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
                                                disabled={tx.type === 'purchase'}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8" 
                                                title="Reprint Receipt"
                                                onClick={() => handleReprint(tx)}
                                                disabled={tx.type === 'purchase'}
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

    <SaleReturnDetailsDialog
        saleReturn={selectedReturnForDetails}
        open={returnDetailsDialogOpen}
        onOpenChange={setReturnDetailsDialogOpen}
    />

    <ReceiptDialog 
        open={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        transaction={selectedTransactionForReceipt}
    />
    </>
  )
}
