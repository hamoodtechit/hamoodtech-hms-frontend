"use client"

import { useDiagnosticReport } from "@/hooks/diagnostic-queries"
import { cn } from "@/lib/utils"
import { DiagnosticBlock, DiagnosticColumnDef, DiagnosticReport, DiagnosticResult } from "@/types/diagnostic"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useAuthStore } from "@/store/use-auth-store"

interface PrintReportProps {
    report: DiagnosticReport
}

const DEFAULT_COLUMNS: DiagnosticColumnDef[] = [
    { id: '1', label: 'Test / Parameter', key: 'parameter', isVisible: true, width: '40%' },
    { id: '2', label: 'Result', key: 'value', isVisible: true, width: '15%' },
    { id: '3', label: 'Unit', key: 'unit', isVisible: true, width: '15%' },
    { id: '4', label: 'Reference Range', key: 'referenceRange', isVisible: true, width: '30%' }
]

export function PrintReport({ report }: PrintReportProps) {
    // Fetch full details (has full patient object with patientNumber etc.)
    const { data: detailRes, isLoading } = useDiagnosticReport(report.id)
    const { user } = useAuthStore()
    const detail = detailRes?.data ?? report

    const patient = (detail?.patient) as any
    const technician = (detail as any)?.technician
    const approvedBy = (detail as any)?.approvedBy

    const result = detail?.result as DiagnosticResult | null
    const barcode = detail?.barcode ?? report.barcode ?? report.id

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div
            id="print-report"
            className="bg-white text-black font-['Times_New_Roman',serif] text-[10.5pt] leading-tight mx-auto relative overflow-hidden"
            style={{ width: "210mm", minHeight: "297mm", padding: "0" }}
        >
            {/* Vertical Metadata */}
            <div className="absolute -left-16 top-1/2 -translate-y-1/2 -rotate-90 text-[8pt] text-black/30 tracking-widest whitespace-nowrap hidden print:block font-bold font-sans">
                PRINTED BY: {user?.fullName?.toUpperCase()} {user?.phone ? `(${user.phone})` : ''} - {new Date().toLocaleString()}
            </div>

            {/* Main Content Area - Added top margin for Pad compatibility */}
            <div className="px-10 py-6 pt-[20mm] relative z-10 min-h-[290mm] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-6 border-b-2 border-black pb-2">
                    <div className="text-[12pt] font-black tracking-tight text-primary uppercase">
                        Lab Report
                    </div>
                    <div className="font-mono text-[9pt] bg-black text-white px-2 py-0.5 rounded-sm">
                        ID: {barcode.toUpperCase()}
                    </div>
                </div>

                {/* Custom Report Header */}
                <div className="text-center font-bold text-[15pt] uppercase tracking-wider mb-2 underline decoration-1 underline-offset-4">
                    {result?.reportHeader || (detail?.diagnosticTest?.name ? `${detail.diagnosticTest.name} Report` : "Diagnostic Report")}
                </div>

                {/* Patient info table */}
                <div className="border border-black p-3 rounded-md mb-4 bg-muted/5">
                    <table className="w-full border-collapse text-[10.5pt]">
                        <tbody>
                            <tr>
                                <td className="pr-1 py-1 w-[15%] font-bold">Lab ID</td>
                                <td className="pr-4 py-1 w-[35%]">: <span className="font-mono">{barcode.toUpperCase()}</span></td>
                                <td className="pr-1 py-1 w-[20%] font-bold">Delivery Date</td>
                                <td className="py-1 w-[30%]">: {detail?.approvedAt ? format(new Date(detail.approvedAt), "dd-MM-yyyy hh:mm a") : format(new Date(), "dd-MM-yyyy hh:mm a")}</td>
                            </tr>
                            <tr>
                                <td className="pr-1 py-1 font-bold">UHID</td>
                                <td className="pr-4 py-1">: {patient?.patientNumber ?? patient?.uhid ?? patient?.id?.substring(0, 8)}</td>
                                <td className="pr-1 py-1 font-bold">Received Date</td>
                                <td className="py-1">: {detail?.createdAt ? format(new Date(detail.createdAt), "dd-MM-yyyy hh:mm a") : "—"}</td>
                            </tr>
                            <tr>
                                <td className="pr-1 py-1 font-bold">Patient Name</td>
                                <td className="pr-4 py-1">: <span className="font-black uppercase text-[11pt]">{patient?.name}</span></td>
                                <td className="pr-1 py-1 font-bold">Age / Sex</td>
                                <td className="py-1">: {patient?.age ? `${patient.age}Y` : "—"} / {patient?.gender?.toUpperCase() || "—"}</td>
                            </tr>
                            <tr>
                                <td className="pr-1 py-1 font-bold">Address</td>
                                <td className="pr-4 py-1" colSpan={3}>: {patient?.address || "—"}</td>
                            </tr>
                            <tr>
                                <td className="pr-1 py-1 font-bold">Consultant</td>
                                <td className="pr-4 py-1 text-[10pt]">
                                    : <span className="font-bold">{result?.consultantName || (detail as any)?.sale?.doctor?.name || "—"}</span>
                                    {result?.consultantDesignation && <span className="text-[8.5pt] ml-1 opacity-70">({result.consultantDesignation})</span>}
                                </td>
                                <td className="pr-1 py-1 font-bold">Specimen</td>
                                <td className="py-1">: <span className="font-bold">{detail?.sampleDetails || "—"}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Machine/Method Info */}
                {result?.machineInfo && (
                    <div className="text-center italic text-[9.5pt] mb-4 font-semibold text-gray-700">
                        ({result.machineInfo})
                    </div>
                )}

                {/* DYNAMIC BLOCK RENDERING */}
                <div className="space-y-4">
                    {result?.blocks && Array.isArray(result.blocks) && result.blocks.length > 0 ? (
                        <div className="flex flex-col">
                            {(() => {
                                const blocks = result.blocks as DiagnosticBlock[];
                                const renderedElements: React.ReactNode[] = [];
                                let currentGroup: DiagnosticBlock[] = [];

                                const renderGroup = (group: DiagnosticBlock[]) => {
                                    if (group.length === 0) return null;
                                    const firstBlock = group[0];
                                    const columns = (firstBlock.columnDefs && firstBlock.columnDefs.length > 0) 
                                        ? firstBlock.columnDefs.filter(c => c.isVisible) 
                                        : DEFAULT_COLUMNS;

                                    return (
                                        <table key={`group-${group[0].id || Math.random()}`} className="w-full border-collapse mb-6 text-[10.5pt]">
                                            <thead>
                                                <tr className="border-y-2 border-black bg-gray-50/50">
                                                    {columns.map((col, i) => (
                                                        <th 
                                                            key={i} 
                                                            style={{ width: col.width }} 
                                                            className={cn(
                                                                "py-2 px-1 font-black uppercase text-[9pt] tracking-widest",
                                                                col.key !== 'parameter' && "text-center",
                                                                col.key === 'parameter' && "text-left pl-2"
                                                            )}
                                                        >
                                                            {col.label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {group.map((block, bIdx) => (
                                                    <tr 
                                                        key={bIdx} 
                                                        className={cn(
                                                            "border-b border-gray-200 transition-colors",
                                                            block.isHeader && "bg-blue-50/10"
                                                        )}
                                                    >
                                                        {columns.map((col, cIdx) => {
                                                            const isCore = ['parameter', 'value', 'unit', 'referenceRange'].includes(col.key);
                                                            const val = isCore ? (block as any)[col.key] : (block.extraValues?.[col.key] || "");
                                                            const isResult = col.key === 'value';
                                                            const isParameter = col.key === 'parameter';

                                                            return (
                                                                <td 
                                                                    key={cIdx} 
                                                                    style={{ width: col.width }} 
                                                                    className={cn(
                                                                        "py-2 px-1 text-[10pt] leading-snug break-words whitespace-pre-wrap",
                                                                        col.key !== 'parameter' && "text-center",
                                                                        isParameter && (block.isBold || block.isHeader) ? (block.isHeader ? "font-black text-blue-900 uppercase text-[10.5pt] underline" : "font-bold italic text-blue-900") : "",
                                                                        isResult && "font-black"
                                                                    )}
                                                                >
                                                                    {isResult ? (
                                                                        <div className={cn(block.isAbnormal && "text-red-700 underline decoration-1")}>
                                                                            {block.isHeader && !isParameter ? "" : val}
                                                                            {block.isAbnormal && <span className="ml-1 text-[8pt] text-red-600 font-black"> (H)</span>}
                                                                        </div>
                                                                    ) : (block.isHeader && !isParameter ? "" : val)}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    );
                                };

                                blocks.forEach((block, idx) => {
                                    if (block.type === 'parameter') {
                                        currentGroup.push(block);
                                    } else {
                                        if (currentGroup.length > 0) {
                                            renderedElements.push(renderGroup(currentGroup));
                                            currentGroup = [];
                                        }

                                        if (block.type === 'header') {
                                            renderedElements.push(
                                                <div key={`header-${idx}`} className="py-2 border-b-2 border-black mt-4 first:mt-0 mb-4">
                                                    <h3 className="font-black text-[13pt] uppercase tracking-tight text-blue-900 leading-none">
                                                        {block.content || block.headerText || block.parameter}
                                                    </h3>
                                                </div>
                                            );
                                        } else if (block.type === 'narrative' || block.type === 'impression') {
                                            renderedElements.push(
                                                <div key={`text-${idx}`} className={cn("py-4 mb-4", block.type === 'impression' && "mt-4 pt-6 border-t-2 border-dashed border-gray-300")}>
                                                    {block.type === 'impression' && (
                                                        <span className="font-black underline text-[11pt] mr-3 uppercase">IMPRESSION / CONCLUSION:</span>
                                                    )}
                                                    <div 
                                                        className={cn(
                                                            "leading-relaxed text-[11.5pt]",
                                                            block.type === 'impression' ? "font-bold inline" : "font-medium"
                                                        )}
                                                        style={{ textAlign: 'justify' }}
                                                        dangerouslySetInnerHTML={{ __html: block.content || "" }}
                                                    />
                                                </div>
                                            );
                                        }
                                    }
                                });

                                if (currentGroup.length > 0) {
                                    renderedElements.push(renderGroup(currentGroup));
                                }

                                return renderedElements;
                            })()}
                        </div>
                    ) : (
                        /* BACKWARD COMPATIBILITY RENDERING */
                        <>
                            {/* Table Mode */}
                            {result?.mode === 'table' && result.rows && (
                                <table className="w-full border-collapse text-[11pt] mb-8">
                                    <thead>
                                        <tr className="border-y-2 border-black bg-gray-100/50">
                                            <th className="text-left py-2 pr-4 font-black uppercase text-[9.5pt] w-[40%]">Test / Parameter</th>
                                            <th className="text-left py-2 pr-4 font-black uppercase text-[9.5pt] w-[18%] text-center">Result</th>
                                            <th className="text-left py-2 pr-4 font-black uppercase text-[9.5pt] w-[12%] text-center">Unit</th>
                                            <th className="text-left py-2 font-black uppercase text-[9.5pt] w-[30%]">Reference Range</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(result.rows || []).map((row, i) => (
                                            row.isHeader ? (
                                                <tr key={i}>
                                                    <td colSpan={4} className="py-2.5 pt-5 font-black text-blue-900 uppercase text-[10pt] border-b border-gray-200">
                                                        {row.parameter}
                                                    </td>
                                                </tr>
                                            ) : (
                                                <tr key={i} className="border-b border-gray-100">
                                                    <td className={cn("py-2 pr-4", row.isBold && "font-bold")}>{row.parameter}</td>
                                                    <td className={cn("py-2 pr-4 font-black text-center", row.isAbnormal && "text-red-700 underline")}>
                                                        {row.value}
                                                        {row.isAbnormal && <span className="ml-1 text-[8pt] text-red-600 font-black"> (H)</span>}
                                                    </td>
                                                    <td className="py-2 pr-4 text-[10pt] text-center">{row.unit}</td>
                                                    <td className="py-2 text-[10pt] whitespace-pre-line leading-tight italic text-gray-600">{row.referenceRange}</td>
                                                </tr>
                                            )
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* Narrative Mode */}
                            {result?.mode === 'narrative' && (
                                <div className="space-y-10 py-6 border-b border-gray-100 mb-8">
                                    <div 
                                        className="whitespace-pre-wrap leading-[1.8] text-[11.5pt] font-medium" 
                                        style={{ textAlign: 'justify' }}
                                        dangerouslySetInnerHTML={{ __html: result.content || "" }}
                                    />
                                    {result.interpretation && (
                                        <div className="pt-10 mt-10 border-t border-dashed border-gray-300">
                                            <div className="flex items-start gap-4">
                                                <span className="font-black underline text-[11pt] shrink-0">IMPRESSION:</span>
                                                <span className="font-bold text-[11.5pt] leading-snug">{result.interpretation}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Notes */}
                {detail?.reportNotes && (
                    <div className="p-3 bg-amber-50/30 rounded-lg border border-amber-100 mb-8">
                        <p className="text-[9pt] italic text-amber-800"><span className="font-bold not-italic">Note:</span> {detail.reportNotes}</p>
                    </div>
                )}

                {/* Signature Section - Rock-solid Table Layout for Print */}
                <table className="w-full mt-auto pt-16 border-none font-serif">
                    <tbody>
                        <tr>
                            {/* Left: Prepared By */}
                            <td className="text-left align-bottom w-1/3 text-[10.5pt]">
                                <span className="font-bold border-b-2 border-black pb-0.5">Prepared By</span>
                                <span className="font-bold whitespace-nowrap">&nbsp; {result?.preparedBy || (technician?.name) || "—"}</span>
                            </td>

                            {/* Center: Checked By */}
                            <td className="text-center align-bottom w-1/3 text-[10.5pt]">
                                <span className="font-bold border-b-2 border-black pb-0.5 whitespace-nowrap">Checked By</span>
                            </td>
                            
                            {/* Right: Doctor / Verified */}
                            <td className="text-right align-bottom w-1/3">
                                <p className="font-black border-b-2 border-black pb-0.5 uppercase tracking-tight text-[11pt] whitespace-nowrap inline-block">
                                    {approvedBy?.name || "—"}
                                </p>
                                <div className="mt-1 flex flex-col items-end">
                                    <p className="text-[9.5pt] font-black italic leading-tight">
                                        {result?.doctorDegrees && result.doctorDegrees !== "—" ? result.doctorDegrees : "—"}
                                    </p>
                                    <p className="text-[8.5pt] font-bold text-gray-700 italic leading-tight uppercase tracking-tight">
                                        {result?.doctorDesignation || approvedBy?.designation?.name || "—"}
                                    </p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    )
}
