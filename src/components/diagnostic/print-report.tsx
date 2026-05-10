"use client"

import { useDiagnosticReport } from "@/hooks/diagnostic-queries"
import { cn } from "@/lib/utils"
import { DiagnosticBlock, DiagnosticColumnDef, DiagnosticReport, DiagnosticResult } from "@/types/diagnostic"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useMemo } from "react"
import { toast } from "sonner"
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
    const doctor = (detail?.doctor) as any
    const result = detail?.result as DiagnosticResult | null
    const barcode = detail?.barcode ?? report.barcode ?? report.id

    // --- LOGIC: Group blocks by their Test Group (Header) ---
    const groupReports = useMemo(() => {
        if (!result?.blocks || !Array.isArray(result.blocks)) return [];
        
        const groups: { title: string; blocks: DiagnosticBlock[]; tests?: any[] }[] = [];
        let currentGroup: { title: string; blocks: DiagnosticBlock[]; tests?: any[] } | null = null;

        // Extract potential test name from the result data linkage
        const testItems = (detail as any)?.testItems || (detail as any)?.sale?.saleItems || [];

        result.blocks.forEach((block) => {
            if (block.type === 'header') {
                let title = (block.content || block.headerText || block.parameter || "Diagnostic Report").toUpperCase();
                
                // If it's a generic "OTHER TESTS" or "LABORATORY REPORT", try to find a specific test name
                if (title === "OTHER TESTS" || title === "LABORATORY REPORT" || title === "DIAGNOSTIC REPORT") {
                    const firstTestName = testItems[0]?.itemName || testItems[0]?.service?.name;
                    if (firstTestName) {
                        title = firstTestName.toUpperCase();
                    }
                }

                // Start a new group
                currentGroup = {
                    title,
                    blocks: [],
                    tests: testItems // Link all tests for metadata access
                };
                groups.push(currentGroup);
            } else if (currentGroup) {
                // Add to current group
                currentGroup.blocks.push(block);
            } else {
                // Fallback for blocks before any header
                const title = (testItems[0]?.itemName || testItems[0]?.service?.name || "LABORATORY REPORT").toUpperCase();
                currentGroup = { 
                    title, 
                    blocks: [block],
                    tests: testItems
                };
                groups.push(currentGroup);
            }
        });
        
        return groups;
    }, [result?.blocks, detail]);

    const renderTable = (groupBlocks: DiagnosticBlock[]) => {
        const parameterBlocks = groupBlocks.filter(b => b.type === 'parameter');
        if (parameterBlocks.length === 0) return null;

        const firstBlock = parameterBlocks[0];
        const columns = (firstBlock.columnDefs && firstBlock.columnDefs.length > 0) 
            ? firstBlock.columnDefs.filter(c => c.isVisible) 
            : DEFAULT_COLUMNS;

        return (
            <table className="w-full border-collapse mb-6 text-[10.5pt]">
                <thead>
                    <tr className="border-y border-gray-300 bg-gray-50/20">
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
                    {groupBlocks.map((block, bIdx) => {
                        if (block.type !== 'parameter') return null;
                        const isParamHeader = block.isHeader;
                        return (
                            <tr key={bIdx} className={cn("border-b border-gray-100", isParamHeader && "bg-blue-50/10")}>
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
                                                "py-1 px-1 text-[10.5pt] leading-snug break-words whitespace-pre-wrap",
                                                col.key !== 'parameter' && "text-center",
                                                isParameter && (block.isBold || block.isHeader) ? (isParamHeader ? "font-black text-black uppercase text-[11pt] tracking-tight pt-2 pb-0.5" : "font-bold italic text-black") : "",
                                                isResult && "font-black"
                                            )}
                                        >
                                            {isResult ? (
                                                <div className={cn("whitespace-pre-wrap", block.isAbnormal && "text-red-600 underline decoration-1 italic")}>
                                                    {isParamHeader && !isParameter ? "" : val}
                                                    {block.isAbnormal && (
                                                        <span className={cn(
                                                            "ml-1 text-[8.5pt] font-black",
                                                            (block as any).flag === 'H' ? "text-red-600" : "text-amber-600"
                                                        )}>
                                                            ({(block as any).flag || 'AB'})
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                (isParamHeader && !isParameter) ? "" : (
                                                    typeof val === 'string' 
                                                        ? <div className="leading-tight whitespace-pre-wrap">{val}</div>
                                                        : val
                                                )
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    return (
        <div id="print-report" className="bg-white text-black font-['Times_New_Roman',serif]">
            {groupReports.map((group, gIdx) => (
                <div 
                    key={gIdx} 
                    className={cn(
                        "mx-auto relative overflow-hidden bg-white",
                        gIdx > 0 && "print:break-before-page" // Page break for subsequent groups
                    )}
                    style={{ width: "210mm", height: "297mm", padding: "0" }}
                >

                    <div className="px-10 pt-[1.5in] pb-[2.8in] relative z-10 h-full flex flex-col">
                        {/* Barcodes at Top Left and Top Right */}
                        <div className="flex justify-between items-start mb-6 px-1">
                            <div className="flex flex-col items-center">
                                <svg className="h-10 w-40" viewBox="0 0 100 20" preserveAspectRatio="none">
                                    {[2, 5, 8, 12, 15, 20, 22, 25, 30, 32, 35, 40, 42, 45, 50, 52, 55, 60, 62, 65, 70, 72, 75, 80, 82, 85, 90, 92, 95].map((x, i) => (
                                        <rect key={i} x={`${x}%`} y="0" width={i % 3 === 0 ? "2" : "1"} height="20" fill="black" />
                                    ))}
                                </svg>
                                <span className="text-[7pt] font-mono font-bold mt-0.5">{barcode.toUpperCase()}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <svg className="h-10 w-40" viewBox="0 0 100 20" preserveAspectRatio="none">
                                    {[3, 6, 9, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66, 70, 74, 78, 82, 86, 90, 94, 98].map((x, i) => (
                                        <rect key={i} x={`${x}%`} y="0" width={i % 2 === 0 ? "2.5" : "1"} height="20" fill="black" />
                                    ))}
                                </svg>
                                <span className="text-[7pt] font-mono font-bold mt-0.5">{barcode.toUpperCase()}</span>
                            </div>
                        </div>

                        {/* 
                         * HOSPITAL HEADER REMOVED 
                         * As per User Request: Utilizing pre-printed letterheads (pads).
                         * We only print patient info and results.
                         */}
                        
                        {(() => {
                            const isNarrativeGroup = (group as any).tests?.some((t: any) => {
                                const s = t.service || t;
                                return s?.templateType === 'narrative';
                            }) || group.blocks.some(b => b.type === 'narrative');
                            
                            const displayTitle = isNarrativeGroup 
                                ? (group as any).tests?.[0]?.itemName || group.title 
                                : group.title;

                            if (isNarrativeGroup) {
                                return (
                                    <>
                                        {/* Standardized Boxed Patient Info (Unified across all modes) */}
                                        <div className="py-6 mb-10 bg-white text-black text-[11pt] font-serif">
                                            <table className="w-full border-collapse text-[11pt]">
                                                <tbody>
                                                    <tr >
                                                        <td className="pr-1 py-1.5 w-[15%] font-bold">Patient ID</td>
                                                        <td className="pr-1 py-1.5 w-[35%]">: <span className="font-mono font-black text-black">{patient?.patientNumber || barcode.toUpperCase()}</span></td>
                                                        <td className="pr-1 py-1.5 w-[20%] font-bold">Collection Date</td>
                                                        <td className="py-1.5 w-[30%] font-black">: {detail?.createdAt ? format(new Date(detail.createdAt), "dd MMM yyyy hh:mm a") : "—"}</td>
                                                    </tr>
                                                    <tr >
                                                        <td className="pr-1 py-1.5 font-bold">Name</td>
                                                        <td className="pr-4 py-1.5">: <span className="font-black uppercase text-[13pt] text-black">{patient?.name}</span></td>
                                                        <td className="pr-1 py-1.5 font-bold">Report Date</td>
                                                        <td className="py-1.5">: {detail?.updatedAt ? format(new Date(detail.updatedAt), "dd MMM yyyy hh:mm a") : format(new Date(), "dd MMM yyyy hh:mm a")}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="pr-1 py-1.5 font-bold">Age / Gender</td>
                                                        <td className="pr-4 py-1.5">: <span className="font-bold">{patient?.age ? `${patient.age}Y` : "—"} / {patient?.gender?.toUpperCase() || "—"}</span></td>
                                                        <td className="pr-1 py-1.5 font-bold">Consultant</td>
                                                        <td className="py-1.5">: <span className="font-medium text-black uppercase">
                                                            {result?.consultantName || doctor?.fullName || 'SELF'}
                                                            {(result?.consultantDesignation || (detail as any)?.doctor?.designation || doctor?.designation?.name) && (
                                                                <span className="ml-1 text-[9pt] font-medium text-black/60 lowercase italic">
                                                                    ({result?.consultantDesignation || (detail as any)?.doctor?.designation || doctor?.designation?.name})
                                                                </span>
                                                            )}
                                                        </span></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Narrative Style: Test Title */}
                                        <div className="mb-10 text-center">
                                            <div className="inline-flex items-baseline gap-4">
                                                <span className="font-bold text-[13pt] italic">Test of:</span>
                                                <h2 className="font-black text-[15pt] uppercase tracking-wide inline-block">
                                                    {displayTitle}
                                                </h2>
                                            </div>
                                        </div>
                                    </>
                                );
                            }

                            return (
                                <>
                                    {/* Standard Style: Prominent Title */}
                                    <div className="text-center mb-10 pb-2">
                                        <h2 className="font-black text-[22pt] uppercase tracking-[0.2em] text-black">
                                            {displayTitle} REPORT
                                        </h2>
                                    </div>

                                    {/* Standard Style: Boxed Patient Info */}
                                    <div className="py-6 mb-10 bg-white text-black text-[11pt] font-serif">
                                        <table className="w-full border-collapse text-[11pt]">
                                            <tbody>
                                                <tr >
                                                    <td className="pr-1 py-1.5 w-[15%] font-bold">Patient ID</td>
                                                    <td className="pr-1 py-1.5 w-[35%]">: <span className="font-mono font-black text-black">{patient?.patientNumber || barcode.toUpperCase()}</span></td>
                                                    <td className="pr-1 py-1.5 w-[20%] font-bold">Collection Date</td>
                                                    <td className="py-1.5 w-[30%] font-black">: {detail?.createdAt ? format(new Date(detail.createdAt), "dd MMM yyyy hh:mm a") : "—"}</td>
                                                </tr>
                                                <tr >
                                                    <td className="pr-1 py-1.5 font-bold">Name</td>
                                                    <td className="pr-4 py-1.5">: <span className="font-black uppercase text-[13pt] text-black">{patient?.name}</span></td>
                                                    <td className="pr-1 py-1.5 font-bold">Report Date</td>
                                                    <td className="py-1.5">: {detail?.updatedAt ? format(new Date(detail.updatedAt), "dd MMM yyyy hh:mm a") : format(new Date(), "dd MMM yyyy hh:mm a")}</td>
                                                </tr>
                                                <tr>
                                                    <td className="pr-1 py-1.5 font-bold">Age / Gender</td>
                                                    <td className="pr-4 py-1.5">: <span className="font-bold">{patient?.age ? `${patient.age}Y` : "—"} / {patient?.gender?.toUpperCase() || "—"}</span></td>
                                                    <td className="pr-1 py-1.5 font-bold">Consultant</td>
                                                    <td className="py-1.5">: <span className="font-medium text-black uppercase">
                                                        {result?.consultantName || doctor?.fullName || 'SELF'}
                                                        {(result?.consultantDesignation || (detail as any)?.doctor?.designation || doctor?.designation?.name) && (
                                                            <span className="ml-1 text-[9pt] font-medium text-black/60 lowercase italic">
                                                                ({result?.consultantDesignation || (detail as any)?.doctor?.designation || doctor?.designation?.name})
                                                            </span>
                                                        )}
                                                    </span></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            );
                        })()}

                        {/* Machine / Equipment Info (Context-aware extraction) */}
                        {(() => {
                            const machines = new Set<string>();
                            
                            // 1. Get all test names in this specific group
                            const groupTestNames = new Set(
                                group.blocks
                                    .filter(b => b.type === 'parameter' && b.parameter)
                                    .map(b => b.parameter?.toLowerCase().trim())
                            );

                            // 2. Filter sale items that match the tests in this group
                            const saleItems = (detail as any)?.sale?.saleItems || [];
                            saleItems.forEach((item: any) => {
                                const itemNameLower = item.itemName?.toLowerCase().trim();
                                // Check if this item is part of the current group
                                if (itemNameLower && groupTestNames.has(itemNameLower)) {
                                    const svc = item.service;
                                    if (svc?.machineName) {
                                        machines.add(`${svc.machineName}${svc.machineDescription ? ` ${svc.machineDescription}` : ''}`);
                                    }
                                }
                            });

                            // 3. Robust fallback: Also check direct diagnosticTests if saleItems didn't work
                            if (machines.size === 0) {
                                const diagTests = detail?.diagnosticTests || (detail as any)?.testItems || [];
                                diagTests.forEach((item: any) => {
                                    const itemNameLower = (item.itemName || item.service?.name)?.toLowerCase().trim();
                                    if (itemNameLower && groupTestNames.has(itemNameLower)) {
                                        const source = item.service || item.test || item;
                                        if (source?.machineName) {
                                            machines.add(`${source.machineName}${source.machineDescription ? ` ${source.machineDescription}` : ''}`);
                                        }
                                    }
                                });
                            }
                            
                            if (machines.size === 0) return null;
                            
                            // Smart deduplication: filter out names that are substrings of other longer names
                            const machineList = Array.from(machines);
                            const uniqueMachines = machineList.filter((m, i) => 
                                !machineList.some((other, j) => 
                                    i !== j && 
                                    other.toLowerCase().includes(m.toLowerCase()) && 
                                    other.length > m.length
                                )
                            );
                            
                            return (
                                <div className="text-center mb-6 italic text-[11.5pt] text-black font-serif leading-tight">
                                    {uniqueMachines.map((m, idx) => (
                                        <div key={idx} className="mb-0.5">
                                            (Tests are carried out by {m})
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* Results Area */}
                        <div className="flex-1">
                            {renderTable(group.blocks)}
                            
                            {/* Narrative/Impression blocks in the same group */}
                            {group.blocks.map((block, bIdx) => {
                                if (block.type === 'narrative' || block.type === 'impression') {
                                    const unescapedContent = (block.content || "")
                                        .replace(/&lt;/g, '<')
                                        .replace(/&gt;/g, '>')
                                        .replace(/&quot;/g, '"')
                                        .replace(/&amp;/g, '&');
                                        
                                    return (
                                        <div key={bIdx} className={cn("py-4 mb-4", block.type === 'impression' && "mt-10 pt-6 border-t-2 border-black font-serif")}>
                                            {block.type === 'impression' && (
                                                <span className="font-black underline text-[12pt] mr-3 uppercase text-black italic">INTERPRETATION / CONCLUSION:</span>
                                            )}
                                            <div 
                                                className={cn(
                                                    "leading-[1.8] text-[12pt] text-black",
                                                     block.type === 'impression' ? "font-bold inline" : "font-medium"
                                                )}
                                                style={{ textAlign: 'justify', wordBreak: 'break-word' }}
                                                dangerouslySetInnerHTML={{ __html: unescapedContent }}
                                            />
                                        </div>
                                    );
                                }
                                return null;
                            })}
                        </div>

                        {/* Fixed Positioning Footer to align with Pre-printed pads */}
                        <div className="absolute bottom-[0.3in] left-10 right-10">
                            {(() => {
                                const isNarrativeGroup = group.blocks.some(b => b.type === 'narrative');
                                
                                // Data from the result payload (saved in ResultEntryDialog)
                                const res = result as any;
                                const checkedByName = res?.checkedByName || "";
                                const checkedByDesignation = res?.checkedByDesignation || "";
                                const authorizedDoctorName = res?.authorizedDoctorName || doctor?.fullName || "";
                                const authorizedDoctorDegrees = res?.doctorDegrees || res?.authorizedDoctorDesignation || (detail as any)?.doctor?.designation || doctor?.designation?.name || "";
                                const preparedByName = result?.preparedBy || (detail as any)?.medicalTechnologist?.fullName || "—";

                                return (
                                    <div className="grid grid-cols-3 items-start font-serif text-black gap-4">
                                        {/* COLUMN 1: LEFT - Always CHECKED BY label for signature */}
                                        <div className="text-left">
                                            <div className="flex flex-col items-start gap-0">
                                                <div className="h-[40px]" /> {/* Space for signature */}
                                                <div className="w-full max-w-[180px] h-[1.5px] bg-black mb-1" />
                                                <p className="font-bold text-[11pt] italic leading-none uppercase tracking-widest">Checked By</p>
                                                {/* Empty line to match the 2-line height of other columns for line alignment */}
                                                <p className="text-[10pt] leading-tight">&nbsp;</p>
                                            </div>
                                        </div>

                                        {/* COLUMN 2: MIDDLE - Narrative: Doctor, Table: Checked By Name */}
                                        <div className="text-center">
                                            <div className="flex flex-col items-center gap-0">
                                                <div className="h-[40px]" /> {/* Space for signature */}
                                                <div className="w-full max-w-[180px] h-[1.5px] bg-black mb-1" />
                                                {isNarrativeGroup ? (
                                                    <>
                                                        <p className="font-black text-[13pt] leading-tight uppercase tracking-tight">
                                                            {authorizedDoctorName}
                                                        </p>
                                                        <p className="text-[10pt] font-bold italic opacity-80 leading-tight">
                                                            {authorizedDoctorDegrees}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="font-black text-[13pt] leading-tight uppercase tracking-tight">
                                                            {checkedByName || "—"}
                                                        </p>
                                                        <p className="text-[10pt] font-bold italic opacity-80 leading-tight">
                                                            {checkedByDesignation || ""}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* COLUMN 3: RIGHT - Always PREPARED BY label + name (no designation) */}
                                        <div className="text-right">
                                            <div className="flex flex-col items-end gap-0">
                                                <div className="h-[40px]" /> {/* Space for signature */}
                                                <div className="w-full max-w-[180px] h-[1.5px] bg-black mb-1" />
                                                <p className="font-bold text-[11pt] italic leading-none uppercase tracking-widest">Prepared By</p>
                                                <p className="font-black text-[13pt] leading-none uppercase tracking-tight py-1">
                                                    {preparedByName}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            
                            <div className="mt-8 flex justify-between items-center text-[8pt] text-black font-sans font-bold pt-2 border-t border-dashed border-black/20">
                                <p>REPORT ID: {barcode.toUpperCase()}</p>
                                <p className="italic">*Powered by HamoodTech</p>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    )
}
