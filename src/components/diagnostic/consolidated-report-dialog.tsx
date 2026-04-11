"use client"

import { PrintReport } from "@/components/diagnostic/print-report"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useDiagnosticReport, useDiagnosticReports } from "@/hooks/diagnostic-queries"
import { cn } from "@/lib/utils"
import { DiagnosticReport, DiagnosticResult } from "@/types/diagnostic"
import { Activity, Beaker, CheckCircle2, FlaskConical, Loader2, Printer, User } from "lucide-react"
import { useMemo, useState } from "react"

interface ConsolidatedReportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    patientId: string
    branchId: string
}

export function ConsolidatedReportDialog({ open, onOpenChange, patientId, branchId }: ConsolidatedReportDialogProps) {
    // Fetch all completed reports for this patient
    const { data: reportsRes, isLoading: isListLoading } = useDiagnosticReports({
        patientId,
        branchId,
        reportStatus: 'completed',
        limit: 100
    }, { enabled: open && !!patientId })

    const reports = reportsRes?.data || []
    
    // Fetch full details of the first report to get 'Perfect Data' (Age, Gender, Invoice Number)
    const firstReportId = reports[0]?.id
    const { data: detailedReportRes, isLoading: isDetailLoading } = useDiagnosticReport(firstReportId as string)
    const detailedReport = detailedReportRes?.data
    
    const isLoading = isListLoading || isDetailLoading

    // Group reports by Test Group
    const groups = useMemo(() => {
        const grouped: Record<string, { id: string, name: string, reports: DiagnosticReport[] }> = {}
        
        reports.forEach(report => {
            const firstTest = report.diagnosticTests?.[0];
            const group = firstTest?.service?.testGroup || { id: 'uncategorized', name: 'Other Results' }
            if (!grouped[group.id]) {
                grouped[group.id] = { id: group.id, name: group.name, reports: [] }
            }
            grouped[group.id].reports.push(report)
        })

        return Object.values(grouped)
    }, [reports])

    const patient = reports[0]?.patient

    const handlePrintGroup = (group: { name: string, reports: DiagnosticReport[] }) => {
        const win = window.open("", "_blank", "width=1024,height=800")
        if (!win) return
        
        // Use the detailed report for the header if available, otherwise use the first from group
        const headerReport = (detailedReport?.id === group.reports[0]?.id ? detailedReport : group.reports[0]) || detailedReport || group.reports[0]
        const resultData = headerReport?.result as DiagnosticResult | null

        const reportHtml = `
            <div class="group-section">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th style="width: 45%">Test</th>
                            <th style="width: 20%; text-align: center;">Result</th>
                            <th style="width: 15%; text-align: center;">Unit</th>
                            <th style="width: 20%; text-align: right;">Reference Range</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${group.reports.map(report => {
                            const result = report.result as DiagnosticResult | null
                            const blocks = (result?.blocks || []).filter(b => b.type === 'parameter')
                            
                            return `
                                <tr class="test-row-header">
                                    <td colspan="4" style="font-weight: 900; background: #f9f9f9; padding: 6px 10px;">${report.diagnosticTests?.map(t => t.itemName).join(', ')}</td>
                                </tr>
                                ${blocks.map(block => `
                                    <tr style="${block.isHeader ? 'background: #fafafa; font-weight: bold;' : ''}">
                                        <td style="padding-left: ${block.isHeader ? '10px' : '20px'};">${block.parameter}</td>
                                        <td style="text-align: center; font-weight: 900; ${block.isAbnormal ? 'color: red;' : ''}">${block.value || ''}</td>
                                        <td style="text-align: center;">${block.unit || ''}</td>
                                        <td style="text-align: right; font-size: 9pt;">${block.referenceRange || ''}</td>
                                    </tr>
                                `).join('')}
                                ${(result?.rows || []).map(row => `
                                    <tr>
                                        <td style="padding-left: 20px;">${row.parameter}</td>
                                        <td style="text-align: center; font-weight: 900;">${row.value}</td>
                                        <td style="text-align: center;">${row.unit || ''}</td>
                                        <td style="text-align: right; font-size: 9pt;">${row.referenceRange || ''}</td>
                                    </tr>
                                `).join('')}
                            `
                        }).join('')}
                    </tbody>
                </table>
                <div style="margin-top: 15px; font-size: 9pt; font-style: italic; text-align: center; opacity: 0.8;">
                    (Tests are carried out by automated laboratory analyzers)
                </div>
            </div>
        `

        win.document.write(`
            <html>
            <head>
                <title>${group.name} Report - ${patient?.name || 'Patient'}</title>
                <style>
                    body { margin: 0; padding: 45mm 15mm 20mm 15mm; font-family: 'Arial', sans-serif; font-size: 10pt; line-height: 1.4; color: #000; }
                    .patient-box { border: 1.5px solid #000; padding: 12px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; border-radius: 4px; }
                    .info-row { display: flex; justify-content: space-between; gap: 10px; }
                    .label { font-weight: bold; min-width: 90px; }
                    .value { flex: 1; border-bottom: 1px dotted #ccc; }
                    
                    .category-header { text-align: center; font-size: 16pt; font-weight: 900; text-transform: uppercase; margin-bottom: 25px; letter-spacing: 1px; }
                    
                    .results-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .results-table th { border: 1.5px solid #000; padding: 8px; background: #eee; text-transform: uppercase; font-size: 9pt; }
                    .results-table td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
                    
                    .report-footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
                    .foot-left { font-size: 9pt; line-height: 1.3; }
                    .print-info { text-align: right; font-size: 8pt; margin-top: 40px; }
                    
                    @page { margin: 0; size: A4; }
                    @media print { body { -webkit-print-color-adjust: exact; } }
                </style>
            </head>
            <body>
                <div class="category-header">${group.name} REPORT</div>
                
                <div class="patient-box">
                    <div class="info-row"><span class="label">Bill ID</span> <span class="value">: ${headerReport?.sale?.invoiceNumber || 'N/A'}</span></div>
                    <div class="info-row"><span class="label">Delivery Date</span> <span class="value">: ${headerReport?.updatedAt ? new Date(headerReport.updatedAt).toLocaleDateString() : 'N/A'}</span></div>
                    
                    <div class="info-row"><span class="label">UHID</span> <span class="value">: ${headerReport?.patient?.uhid || 'N/A'}</span></div>
                    <div class="info-row"><span class="label">Received Date</span> <span class="value">: ${new Date(headerReport?.createdAt || '').toLocaleDateString()}</span></div>
                    
                    <div class="info-row"><span class="label">Patient Name</span> <span class="value">: ${headerReport?.patient?.name}</span></div>
                    <div class="info-row"><span class="label">Age / Sex</span> <span class="value">: ${headerReport?.patient?.age || 'N/A'} Y / ${headerReport?.patient?.gender || 'N/A'}</span></div>
                    
                    <div class="info-row"><span class="label">Consultant</span> <span class="value">: ${resultData?.consultantName || headerReport?.doctor?.fullName || 'SELF'}</span></div>
                    <div class="info-row"><span class="label">Specimen</span> <span class="value">: ${headerReport?.note || 'Sample'}</span></div>
                </div>

                ${reportHtml}

                <div class="report-footer">
                    <div class="foot-left">
                        <strong>${headerReport?.medicalTechnologistId || 'Verified & Digital Signature Approved'}</strong><br/>
                        Medical Technologist (Lab)
                    </div>
                </div>
                
                <div class="print-info">
                    Printed at: ${new Date().toLocaleString()}
                </div>
            </body>
            </html>
        `)
        win.document.close()
        setTimeout(() => { win.print(); win.close() }, 500)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden rounded-3xl">
                <DialogHeader className="p-6 pb-2 bg-indigo-600">
                    <DialogTitle className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        <FlaskConical className="w-6 h-6" />
                        Patient Diagnostic Grouping
                    </DialogTitle>
                    <DialogDescription className="text-indigo-100 font-medium">
                        View and print merged reports categorized by test group.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-0 flex flex-col h-[70vh]">
                    <div className="px-6 py-4 bg-muted/20 border-b flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm">{patient?.name || 'Loading patient...'}</h3>
                                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{patient?.phone || patient?.uhid || 'Scanning identity...'}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="h-10 px-4 rounded-xl font-black bg-white shadow-sm border-indigo-100 text-indigo-700">
                             {reports.length} COMPLETED TESTS
                        </Badge>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                                <p className="text-sm font-black uppercase mt-4 tracking-widest text-indigo-900">Analyzing Visit Data...</p>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
                                <Beaker className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                                <p className="text-sm font-bold text-muted-foreground">No completed reports found to merge.</p>
                                <p className="text-xs text-muted-foreground mt-1">Ensure results are approved and completed.</p>
                            </div>
                        ) : (
                            <div className="space-y-10 pb-10" id="consolidated-print-area">
                                {groups.map(group => (
                                    <div key={group.id} className="report-group-section space-y-6">
                                        <div className="flex items-center gap-3">
                                            <Separator className="flex-1" />
                                            <div className="flex flex-col items-center gap-2 px-4 shadow-sm bg-indigo-50 rounded-2xl py-2 border border-indigo-100">
                                                <Badge className="rounded-full font-black uppercase text-[10px] tracking-widest px-4 py-1.5 bg-indigo-600">
                                                    {group.name} CATEGORY
                                                </Badge>
                                                <Button 
                                                    size="sm" 
                                                    className="h-9 px-6 text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl bg-indigo-600 text-white border-none shadow-lg shadow-indigo-200 hover:bg-slate-900 transition-all"
                                                    onClick={() => handlePrintGroup(group)}
                                                >
                                                    <Printer className="h-3.5 w-3.5" />
                                                    Print {group.name} Report
                                                </Button>
                                            </div>
                                            <Separator className="flex-1" />
                                        </div>

                                        <div className="space-y-4">
                                            {group.reports.map((report, idx) => {
                                                const result = report.result as DiagnosticResult | null
                                                return (
                                                    <div key={idx} className="bg-card/40 rounded-2xl border-2 border-border/50 overflow-hidden shadow-xl shadow-black/5 hover:shadow-black/10 transition-all">
                                                        <div className="px-4 py-2 bg-secondary/30 flex items-center justify-between border-b border-border/50">
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {report.diagnosticTests?.map((t, i) => (
                                                                    <Badge key={i} variant="secondary" className="h-5 text-[9px] font-black">{t.service?.name || t.itemName}</Badge>
                                                                ))}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                                <span className="text-[10px] font-black text-emerald-500/80 uppercase">{report.status}</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-4">
                                                            {/* Result Table Headers */}
                                                            <div className="grid grid-cols-12 gap-2 mb-2 pb-1 border-b border-border/40 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                                                                <div className="col-span-5">Test Parameter</div>
                                                                <div className="col-span-3 text-center">Result / Unit</div>
                                                                <div className="col-span-4 text-right">Reference Range</div>
                                                            </div>

                                                            {result?.blocks && (
                                                                <div className="space-y-1">
                                                                    {result.blocks.filter(b => b.type === 'parameter').map((block, bIdx) => (
                                                                        <div key={bIdx} className="grid grid-cols-12 gap-2 py-2 border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors rounded-lg px-1 -mx-1">
                                                                            <div className="col-span-5">
                                                                                <p className={cn("text-xs font-bold text-foreground", block.isBold && "font-black underline decoration-primary/20")}>
                                                                                    {block.parameter}
                                                                                </p>
                                                                            </div>
                                                                            <div className="col-span-3 text-center">
                                                                                <div className="inline-flex flex-col">
                                                                                    <span className={cn("text-xs font-black text-primary", block.isAbnormal && "text-destructive bg-destructive/10 px-1.5 rounded")}>
                                                                                        {block.value}
                                                                                    </span>
                                                                                    <span className="text-[8px] uppercase font-black text-muted-foreground">{block.unit}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="col-span-4 text-right">
                                                                                <p className="text-[10px] text-muted-foreground font-bold">{block.referenceRange}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {/* Legacy support */}
                                                            {result?.rows && (
                                                                <div className="space-y-1">
                                                                    {result.rows.map((row, rIdx) => (
                                                                        <div key={rIdx} className="grid grid-cols-12 gap-2 py-2 border-b border-border/20 last:border-0">
                                                                            <div className="col-span-5">
                                                                                <p className="text-xs font-bold text-foreground">{row.parameter}</p>
                                                                            </div>
                                                                            <div className="col-span-3 text-center">
                                                                                <span className="text-xs font-black text-primary">{row.value} {row.unit}</span>
                                                                            </div>
                                                                            <div className="col-span-4 text-right">
                                                                                <p className="text-[10px] text-muted-foreground font-bold">{row.referenceRange}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}
