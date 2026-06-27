"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { DiagnosticReceiptDialog } from "@/components/billing/diagnostic-receipt-dialog"
import { ReceiptDialog } from "@/components/pharmacy/receipt-dialog"
import { SaleDetailsDialog } from "@/components/pharmacy/sale-details-dialog"
import { BulkDueCollectionDialog } from "@/components/finance/bulk-due-collection-dialog"
import { SearchableSelect } from "@/components/shared/searchable-select"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useSales } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { useEmployees } from "@/hooks/hr-queries"
import { usePatients } from "@/hooks/patient-queries"
import { Sale } from "@/types/sales"
import { format } from "date-fns"
import { DollarSign, Eye, FileText, Filter, Loader2, Search, ShoppingCart, X, Wallet } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { useAuthStore } from "@/store/use-auth-store"

export default function SalesHistoryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlPatientId = searchParams.get('patientId')
  
  const { formatCurrency } = useCurrency()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 500)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>("all")
  const [paymentStatus, setPaymentStatus] = useState<string>("all")
  const [paymentMethod, setPaymentMethod] = useState<string>("all")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [createdBy, setCreatedBy] = useState("")
  const [isIndoorSale, setIsIndoorSale] = useState<string>("all")
  const [minAmount, setMinAmount] = useState("")
  const [maxAmount, setMaxAmount] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const { user } = useAuthStore()
  const roleName = user?.role?.name?.toLowerCase() || ""
  const isPharmacist = roleName === "pharmacist"
  const isReceptionist = roleName === "receptionist"

  const urlType = searchParams.get('type')
  
  const [saleType, setSaleType] = useState<string>(() => {
    if (urlType) return urlType === 'pharmacy' ? 'pos' : urlType
    if (isPharmacist) return 'pos'
    if (isReceptionist) return 'hospital'
    return 'all'
  })

  // Enforce role-based restrictions even if URL changes
  useEffect(() => {
    if (isPharmacist && saleType !== 'pos') {
      setSaleType('pos')
    } else if (isReceptionist && saleType !== 'hospital') {
      setSaleType('hospital')
    }
  }, [isPharmacist, isReceptionist, saleType])

  // Sync with URL type if it changes and user is not restricted
  useEffect(() => {
    if (urlType && !isPharmacist && !isReceptionist) {
        const type = urlType === 'pharmacy' ? 'pos' : urlType
        setSaleType(type)
    }
  }, [urlType, isPharmacist, isReceptionist])

  const [branchId, setBranchId] = useState<string>("all")
  const [doctorId, setDoctorId] = useState<string>("all")
  const [staffId, setStaffId] = useState<string>("all")

  const [patientIdFilter, setPatientIdFilter] = useState<string | null>(urlPatientId)
  const limit = 10

  const handleTypeChange = (value: string) => {
    setSaleType(value)
    setPage(1)
    
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('type')
    } else {
      params.set('type', value)
    }
    router.push(`/sales?${params.toString()}`)
  }

  const activeFilterCount = (status !== "all" ? 1 : 0) + 
                            (paymentStatus !== "all" ? 1 : 0) + 
                            (paymentMethod !== "all" ? 1 : 0) +
                            (invoiceNumber ? 1 : 0) +
                            (createdBy ? 1 : 0) +
                            (isIndoorSale !== "all" ? 1 : 0) +
                            (minAmount ? 1 : 0) +
                            (maxAmount ? 1 : 0) +
                            (dateRange ? 1 : 0) +
                            (saleType !== "all" ? 1 : 0) +
                            (patientIdFilter ? 1 : 0) +
                            (branchId !== "all" ? 1 : 0) +
                            (doctorId !== "all" ? 1 : 0) +
                            (staffId !== "all" ? 1 : 0)

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [initialAddPayment, setInitialAddPayment] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDueDialogOpen, setBulkDueDialogOpen] = useState(false)

  const { data: salesRes, isLoading, refetch } = useSales({
    page,
    limit,
    status: status !== "all" ? (status as any) : undefined,
    paymentStatus: paymentStatus !== "all" ? (paymentStatus as any) : undefined,
    paymentMethod: paymentMethod !== "all" ? paymentMethod : undefined,
    invoiceNumber: invoiceNumber || undefined,
    createdBy: staffId !== "all" ? staffId : (createdBy || undefined),
    isIndoorSale: isIndoorSale === "yes" ? true : isIndoorSale === "no" ? false : undefined,
    minAmount: minAmount ? Number(minAmount) : undefined,
    maxAmount: maxAmount ? Number(maxAmount) : undefined,
    startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    search: debouncedSearch || undefined,
    patientId: patientIdFilter || undefined,
    type: saleType !== "all" ? saleType : undefined,
    branchId: branchId !== "all" ? branchId : undefined,
    doctorId: doctorId !== "all" ? doctorId : undefined
  })

  const { data: doctorsRes } = useEmployees({ 
    limit: 1000, 
    branchId: branchId !== "all" ? branchId : undefined 
  })
  const { data: staffsRes } = useEmployees({ 
    limit: 1000, 
    branchId: branchId !== "all" ? branchId : undefined 
  })
  const { data: patientsRes } = usePatients({ limit: 1000 })
  const { data: branchesRes } = useQuery({ 
    queryKey: ['pharmacy', 'branches', { limit: 100 }],
    queryFn: () => import("@/services/pharmacy-service").then(m => m.pharmacyService.getBranches({ limit: 100 }))
  })

  const sales = salesRes?.data?.sales || []
  const doctors = (doctorsRes?.data || []).filter((emp: any) => 
    emp.designation?.name?.toLowerCase().includes('doctor') || 
    emp.role?.name?.toLowerCase().includes('doctor')
  )
  const staffs = staffsRes?.data || []
  const patients = patientsRes?.data || []
  const branches = branchesRes?.data?.branches || []
  const pagination = salesRes?.data?.pagination

  // Selection Logic for Bulk Due Collection
  const validDueSales = sales.filter((s: Sale) => Number(s.dueAmount) > 0 && s.paymentStatus !== 'paid')

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === validDueSales.length) {
        setSelectedIds(new Set())
    } else {
        setSelectedIds(new Set(validDueSales.map((s: Sale) => s.id)))
    }
  }

  const selectedSales = sales.filter((s: Sale) => selectedIds.has(s.id))
  const selectedPatientIds = new Set(selectedSales.map((s: Sale) => s.patient?.id || s.patientId))
  const isSamePatient = selectedPatientIds.size <= 1
  const selectedTotalDue = selectedSales.reduce((sum: number, s: Sale) => sum + Number(s.dueAmount || 0), 0)
  const bulkPatientName = selectedSales[0]?.patient?.name || "Patient"

  return (
    <PermissionGuard permission="sale:read">
        <div className="space-y-6 animate-in fade-in-50 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                Sale History
              </h2>
              <p className="text-muted-foreground">
                Track and manage all your sales transactions in real-time.
              </p>
            </div>
          </div>

          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  All Sales Records
                </CardTitle>
                <div className="flex flex-col md:flex-row items-center gap-3">
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search invoice, phone, or patient ID..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-10 bg-background/50 border-primary/20 focus:border-primary transition-all rounded-xl"
                    />
                  </div>

                  {(!isPharmacist && !isReceptionist) && (
                    <div className="w-full md:w-40">
                      <Select value={saleType} onValueChange={handleTypeChange}>
                        <SelectTrigger className="h-10 rounded-xl bg-background/50 border-primary/20 text-xs font-medium">
                          <SelectValue placeholder="Sale Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Sale Type: All</SelectItem>
                          <SelectItem value="pos">Pharmacy (POS)</SelectItem>
                          <SelectItem value="hospital">Hospital Sales</SelectItem>
                          <SelectItem value="admission">Admission</SelectItem>
                          <SelectItem value="appointment">Appointment</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

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
                    <PopoverContent className="w-[450px] p-6 shadow-2xl rounded-2xl border-primary/20 bg-background/95 backdrop-blur-xl" align="end">
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
                                setStaffId("all")
                                setBranchId("all")
                                setDoctorId("all")
                                setIsIndoorSale("all")
                                setMinAmount("")
                                setMaxAmount("")
                                setDateRange(undefined)
                                setSaleType(() => {
                                  if (isPharmacist) return 'pos'
                                  if (isReceptionist) return 'hospital'
                                  if (urlType) return urlType === 'pharmacy' ? 'pos' : urlType
                                  return 'all'
                                })
                                setPatientIdFilter(null)
                              }}
                              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                            >
                              Reset
                            </Button>
                          )}
                        </div>
 
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="grid gap-2 col-span-2 md:col-span-3">
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date Range</Label>
                            <DatePickerWithRange 
                              date={dateRange} 
                              setDate={setDateRange}
                              className="w-full"
                            />
                          </div>
 
                          <div className="grid gap-2">
                             <Label className="text-xs uppercase tracking-wider text-muted-foreground">Branch</Label>
                             <Select value={branchId} onValueChange={(v) => { setBranchId(v); setPage(1); }}>
                               <SelectTrigger className="h-9">
                                 <SelectValue placeholder="All Branches" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="all">All Branches</SelectItem>
                                 {branches.map((b: any) => (
                                   <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           </div>

                           <div className="grid gap-2">
                             <Label className="text-xs uppercase tracking-wider text-muted-foreground">Doctor</Label>
                             <Select value={doctorId} onValueChange={(v) => { setDoctorId(v); setPage(1); }}>
                               <SelectTrigger className="h-9">
                                 <SelectValue placeholder="All Doctors" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="all">All Doctors</SelectItem>
                                 {doctors.map((d: any) => (
                                   <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           </div>

                           <div className="grid gap-2">
                             <Label className="text-xs uppercase tracking-wider text-muted-foreground">Staff / Casher</Label>
                             <Select value={staffId} onValueChange={(v) => { setStaffId(v); setPage(1); }}>
                               <SelectTrigger className="h-9">
                                 <SelectValue placeholder="All Staff" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="all">All Staff</SelectItem>
                                 {staffs.map((s: any) => (
                                   <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           </div>

                           <div className="grid gap-2">
                             <Label className="text-xs uppercase tracking-wider text-muted-foreground">Patient</Label>
                             <SearchableSelect
                               value={patientIdFilter || ""}
                               onChange={(v) => { setPatientIdFilter(v || null); setPage(1); }}
                               options={patients.map((p: any) => ({
                                 id: p.id,
                                 name: `${p.patientNumber ? `[${p.patientNumber}] ` : ''}${p.name} ${p.phone ? `(${p.phone})` : ''}`
                               }))}
                               placeholder="Search patient..."
                               allLabel="All Patients"
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
                            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Sale Status</Label>
                            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="returned">Returned</SelectItem>
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

                  {selectedSales.length > 0 && (
                      <Button
                          onClick={() => setBulkDueDialogOpen(true)}
                          disabled={!isSamePatient}
                          className="gap-2 h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 bg-emerald-600 hover:bg-emerald-700"
                      >
                          <Wallet className="h-4 w-4" />
                          Pay Dues {formatCurrency(selectedTotalDue)} ({selectedSales.length})
                      </Button>
                  )}
                </div>
              </div>
              {selectedSales.length > 0 && !isSamePatient && (
                  <p className="text-xs text-destructive font-bold mt-2">
                      ⚠ Selected bills must belong to the same patient to process bulk payment.
                  </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-primary/10 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-12 pl-4">
                          <Checkbox
                              checked={validDueSales.length > 0 && selectedIds.size === validDueSales.length}
                              onCheckedChange={toggleAll}
                              disabled={validDueSales.length === 0}
                          />
                      </TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                        </TableCell>
                      </TableRow>
                    ) : sales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                          No sales found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sales.map((sale) => (
                        <TableRow 
                          key={sale.id} 
                          className={cn(
                            "group transition-colors font-medium",
                            (sale.paymentStatus === 'due' || (Number(sale.dueAmount) > 0 && sale.paymentStatus !== 'paid'))
                              ? "text-rose-500 font-bold hover:bg-rose-500/5" 
                              : "hover:bg-primary/5"
                          )}
                        >
                          <TableCell className="pl-4">
                              <Checkbox
                                  checked={selectedIds.has(sale.id)}
                                  onCheckedChange={() => toggleSelect(sale.id)}
                                  disabled={Number(sale.dueAmount) <= 0 || sale.paymentStatus === 'paid'}
                              />
                          </TableCell>
                          <TableCell className="font-medium">{sale.invoiceNumber}</TableCell>
                          <TableCell>
                            {format(new Date(sale.createdAt), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "capitalize text-[10px] font-bold",
                                sale.type === 'pos' ? "bg-blue-50 text-blue-600 border-blue-200" :
                                sale.type === 'hospital' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                sale.type === 'appointment' ? "bg-orange-50 text-orange-600 border-orange-200" :
                                sale.type === 'pathology' ? "bg-purple-50 text-purple-600 border-purple-200" :
                                sale.type === 'radiology' ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                                sale.type === 'admission' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                sale.type === 'others' ? "bg-rose-50 text-rose-600 border-rose-200" :
                                "bg-gray-50 text-gray-600 border-gray-200"
                              )}
                            >
                              {sale.type || 'General'}
                            </Badge>
                          </TableCell>
                          <TableCell>{sale.patient?.name || "Walk-in"}</TableCell>
                          <TableCell className="font-bold text-primary">
                            {formatCurrency(Number(sale.netPrice || sale.totalPrice))}
                          </TableCell>
                          <TableCell className="text-emerald-600 font-medium">
                            {formatCurrency(Number(sale.paidAmount || 0))}
                          </TableCell>
                          <TableCell className={cn(
                            "font-bold",
                            Number(sale.dueAmount) > 0 ? "text-red-600" : "text-muted-foreground"
                          )}>
                            {formatCurrency(Number(sale.dueAmount || 0))}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={sale.status === 'completed' ? 'success' : sale.status === 'pending' ? 'warning' : 'destructive'}
                              className="capitalize"
                            >
                              {sale.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline"
                              className={cn(
                                "capitalize border-none px-2 py-0.5",
                                sale.paymentStatus === 'paid' 
                                  ? "text-emerald-500 bg-emerald-500/10" 
                                  : sale.paymentStatus === 'partial'
                                  ? "text-amber-500 bg-amber-500/10"
                                  : "text-red-500 bg-red-500/10"
                              )}
                            >
                              {sale.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 hover:bg-primary/20 hover:text-primary transition-all"
                                 onClick={() => {
                                    setSelectedSale(sale)
                                    setInitialAddPayment(false)
                                    setDetailsOpen(true)
                                 }}
                               >
                                  <Eye className="h-4 w-4" />
                               </Button>
                               {Number(sale.dueAmount) > 0 && (
                                 <Button 
                                   variant="ghost" 
                                   size="icon" 
                                   className="h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100"
                                   title="Collect Payment"
                                   onClick={() => {
                                      setSelectedSale(sale)
                                      setInitialAddPayment(true)
                                      setDetailsOpen(true)
                                   }}
                                 >
                                    <DollarSign className="h-4 w-4" />
                                 </Button>
                               )}
                               <Button 
                                 variant="ghost" 
                                 size="icon" 
                                 className="h-8 w-8 hover:bg-blue-500/20 hover:text-blue-500 transition-all"
                                 onClick={() => {
                                    setSelectedSale(sale)
                                    setReceiptOpen(true)
                                 }}
                               >
                                  <FileText className="h-4 w-4" />
                               </Button>
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

          <SaleDetailsDialog 
            sale={selectedSale}
            open={detailsOpen}
            onOpenChange={setDetailsOpen}
            onSuccess={() => refetch()}
            initialAddPayment={initialAddPayment}
          />

          {selectedSale?.type === 'pos' ? (
            <ReceiptDialog 
                open={receiptOpen}
                onOpenChange={setReceiptOpen}
                transaction={selectedSale ? {
                    id: selectedSale.id,
                    customerName: selectedSale.patient?.name || 'Walk-in',
                    items: (selectedSale.saleItems || []).map(item => ({
                        id: item.medicineId || '',
                        name: item.itemName || 'Unknown Item',
                        price: Number(item.price),
                        quantity: Number(item.quantity),
                        batchNumber: item.batchNumber,
                        discountPercentage: Number(item.discountPercentage || 0),
                        discountAmount: Number(item.discountAmount || 0),
                        dosageForm: item.unit // mapping unit to dosageForm as fallback
                    })),
                    total: Number(selectedSale.totalPrice),
                    subtotal: Number(selectedSale.netPrice || selectedSale.totalPrice),
                    tax: Number(selectedSale.taxAmount || 0),
                    taxPercentage: Number(selectedSale.taxPercentage || 0),
                    discount: Number(selectedSale.discountPercentage || 0),
                    discountAmount: Number(selectedSale.discountAmount || 0),
                    paidAmount: Number(selectedSale.paidAmount || 0),
                    dueAmount: Number(selectedSale.dueAmount || 0),
                    date: selectedSale.createdAt,
                    status: selectedSale.status === 'completed' ? 'Completed' : 'Refunded',
                    paymentMethod: (selectedSale.paymentMethod as any) || 'cash',
                    invoiceNumber: selectedSale.invoiceNumber
                } as any : null}
            />
          ) : (
            <DiagnosticReceiptDialog 
                open={receiptOpen}
                onOpenChange={setReceiptOpen}
                transaction={selectedSale ? { sale: selectedSale } : null}
                doctors={doctors}
                staffs={staffs}
            />
          )}

          <BulkDueCollectionDialog
             open={bulkDueDialogOpen}
             onOpenChange={setBulkDueDialogOpen}
             sales={selectedSales}
             patientName={bulkPatientName}
             onSuccess={() => {
                 setSelectedIds(new Set())
                 refetch()
             }}
          />
        </div>
    </PermissionGuard>
  )
}
