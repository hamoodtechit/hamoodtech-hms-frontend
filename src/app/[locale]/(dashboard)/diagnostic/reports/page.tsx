"use client"

import { ApprovalDialog } from "@/components/diagnostic/approval-dialog"
import { RequisitionDialog } from "@/components/diagnostic/requisition-dialog"
import { ResultEntryDialog } from "@/components/diagnostic/result-entry-dialog"
import { SampleCollectionDialog } from "@/components/diagnostic/sample-collection-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { DiagnosticReport, ReportStatus } from "@/types/diagnostic"
import { format } from "date-fns"
import {
    Activity,
    Beaker,
    CheckCircle2,
    ClipboardList,
    Clock,
    FlaskConical,
    Loader2,
    Plus,
    Search
} from "lucide-react"
import { useState } from "react"

export default function DiagnosticReportsPage() {
    const [status, setStatus] = useState<ReportStatus | 'all'>('all')
    const [search, setSearch] = useState("")
    const [debouncedSearch] = useDebounce(search, 500)
    
    // Dialog States
    const [requisitionOpen, setRequisitionOpen] = useState(false)
    const [collectionOpen, setCollectionOpen] = useState(false)
    const [resultOpen, setResultOpen] = useState(false)
    const [approvalOpen, setApprovalOpen] = useState(false)
    const [selectedReport, setSelectedReport] = useState<DiagnosticReport | null>(null)

    const { activeStoreId } = useStoreContext()

    const { data: reportsRes, isLoading, refetch } = useDiagnosticReports({
        branchId: activeStoreId || undefined,
        reportStatus: status === 'all' ? undefined : status,
        search: debouncedSearch || undefined,
    })

    const reports = reportsRes?.data || []
    console.log("LAB_WORKLIST_REPORTS:", reports)

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
        'pending-billing': { label: 'Pending Billing', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
        'pending-sample-collection': { label: 'Collect Sample', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: Beaker },
        'sample-collected': { label: 'Test Run', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Activity },
        'processing': { label: 'Processing', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: FlaskConical },
        'pending-verification': { label: 'Verification', color: 'bg-rose-500/10 text-rose-600 border-rose-500/20', icon: ClipboardList },
        'completed': { label: 'Completed', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
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

            {/* Hub Stats / Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(statusConfig).map(([key, config]) => (
                    <Card key={key} className="border-none shadow-sm cursor-pointer hover:shadow-md transition-all group overflow-hidden bg-card/50 backdrop-blur-sm" onClick={() => setStatus(key as ReportStatus)}>
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
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <Tabs value={status} onValueChange={(v) => setStatus(v as any)} className="w-full md:w-auto">
                            <TabsList className="bg-muted/50 p-1 h-10 rounded-xl">
                                <TabsTrigger value="all" className="rounded-lg px-4 text-xs font-bold data-[state=active]:bg-card">All Reports</TabsTrigger>
                                <TabsTrigger value="pending-sample-collection" className="rounded-lg px-4 text-xs font-bold data-[state=active]:bg-card">To Collect</TabsTrigger>
                                <TabsTrigger value="sample-collected" className="rounded-lg px-4 text-xs font-bold data-[state=active]:bg-card">To Run</TabsTrigger>
                                <TabsTrigger value="pending-verification" className="rounded-lg px-4 text-xs font-bold data-[state=active]:bg-card">Approval</TabsTrigger>
                            </TabsList>
                        </Tabs>

                                <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by patient or barcode..."
                                        className="pl-10 h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-primary/20"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50 text-[11px] uppercase tracking-wider font-extrabold">
                            <TableRow>
                                <TableHead className="pl-6">Barcode / ID</TableHead>
                                <TableHead>Patient Info</TableHead>
                                <TableHead>Test Ordered</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date Requested</TableHead>
                                <TableHead className="text-right pr-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                            <p className="text-sm font-bold">Fetching worklist...</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-96 text-center">
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
                                    <TableRow key={report.id} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell className="pl-6 font-black tracking-tighter text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1 h-6 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                                {report.barcode || `REQ-${report.id.substring(0, 8)}`}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-sm tracking-tight">{report.patient?.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-muted-foreground font-medium">{report.patient?.phone}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-sm tracking-tight">{report.diagnosticTest?.name}</span>
                                                {report.diagnosticTest?.type && (
                                                    <Badge variant="outline" className="w-fit text-[9px] font-black uppercase tracking-tight py-0 h-4 border-primary/20 text-primary">
                                                        {report.diagnosticTest.type}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                "rounded-lg font-black uppercase text-[10px] tracking-tight py-1 px-3 border",
                                                statusConfig[report.reportStatus as string]?.color || "bg-muted text-muted-foreground"
                                            )}>
                                                {statusConfig[report.reportStatus as string]?.label || report.reportStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-xs font-bold text-muted-foreground">
                                                <span>{format(new Date(report.createdAt), 'dd MMM yyyy')}</span>
                                                <span className="text-[10px] opacity-70">{format(new Date(report.createdAt), 'hh:mm a')}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            {report.reportStatus !== 'completed' && report.reportStatus !== 'pending-billing' ? (
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
                                            ) : (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="h-8 w-8 rounded-lg"
                                                >
                                                    <Search className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

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
