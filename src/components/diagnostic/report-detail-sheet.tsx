"use client"

import { PrintReport } from "@/components/diagnostic/print-report"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { useDiagnosticReport, useUpdateDeliveryStatus } from "@/hooks/diagnostic-queries"
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
    const win = window.open("", "_blank", "width=900,height=700")
    if (!win) return
    win.document.write(`
        <html>
        <head>
            <title>Lab Report</title>
            <style>
                body { margin: 0; padding: 0; font-family: 'Times New Roman', serif; background: white; color: black; }
                table { border-collapse: collapse; width: 100%; border: 1px solid black; }
                th, td { padding: 4px 8px; border: 1px solid #ddd; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .report-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid black; }
                @page { margin: 10mm; size: A4; }
                @media print { body { -webkit-print-color-adjust: exact; } }
            </style>
        </head>
        <body>${el.innerHTML}</body>
        </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
}

export function ReportDetailSheet({ open, onOpenChange, report }: ReportDetailSheetProps) {
    const { data: detailRes, isLoading } = useDiagnosticReport(report?.id ?? "")
    const detail = detailRes?.data ?? report
    
    const { mutate: updateDelivery, isPending: isUpdating } = useUpdateDeliveryStatus()

    const result = detail?.result as DiagnosticResult | null

    const handleUpdateDelivery = (status: 'pending' | 'delivered' | 'cancelled') => {
        if (!detail?.id) return
        updateDelivery({ id: detail.id, data: { deliveryStatus: status } })
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
                            <Badge variant="outline" className={cn(
                                "rounded-lg font-bold uppercase text-[9px] tracking-tight py-1 px-2",
                                detail.deliveryStatus === 'delivered' && "border-emerald-500/30 text-emerald-600 bg-emerald-500/10",
                                detail.deliveryStatus === 'pending' && "border-amber-500/30 text-amber-600 bg-amber-500/10",
                                detail.deliveryStatus === 'cancelled' && "border-rose-500/30 text-rose-600 bg-rose-500/10",
                            )}>
                                Delivery: {detail.deliveryStatus || 'pending'}
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
                                <InfoRow label="Barcode" value={detail.barcode} />
                                <InfoRow label="UHID" value={(detail.patient as any)?.patientNumber || detail.patientId.substring(0,8)} />
                            </Section>
                        </div>

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
                                        {result.mode.toUpperCase()}
                                    </Badge>
                                </div>

                                {result.machineInfo && (
                                    <p className="text-[10px] italic text-muted-foreground bg-muted/50 p-2 rounded-lg border border-dashed text-center">
                                        {result.machineInfo}
                                    </p>
                                )}

                                <div className="bg-muted/30 rounded-2xl overflow-hidden border">
                                    {result.mode === 'table' && result.rows ? (
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
                                                            <p className="text-[9px] text-muted-foreground mt-0.5">Ref: {row.referenceRange}</p>
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
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Prepared: {result.preparedBy || detail.technician?.name || "System"}</p>
                                     </div>
                                     {detail.approvedBy && (
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <p className="text-[10px] font-bold text-emerald-800 uppercase">Signed: {detail.approvedBy.name}</p>
                                        </div>
                                     )}
                                </div>
                            </div>
                        )}

                        {/* Metadata Sections */}
                        <div className="grid grid-cols-2 gap-6">
                            <Section title="Collection" icon={Beaker}>
                                <InfoRow label="Status" value={detail.sampleStatus} />
                                <InfoRow label="At" value={detail.sampleCollectedAt ? format(new Date(detail.sampleCollectedAt), 'dd MMM, hh:mm a') : null} />
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
                                    disabled={isUpdating || detail.deliveryStatus === 'delivered'}
                                    onClick={() => handleUpdateDelivery('delivered')}
                                    className="flex-1 rounded-lg h-9 text-[10px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white border-none gap-2"
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Mark Delivered
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={isUpdating || detail.deliveryStatus === 'cancelled'}
                                    onClick={() => handleUpdateDelivery('cancelled')}
                                    className="flex-1 rounded-lg h-9 text-[10px] font-black uppercase bg-rose-600 hover:bg-rose-700 text-white border-none gap-2"
                                >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Cancel Delivery
                                </Button>
                                {detail.deliveryStatus !== 'pending' && (
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        disabled={isUpdating}
                                        onClick={() => handleUpdateDelivery('pending')}
                                        className="h-9 px-3 rounded-lg text-[10px] font-black uppercase border-dashed"
                                    >
                                        Reset
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

                <div className="p-6 border-t bg-muted/10 flex gap-4 shrink-0">
                    {detail?.reportStatus === 'completed' && (
                        <Button
                            onClick={handlePrint}
                            className="flex-1 h-12 rounded-xl font-black gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            <Printer className="h-4 w-4" />
                            Generate Print Report
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12 rounded-xl font-black transition-all active:scale-95">
                        Close Details
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
