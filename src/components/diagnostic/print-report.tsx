"use client"

import { useDiagnosticReport } from "@/hooks/diagnostic-queries"
import { DiagnosticReport } from "@/types/diagnostic"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"

interface PrintReportProps {
    report: DiagnosticReport
}

/**
 * Parses the result field which may be:
 *  - New format: { param: { value, unit, referenceRange } }
 *  - Legacy format: { param: "string value" }
 */
function parseResults(result: Record<string, any> | null) {
    if (!result) return []
    return Object.entries(result).map(([param, data]) => {
        if (typeof data === "object" && data !== null && "value" in data) {
            return {
                parameter: param,
                value: String(data.value ?? ""),
                unit: String(data.unit ?? ""),
                referenceRange: String(data.referenceRange ?? ""),
            }
        }
        return { parameter: param, value: String(data), unit: "", referenceRange: "" }
    })
}

export function PrintReport({ report }: PrintReportProps) {
    // Fetch full details (has full patient object with patientNumber etc.)
    const { data: detailRes, isLoading } = useDiagnosticReport(report.id)
    const detail = detailRes?.data

    const patient = (detail?.patient ?? report.patient) as any
    const saleItem = (detail as any)?.saleItem
    const technician = (detail as any)?.technician
    const approvedBy = (detail as any)?.approvedBy

    const results = parseResults((detail?.result ?? report.result) as any)
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
            className="bg-white text-black font-['Times_New_Roman',serif] text-[11pt] leading-tight"
            style={{ width: "210mm", minHeight: "160mm", padding: "6mm 8mm 10mm" }}
        >
            {/* Top barcodes row */}
            <div className="flex justify-between items-start mb-3">
                <div className="font-mono text-xs tracking-widest border border-black px-1 py-0.5">
                    {/* barcode placeholder — actual barcode rendering */}
                    <span className="text-[8pt] font-mono">{barcode}</span>
                </div>
                <div className="font-mono text-xs tracking-widest border border-black px-1 py-0.5">
                    <span className="text-[8pt] font-mono">{barcode}</span>
                </div>
            </div>

            {/* Report title */}
            <div className="text-center font-bold text-[13pt] uppercase tracking-wider mb-2 underline">
                {report.diagnosticTest?.name
                    ? `${report.diagnosticTest.name} Report`
                    : "Diagnostic Report"}
            </div>

            {/* Patient info table */}
            <table className="w-full border-collapse text-[10pt] mb-3">
                <tbody>
                    <tr>
                        <td className="pr-2 py-0.5 w-24 font-semibold whitespace-nowrap">Bill ID</td>
                        <td className="pr-4 py-0.5">: {saleItem?.invoiceNumber ?? barcode}</td>
                        <td className="pr-2 py-0.5 font-semibold whitespace-nowrap">Delivery Date</td>
                        <td className="py-0.5">: {detail?.approvedAt ? format(new Date(detail.approvedAt), "dd-MM-yyyy hh:mm a") : "—"}</td>
                    </tr>
                    <tr>
                        <td className="pr-2 py-0.5 font-semibold whitespace-nowrap">UHID</td>
                        <td className="pr-4 py-0.5">: {patient?.patientNumber ?? patient?.id?.substring(0, 8)}</td>
                        <td className="pr-2 py-0.5 font-semibold whitespace-nowrap">Received Date</td>
                        <td className="py-0.5">: {detail?.createdAt ? format(new Date(detail.createdAt), "dd-MM-yyyy hh:mm a") : "—"}</td>
                    </tr>
                    <tr>
                        <td className="pr-2 py-0.5 font-semibold">Patient Name</td>
                        <td className="pr-4 py-0.5">: {patient?.name}</td>
                        <td className="pr-2 py-0.5 font-semibold">Age</td>
                        <td className="py-0.5">: {patient?.age ? `${patient.age}Y 0M 0D` : "—"}</td>
                    </tr>
                    <tr>
                        <td className="pr-2 py-0.5 font-semibold">Consultant</td>
                        <td className="pr-4 py-0.5">: {(detail as any)?.approvedBy?.name ?? "—"}</td>
                        <td className="pr-2 py-0.5 font-semibold">Sex</td>
                        <td className="py-0.5">: {patient?.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : "—"}</td>
                    </tr>
                    <tr>
                        <td className="pr-2 py-0.5 font-semibold">Specimen</td>
                        <td className="pr-4 py-0.5" colSpan={3}>: {detail?.sampleDetails ?? "Blood"}</td>
                    </tr>
                </tbody>
            </table>

            {/* Separator */}
            <hr className="border-black mb-2" />

            {/* Results table */}
            <table className="w-full border-collapse text-[10pt] mb-4">
                <thead>
                    <tr className="border-y border-black">
                        <th className="text-left py-1 pr-4 font-bold">Test</th>
                        <th className="text-left py-1 pr-4 font-bold">Result</th>
                        <th className="text-left py-1 pr-4 font-bold">Unit</th>
                        <th className="text-left py-1 font-bold">Reference Range</th>
                    </tr>
                </thead>
                <tbody>
                    {results.length > 0 ? results.map((row, i) => (
                        <tr key={i} className="border-b border-gray-300">
                            <td className="py-1 pr-4">{row.parameter}</td>
                            <td className="py-1 pr-4 font-bold">{row.value}</td>
                            <td className="py-1 pr-4">{row.unit}</td>
                            <td className="py-1">{row.referenceRange}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={4} className="py-2 text-center text-gray-500 italic text-[9pt]">No results recorded</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Notes */}
            {detail?.reportNotes && (
                <p className="text-[9pt] italic mb-4">Note: {detail.reportNotes}</p>
            )}

            {/* Footer */}
            <div className="flex justify-between items-end mt-6">
                <div className="text-[9pt]">
                    <p className="font-bold">{technician?.name ?? "—"}</p>
                    <p>Medical Technologist (Lab)</p>
                </div>
                <div className="text-[9pt] text-right">
                    <p>Printed By: {approvedBy?.name ?? technician?.name ?? "—"}</p>
                    {detail?.approvedAt && (
                        <p>Printing Time: {format(new Date(detail.approvedAt), "dd-MM-yyyy hh:mm a")}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
