"use client"

import { DiagnosticReceiptDialog } from "@/components/billing/diagnostic-receipt-dialog"
import { ReceiptDialog } from "@/components/pharmacy/receipt-dialog"
import { SaleReturnDetailsDialog } from "@/components/pharmacy/sale-return-details-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useSaleReturns, useUpdateSaleReturnStatus } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { useStoreContext } from "@/store/use-store-context"
import { SaleReturn } from "@/types/sales"
import { format } from "date-fns"
import {
    CheckCircle2,
    Eye,
    Filter,
    Loader2,
    Printer,
    RefreshCcw,
    Search,
    X,
    XCircle
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { toast } from "sonner"

export default function SalesReturnsPage() {
  const router = useRouter()
  const { activeStoreId } = useStoreContext()
  const { formatCurrency } = useCurrency()
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 500)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>("all")
  const [paymentStatus, setPaymentStatus] = useState<string>("all")
  const [paymentMethod, setPaymentMethod] = useState<string>("all")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [createdBy, setCreatedBy] = useState("")
  const [isIndoorSale, setIsIndoorSale] = useState<string>("all")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const searchParams = useSearchParams()
  const urlType = searchParams.get('type')
  const [type, setType] = useState<string>(urlType === 'pharmacy' ? 'pos' : (urlType || "all"))

  // Sync with URL type if it changes
  useEffect(() => {
    if (urlType) {
        setType(urlType === 'pharmacy' ? 'pos' : urlType)
    }
  }, [urlType])

  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [selectedReturnForReceipt, setSelectedReturnForReceipt] = useState<SaleReturn | null>(null)
  const [selectedReturn, setSelectedReturn] = useState<SaleReturn | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const handleTypeChange = (value: string) => {
    setType(value)
    setPage(1)
    
    // Update URL to keep it as single source of truth
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('type')
    } else {
      params.set('type', value)
    }
    router.push(`/sales/returns?${params.toString()}`)
  }
  const limit = 10

  const activeFilterCount = (status !== "all" ? 1 : 0) + 
                            (paymentStatus !== "all" ? 1 : 0) + 
                            (paymentMethod !== "all" ? 1 : 0) +
                            (invoiceNumber ? 1 : 0) +
                            (createdBy ? 1 : 0) +
                            (isIndoorSale !== "all" ? 1 : 0) +
                            (minAmount ? 1 : 0) +
                            (maxAmount ? 1 : 0) +
                            (dateRange ? 1 : 0) +
                            (type !== 'all' ? 1 : 0)

  const { data: returnsRes, isLoading } = useSaleReturns({
    page,
    limit,
    status: status !== "all" ? (status as any) : undefined,
    paymentStatus: paymentStatus !== "all" ? (paymentStatus as any) : undefined,
    paymentMethod: paymentMethod !== "all" ? paymentMethod : undefined,
    invoiceNumber: invoiceNumber || undefined,
    createdBy: createdBy || undefined,
    isIndoorSale: isIndoorSale === "yes" ? true : isIndoorSale === "no" ? false : undefined,
    minAmount: minAmount ? Number(minAmount) : undefined,
    maxAmount: maxAmount ? Number(maxAmount) : undefined,
    startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    search: debouncedSearch || undefined,
    branchId: activeStoreId || undefined,
    type: type !== 'all' ? type : undefined
  })

  const updateStatus = useUpdateSaleReturnStatus()

  const returns = returnsRes?.data?.data || returnsRes?.data?.returns || []
  const pagination = returnsRes?.data?.pagination

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status })
      toast.success(`Return status updated to ${status}`)
    } catch (error) {
      toast.error("Failed to update status")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
            Sales Returns
          </h2>
          <p className="text-muted-foreground">
            Manage product returns and customer refunds.
          </p>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-orange-500" />
              Return Requests
            </CardTitle>
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoice or patient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-background/50 border-primary/20 focus:border-primary transition-all rounded-xl"
                />
              </div>

              <div className="w-full md:w-40">
                <Select value={type} onValueChange={handleTypeChange}>
                  <SelectTrigger className="h-10 rounded-xl bg-background/50 border-primary/20 text-xs font-medium">
                    <SelectValue placeholder="Return Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Return Type: All</SelectItem>
                    <SelectItem value="pos">Pharmacy (POS)</SelectItem>
                    <SelectItem value="hospital">Hospital Sales</SelectItem>
                    <SelectItem value="admission">Admission</SelectItem>
                    <SelectItem value="appointment">Appointment</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "rounded-xl gap-2",
                      activeFilterCount > 0 && "bg-primary/5 border-primary text-primary"
                    )}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
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
                      {activeFilterCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setStatus("all")
                            setPaymentStatus("all")
                            setPaymentMethod("all")
                            setInvoiceNumber("")
                            setCreatedBy("")
                            setIsIndoorSale("all")
                            setMinAmount("")
                            setMaxAmount("")
                            setDateRange(undefined)
                            setType(urlType === 'pharmacy' ? 'pos' : (urlType || "all"))
                          }}
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                        >
                          Reset
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2 col-span-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date Range</Label>
                        <DatePickerWithRange 
                          date={dateRange} 
                          setDate={setDateRange}
                          className="w-full"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Invoice Number</Label>
                        <Input 
                          placeholder="SALE-..."
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          className="h-9"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Created By</Label>
                        <Input 
                          placeholder="User name"
                          value={createdBy}
                          onChange={(e) => setCreatedBy(e.target.value)}
                          className="h-9"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Return Status</Label>
                        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Indoor Sale</Label>
                        <Select value={isIndoorSale} onValueChange={(v) => { setIsIndoorSale(v); setPage(1); }}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="yes">Indoor Only</SelectItem>
                            <SelectItem value="no">Outdoor Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Payment Status</Label>
                        <Select value={paymentStatus} onValueChange={(v) => { setPaymentStatus(v); setPage(1); }}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Payment Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="due">Due</SelectItem>
                            <SelectItem value="partial">Partial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Payment Method</Label>
                        <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); setPage(1); }}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="All Methods" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Methods</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="bKash">bKash</SelectItem>
                            <SelectItem value="Nagad">Nagad</SelectItem>
                            <SelectItem value="Rocket">Rocket</SelectItem>
                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Min Amount</Label>
                        <Input 
                          type="number"
                          placeholder="0.00"
                          value={minAmount}
                          onChange={(e) => setMinAmount(e.target.value)}
                          className="h-9"
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Max Amount</Label>
                        <Input 
                          type="number"
                          placeholder="999..."
                          value={maxAmount}
                          onChange={(e) => setMaxAmount(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {search && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearch("")
                    setPage(1)
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-primary/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    </TableCell>
                  </TableRow>
                ) : returns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No returns found.
                    </TableCell>
                  </TableRow>
                ) : (
                  returns.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-primary/5 transition-colors">
                      <TableCell className="font-medium">{item.invoiceNumber}</TableCell>
                      <TableCell>
                        {format(new Date(item.createdAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{item.patient?.name || "N/A"}</TableCell>
                      <TableCell className="font-bold text-orange-600">
                        {formatCurrency(item.transactions && item.transactions.length > 0 ? item.transactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0) : Number(item.totalPrice))}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={item.status === 'completed' ? 'success' : item.status === 'pending' ? 'warning' : 'destructive'}
                          className="capitalize"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-primary/20 hover:text-primary transition-all"
                              onClick={() => {
                                  setSelectedReturn(item)
                                  setDetailsDialogOpen(true)
                              }}
                           >
                              <Eye className="h-4 w-4" />
                           </Button>
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-primary/20 hover:text-primary transition-all"
                              onClick={() => {
                                  setSelectedReturnForReceipt(item)
                                  setReceiptOpen(true)
                              }}
                           >
                              <Printer className="h-4 w-4" />
                           </Button>
                           {item.status === 'pending' && (
                             <>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-emerald-500 hover:bg-emerald-500/20"
                                 onClick={() => handleStatusUpdate(item.id, 'completed')}
                               >
                                  <CheckCircle2 className="h-4 w-4" />
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 text-red-500 hover:bg-red-500/20"
                                 onClick={() => handleStatusUpdate(item.id, 'rejected')}
                               >
                                  <XCircle className="h-4 w-4" />
                               </Button>
                             </>
                           )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg"
              >
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {page} of {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="rounded-lg"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <SaleReturnDetailsDialog 
        saleReturn={selectedReturn}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
      
      {(selectedReturnForReceipt as any)?.sale?.type === 'pos' || (selectedReturnForReceipt as any)?.sale?.type === 'pharmacy' ? (
        <ReceiptDialog 
            open={receiptOpen}
            onOpenChange={setReceiptOpen}
            transaction={selectedReturnForReceipt as any}
        />
      ) : (
        <DiagnosticReceiptDialog 
            open={receiptOpen}
            onOpenChange={setReceiptOpen}
            transaction={selectedReturnForReceipt ? { 
                sale: selectedReturnForReceipt 
            } : null}
        />
      )}
    </div>
  )
}
