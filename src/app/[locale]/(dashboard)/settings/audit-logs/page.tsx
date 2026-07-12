"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuditLogs } from "@/hooks/audit-log-queries"
import { useDebounce } from "@/hooks/use-debounce"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { 
    Activity, 
    Calendar, 
    ChevronLeft, 
    ChevronRight, 
    Monitor, 
    Search, 
    Smartphone, 
    User,
    Info,
    History
} from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { FilterPopover } from "@/components/shared/filter-popover"
import { AuditLogFilters } from "@/components/settings/audit-log-filters"
import { AuditLogQueryParams } from "@/types/audit-log"
import { RefreshCcw, X } from "lucide-react"
import { DateRange } from "react-day-picker"

export default function AuditLogsPage() {
    const [page, setPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch] = useDebounce(searchTerm, 500)
    const [filters, setFilters] = useState<AuditLogQueryParams>({})
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [selectedLog, setSelectedLog] = useState<any>(null)

    const { data: response, isLoading, isFetching } = useAuditLogs({
        page,
        limit: 100,
        search: debouncedSearch,
        module: filters.module,
        action: filters.action,
        userId: filters.userId,
        startDate: dateRange?.from ? new Date(`${format(dateRange.from, 'yyyy-MM-dd')}T00:00:00.000Z`).toISOString() : undefined,
        endDate: dateRange?.to ? new Date(`${format(dateRange.to, 'yyyy-MM-dd')}T23:59:59.999Z`).toISOString() : undefined,
    })
    
    const logs = response?.data || []
    const meta = response?.meta

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'CREATE':
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">CREATE</Badge>
            case 'UPDATE':
                return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">UPDATE</Badge>
            case 'DELETE':
                return <Badge className="bg-rose-500/10 text-rose-600 border-rose-200">DELETE</Badge>
            default:
                return <Badge variant="outline">{action}</Badge>
        }
    }

    return (
        <PermissionGuard permission="settings:read">
            <div className="space-y-6 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-primary flex items-center gap-2">
                            <History className="h-8 w-8" />
                            System Audit Logs
                        </h1>
                        <p className="text-muted-foreground font-medium">Track all administrative actions and system changes across the platform.</p>
                    </div>
                </div>

                <Card className="border-none shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="p-6 bg-card/80 border-b">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 w-full sm:max-w-2xl">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search logs by user, module, or record ID..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value)
                                            setPage(1)
                                        }}
                                        className="pl-10 h-11 rounded-xl bg-muted/50 border-none focus-visible:ring-primary/20"
                                    />
                                    {isFetching && !isLoading && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <RefreshCcw className="h-4 w-4 animate-spin text-muted-foreground opacity-50" />
                                        </div>
                                    )}
                                </div>

                                <FilterPopover
                                    activeFilterCount={
                                        [
                                            filters.module,
                                            filters.action,
                                            filters.userId,
                                            dateRange?.from || dateRange?.to,
                                        ].filter(Boolean).length
                                    }
                                    onReset={() => {
                                        setFilters({})
                                        setDateRange(undefined)
                                        setPage(1)
                                    }}
                                    title="Advanced Audit Filters"
                                >
                                    <AuditLogFilters 
                                        values={filters}
                                        onChange={(val) => {
                                            setFilters(val)
                                            setPage(1)
                                        }}
                                        dateRange={dateRange}
                                        setDateRange={setDateRange}
                                    />
                                </FilterPopover>

                                {(Object.keys(filters).length > 0 || dateRange || searchTerm) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2 text-muted-foreground hover:text-foreground shrink-0 h-11 rounded-xl"
                                        onClick={() => {
                                            setFilters({})
                                            setDateRange(undefined)
                                            setSearchTerm("")
                                            setPage(1)
                                        }}
                                    >
                                        <X className="h-4 w-4" /> Clear
                                    </Button>
                                )}
                            </div>

                            <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary">
                                <Calendar className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    {format(new Date(), 'MMMM yyyy')}
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/30 text-[10px] uppercase tracking-[0.1em] font-black">
                                <TableRow>
                                    <TableHead className="pl-6">Timestamp / Action</TableHead>
                                    <TableHead>User / Role</TableHead>
                                    <TableHead>Module / Record ID</TableHead>
                                    <TableHead>Device Info</TableHead>
                                    <TableHead className="text-right pr-6">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="pl-6"><Skeleton className="h-12 w-full rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-12 w-full rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-12 w-full rounded-lg" /></TableCell>
                                            <TableCell><Skeleton className="h-12 w-full rounded-lg" /></TableCell>
                                            <TableCell className="pr-6 text-right"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Activity className="h-12 w-12 opacity-10" />
                                                <p className="font-bold">No activity logs found</p>
                                                <p className="text-xs">Try adjusting your filters or search term</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id} className="group hover:bg-primary/5 transition-colors">
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase">
                                                        {format(new Date(log.createdAt), 'HH:mm:ss')}
                                                    </span>
                                                    {getActionBadge(log.action)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm">{log.userName || "System"}</span>
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">
                                                            {log.userRole || "Automated"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-primary/80">{log.module}</span>
                                                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded w-fit font-mono text-muted-foreground">
                                                        {log.recordId}
                                                    </code>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {log.deviceInfo?.mobile ? <Smartphone className="h-4 w-4 text-muted-foreground" /> : <Monitor className="h-4 w-4 text-muted-foreground" />}
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold">{log.deviceInfo?.platform?.replace(/"/g, '') || "Unknown"}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono">{log.ipAddress}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                                    onClick={() => setSelectedLog(log)}
                                                >
                                                    <Info className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        
                        {meta && meta.totalPages > 1 && (
                            <div className="flex items-center justify-between p-6 border-t bg-muted/20">
                                <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                    Page {meta.page} of {meta.totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 rounded-lg border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={meta.page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 rounded-lg border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                                        onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                                        disabled={meta.page === meta.totalPages}
                                    >
                                        Next <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Log Details Dialog */}
                <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                    <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto rounded-[2rem] border-none shadow-2xl p-0">
                        <DialogHeader className="p-8 bg-primary/5">
                            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center border-b-4 border-primary/30 shadow-lg">
                                    <History className="h-6 w-6 text-primary" />
                                </div>
                                Activity Details
                            </DialogTitle>
                        </DialogHeader>
                        
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">User</p>
                                    <p className="font-bold text-sm">{selectedLog?.userName || "System"}</p>
                                    <Badge variant="secondary" className="text-[10px]">{selectedLog?.userRole || "Automated Action"}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Action</p>
                                    <div>{selectedLog && getActionBadge(selectedLog.action)}</div>
                                    <p className="text-[10px] text-muted-foreground font-mono mt-1">
                                        {selectedLog?.createdAt && format(new Date(selectedLog.createdAt), 'PPP p')}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-muted/50 border border-dashed border-muted-foreground/20 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target Module</p>
                                    <p className="font-black text-primary">{selectedLog?.module}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Record ID</p>
                                    <code className="text-xs bg-background p-2 rounded-lg block font-mono border border-primary/5 break-all">
                                        {selectedLog?.recordId}
                                    </code>
                                </div>
                            </div>

                            {/* Data Changes: Old vs New Values */}
                            {(selectedLog?.oldValues || selectedLog?.newValues) && (
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data Changes</p>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {selectedLog.oldValues && (
                                            <div className="space-y-2">
                                                <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200">Before (Old)</Badge>
                                                <pre className="text-[10px] font-mono bg-muted/30 p-4 rounded-xl overflow-auto max-h-[300px] border border-muted-foreground/10 text-muted-foreground">
                                                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                        {selectedLog.newValues && (
                                            <div className="space-y-2">
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">After (New)</Badge>
                                                <pre className="text-[10px] font-mono bg-emerald-500/5 p-4 rounded-xl overflow-auto max-h-[300px] border border-emerald-500/10 text-emerald-700/80">
                                                    {JSON.stringify(selectedLog.newValues, null, 2)}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Environment Context</p>
                                <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                                        <Monitor className="h-4 w-4 text-primary/60" />
                                        <span>{selectedLog?.deviceInfo?.platform?.replace(/"/g, '') || "Unknown"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                                        <Activity className="h-4 w-4 text-primary/60" />
                                        <span className="font-mono">{selectedLog?.ipAddress}</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/30 text-[10px] font-mono text-muted-foreground leading-relaxed break-all">
                                    {selectedLog?.userAgent}
                                </div>
                                <div className="text-[10px] font-mono text-muted-foreground">
                                    <span className="font-bold text-foreground">Endpoint:</span> {selectedLog?.method} {selectedLog?.endpoint}
                                </div>
                            </div>

                            <Button 
                                className="w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                                onClick={() => setSelectedLog(null)}
                            >
                                Close Details
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </PermissionGuard>
    )
}
