"use client"

import { ApprovalDialog } from "@/components/diagnostic/approval-dialog"
import { ConsolidatedReportDialog } from "@/components/diagnostic/consolidated-report-dialog"
import { ReportDetailSheet } from "@/components/diagnostic/report-detail-sheet"
import { ResultEntryDialog } from "@/components/diagnostic/result-entry-dialog"
import { SampleCollectionDialog } from "@/components/diagnostic/sample-collection-dialog"
import { SampleLabelDialog } from "@/components/diagnostic/sample-label-dialog"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDiagnosticReports, useUpdateReport } from "@/hooks/diagnostic-queries"
import { useDebounce } from "@/hooks/use-debounce"
import { usePermissions } from "@/hooks/use-permissions"
import { cn } from "@/lib/utils"
import { useStoreContext } from "@/store/use-store-context"
import { DiagnosticReport, ReportStatus, SampleStatus } from "@/types/diagnostic"
import { format } from "date-fns"
import { toast } from "sonner"
import {
    Activity,
    Beaker,
    CheckCircle2,
    ClipboardList,
    Clock,
    Eye,
    FileStack,
    Filter,
    FlaskConical,
    Loader2,
    Printer,
    Search,
    Truck,
    X
} from "lucide-react"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { DateRange } from "react-day-picker"

export default function DiagnosticReportsPage() {
    const { hasPermission } = usePermissions()
    const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all')
    const [sampleStatus, setSampleStatus] = useState<SampleStatus | 'all'>('all')
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [barcodeFilter, setBarcodeFilter] = useState("")
    const [testGroupId, setTestGroupId] = useState<string | 'all'>('all')
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [filterOpen, setFilterOpen] = useState(false)
    const [debouncedSearch] = useDebounce(search, 500)
    const [debouncedBarcode] = useDebounce(barcodeFilter, 500)

    // Dialog States
    const [collectionOpen, setCollectionOpen] = useState(false)
    const [labelOpen, setLabelOpen] = useState(false)
    const [resultOpen, setResultOpen] = useState(false)
    const [approvalOpen, setApprovalOpen] = useState(false)
    const [detailOpen, setDetailOpen] = useState(false)
    const [selectedReport, setSelectedReport] = useState<DiagnosticReport | null>(null)
    const [consolidatedOpen, setConsolidatedOpen] = useState(false)

    const updateMutation = useUpdateReport()
    const isUpdating = updateMutation.isPending

    const searchParams = useSearchParams()
    const urlPatientId = searchParams.get('patientId')
    const { activeStoreId } = useStoreContext()

    const canReadPathology = hasPermission('pathology:read')
    const canReadRadiology = hasPermission('radiology:read')
    const canRead = canReadPathology || canReadRadiology

    const { data: reportsRes, isLoading, isFetching, refetch } = useDiagnosticReports({
        page,
        limit: 10,
        branchId: activeStoreId || undefined,
        reportStatus: statusFilter === 'all' ? undefined : statusFilter,
        sampleStatus: sampleStatus === 'all' ? undefined : sampleStatus,
        search: debouncedSearch || undefined,
        barcode: debouncedBarcode || undefined,
        testGroupId: testGroupId === 'all' ? undefined : testGroupId,
        patientId: urlPatientId || undefined,
        startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    }, { enabled: canRead })

    const allReports = reportsRes?.data || []

    // List of reports
    const reports = allReports

    const activeFilterCount = [
        sampleStatus !== 'all',
        barcodeFilter !== '',
        testGroupId !== 'all',
        !!dateRange?.from,
        !!dateRange?.to,
    ].filter(Boolean).length

    const handleAction = (report: DiagnosticReport) => {
        setSelectedReport(report)
        switch (report.status) {
            case 'pending-billing':
                // Usually handled by billing module, but if needed:
                break
            case 'pending-sample-collection':
                setCollectionOpen(true)
                break
            case 'sample-collected':
            case 'processing':
                setResultOpen(true)
                break
            case 'pending-verification':
                setApprovalOpen(true)
                break
            default:
                break
        }
    }

    const handleDeliver = (report: DiagnosticReport) => {
        updateMutation.mutate({ 
            id: report.id, 
            data: { isDelivered: true } 
        })
    }

    const handleCollectSample = async (report: DiagnosticReport) => {
        try {
            await updateMutation.mutateAsync({
                id: report.id,
                data: {
                    isSampleCollected: true
                }
            })
            toast.success("Sample collected successfully")
        } catch (error) {
            toast.error("Failed to collect sample")
        }
    }

    const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
        'pending-billing':           { label: 'Pending Billing',      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',    icon: Clock },
        'pending-sample-collection': { label: 'Collect Sample',       color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', icon: Beaker },
        'sample-collected':          { label: 'Sample Collected',     color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',       icon: Activity },
        'processing':                { label: 'Processing Results',   color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: FlaskConical },
        'pending-verification':      { label: 'Verify Report',        color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',       icon: ClipboardList },
        'completed':                 { label: 'Completed',            color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
        'cancelled':                 { label: 'Cancelled',            color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',    icon: X },
    }

    // Dynamic Title    
    const pageTitle = "Diagnostic Worklist";

    return (
        <PermissionGuard permission={["pathology:read", "radiology:read"]}>
            <div className="flex flex-col gap-6 p-6 min-h-screen bg-muted/20">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-primary flex items-center gap-3">
                            <FlaskConical className="w-8 h-8" />
                            {pageTitle}
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">Manage the diagnostic lifecycle from requisition to approval.</p>
                    </div>

                    {urlPatientId && (
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                             <Button 
                                onClick={() => setConsolidatedOpen(true)}
                                className="h-12 rounded-xl px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-lg shadow-indigo-600/20 gap-2 border-none"
                            >
                                <FileStack className="h-5 w-5" />
                                Combined Patient Report
                            </Button>
                            {/* Clear filter button */}
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-12 w-12 rounded-xl bg-card border-none"
                                onClick={() => window.location.href = '/diagnostic/reports'}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    )}
                </div>


                <PermissionGuard permission={["pathology:read", "radiology:read"]} mode="silent">
                    <Card className="border-none shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="p-4 border-b bg-card/80">
                            {/* ... (Search and filters content) ... */}
                            <div className="flex flex-col gap-3">
                                {/* Tabs row */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-black tracking-tight text-primary">Pending Requirements</h2>
                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Manage clinical workflow units</p>
                                    </div>

                                    {/* Search + Advanced Filter */}
                                    <div className="flex items-center gap-2 flex-1 md:max-w-sm ml-auto">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search patient..."
                                                className="pl-10 h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-primary/20"
                                                value={search}
                                                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                                            />
                                        </div>

                                        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" size="icon" className={cn("h-10 w-10 rounded-xl border-none bg-muted/50 relative", activeFilterCount > 0 && "ring-2 ring-primary/40 bg-primary/5")}>
                                                    <Filter className="h-4 w-4" />
                                                    {activeFilterCount > 0 && (
                                                        <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-[9px] text-primary-foreground font-black rounded-full flex items-center justify-center">
                                                            {activeFilterCount}
                                                        </span>
                                                    )}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-72 p-4 rounded-xl shadow-2xl" align="end">
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Advanced Filters</p>
                                                        {activeFilterCount > 0 && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-2 text-[10px] font-bold text-destructive hover:text-destructive"
                                                                onClick={() => { setSampleStatus('all'); setBarcodeFilter(''); setPage(1) }}
                                                            >
                                                                Clear All
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Sample Status</Label>
                                                        <Select value={sampleStatus} onValueChange={(v) => { setSampleStatus(v as any); setPage(1) }}>
                                                            <SelectTrigger className="h-9 rounded-lg bg-muted/50 border-none text-xs font-bold">
                                                                <SelectValue placeholder="All sample statuses" />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl">
                                                                <SelectItem value="all" className="text-xs font-bold">All</SelectItem>
                                                                <SelectItem value="pending" className="text-xs font-bold">Pending</SelectItem>
                                                                <SelectItem value="collected" className="text-xs font-bold">Collected</SelectItem>
                                                                <SelectItem value="not-required" className="text-xs font-bold">Not Required</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Barcode</Label>
                                                        <div className="relative">
                                                            <Input
                                                                placeholder="e.g. SALE-2603-0037"
                                                                className="h-9 rounded-lg bg-muted/50 border-none text-xs font-bold pr-7"
                                                                value={barcodeFilter}
                                                                onChange={(e) => { setBarcodeFilter(e.target.value); setPage(1) }}
                                                            />
                                                            {barcodeFilter && (
                                                                <button onClick={() => { setBarcodeFilter(''); setPage(1) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 pt-2 border-t">
                                                        <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Select Date Range</Label>
                                                        <DatePickerWithRange 
                                                            date={dateRange}
                                                            setDate={(v) => { setDateRange(v); setPage(1) }}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                {/* Active filter chips */}
                                {activeFilterCount > 0 && (
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {sampleStatus !== 'all' && (
                                            <Badge variant="secondary" className="rounded-full text-[10px] font-bold gap-1 pr-1">
                                                Sample: {sampleStatus}
                                                <button onClick={() => setSampleStatus('all')} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
                                            </Badge>
                                        )}
                                        {barcodeFilter && (
                                            <Badge variant="secondary" className="rounded-full text-[10px] font-bold gap-1 pr-1">
                                                Barcode: {barcodeFilter}
                                                <button onClick={() => setBarcodeFilter('')} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
                                            </Badge>
                                        )}
                                        {dateRange?.from && (
                                            <Badge variant="secondary" className="rounded-full text-[10px] font-bold gap-1 pr-1">
                                                From: {format(dateRange.from, 'yyyy-MM-dd')}
                                                <button onClick={() => setDateRange(prev => prev ? { ...prev, from: undefined } : undefined)} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
                                            </Badge>
                                        )}
                                        {dateRange?.to && (
                                            <Badge variant="secondary" className="rounded-full text-[10px] font-bold gap-1 pr-1">
                                                To: {format(dateRange.to, 'yyyy-MM-dd')}
                                                <button onClick={() => setDateRange(prev => prev ? { ...prev, to: undefined } : undefined)} className="hover:opacity-70"><X className="h-2.5 w-2.5" /></button>
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-muted/50 text-[11px] uppercase tracking-wider font-extrabold">
                                    <TableRow>
                                        <TableHead className="pl-6">Barcode / ID</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Test</TableHead>
                                        <TableHead>Report Status</TableHead>
                                        <TableHead>Sample Status</TableHead>
                                        <TableHead>Delivery</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-64 text-center">
                                                <div className="flex flex-col items-center gap-2 opacity-50">
                                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                                    <p className="text-sm font-bold">Fetching worklist...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : reports.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-96 text-center">
                                                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground opacity-50">
                                                    <div className="p-6 bg-secondary/50 rounded-full mb-4">
                                                        <ClipboardList className="h-12 w-12" />
                                                    </div>
                                                    <p className="text-lg font-black tracking-tight">Worklist Clear</p>
                                                    <p className="text-sm">No reports matching the current filters.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        reports.map((report) => (
                                            <TableRow key={report.id} className={cn("group hover:bg-muted/30 transition-colors", isFetching && "opacity-60")}>
                                                <TableCell className="pl-6 font-black tracking-tighter text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1 h-6 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                                        {report.barcode || `REQ-${report.id.substring(0, 8)}`}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-sm tracking-tight">{report.patient?.name}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium">{report.patient?.phone}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col max-w-[250px] overflow-hidden">
                                                        <span className="text-xs font-black tracking-tight text-blue-900 truncate">
                                                            {report.diagnosticTests && report.diagnosticTests.length > 0 
                                                                ? report.diagnosticTests.map(t => t.itemName).join(', ') 
                                                                : "No tests found"}
                                                        </span>
                                                        <span className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-widest mt-0.5">
                                                            {report.diagnosticTests?.length || 0} Test items
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        "rounded-lg font-black uppercase text-[10px] tracking-tight py-1 px-3 border",
                                                        statusConfig[report.status]?.color || "bg-muted text-muted-foreground"
                                                    )}>
                                                        {statusConfig[report.status]?.label || report.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(
                                                        "rounded-lg font-bold uppercase text-[9px] tracking-tight py-1 px-2",
                                                        report.isSampleCollected ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10" : "border-amber-500/30 text-amber-600 bg-amber-500/10",
                                                    )}>
                                                        {report.isSampleCollected ? 'Collected' : 'Pending Sample'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn(
                                                        "rounded-lg font-bold uppercase text-[9px] tracking-tight py-1 px-2",
                                                        report.isDelivered ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10" : "border-slate-500/20 text-slate-500"
                                                    )}>
                                                        {report.isDelivered ? 'Delivered' : 'Pending'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-xs font-bold text-muted-foreground">
                                                        <span>{format(new Date(report.createdAt), 'dd MMM yyyy')}</span>
                                                        <span className="text-[10px] opacity-70">{format(new Date(report.createdAt), 'hh:mm a')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {/* Sequential Workflow Primary Action */}
                                                        {!report.isSampleCollected && report.status !== 'cancelled' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={isUpdating}
                                                                onClick={() => handleCollectSample(report)}
                                                                className="rounded-lg h-9 text-[11px] font-black uppercase border-none px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 gap-2"
                                                            >
                                                                {isUpdating && updateMutation.variables?.id === report.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Beaker className="h-4 w-4" />}
                                                                Take Sample
                                                            </Button>
                                                        )}

                                                        {report.isSampleCollected && report.status !== 'completed' && report.status !== 'cancelled' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => { setSelectedReport(report); setResultOpen(true) }}
                                                                className="rounded-lg h-9 text-[11px] font-black uppercase border-none px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 gap-2"
                                                            >
                                                                <Activity className="h-4 w-4" />
                                                                Add Result
                                                            </Button>
                                                        )}

                                                        {report.status === 'completed' && (
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => { setSelectedReport(report); setDetailOpen(true) }}
                                                                    className="rounded-lg h-9 text-[11px] font-black uppercase border-none px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 gap-2"
                                                                >
                                                                    <Printer className="h-4 w-4" />
                                                                    Print
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => { setSelectedReport(report); setResultOpen(true) }}
                                                                    className="rounded-lg h-9 text-[11px] font-black uppercase border-none px-4 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 gap-2"
                                                                >
                                                                    <ClipboardList className="h-4 w-4" />
                                                                    Edit
                                                                </Button>
                                                            </div>
                                                        )}

                                                        {/* Secondary Actions (always small and ghost/outline) */}
                                                        <div className="flex items-center gap-1 ml-2 border-l pl-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => { setSelectedReport(report); setDetailOpen(true) }}
                                                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            
                                                            {report.isSampleCollected && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                                                    onClick={() => {
                                                                        setSelectedReport(report)
                                                                        setLabelOpen(true)
                                                                    }}
                                                                >
                                                                    <Beaker className="h-3.5 w-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>

                        {reportsRes?.meta && reportsRes.meta.totalPages > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                                <p className="text-[11px] text-muted-foreground font-bold tracking-tight">
                                    Showing {(reportsRes.meta.page - 1) * reportsRes.meta.pageSize + 1} to {Math.min(reportsRes.meta.page * reportsRes.meta.pageSize, reportsRes.meta.totalItems)} of {reportsRes.meta.totalItems} Work Items
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest border-none bg-background shadow-sm hover:shadow-md transition-all px-4"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={!reportsRes.meta.hasPreviousPage}
                                    >
                                        PreV
                                    </Button>
                                    <div className="text-[11px] font-black px-4 h-8 flex items-center bg-indigo-600 text-white rounded-lg shadow-inner">
                                        P. {reportsRes.meta.page} / {reportsRes.meta.totalPages}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest border-none bg-background shadow-sm hover:shadow-md transition-all px-4"
                                        onClick={() => setPage(p => Math.min(reportsRes.meta.totalPages, p + 1))}
                                        disabled={!reportsRes.meta.hasNextPage}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </PermissionGuard>

                {/* Detail Sheet */}
                <ReportDetailSheet
                    open={detailOpen}
                    onOpenChange={setDetailOpen}
                    report={selectedReport}
                    onEdit={() => setResultOpen(true)}
                />

                {/* Workflow Dialogs */}
                <SampleCollectionDialog
                    open={collectionOpen}
                    onOpenChange={setCollectionOpen}
                    report={selectedReport}
                    onSuccess={refetch}
                />

                <SampleLabelDialog 
                    open={labelOpen}
                    onOpenChange={setLabelOpen}
                    report={selectedReport}
                />

                <ResultEntryDialog
                    open={resultOpen}
                    onOpenChange={setResultOpen}
                    report={selectedReport}
                    onSuccess={refetch}
                />

                <ApprovalDialog
                    open={approvalOpen}
                    onOpenChange={setApprovalOpen}
                    report={selectedReport}
                    onSuccess={refetch}
                />

                {urlPatientId && (
                    <ConsolidatedReportDialog
                        open={consolidatedOpen}
                        onOpenChange={setConsolidatedOpen}
                        patientId={urlPatientId}
                        branchId={activeStoreId || ''}
                    />
                )}
            </div>
        </PermissionGuard>
    )
}
