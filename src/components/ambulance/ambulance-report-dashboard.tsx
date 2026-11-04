"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAmbulances } from "@/hooks/ambulance-queries"
import { useDebounce } from "@/hooks/use-debounce"
import { useCurrency } from "@/hooks/use-currency"
import { useAmbulanceReport } from "@/hooks/report-queries"
import { useStoreContext } from "@/store/use-store-context"
import { Ambulance as AmbulanceRecord } from "@/types/ambulance"
import { endOfDay, format, startOfMonth } from "date-fns"
import { Ambulance as AmbulanceIcon, CalendarDays, Printer, Search, Truck } from "lucide-react"
import { useState, type ReactNode } from "react"
import { DateRange } from "react-day-picker"
import { AmbulanceReportPrint } from "./ambulance-report-print"

const ALL = "all"

export function AmbulanceReportDashboard() {
  const { activeStoreId, stores } = useStoreContext()
  const { formatCurrency } = useCurrency()
  const [date, setDate] = useState<DateRange | undefined>({ from: startOfMonth(new Date()), to: endOfDay(new Date()) })
  const [search, setSearch] = useState("")
  const [ambulanceId, setAmbulanceId] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [paymentStatus, setPaymentStatus] = useState(ALL)
  const [page, setPage] = useState(1)
  const [debouncedSearch] = useDebounce(search, 300)

  const { data: ambulanceData } = useAmbulances({ branchId: activeStoreId || undefined, limit: 100 })
  const { data, isLoading } = useAmbulanceReport({
    branchId: activeStoreId || undefined,
    startDate: date?.from?.toISOString(),
    endDate: date?.to ? endOfDay(date.to).toISOString() : undefined,
    ambulanceId: ambulanceId === ALL ? undefined : ambulanceId,
    status: status === ALL ? undefined : status as "pending" | "confirmed" | "cancelled" | "completed",
    paymentStatus: paymentStatus === ALL ? undefined : paymentStatus as "due" | "partial" | "paid",
    search: debouncedSearch || undefined,
    page,
    limit: 20,
  })

  const report = data?.data
  const summary = report?.summary
  const ambulancePayload = ambulanceData?.data
  const ambulances: AmbulanceRecord[] = Array.isArray(ambulancePayload)
    ? ambulancePayload
    : ((ambulancePayload as unknown as { ambulances?: AmbulanceRecord[] } | undefined)?.ambulances || [])
  const bookings = Array.isArray(report?.bookings) ? report.bookings : []
  const printableReport = report ? { ...report, bookings } : undefined
  const updateFilter = (setter: (value: string) => void, value: string) => { setter(value); setPage(1) }

  const handlePrintReport = () => {
    if (!printableReport || !date?.from || !date.to) return
    const printContent = document.getElementById("ambulance-report-print-content")?.innerHTML
    if (!printContent) return

    const iframe = document.createElement("iframe")
    iframe.style.cssText = "position:fixed;width:100vw;height:100vh;left:-100vw;top:-100vh;border:none;"
    document.body.appendChild(iframe)
    const iframeDoc = iframe.contentWindow?.document
    if (!iframeDoc) return

    iframeDoc.open()
    iframeDoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ambulance Service Report</title>${Array.from(document.querySelectorAll("link[rel='stylesheet'], style")).map((element) => element.outerHTML).join("\n")}<style>@page{size:A4;margin:0}body{background:#fff!important;margin:0;padding:0;font-family:sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;display:flex;justify-content:center}.print-container{width:210mm;min-height:297mm;padding:10mm;box-sizing:border-box}*{overflow:visible!important}::-webkit-scrollbar{display:none!important}table{font-size:10px!important;border-collapse:collapse!important;width:100%!important;border:1px solid #000!important}th,td{border:1px solid #000!important;padding:4px!important;color:#000!important}</style></head><body><div class="print-container">${printContent}</div></body></html>`)
    iframeDoc.close()
    window.setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      window.setTimeout(() => document.body.removeChild(iframe), 1000)
    }, 500)
  }

  if (isLoading) return <div className="space-y-6"><div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28" />)}</div><Skeleton className="h-96" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-3xl font-bold tracking-tight">Ambulance Report</h2><p className="text-muted-foreground">Track ambulance bookings, collections, and outstanding dues.</p></div><Button onClick={handlePrintReport} disabled={!printableReport} className="gap-2"><Printer className="h-4 w-4" /> Print / PDF</Button></div>
      <Card><CardContent className="flex flex-wrap items-center gap-4 p-4">
        <div className="w-full sm:w-[18rem] xl:w-[24rem]"><DatePickerWithRange date={date} setDate={(value) => { setDate(value); setPage(1) }} /></div>
        <div className="w-full sm:w-[11rem]"><Select value={ambulanceId} onValueChange={(value) => updateFilter(setAmbulanceId, value)}><SelectTrigger><Truck className="mr-2 h-4 w-4" /><SelectValue placeholder="All vehicles" /></SelectTrigger><SelectContent><SelectItem value={ALL}>All vehicles</SelectItem>{ambulances.map((ambulance) => <SelectItem key={ambulance.id} value={ambulance.id}>{ambulance.vehicleNumber}</SelectItem>)}</SelectContent></Select></div>
        <div className="w-full sm:w-[11rem]"><Select value={status} onValueChange={(value) => updateFilter(setStatus, value)}><SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value={ALL}>All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select></div>
        <div className="w-full sm:w-[11rem]"><Select value={paymentStatus} onValueChange={(value) => updateFilter(setPaymentStatus, value)}><SelectTrigger><SelectValue placeholder="All payments" /></SelectTrigger><SelectContent><SelectItem value={ALL}>All payments</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="partial">Partial</SelectItem><SelectItem value="due">Due</SelectItem></SelectContent></Select></div>
        <div className="relative w-full sm:w-[11rem]"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Patient, phone, route..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></div>
      </CardContent></Card>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Bookings" value={summary?.bookingCount || 0} icon={<CalendarDays className="h-4 w-4" />} />
        <SummaryCard label="Net Fare" value={formatCurrency(summary?.netFare || 0)} icon={<AmbulanceIcon className="h-4 w-4" />} />
        <SummaryCard label="Collected in Period" value={formatCurrency(summary?.collectedInPeriod || 0)} icon={<CalendarDays className="h-4 w-4" />} />
        <SummaryCard label="Outstanding Due" value={formatCurrency(summary?.outstandingDue || 0)} icon={<CalendarDays className="h-4 w-4" />} />
      </div>
      <Card><CardHeader><CardTitle>Booking Details</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Patient & Contact</TableHead><TableHead>Vehicle</TableHead><TableHead>Route</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Net Fare</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Due</TableHead></TableRow></TableHeader><TableBody>{!bookings.length ? <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No bookings found.</TableCell></TableRow> : bookings.map((booking) => <TableRow key={booking.id}><TableCell className="whitespace-nowrap">{format(new Date(booking.createdAt), "dd MMM yyyy")}</TableCell><TableCell><div className="font-medium">{booking.patientName}</div><div className="text-xs text-muted-foreground">{booking.guardianPhone || "—"}</div></TableCell><TableCell>{booking.ambulance?.vehicleNumber || "—"}</TableCell><TableCell className="max-w-56 truncate">{booking.pickupLocation} → {booking.dropoffLocation}</TableCell><TableCell className="capitalize">{booking.status}</TableCell><TableCell className="text-right">{formatCurrency(Number(booking.netFare))}</TableCell><TableCell className="text-right text-emerald-600">{formatCurrency(Number(booking.paidAmount))}</TableCell><TableCell className="text-right text-rose-600">{formatCurrency(Number(booking.dueAmount))}</TableCell></TableRow>)}</TableBody></Table></div>{report?.pagination && report.pagination.totalPages > 1 && <div className="mt-4 flex items-center justify-end gap-3"><span className="text-sm text-muted-foreground">Page {report.pagination.page} of {report.pagination.totalPages}</span><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page >= report.pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button></div>}</CardContent></Card>
      {printableReport && date?.from && date.to && <div className="hidden"><div id="ambulance-report-print-content"><AmbulanceReportPrint reportData={printableReport} dateRange={{ from: date.from, to: date.to }} activeBranch={stores.find((store) => store.id === activeStoreId)} /></div></div>}
    </div>
  )
}

function SummaryCard({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle><span className="text-muted-foreground">{icon}</span></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div></CardContent></Card>
}
