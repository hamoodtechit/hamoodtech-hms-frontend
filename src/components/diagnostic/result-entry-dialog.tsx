"use client"

import { useEnterResult, useDiagnosticTest } from "@/hooks/diagnostic-queries"
import { cn } from "@/lib/utils"
import { DiagnosticBlock, DiagnosticReport, DiagnosticResult } from "@/types/diagnostic"
import { format } from "date-fns"
import { 
    Activity, 
    Beaker, 
    Calendar, 
    CheckCircle2, 
    ClipboardList, 
    Clock, 
    FileText, 
    FlaskConical, 
    History, 
    Info, 
    Loader2, 
    Save, 
    User, 
    UserCog,
    ChevronRight,
    Search,
    Microscope,
    Hash,
    Edit3
} from "lucide-react"
import React, { useEffect, useState, useMemo, useRef } from "react"
import { toast } from "sonner"
import { v4 as uuidv4 } from 'uuid'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { groupTestsByGroup } from "@/lib/diagnostic-grouping"
import { useQueries } from "@tanstack/react-query"
import { diagnosticService } from "@/services/diagnostic-service"
import { useAuthStore } from "@/store/use-auth-store"
import { Textarea as UITextarea } from "@/components/ui/textarea"

function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder?: string }) {
    const [isSource, setIsSource] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    // Sync only when value changes EXTERNALLY (e.g., template load)
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleCommand = (cmd: string, val?: string) => {
        document.execCommand(cmd, false, val);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerHTML);
    };

    return (
        <div className="flex flex-col rounded-3xl bg-muted/20 border border-border/50 shadow-inner overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-card border-b border-border/50 shrink-0">
                <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => handleCommand('bold')} className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                        <strong className="text-sm">B</strong>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleCommand('italic')} className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                        <em className="text-sm">I</em>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleCommand('underline')} className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                        <u className="text-sm">U</u>
                    </Button>
                    <div className="w-[1px] h-4 bg-border/60 mx-1.5" />
                    <Button variant="ghost" size="sm" onClick={() => handleCommand('insertUnorderedList')} className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                        <ClipboardList className="h-3.5 w-3.5" />
                    </Button>
                </div>
                <Button 
                    variant={isSource ? "default" : "ghost"} 
                    size="sm" 
                    onClick={() => setIsSource(!isSource)}
                    className="h-8 px-3 text-[9px] font-black uppercase tracking-widest rounded-full"
                >
                    {isSource ? "View Design" : "View Source"}
                </Button>
            </div>
            
            {isSource ? (
                <UITextarea 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="min-h-[400px] rounded-none border-none bg-zinc-950 text-emerald-400 font-mono text-[11px] focus-visible:ring-0 p-8 leading-relaxed selection:bg-emerald-500/30"
                />
            ) : (
                <div 
                    ref={editorRef}
                    className="p-12 min-h-[500px] outline-none font-medium leading-[2.2] text-[16px] overflow-y-auto bg-background prose prose-indigo max-w-none dark:prose-invert selection:bg-primary/20"
                    contentEditable
                    onInput={handleInput}
                    data-placeholder={placeholder}
                />
            )}
            <style jsx>{`
                [contentEditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                    font-style: italic;
                    font-weight: 400;
                }
            `}</style>
        </div>
    );
}

interface ResultEntryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: DiagnosticReport | null
    onSuccess?: () => void
}

// Result structure to handle overrides
interface ParamResult {
    result: string
    unit: string
    refRange: string
}

export function ResultEntryDialog({ open, onOpenChange, report, onSuccess }: ResultEntryDialogProps) {
    const { user } = useAuthStore()
    const enterResult = useEnterResult()
    
    // Form State (New Structure)
    const [resultsState, setResultsState] = useState<Record<string, Record<string, ParamResult>>>({})
    const [reportHeader, setReportHeader] = useState("DIAGNOSTIC REPORT")
    const [reportNotes, setReportNotes] = useState("")
    const [machineInfo, setMachineInfo] = useState("")
    const [lastLoadedId, setLastLoadedId] = useState<string | null>(null)

    // Parallel fetch service details for full templates
    const testIds = useMemo(() => report?.diagnosticTests?.map(t => t.serviceId) || [], [report]);
    const templateQueries = useQueries({
        queries: testIds.map(id => ({
            queryKey: ['diagnostic-test', id],
            queryFn: () => diagnosticService.getDiagnosticTestById(id),
            enabled: open && !!id
        }))
    });

    const isLoadingTemplates = templateQueries.some(q => q.isLoading);
    const templatesMap = useMemo(() => {
        const map: Record<string, any> = {};
        
        // 1. Populate from API queries
        templateQueries.forEach(q => {
            if (q.data?.data) {
                map[q.data.data.id] = q.data.data;
            }
        });

        // 2. Fallback: Populate from saleItems already in report (Instant loading from JSON)
        const saleItems = (report as any)?.sale?.saleItems || [];
        saleItems.forEach((item: any) => {
            if (item.serviceId && item.service) {
                if (!map[item.serviceId]) map[item.serviceId] = item.service;
            }
        });

        return map;
    }, [templateQueries, report]);

    useEffect(() => {
        if (open && report) {
            // Reset only if report ID changed
            if (report.id !== lastLoadedId) {
                setLastLoadedId(report.id)
                const result = report.result as DiagnosticResult | null
                if (result?.testResults) {
                    const rawResults = result.testResults as any;
                    const convertedResults: Record<string, Record<string, ParamResult>> = {};
                    Object.keys(rawResults).forEach(testId => {
                        convertedResults[testId] = {};
                        Object.keys(rawResults[testId]).forEach(paramKey => {
                            const val = rawResults[testId][paramKey];
                            convertedResults[testId][paramKey] = typeof val === 'string' 
                                ? { result: val, unit: "", refRange: "" } 
                                : val;
                        });
                    });
                    setResultsState(convertedResults)
                    setReportHeader(result.reportHeader || "DIAGNOSTIC REPORT")
                    setReportNotes(report.note || "")
                    setMachineInfo(result.machineInfo || "")
                    return; // Don't proceed to defaults if we have saved results
                }
            }
            
            // This part runs every time open/report/templatesMap changes
            setResultsState(prev => {
                const newState = { ...prev };
                let modified = false;

                report.diagnosticTests?.forEach((test, tIdx) => {
                    const testKey = `${test.id}_${tIdx}`;
                    if (!newState[testKey]) {
                        newState[testKey] = {};
                        modified = true;
                    }
                    
                    const serviceData = templatesMap[test.serviceId] || test.service || (test as any).test || (test as any).service
                    const templateType = serviceData?.templateType || (test as any).templateType || 'table'
                    const rawTemplateDescription = serviceData?.templateDescription || (test as any).templateDescription || ""
                    
                    // Decode HTML entities (e.g., &lt; to <) for the Rich Text Editor
                    const templateDescription = rawTemplateDescription
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&quot;/g, '"')
                        .replace(/&amp;/g, '&')
                        .replace(/&nbsp;/g, ' ');

                    if (templateType === 'narrative') {
                        // Crucial: Only set if current result is empty or placeholder
                        if (!newState[testKey]['__narrative'] || newState[testKey]['__narrative'].result === "" || newState[testKey]['__narrative'].result === undefined) {
                            if (templateDescription) {
                                newState[testKey]['__narrative'] = {
                                    result: templateDescription,
                                    unit: "",
                                    refRange: ""
                                };
                                modified = true;
                            }
                        }
                    } else if (Array.isArray(serviceData?.testResultTemplate)) {
                        serviceData.testResultTemplate.forEach((field: any, fIdx: number) => {
                            const paramKey = field.id || field.key || `${field.name}-${fIdx}`;
                            if (!newState[testKey][paramKey]) {
                                newState[testKey][paramKey] = {
                                    result: field.result || "",
                                    unit: field.unit || "",
                                    refRange: field.refRange || field.normalRange || ""
                                };
                                modified = true;
                            }
                        });
                    }
                });
                return modified ? newState : prev;
            });
        }
    }, [open, report, lastLoadedId, templatesMap])

    const getClinicalIndicator = (val: string, min?: string | number, max?: string | number) => {
        if (!val || (!min && !max)) return null;
        
        const numVal = parseFloat(val);
        if (isNaN(numVal)) return null;

        const numMin = min ? parseFloat(min.toString()) : -Infinity;
        const numMax = max ? parseFloat(max.toString()) : Infinity;

        if (numVal < numMin) return { label: 'LOW', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
        if (numVal > numMax) return { label: 'HIGH', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' };
        
        return { label: 'NORMAL', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
    }

    const updateParam = (testKey: string, paramKey: string, field: keyof ParamResult, val: string, defaults?: Partial<ParamResult>) => {
        setResultsState(prev => ({
            ...prev,
            [testKey]: {
                ...(prev[testKey] || {}),
                [paramKey]: {
                    // Start with passed defaults if the state doesn't exist yet
                    ...(prev[testKey]?.[paramKey] || { 
                        result: "", 
                        unit: defaults?.unit || "", 
                        refRange: defaults?.refRange || "" 
                    }),
                    [field]: val
                }
            }
        }))
    }

    const handleConfirm = async () => {
        if (!report) return
        if (!user) return toast.error("User not found")

        const blocks: DiagnosticBlock[] = [];
        const groups = groupTestsByGroup(report);

        groups.forEach(group => {
            blocks.push({ id: uuidv4(), type: 'header', headerText: group.groupName.toUpperCase() });

            group.tests.forEach((test, tIdx) => {
                const testKey = `${test.id}_${tIdx}`;
                const templateService = templatesMap[test.serviceId];
                const templateType = templateService?.templateType || test.service?.templateType || 'table';
                
                if (templateType === 'narrative') {
                    const narrativeContent = resultsState[testKey]?.['__narrative']?.result || "";
                    blocks.push({ 
                        id: uuidv4(), 
                        type: 'narrative', 
                        content: narrativeContent 
                    });
                } else {
                    const template = templateService?.testResultTemplate || test.service?.testResultTemplate || [];
                    if (Array.isArray(template)) {
                        blocks.push({ id: uuidv4(), type: 'parameter', parameter: test.itemName, isBold: true, isHeader: true } as any);
                        
                        template.forEach((field: any, fIdx: number) => {
                            const paramKey = field.id || field.key || `${field.name}-${fIdx}`;
                            const data = resultsState[testKey]?.[paramKey] || { result: "", unit: "", refRange: "" };
                            
                            const indicator = getClinicalIndicator(data.result, field.minRef, field.maxRef);
                            const isAbnormal = !!indicator && indicator.label !== 'NORMAL';
                            const flag = indicator?.label === 'HIGH' ? 'H' : indicator?.label === 'LOW' ? 'L' : '';

                            blocks.push({
                                id: uuidv4(),
                                type: 'parameter',
                                parameter: field.name || field.label,
                                value: data.result,
                                unit: data.unit || "",
                                referenceRange: data.refRange || "",
                                isAbnormal,
                                flag
                            } as any);
                        });
                    }
                }
            });
        });

        const payload = { 
            reportHeader, 
            blocks, 
            testResults: resultsState, 
            machineInfo, 
            preparedBy: user.fullName 
        }

        try {
            await enterResult.mutateAsync({ 
                id: report.id, 
                data: {
                    medicalTechnologistId: user.id,
                    result: payload,
                    note: reportNotes,
                    status: 'completed',
                    isSampleCollected: true
                } 
            })
            toast.success("Report results finalized")
            onOpenChange(false)
            onSuccess?.()
        } catch {
            toast.error("Failed to save report results")
        }
    }

    const groups = groupTestsByGroup(report);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1200px] w-[96vw] h-[92vh] p-0 flex flex-col overflow-hidden border-border/60 shadow-2xl bg-background rounded-[2rem]">
                {/* Premium Background Accents */}
                <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10 pointer-events-none" />
                
                {/* Header: Patient Info Card (Adapts to Light/Dark) */}
                <header className="px-10 py-5 border-b border-border/50 bg-card/30 backdrop-blur-2xl flex items-center justify-between shrink-0">
                    <DialogTitle className="sr-only">Result Entry Manager - {report?.patient?.name}</DialogTitle>
                    <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5">
                            <FlaskConical className="h-7 w-7 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="font-black text-xl tracking-tighter uppercase flex items-center gap-3 text-foreground">
                                {report?.patient?.name || "ANONYMOUS PATIENT"}
                                <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/10 text-primary px-3 py-1 uppercase tracking-widest font-black rounded-full">PIN: {report?.patient?.pin || "N/A"}</Badge>
                            </h3>
                            <div className="flex items-center gap-4 text-muted-foreground font-bold text-[10px] uppercase tracking-tight opacity-80">
                                <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> {report?.patient?.gender}, {report?.patient?.age}</span>
                                <Separator orientation="vertical" className="h-3 bg-border" />
                                <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {report?.createdAt ? format(new Date(report.createdAt), 'dd MMM yyyy, hh:mm a') : 'N/A'}</span>
                                <Separator orientation="vertical" className="h-3 bg-border" />
                                <span className="text-primary font-black">INV: {report?.barcode || report?.id?.substring(0,8)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="text-right">
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] block mb-1">Technician (Signed)</span>
                            <div className="flex items-center gap-2.5 justify-end">
                                <span className="font-black text-sm text-foreground/90">{user?.fullName || "System Admin"}</span>
                                <div className="h-7 w-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                </div>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-11 w-11 rounded-2xl bg-muted/50 hover:bg-destructive/10 hover:text-destructive transition-all">
                            <span className="text-xl font-bold">×</span>
                        </Button>
                    </div>
                </header>

                {/* Main Content: High-Density Result Table (Standard Scrollable Container) */}
                <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-muted/20">
                    {/* Subtle top shadow on scroll */}
                    <div className="sticky top-0 left-0 w-full h-4 bg-gradient-to-b from-foreground/5 to-transparent z-10 pointer-events-none" />
                    
                    <div className="px-8 py-6 pb-24">                        {groups.map((group, gIdx) => (
                            <div key={gIdx} className="mb-12 last:mb-0">
                                {/* Group Header Badge */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-px flex-1 bg-border/50" />
                                    <Badge className="bg-primary/5 text-primary border-primary/20 text-[10px] font-black uppercase px-6 py-2 rounded-full tracking-widest shadow-sm">{group.groupName}</Badge>
                                    <div className="h-px flex-1 bg-border/50" />
                                </div>

                                <div className="rounded-[2rem] bg-card/40 border border-border/60 overflow-hidden shadow-2xl backdrop-blur-sm">
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <Table className="border-collapse min-w-[1050px]">
                                            <TableHeader className="bg-muted/30">
                                                {group.tests.some(t => {
                                                    const s = templatesMap[t.serviceId] || t.service || t;
                                                    return s.templateType !== 'narrative';
                                                }) && (
                                                    <TableRow className="border-none hover:bg-transparent tracking-widest uppercase text-muted-foreground font-black text-[10px] h-14">
                                                        <TableHead className="w-[60px] text-center px-4"><Hash className="h-4 w-4 mx-auto" /></TableHead>
                                                        <TableHead className="min-w-[280px] px-8">Clinical Parameter</TableHead>
                                                        <TableHead className="w-[320px] text-center px-8">Test Result</TableHead>
                                                        <TableHead className="w-[160px] text-center px-8">Metric (Unit)</TableHead>
                                                        <TableHead className="w-[280px] text-center px-8">Clinical Reference</TableHead>
                                                    </TableRow>
                                                )}
                                            </TableHeader>
                                            <TableBody>
                                                {group.tests.map((test, tIdx) => {
                                                    const testKey = `${test.id}_${tIdx}`;
                                                    const templateService = templatesMap[test.serviceId];
                                                    const template = templateService?.testResultTemplate || test.service?.testResultTemplate || [];
                                                    
                                                    return (
                                                        <React.Fragment key={testKey}>
                                                            {/* Service Separator Row - Only for Table mode */}
                                                            {(templateService?.templateType !== 'narrative' && test.service?.templateType !== 'narrative') && (
                                                                <TableRow className="bg-muted/50 border-y border-border/40 hover:bg-muted/70 transition-colors">
                                                                    <TableCell colSpan={5} className="py-3 px-8">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                                                <Beaker className="h-4 w-4" />
                                                                            </div>
                                                                            <h4 className="font-black text-sm text-foreground uppercase tracking-wider">{test.itemName}</h4>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}

                                                            {isLoadingTemplates ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={5} className="h-32 text-center border-none">
                                                                        <div className="flex flex-col items-center gap-2 opacity-30">
                                                                            <Loader2 className="h-5 w-5 animate-spin" />
                                                                            <span className="text-[9px] font-black uppercase tracking-widest">Syncing Schema...</span>
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : (templateService?.templateType === 'narrative' || test.service?.templateType === 'narrative') ? (
                                                                <TableRow className="border-none hover:bg-transparent">
                                                                    <TableCell colSpan={5} className="p-0">
                                                                        <div className="bg-card/30 border-b border-border/50 p-6 flex items-center justify-between">
                                                                            <div className="flex items-center gap-4">
                                                                                <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                                                                                    <FileText className="h-5 w-5" />
                                                                                </div>
                                                                                <div>
                                                                                    <h4 className="font-black text-sm text-foreground uppercase tracking-widest leading-none">{test.itemName}</h4>
                                                                                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-tighter opacity-60 italic">Narrative Mode enabled for descriptive findings</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="p-10 bg-background/50 backdrop-blur-md">
                                                                            <RichTextEditor 
                                                                                value={resultsState[testKey]?.['__narrative']?.result || ""}
                                                                                onChange={(val) => updateParam(testKey, '__narrative', 'result', val, { unit: '', refRange: '' })}
                                                                                placeholder="Draft detailed descriptive findings here..."
                                                                            />
                                                                        </div>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : template.length > 0 ? (
                                                                template.map((field: any, fIdx: number) => {
                                                                    const paramKey = field.id || field.key || `${field.name}-${fIdx}`;
                                                                    const defaultData = { 
                                                                        unit: field.unit || "", 
                                                                        refRange: field.refRange || field.normalRange || "" 
                                                                    };
                                                                    const data = resultsState[testKey]?.[paramKey] || { 
                                                                        result: "", 
                                                                        ...defaultData 
                                                                    };
                                                                    
                                                                    return (
                                                                        <TableRow key={fIdx} className="group border-none hover:bg-primary/5 transition-all duration-200">
                                                                            <TableCell className="text-center font-black text-muted-foreground/50 group-hover:text-primary transition-colors text-[11px] px-4 py-3">
                                                                                {fIdx + 1}
                                                                            </TableCell>
                                                                            <TableCell className="px-8 py-3">
                                                                                <span className="font-bold text-foreground/80 group-hover:text-foreground transition-colors text-xs tracking-tight">{field.name || field.label}</span>
                                                                                {field.fieldType === 'dropdown' && <Badge variant="secondary" className="ml-2 text-[7px] h-3 px-1 rounded-sm opacity-50">LIST</Badge>}
                                                                            </TableCell>
                                                                            
                                                                            <TableCell className="px-8 py-3">
                                                                                <div className="flex flex-col gap-1.5 items-center">
                                                                                    {field.fieldType === 'dropdown' ? (
                                                                                        <Select value={data.result} onValueChange={(v) => updateParam(testKey, paramKey, 'result', v, defaultData)}>
                                                                                            <SelectTrigger className="h-9 rounded-xl bg-background border-border hover:border-primary/40 text-[13px] font-black text-indigo-500 focus:ring-primary/20 transition-all text-center shadow-sm">
                                                                                                <SelectValue placeholder="Select" />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent className="bg-popover border-border text-popover-foreground rounded-2xl shadow-2xl">
                                                                                                {(field.options || []).map((opt: string) => (
                                                                                                    <SelectItem key={opt} value={opt} className="focus:bg-primary focus:text-primary-foreground font-black cursor-pointer text-xs">{opt}</SelectItem>
                                                                                                ))}
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    ) : (
                                                                                        <div className="relative w-full">
                                                                                            <Input 
                                                                                                value={data.result}
                                                                                                onChange={e => updateParam(testKey, paramKey, 'result', e.target.value, defaultData)}
                                                                                                className={cn(
                                                                                                    "h-9 rounded-xl bg-background border-border text-[13px] font-black text-center transition-all focus-visible:ring-primary/20 hover:border-primary/30 shadow-sm px-6",
                                                                                                    data.result ? "text-foreground" : "text-muted-foreground/30 italic"
                                                                                                )}
                                                                                                placeholder="Value"
                                                                                            />
                                                                                            {/* Clinical Indicator Badge */}
                                                                                            {(() => {
                                                                                                const indicator = getClinicalIndicator(data.result, field.minRef, field.maxRef);
                                                                                                if (!indicator) return null;
                                                                                                return (
                                                                                                    <div className={cn(
                                                                                                        "absolute -right-2 -top-2 px-1.5 py-0.5 rounded-md text-[8px] font-black border tracking-tighter shadow-sm backdrop-blur-md animate-in fade-in zoom-in duration-300",
                                                                                                        indicator.color
                                                                                                    )}>
                                                                                                        {indicator.label}
                                                                                                    </div>
                                                                                                );
                                                                                            })()}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </TableCell>

                                                                            <TableCell className="px-8 py-3">
                                                                                <div className="relative group/input">
                                                                                    <Input 
                                                                                        value={data.unit}
                                                                                        onChange={e => updateParam(testKey, paramKey, 'unit', e.target.value, defaultData)}
                                                                                        className={cn(
                                                                                            "h-9 rounded-xl bg-muted/20 border-transparent text-center text-[11px] font-bold text-muted-foreground/80 transition-all hover:bg-background hover:border-border focus-visible:ring-primary/20 shadow-sm px-4",
                                                                                            !data.unit && "opacity-30"
                                                                                        )}
                                                                                        placeholder="Unit"
                                                                                    />
                                                                                    <Edit3 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/30 opacity-0 group-hover/input:opacity-100 transition-all" />
                                                                                </div>
                                                                            </TableCell>

                                                                            <TableCell className="px-8 py-3">
                                                                                <div className="relative group/input">
                                                                                    <Input 
                                                                                        value={data.refRange}
                                                                                        onChange={e => updateParam(testKey, paramKey, 'refRange', e.target.value, defaultData)}
                                                                                        className={cn(
                                                                                            "h-9 rounded-xl bg-muted/20 border-transparent text-center text-[10px] font-bold text-muted-foreground/70 italic transition-all hover:bg-background hover:border-border focus-visible:ring-primary/20 shadow-sm px-4",
                                                                                            !data.refRange && "opacity-30"
                                                                                        )}
                                                                                        placeholder="Reference"
                                                                                    />
                                                                                    <Edit3 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/30 opacity-0 group-hover/input:opacity-100 transition-all" />
                                                                                </div>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    );
                                                                })
                                                            ) : (
                                                                <TableRow>
                                                                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground/50 font-bold italic border-none text-[11px]">
                                                                        No entry parameters defined for this clinical test.
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>
                </main>

                {/* Footer: Clinical Documentation & Actions (Fixed at bottom) */}
                <footer className="shrink-0 bg-card border-t border-border shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.05)] backdrop-blur-3xl">
                    <div className="px-10 py-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-widest px-1">
                                    <Microscope className="h-3.5 w-3.5" />
                                    <span>Methodology & Equipment</span>
                                </div>
                                <Input 
                                    value={machineInfo} 
                                    onChange={e => setMachineInfo(e.target.value)}
                                    className="h-11 rounded-2xl bg-muted/40 border-border text-xs font-bold focus-visible:ring-primary/20 shadow-inner px-5"
                                    placeholder="e.g. Automated Analyzer..."
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-widest px-1">
                                    <Activity className="h-3.5 w-3.5" />
                                    <span>Clinical Interpretation</span>
                                </div>
                                <Textarea 
                                    value={reportNotes} 
                                    onChange={e => setReportNotes(e.target.value)}
                                    className="h-11 min-h-[44px] rounded-2xl bg-muted/40 border-border text-xs font-medium resize-none py-3 focus-visible:ring-primary/20 shadow-inner px-5"
                                    placeholder="Additional observations..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-3 border-t border-border/50">
                            <p className="text-[9px] font-black uppercase text-muted-foreground max-w-[400px] tracking-tight leading-relaxed opacity-70">
                                * Diagnostic integrity verified. Laboratory parameters validated by technologist.
                            </p>
                            <div className="flex items-center gap-3">
                                <Button 
                                    variant="outline" 
                                    onClick={() => onOpenChange(false)}
                                    className="h-11 rounded-2xl px-8 font-bold text-xs uppercase tracking-widest border-border hover:bg-muted transition-all active:scale-95"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleConfirm} 
                                    disabled={enterResult.isPending || isLoadingTemplates}
                                    className="h-11 rounded-2xl px-12 gap-3 font-black uppercase text-xs tracking-widest bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 active:scale-95 transition-all text-primary-foreground border-none"
                                >
                                    {enterResult.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Finalize Entry
                                </Button>
                            </div>
                        </div>
                    </div>
                </footer>

                {/* Final Styles Restored/Enhanced */}
                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 12px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: hsl(var(--primary) / 0.1);
                        border-radius: 20px;
                        border: 4px solid transparent;
                        background-clip: content-box;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: hsl(var(--primary) / 0.3);
                        background-clip: content-box;
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    )
}
