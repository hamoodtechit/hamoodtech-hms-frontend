"use client"

import { ApprovalDialog } from "@/components/diagnostic/approval-dialog"
import { ReportDetailSheet } from "@/components/diagnostic/report-detail-sheet"
import { RequisitionDialog } from "@/components/diagnostic/requisition-dialog"
import { ResultEntryDialog } from "@/components/diagnostic/result-entry-dialog"
import { SampleCollectionDialog } from "@/components/diagnostic/sample-collection-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
import { useDiagnosticReports } from "@/hooks/diagnostic-queries"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { useStoreContext } from "@/store/use-store-context"
import { DiagnosticReport, ReportStatus, SampleStatus } from "@/types/diagnostic"
import { format } from "date-fns"
import {
    Activity,
    Beaker,
    CheckCircle2,
    ClipboardList,
    Clock,
    Eye,
    Filter,
    FlaskConical,
    Loader2,
    Plus,
    Search,
    X
} from "lucide-react"
import { useState } from "react"

export default function DiagnosticReportsPage() {
    const [reportStatus, setReportStatus] = useState<ReportStatus | 'all'>('all')
    const [sampleStatus, setSampleStatus] = useState<SampleStatus | 'all'>('all')
    const [search, setSearch] = useState("")
    const [barcodeFilter, setBarcodeFilter] = useState("")
    const [filterOpen, setFilterOpen] = useState(false)
    const [debouncedSearch] = useDebounce(search, 500)
    const [debouncedBarcode] = useDebounce(barcodeFilter, 500)

    // Dialog States
    const [requisitionOpen, setRequisitionOpen] = useState(false)
    const [collectionOpen, setCollectionOpen] = useState(false)
    const [resultOpen, setResultOpen] = useState(false)
    const [approvalOpen, setApprovalOpen] = useState(false)
    const [detailOpen, setDetailOpen] = useState(false)
    const [selectedReport, setSelectedReport] = useState<DiagnosticReport | null>(null)

    const { activeStoreId } = useStoreContext()

    const { data: reportsRes, isLoading, isFetching, refetch } = useDiagnosticReports({
        branchId: activeStoreId || undefined,
        reportStatus: reportStatus === 'all' ? undefined : reportStatus,
        sampleStatus: sampleStatus === 'all' ? undefined : sampleStatus,
        search: debouncedSearch || undefined,
        barcode: debouncedBarcode || undefined,
    })

    const reports = reportsRes?.data || []

    const activeFilterCount = [
        sampleStatus !== 'all',
        barcodeFilter !== '',
    ].filter(Boolean).length

    const handleAction = (report: DiagnosticReport) => {
        setSelectedReport(report)
        switch (report.reportStatus) {
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

    const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
        'pending-billing':           { label: 'Pending Billing',      color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',    icon: Clock },
        'pending-sample-collection': { label: 'Pending Collection',   color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', icon: Beaker },
        'sample-collected':          { label: 'Sample Collected',     color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',       icon: Activity },
        'processing':                { label: 'Processing',           color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: FlaskConical },
        'pending-verification':      { label: 'Pending Verification', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20',       icon: ClipboardList },
        'completed':                 { label: 'Completed',            color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 },
        'cancelled':                 { label: 'Cancelled',            color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',    icon: X },
    }

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-muted/20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-primary flex items-center gap-3">
                        <FlaskConical className="w-8 h-8" />
                        Lab Worklist
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium">Manage the diagnostic lifecycle from requisition to approval.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setRequisitionOpen(true)}
                        className="rounded-xl shadow-lg shadow-primary/20 gap-2 h-11 px-6 font-bold"
                    >
                        <Plus className="h-4 w-4" /> New Requisition
                    </Button>
                </div>
            </div>

            {/* Hub Stats / Overview — only count from all-reports data */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {Object.entries(statusConfig).map(([key, config]) => (
                    <Card
                        key={key}
                        onClick={() => { setReportStatus(key as ReportStatus); setSampleStatus('all') }}
                        className={cn(
                            "border-none shadow-sm cursor-pointer hover:shadow-md transition-all group overflow-hidden bg-card/50 backdrop-blur-sm",
                            reportStatus === key && "ring-2 ring-primary/30"
                        )}
                    >
                        <CardHeader className="p-3 pb-0">
                            <config.icon className={cn("w-4 h-4 mb-2", config.color.split(' ')[1])} />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70 leading-none mb-1 group-hover:text-primary transition-colors">{config.label}</p>
                            <p className="text-xl font-black tracking-tighter">
                                {reports.filter(r => r.reportStatus === key).length}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="border-none shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="p-4 border-b bg-card/80">
                    <div className="flex flex-col gap-3">
                        {/* Tabs row */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <Tabs value={reportStatus} onValueChange={(v) => setReportStatus(v as any)} className="w-full md:w-auto">
                                <TabsList className="bg-muted/50 p-1 h-10 rounded-xl">
                                    <TabsTrigger value="all" className="rounded-lg px-4 text-xs font-bold data-[state=active]:bg-card">All</TabsTrigger>
                                    <TabsTrigger value="pending-billing" className="rounded-lg px-3 text-xs font-bold data-[state=active]:bg-card">Billing</TabsTrigger>
                                    <TabsTrigger value="pending-sample-collection" className="rounded-lg px-3 text-xs font-bold data-[state=active]:bg-card">Collect</TabsTrigger>
                                    <TabsTrigger value="sample-collected" className="rounded-lg px-3 text-xs font-bold data-[state=active]:bg-card">Run</TabsTrigger>
                                    <TabsTrigger value="pending-verification" className="rounded-lg px-3 text-xs font-bold data-[state=active]:bg-card">Verify</TabsTrigger>
                                    <TabsTrigger value="completed" className="rounded-lg px-3 text-xs font-bold data-[state=active]:bg-card">Done</TabsTrigger>
                                </TabsList>
                            </Tabs>

                            {/* Search + Advanced Filter */}
                            <div className="flex items-center gap-2 flex-1 md:max-w-sm ml-auto">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search patient..."
                                        className="pl-10 h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-primary/20"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
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
                                                        onClick={() => { setSampleStatus('all'); setBarcodeFilter('') }}
                                                    >
                                                        Clear All
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Sample Status</Label>
                                                <Select value={sampleStatus} onValueChange={(v) => setSampleStatus(v as any)}>
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
                                                        onChange={(e) => setBarcodeFilter(e.target.value)}
                                                    />
                                                    {barcodeFilter && (
                                                        <button onClick={() => setBarcodeFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
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
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right pr-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                            <p className="text-sm font-bold">Fetching worklist...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-96 text-center">
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
                                            <span className="font-semibold text-sm">{report.diagnosticTest?.name}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                "rounded-lg font-black uppercase text-[10px] tracking-tight py-1 px-3 border",
                                                statusConfig[report.reportStatus]?.color || "bg-muted text-muted-foreground"
                                            )}>
                                                {statusConfig[report.reportStatus]?.label || report.reportStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(
                                                "rounded-lg font-bold uppercase text-[9px] tracking-tight py-1 px-2",
                                                report.sampleStatus === 'collected' && "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
                                                report.sampleStatus === 'pending' && "border-amber-500/30 text-amber-600 bg-amber-500/10",
                                                report.sampleStatus === 'not-required' && "border-slate-500/20 text-slate-500",
                                            )}>
                                                {report.sampleStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs font-bold text-muted-foreground">
                                                <span>{format(new Date(report.createdAt), 'dd MMM yyyy')}</span>
                                                <span className="text-[10px] opacity-70">{format(new Date(report.createdAt), 'hh:mm a')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {/* View Details button — always visible */}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => { setSelectedReport(report); setDetailOpen(true) }}
                                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {/* Action button — only for actionable statuses */}
                                                {report.reportStatus !== 'completed' && report.reportStatus !== 'pending-billing' && report.reportStatus !== 'cancelled' ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleAction(report)}
                                                        className={cn(
                                                            "rounded-lg h-8 text-[11px] font-black uppercase border-none px-4",
                                                            report.reportStatus === 'pending-sample-collection' ? "bg-indigo-600 hover:bg-indigo-700 text-white" :
                                                            report.reportStatus === 'sample-collected' ? "bg-blue-600 hover:bg-blue-700 text-white" :
                                                            report.reportStatus === 'pending-verification' ? "bg-rose-600 hover:bg-rose-700 text-white" :
                                                            "bg-primary hover:bg-primary/90 text-primary-foreground"
                                                        )}
                                                    >
                                                        {report.reportStatus === 'pending-sample-collection' ? 'Collect' :
                                                         report.reportStatus === 'sample-collected' ? 'Results' :
                                                         report.reportStatus === 'pending-verification' ? 'Approve' : 'Action'}
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Detail Sheet */}
            <ReportDetailSheet
                open={detailOpen}
                onOpenChange={setDetailOpen}
                report={selectedReport}
            />

            {/* Workflow Dialogs */}
            <RequisitionDialog
                open={requisitionOpen}
                onOpenChange={setRequisitionOpen}
                onSuccess={refetch}
            />

            <SampleCollectionDialog
                open={collectionOpen}
                onOpenChange={setCollectionOpen}
                report={selectedReport}
                onSuccess={refetch}
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
        </div>
    )
}
