"use client"

import { useDiagnosticReports } from "@/hooks/diagnostic-queries"
import { Badge } from "@/components/ui/badge"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { FileText, FlaskConical, ClipboardCheck, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

interface PatientDiagnosticReportsProps {
    patientId: string
}

export function PatientDiagnosticReports({ patientId }: PatientDiagnosticReportsProps) {
    const { data: reportsRes, isLoading } = useDiagnosticReports({ patientId, limit: 100 })
    const reports = reportsRes?.data || []

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
            </div>
        )
    }

    if (reports.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-center bg-muted/10 rounded-[3rem] border-2 border-dashed border-muted-foreground/10">
                <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground/40">
                    <FlaskConical className="h-8 w-8" />
                </div>
                <div>
                    <p className="text-lg font-black text-muted-foreground uppercase tracking-tight">No Reports Found</p>
                    <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">This patient has no diagnostic history recorded.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <FileText className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-lg font-black tracking-tight">Diagnostic History</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">{reports.length} Total Laboratory Tests</p>
                </div>
            </div>

            <div className="rounded-[2.5rem] border bg-background overflow-hidden shadow-xl shadow-indigo-500/5">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest pl-8 py-5">Requisition ID</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Test Count</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-8">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map((report) => (
                            <TableRow key={report.id} className="group hover:bg-indigo-500/5 transition-colors border-muted/20">
                                <TableCell className="pl-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-black text-sm tracking-tight">{report.barcode || `REQ-${report.id.substring(0, 8)}`}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">#{report.id.slice(0,8)}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-bold text-muted-foreground">
                                        {format(new Date(report.createdAt), "dd MMM, yyyy")}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <ClipboardCheck className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-xs font-black uppercase tracking-tight">{report.diagnosticTests?.length || 0} Items</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge 
                                        variant="outline" 
                                        className={`capitalize font-black text-[9px] tracking-widest px-2 py-0.5 rounded-lg ${
                                            (report.status as any) === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                                            (report.status as any) === 'sample-collected' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 
                                            (report.status as any) === 'processing' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' :
                                            'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                        }`}
                                    >
                                        {report.status?.replace(/-/g, ' ')}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                    <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl" asChild>
                                        <Link href={`/diagnostic/reports/${report.id}`}>
                                            <ArrowUpRight className="h-5 w-5" />
                                        </Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
