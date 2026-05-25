"use client"

import { PrintReport } from "@/components/diagnostic/print-report"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { useDiagnosticReport, useUpdateDeliveryStatus, useUpdateReport } from "@/hooks/diagnostic-queries"
import { cn } from "@/lib/utils"
import { DiagnosticReport, DiagnosticResult } from "@/types/diagnostic"
import { format } from "date-fns"
import {
    Activity,
    Beaker,
    CheckCircle2,
    Clock,
    FileText,
    FlaskConical,
    Loader2,
    Printer,
    QrCode,
    User,
    ClipboardList,
    Truck,
    XCircle
} from "lucide-react"

interface ReportDetailSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: DiagnosticReport | null
    onEdit?: () => void
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

function handlePrint() {
    const el = document.getElementById("print-report")
    if (!el) return
    const win = window.open("", "_blank", "width=1024,height=800")
    if (!win) return
    
    // Copy all style tags from current document to ensure PrintReport styles are preserved
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(style => style.outerHTML)
        .join('\n');

    win.document.write(`
        <html>
        <head>
            <title>Diagnostic Report</title>
            ${styles}
            <style>
                body { margin: 0; padding: 0; background: white; }
                #print-report { margin: 0 auto !important; box-shadow: none !important; }
            </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
            ${el.innerHTML}
        </body>
        </html>
    `)
    win.document.close()
    win.focus()
}

export function ReportDetailSheet({ open, onOpenChange, report, onEdit }: ReportDetailSheetProps) {
    const { data: detailRes, isLoading } = useDiagnosticReport(report?.id ?? "")
    const detail = detailRes?.data ?? report
    
    const { mutate: updateReport, isPending: isUpdating } = useUpdateReport()

    const result = detail?.result as DiagnosticResult | null

    const handleUpdateDelivery = (isDelivered: boolean) => {
        if (!detail?.id) return
        updateReport({ id: detail.id, data: { isDelivered } })
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-[550px] w-full overflow-y-auto p-0 flex flex-col gap-0 border-l-0 shadow-2xl">
                <SheetHeader className="p-6 pb-4 border-b bg-muted/20">
                    <SheetTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
                        <FlaskConical className="w-5 h-5 text-primary" />
                        Diagnostic Report Analysis
                    </SheetTitle>
                    {detail && (
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge className={cn(
                                "rounded-lg font-black uppercase text-[10px] tracking-tight py-1 px-3 border",
                                statusConfig[detail.status]?.color
                            )}>
                                {statusConfig[detail.status]?.label || detail.status}
                            </Badge>
                            <Badge variant="outline" className={cn(
                                "rounded-lg font-bold uppercase text-[9px] tracking-tight py-1 px-2",
                                detail.isSampleCollected ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10" : "border-amber-500/30 text-amber-600 bg-amber-500/10",
                            )}>
                                Sample: {detail.isSampleCollected ? 'Collected' : 'Pending'}
                            </Badge>
                            <Badge variant="outline" className={cn(
                                "rounded-lg font-bold uppercase text-[9px] tracking-tight py-1 px-2",
                                detail.isDelivered ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10" : "border-slate-500/20 text-slate-500",
                            )}>
                                Handover: {detail.isDelivered ? 'Delivered' : 'Pending'}
                            </Badge>
                        </div>
                    )}
                </SheetHeader>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                    </div>
                ) : detail ? (
                    <div className="p-6 space-y-8 flex-1">

                        {/* Patient & Test Identification */}
                        <div className="grid grid-cols-2 gap-6">
                            <Section title="Patient" icon={User}>
                                <InfoRow label="Name" value={detail.patient?.name} />
                                <InfoRow label="Phone" value={detail.patient?.phone} />
                            </Section>
                            <Section title="Identification" icon={QrCode}>
                                <InfoRow label="UHID" value={(detail.patient as any)?.uhid || detail.patientId.substring(0,8)} />
                                <InfoRow label="Invoice" value={detail.sale?.invoiceNumber} />
                            </Section>
                        </div>

                        {/* Tests List */}
                        <Section title="Tests in Report" icon={Beaker}>
                            <div className="py-2 flex flex-wrap gap-2 items-center">
                                {((detail as any)?.diagnosticTests || (detail as any)?.testItems || []).length > 0 ? (
                                    ((detail as any)?.diagnosticTests || (detail as any)?.testItems || []).map((t: any, i: number) => (
                                        <Badge key={i} variant="secondary" className="bg-blue-500/5 text-blue-700 font-bold border-blue-100 px-3 py-1">
                                            {t.service?.name || t.itemName}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-xs font-bold text-muted-foreground italic">No tests found</span>
                                )}
                            </div>
                        </Section>

                        {/* RESULT CONTENT */}
                        {result && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-600" />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-blue-900">
                                            {result.reportHeader || "Test Results"}
                                        </h3>
                                    </div>
                                    <Badge variant="secondary" className="rounded-lg text-[9px] font-bold">
                                        {result.mode === 'table' ? <ClipboardList className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                                        {(result.mode || 'MODERNIZIED').toUpperCase()}
                                    </Badge>
                                </div>

                                {result.machineInfo && (
                                    <p className="text-[10px] italic text-muted-foreground bg-muted/50 p-2 rounded-lg border border-dashed text-center">
                                        {result.machineInfo}
                                    </p>
                                )}

                                <div className="bg-muted/30 rounded-2xl overflow-hidden border">
                                    {result.blocks ? (
                                        <div className="p-4 space-y-4">
                                            {result.blocks.map((block) => {
                                                if (block.type === 'header') {
                                                    return (
                                                        <div key={block.id} className="py-2 border-b-2 border-primary/10">
                                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/80">
                                                                {block.headerText || block.content}
                                                            </h3>
                                                        </div>
                                                    );
                                                }
                                                if (block.type === 'parameter') {
                                                    return (
                                                        <div key={block.id} className={cn(
                                                            "py-1 border-b border-border/30 last:border-0",
                                                            block.isHeader && "bg-primary/5 px-2 rounded-lg py-2 my-1",
                                                            block.isAbnormal && "bg-red-500/5 px-2 rounded-lg"
                                                        )}>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={cn(
                                                                        "text-xs font-semibold truncate",
                                                                        block.isHeader ? "font-black text-primary uppercase" : "text-muted-foreground",
                                                                        block.isBold && "font-bold text-foreground"
                                                                    )}>
                                                                        {block.parameter}
                                                                        {block.isHeader && block.machineInfo && (
                                                                            <span className="ml-2 text-[10px] font-bold text-muted-foreground/60 uppercase italic tracking-tighter">
                                                                                | {block.machineInfo}
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                {block.value !== undefined && (
                                                                    <div className="text-right shrink-0">
                                                                        <p className={cn(
                                                                            "text-sm font-black",
                                                                            block.isAbnormal && "text-red-600"
                                                                        )}>
                                                                            {block.value}
                                                                            {block.isAbnormal && <span className="ml-1 text-[10px]">(H)</span>}
                                                                        </p>
                                                                        {block.unit && <p className="text-[9px] font-bold text-muted-foreground uppercase">{block.unit}</p>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {block.referenceRange && !block.isHeader && (
                                                                <div className="mt-1 text-[9px] text-muted-foreground/60 font-medium italic leading-tight">
                                                                    Ref: <span dangerouslySetInnerHTML={{ __html: block.referenceRange.replace(/\n/g, '') }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                if (block.type === 'narrative') {
                                                    return (
                                                        <div key={block.id} className="p-3 bg-card/50 rounded-xl border border-border/40 my-2">
                                                            <div className="text-sm font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: block.content || "" }} />
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </div>
                                    ) : result.mode === 'table' && result.rows ? (
                                        <div className="divide-y divide-border/40">
                                            {result.rows.map((row, idx) => (
                                                <div key={idx} className={cn(
                                                    "px-4 py-3 flex items-center justify-between gap-4",
                                                    row.isHeader ? "bg-blue-600/5 py-4" : ""
                                                )}>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn(
                                                            "text-xs font-semibold truncate",
                                                            row.isHeader && "font-black text-blue-800 uppercase tracking-tight",
                                                            row.isBold && "font-black underline underline-offset-2"
                                                        )}>
                                                            {row.parameter}
                                                        </p>
                                                        {!row.isHeader && row.referenceRange && (
                                                            <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">
                                                                Ref: <span dangerouslySetInnerHTML={{ __html: row.referenceRange.replace(/\n/g, '') }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    {!row.isHeader && (
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <div className="text-right">
                                                                <p className={cn(
                                                                    "text-sm font-black",
                                                                    row.isAbnormal && "text-red-600"
                                                                )}>
                                                                    {row.value}
                                                                </p>
                                                                {row.unit && <p className="text-[10px] text-muted-foreground uppercase font-bold">{row.unit}</p>}
                                                            </div>
                                                            {row.isAbnormal && (
                                                                <Badge className="bg-red-600/10 text-red-600 border-red-600/20 text-[9px] font-black italic px-1 h-5 rounded hover:bg-red-600/10">HB</Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-5 space-y-4">
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                                {result.content}
                                            </p>
                                            {result.interpretation && (
                                                <div className="pt-3 border-t border-dashed">
                                                    <p className="text-xs font-black uppercase text-muted-foreground mb-1 underline">Impression / Comment</p>
                                                    <p className="text-sm font-black text-rose-900">{result.interpretation}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                
                                 <div className="flex items-center justify-between gap-4 pt-2">
                                     <div className="flex items-center gap-2">
                                        <User className="w-3 h-3 text-muted-foreground" />
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Prepared: {result.preparedBy || detail.medicalTechnologistId || "System"}</p>
                                     </div>
                                     {detail.doctor && (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <p className="text-[10px] font-bold text-emerald-800 uppercase">Signed: {detail.doctor.fullName}</p>
                                        </div>
                                     )}
                                </div>
                            </div>
                        )}

                        {/* Metadata Sections */}
                        <div className="grid grid-cols-2 gap-6">
                            <Section title="Collection" icon={Beaker}>
                                <InfoRow label="Status" value={detail.isSampleCollected ? "Collected" : "Pending"} />
                                <InfoRow label="At" value={format(new Date(detail.updatedAt), 'dd MMM, hh:mm a')} />
                            </Section>
                            <Section title="Timings" icon={Clock}>
                                <InfoRow label="Requested" value={format(new Date(detail.createdAt), 'dd MMM, hh:mm a')} />
                                <InfoRow label="Updated" value={format(new Date(detail.updatedAt), 'dd MMM, hh:mm a')} />
                            </Section>
                        </div>

                        {/* Handover & Delivery Management */}
                        <div className="space-y-3 bg-indigo-500/5 p-5 rounded-2xl border border-indigo-500/10">
                            <div className="flex items-center gap-2 mb-1">
                                <Truck className="w-4 h-4 text-indigo-600" />
                                <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-900">Handover & Delivery</h3>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={isUpdating || detail.isDelivered}
                                    onClick={() => handleUpdateDelivery(true)}
                                    className="flex-1 rounded-lg h-9 text-[10px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white border-none gap-2"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Mark Delivered
                                </Button>
                                {detail.isDelivered && (
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        disabled={isUpdating}
                                        onClick={() => handleUpdateDelivery(false)}
                                        className="h-9 px-3 rounded-lg text-[10px] font-black uppercase border-dashed shrink-0"
                                    >
                                        Revert Handover
                                    </Button>
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-medium italic">Handover status tracking for patient relations and billing reconciliation.</p>
                        </div>

                        {/* Signature (if approved) */}
                        {detail.digitalSignature && (
                            <div className="p-4 bg-muted/20 border-2 border-dashed rounded-2xl text-center space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Digital Signature Seal</p>
                                <p className="text-sm font-mono font-black italic">"{detail.digitalSignature}"</p>
                            </div>
                        )}

                        {/* Hidden print template for handlePrint */}
                        <div className="hidden">
                            <PrintReport report={detail as DiagnosticReport} />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                        No report selected.
                    </div>
                )}

                <div className="p-6 border-t bg-muted/10 flex flex-col sm:flex-row gap-3 shrink-0">
                    {detail?.status === 'completed' && (
                        <>
                            <Button
                                onClick={handlePrint}
                                className="flex-[2] h-12 rounded-xl font-black gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 text-white"
                            >
                                <Printer className="h-4 w-4" />
                                Print Report
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    onOpenChange(false);
                                    onEdit?.();
                                }}
                                className="flex-1 h-12 rounded-xl font-black gap-2 bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20 shadow-sm transition-all active:scale-95"
                            >
                                <ClipboardList className="h-4 w-4" />
                                Update Result
                            </Button>
                        </>
                    )}
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12 rounded-xl font-black transition-all active:scale-95">
                        Close Details
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
