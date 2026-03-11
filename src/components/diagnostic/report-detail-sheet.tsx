"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { useDiagnosticReport } from "@/hooks/diagnostic-queries"
import { cn } from "@/lib/utils"
import { DiagnosticReport } from "@/types/diagnostic"
import { format } from "date-fns"
import {
    Activity,
    Beaker,
    CheckCircle2,
    Clock,
    FlaskConical,
    Loader2,
    QrCode,
    User,
} from "lucide-react"

interface ReportDetailSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: DiagnosticReport | null
}

const statusConfig: Record<string, { label: string; color: string }> = {
    "pending-billing":           { label: "Pending Billing",      color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
    "pending-sample-collection": { label: "Pending Collection",   color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" },
    "sample-collected":          { label: "Sample Collected",     color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
    "processing":                { label: "Processing",           color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
    "pending-verification":      { label: "Pending Verification", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
    "completed":                 { label: "Completed",            color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    "cancelled":                 { label: "Cancelled",            color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-border/50 last:border-0">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground shrink-0">{label}</span>
            <span className="text-sm font-semibold text-right truncate max-w-[60%]">{value || <span className="text-muted-foreground italic text-xs">—</span>}</span>
        </div>
    )
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 mb-3">
                <Icon className="w-3.5 h-3.5 text-primary" />
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
            </div>
            <div className="bg-muted/30 rounded-xl px-4 py-1">
                {children}
            </div>
        </div>
    )
}

export function ReportDetailSheet({ open, onOpenChange, report }: ReportDetailSheetProps) {
    // Fetch full report details (includes full patient, saleItem, collectedBy, technician, approvedBy)
    const { data: detailRes, isLoading } = useDiagnosticReport(report?.id ?? "")
    const detail = detailRes?.data ?? report

    const results = detail?.result ? Object.entries(detail.result) : []

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[480px] w-full overflow-y-auto p-0 flex flex-col gap-0">
                <SheetHeader className="p-6 pb-4 border-b bg-muted/20">
                    <SheetTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                        <FlaskConical className="w-5 h-5 text-primary" />
                        Report Details
                    </SheetTitle>
                    {detail && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge className={cn(
                                "rounded-lg font-black uppercase text-[10px] tracking-tight py-1 px-3 border",
                                statusConfig[detail.reportStatus]?.color
                            )}>
                                {statusConfig[detail.reportStatus]?.label || detail.reportStatus}
                            </Badge>
                            <Badge variant="outline" className={cn(
                                "rounded-lg font-bold uppercase text-[9px] tracking-tight py-1 px-2",
                                detail.sampleStatus === 'collected' && "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
                                detail.sampleStatus === 'pending' && "border-amber-500/30 text-amber-600 bg-amber-500/10",
                            )}>
                                Sample: {detail.sampleStatus}
                            </Badge>
                            {detail.barcode && (
                                <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                                    <QrCode className="w-3 h-3" />
                                    {detail.barcode}
                                </div>
                            )}
                        </div>
                    )}
                </SheetHeader>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                    </div>
                ) : detail ? (
                    <div className="p-6 space-y-6 flex-1">

                        {/* Patient */}
                        <Section title="Patient" icon={User}>
                            <InfoRow label="Name" value={detail.patient?.name} />
                            <InfoRow label="Phone" value={detail.patient?.phone} />
                        </Section>

                        {/* Test */}
                        <Section title="Test" icon={FlaskConical}>
                            <InfoRow label="Test Name" value={detail.diagnosticTest?.name} />
                            <InfoRow label="Barcode" value={detail.barcode} />
                            <InfoRow label="QR Code" value={detail.qrCode} />
                            <InfoRow label="Requested" value={format(new Date(detail.createdAt), 'dd MMM yyyy, hh:mm a')} />
                        </Section>

                        {/* Sample Collection */}
                        <Section title="Sample Collection" icon={Beaker}>
                            <InfoRow label="Status" value={detail.sampleStatus} />
                            <InfoRow label="Collected By" value={(detail as any).collectedBy?.name} />
                            <InfoRow label="Collected At" value={detail.sampleCollectedAt ? format(new Date(detail.sampleCollectedAt), 'dd MMM yyyy, hh:mm a') : null} />
                            <InfoRow label="Details" value={detail.sampleDetails} />
                        </Section>

                        {/* Results */}
                        {results.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-3.5 h-3.5 text-primary" />
                                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Test Results</p>
                                </div>
                                <div className="bg-muted/30 rounded-xl overflow-hidden divide-y divide-border/50">
                                    {results.map(([param, value]) => (
                                        <div key={param} className="flex justify-between items-center px-4 py-3 text-sm">
                                            <span className="font-medium text-muted-foreground">{param}</span>
                                            <span className="font-black text-foreground">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                                {detail.reportNotes && (
                                    <div className="px-4 py-3 bg-muted/30 rounded-xl text-sm text-muted-foreground italic">
                                        "{detail.reportNotes}"
                                    </div>
                                )}
                                <InfoRow label="Technician" value={(detail as any).technician?.name} />
                            </div>
                        )}

                        {/* Approval */}
                        {detail.approvedById && (
                            <>
                                <Separator />
                                <Section title="Approval" icon={CheckCircle2}>
                                    <InfoRow label="Approved By" value={(detail as any).approvedBy?.name} />
                                    <InfoRow label="Approved At" value={detail.approvedAt ? format(new Date(detail.approvedAt), 'dd MMM yyyy, hh:mm a') : null} />
                                    <InfoRow label="Digital Signature" value={detail.digitalSignature} />
                                </Section>
                            </>
                        )}

                        {/* Timestamps */}
                        <Section title="Timestamps" icon={Clock}>
                            <InfoRow label="Created" value={format(new Date(detail.createdAt), 'dd MMM yyyy, hh:mm a')} />
                            <InfoRow label="Last Updated" value={format(new Date(detail.updatedAt), 'dd MMM yyyy, hh:mm a')} />
                        </Section>

                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                        No report selected.
                    </div>
                )}

                <div className="p-4 border-t bg-muted/10">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full rounded-xl font-bold">
                        Close
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
