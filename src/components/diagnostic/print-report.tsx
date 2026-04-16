"use client"

import { useDiagnosticReport } from "@/hooks/diagnostic-queries"
import { cn } from "@/lib/utils"
import { DiagnosticBlock, DiagnosticColumnDef, DiagnosticReport, DiagnosticResult } from "@/types/diagnostic"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
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
                                                <div className={cn(block.isAbnormal && "text-red-600 underline decoration-1 italic")}>
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
                                                        ? <div className="leading-tight" dangerouslySetInnerHTML={{ __html: val.replace(/\n/g, '') }} />
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
                        gIdx > 0 && "print:break-before-page pt-[35mm]" // Page break for subsequent groups
                    )}
                    style={{ width: "210mm", minHeight: "297mm", padding: "0" }}
                >

                    <div className="px-10 py-6 pt-[35mm] relative z-10 min-h-[290mm] flex flex-col">
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
                                        {/* Narrative Style: Simplified Patient Info (Patwary Sample) */}
                                        <div className="flex justify-between items-start mb-8 text-[11.5pt] font-serif leading-relaxed text-black">
                                            <div className="space-y-1">
                                                <p><span className="font-bold inline-block w-24">Patient ID</span>: <span className="font-black">{barcode.toUpperCase()}</span></p>
                                                <p><span className="font-bold inline-block w-24">PtsName</span>: <span className="font-black uppercase">{patient?.name}</span></p>
                                                <p><span className="font-bold inline-block w-24">Refd. By</span>: <span className="font-black uppercase">{result?.consultantName || doctor?.fullName || 'SELF'}</span></p>
                                                <p className="pl-24 text-[9.5pt] font-bold italic opacity-80 leading-tight">
                                                    {result?.consultantDesignation || (detail as any)?.doctor?.designation || doctor?.designation?.name}
                                                </p>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <p><span className="font-bold inline-block w-16 text-left">Date</span>: {detail?.createdAt ? format(new Date(detail.createdAt), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy")}</p>
                                                <p><span className="font-bold inline-block w-16 text-left">Age</span>: {patient?.age ? `${patient.age} year` : "—"} <span className="ml-2 font-bold">Sex</span>: <span className="capitalize">{patient?.gender || "—"}</span></p>
                                            </div>
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
                                    <div className="border-y-2 border-black py-6 mb-10 bg-white text-black text-[11pt] font-serif">
                                        <table className="w-full border-collapse text-[11pt]">
                                            <tbody>
                                                <tr className="border-b border-black/10">
                                                    <td className="pr-1 py-1.5 w-[15%] font-bold">Lab ID</td>
                                                    <td className="pr-1 py-1.5 w-[35%]">: <span className="font-mono font-black text-black">{barcode.toUpperCase()}</span></td>
                                                    <td className="pr-1 py-1.5 w-[20%] font-bold">Collection Date</td>
                                                    <td className="py-1.5 w-[30%] font-black">: {detail?.createdAt ? format(new Date(detail.createdAt), "dd MMM yyyy hh:mm a") : "—"}</td>
                                                </tr>
                                                <tr className="border-b border-black/10">
                                                    <td className="pr-1 py-1.5 font-bold">Patient Name</td>
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
                            
                            return (
                                <div className="text-center mb-6 italic text-[11.5pt] text-black font-serif leading-tight">
                                    {Array.from(machines).map((m, idx) => (
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

                        {/* Footer Section */}
                        <div className="mt-auto pt-16">
                            {(() => {
                                const isNarrativeGroup = group.blocks.some(b => b.type === 'narrative');
                                
                                if (isNarrativeGroup) {
                                    return (
                                        <div className="flex justify-between items-end font-serif px-2">
                                            {/* Left Side: Prepared By (Manual Style) */}
                                            <div className="text-left w-[40%]">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-bold text-[11pt] border-b border-black pb-0.5">Prepared By</span>
                                                    <span className="font-black text-black text-[12pt] border-b border-black/40 pb-0.5 min-w-[120px]">
                                                        {result?.preparedBy || (detail as any)?.medicalTechnologist?.fullName || "—"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right Side: Doctor Signature (Patwary Style) */}
                                            <div className="text-right w-[50%]">
                                                <div className="ml-auto mb-1 w-64 h-[2.5px] bg-black" />
                                                <p className="font-black text-black text-[16pt] leading-tight uppercase tracking-tight">
                                                    Dr. {doctor?.fullName || "Manik Rana."}
                                                </p>
                                                <p className="text-[11pt] font-bold text-black italic mt-1 border-t border-black/20 pt-1 inline-block">
                                                    {result?.doctorDegrees || (detail as any)?.doctor?.designation || doctor?.designation?.name || "MBBS, CMU(Ultra)."}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="flex justify-between items-end font-serif">
                                        {/* Left Side: Technologist */}
                                        <div className="text-left w-[40%]">
                                            <div className="mb-1 w-48 h-[1px] bg-black" />
                                            <p className="font-bold text-[11pt] uppercase tracking-wider text-black">Medical Technologist</p>
                                            <p className="mt-1 font-black text-black text-[12pt] leading-tight">
                                                {result?.preparedBy || (detail as any)?.medicalTechnologist?.fullName || "—"}
                                            </p>
                                            <p className="text-[10pt] font-bold text-black italic">
                                                {(detail as any)?.medicalTechnologist?.designation || "—"}
                                            </p>
                                        </div>

                                        {/* Right Side: Authorized Doctor (Digital Signature Style) */}
                                        <div className="text-right w-[50%] relative">
                                            <div className="absolute -top-12 right-0 opacity-10">
                                                <div className="border-2 border-black text-black px-2 py-1 rotate-12 rounded text-[10pt] font-black uppercase">
                                                    Digitally Signed
                                                </div>
                                            </div>
                                            <div className="ml-auto mb-1 w-64 h-[2px] bg-black" />
                                            <p className="font-['Dancing_Script',cursive] text-[20pt] text-black px-2 leading-none mb-1">
                                                {doctor?.fullName || "Doctor Ibrahim"}
                                            </p>
                                            <div className="mt-1 flex flex-col items-end leading-tight gap-0.5">
                                                <p className="text-[10pt] font-black italic text-black">
                                                    {result?.doctorDegrees || "MBBS(RMC),CMU(ULTRA),CCD(BIRDEM)"}
                                                </p>
                                                {(result?.doctorDesignation || (detail as any)?.doctor?.designation || doctor?.designation?.name) && 
                                                 (result?.doctorDesignation !== result?.doctorDegrees) && (
                                                    <p className="text-[9.5pt] font-black text-black uppercase tracking-tight">
                                                        {result?.doctorDesignation || (detail as any)?.doctor?.designation || doctor?.designation?.name || "Senior Consultant Pathologist"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            
                            <div className="mt-8 flex justify-between items-center text-[8pt] text-black font-sans font-bold pt-2">
                                <p>REPORT ID: {barcode.toUpperCase()}</p>
                                <p className="uppercase">Page {gIdx + 1} of {groupReports.length}</p>
                                <p className="italic">Printed by HamoodTech HMS</p>
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
