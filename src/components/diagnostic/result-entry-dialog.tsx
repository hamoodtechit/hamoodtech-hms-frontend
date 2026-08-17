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
import { calculateExactAge } from "@/lib/age-calculator"
import { useAuthStore } from "@/store/use-auth-store"
import { useEmployees } from "@/hooks/hr-queries"
import { Textarea as UITextarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/shared/searchable-select"

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

    const handleFontSize = (increase: boolean) => {
        const currentSize = document.queryCommandValue('fontSize') || "3";
        let newSize = parseInt(currentSize, 10);
        if (isNaN(newSize)) newSize = 3;
        if (increase) newSize = Math.min(newSize + 1, 7);
        else newSize = Math.max(newSize - 1, 1);
        handleCommand('fontSize', newSize.toString());
    };

    const [lineHeight, setLineHeight] = useState(() => {
        const match = value?.match(/style="[^"]*line-height:\s*([\d.]+)[^"]*"/);
        return match ? parseFloat(match[1]) : 2.2;
    });

    const handleLineHeight = (increase: boolean) => {
        setLineHeight(prev => {
            const next = increase ? prev + 0.2 : prev - 0.2;
            const newHeight = Number(Math.min(Math.max(next, 1.0), 4.0).toFixed(1));
            
            if (editorRef.current) {
                let content = editorRef.current.innerHTML;
                if (content.includes('class="lh-wrapper"')) {
                    content = content.replace(/(class="lh-wrapper"[^>]*style="[^"]*)line-height:\s*[\d.]+/g, `$1line-height: ${newHeight}`);
                    editorRef.current.innerHTML = content;
                } else {
                    content = `<div class="lh-wrapper" style="line-height: ${newHeight}">${content}</div>`;
                    editorRef.current.innerHTML = content;
                }
                onChange(content);
            }
            return newHeight;
        });
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
                    <Button variant="ghost" size="sm" onClick={() => handleFontSize(true)} className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all font-bold" title="Increase Font Size">
                        A+
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleFontSize(false)} className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all font-bold text-xs" title="Decrease Font Size">
                        A-
                    </Button>
                    <div className="w-[1px] h-4 bg-border/60 mx-1.5" />
                    <Button variant="ghost" size="sm" onClick={() => handleLineHeight(true)} className="h-9 px-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-all font-bold text-xs flex items-center gap-1" title="Increase Line Height">
                        ↕+
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleLineHeight(false)} className="h-9 px-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-all font-bold text-xs flex items-center gap-1" title="Decrease Line Height">
                        ↕-
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
                    className="p-4 md:p-6 min-h-[400px] outline-none font-medium text-[16px] overflow-y-auto bg-background prose prose-indigo max-w-none dark:prose-invert selection:bg-primary/20"
                    style={{ lineHeight: lineHeight }}
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
    const [checkedBy, setCheckedBy] = useState<string>("")
    const [authorizedDoctor, setAuthorizedDoctor] = useState<string>("")
    const [lastLoadedId, setLastLoadedId] = useState<string | null>(null)

    // Fetch employees for "Checked By" and "Doctor" selection
    const { data: employeesRes } = useEmployees({ limit: 1000 }, { enabled: open });
    const employees = employeesRes?.data || [];
    
    // Group employees by type for better UX
    const doctors = employees.filter(e => e.employeeType?.toLowerCase().includes('doctor') || e.employeeType?.toLowerCase() === 'guest-doctor' || e.designation?.name?.toLowerCase().includes('doctor'));
    const technologists = employees.filter(e => !doctors.includes(e));

    // Parallel fetch service details for full templates
    const testIdsMissingData = useMemo(() => {
        return (report?.diagnosticTests || report?.testItems || [])
            ?.filter(t => {
                const s = t.service;
                if (!s) return true;
                // Fetch if narrative and missing description
                if ((s.templateType === 'narrative' || !s.templateType) && !s.templateDescription && (!s.testResultTemplate || (Array.isArray(s.testResultTemplate) && s.testResultTemplate.length === 0))) return true;
                // Fetch if table and missing/empty template
                if (s.templateType !== 'narrative') {
                    if (!s.testResultTemplate) return true;
                    if (Array.isArray(s.testResultTemplate) && s.testResultTemplate.length === 0) return true;
                    if (typeof s.testResultTemplate === 'string' && (s.testResultTemplate === '[]' || s.testResultTemplate === '')) return true;
                }
                return false;
            })
            ?.map(t => t.serviceId) || []
    }, [report]);

    const templateQueries = useQueries({
        queries: testIdsMissingData.map(id => ({
            queryKey: ['diagnostic-test', id],
            queryFn: () => diagnosticService.getDiagnosticTestById(id),
            enabled: open && !!id
        }))
    });

    const isLoadingTemplates = templateQueries.some(q => q.isLoading);
    const templatesMap = useMemo(() => {
        const map: Record<string, any> = {};
        
        // 1. Populate from existing data in report (Highest priority)
        (report?.diagnosticTests || report?.testItems || [])?.forEach(t => {
            if (t.serviceId && t.service) {
                map[t.serviceId] = t.service;
            }
        });

        // 2. Populate from API queries
        templateQueries.forEach(q => {
            if (q.data?.data) {
                map[q.data.data.id] = q.data.data;
            }
        });

        // 3. Fallback: Populate from saleItems already in report
        const saleItems = (report as any)?.sale?.saleItems || [];
        saleItems.forEach((item: any) => {
            if (item.serviceId && item.service) {
                if (!map[item.serviceId]) map[item.serviceId] = item.service;
            }
        });

        return map;
    }, [templateQueries, report]);

    // Check if report is narrative only (to hide Checked By)
    const isNarrativeOnly = useMemo(() => {
        return (report?.diagnosticTests || report?.testItems || [])?.every(test => {
            const serviceData = templatesMap[test.serviceId] || test.service || (test as any).test || (test as any).service;
            return serviceData?.templateType === 'narrative';
        });
    }, [report, templatesMap]);

    // Separate effect for decoding/sanitizing templates
    const decodeTemplate = (raw: string) => {
        if (!raw) return "";
        return raw
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&nbsp;/g, ' ');
    }

    useEffect(() => {
        if (!open || !report) return;

        // Phase 1: Initial State Migration (Only when report ID changes)
        if (report.id !== lastLoadedId) {
            setLastLoadedId(report.id);
            const result = report.result as DiagnosticResult | null;
            
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
                setResultsState(convertedResults);
                setReportHeader(result.reportHeader || "DIAGNOSTIC REPORT");
                setReportNotes(report.note || "");
                setMachineInfo(result.machineInfo || "");
                setCheckedBy((result as any).checkedById || "");
                setAuthorizedDoctor((result as any).authorizedDoctorId || "");
            } else {
                setResultsState({});
            }
        }
        
        // Phase 2: Template Reflow/Merging (Runs on templatesMap updates or open)
        // This ensures that even if results exist, missing defaults from templates can be filled in
        setResultsState(prev => {
            const newState = { ...prev };
            let modified = false;

            (report?.diagnosticTests || report?.testItems || [])?.forEach((test) => {
                const testKey = test.id;
                
                // Clone the state to avoid mutating React's current state directly
                const testState = newState[testKey] ? { ...newState[testKey] } : {};
                if (!newState[testKey]) modified = true;
                
                const serviceData = templatesMap[test.serviceId] || test.service || (test as any).test || (test as any).service;
                const templateType = serviceData?.templateType || (test as any).templateType || 'table';
                
                if (templateType === 'narrative') {
                    // Inject template if current narrative is empty or placeholder
                    const currentResult = testState['__narrative']?.result || "";
                    if (!currentResult || currentResult === "" || currentResult === "<p><br></p>") {
                        const rawTemplateDescription = serviceData?.templateDescription || (test as any).templateDescription || "";
                        const templateDescription = decodeTemplate(rawTemplateDescription);

                        if (templateDescription && templateDescription !== currentResult) {
                            testState['__narrative'] = {
                                result: templateDescription,
                                unit: "",
                                refRange: ""
                            };
                            modified = true;
                        }
                    }
                } else {
                    let templateArray = serviceData?.testResultTemplate;
                    if (typeof templateArray === 'string') {
                        try { templateArray = JSON.parse(templateArray); } catch(e) {}
                    }
                    
                    if (Array.isArray(templateArray)) {
                        // Table mode: Fill in missing parameters
                        templateArray.forEach((field: any, fIdx: number) => {
                            const paramKey = field.id || field.key || `${field.name}-${fIdx}`;
                            if (!testState[paramKey]) {
                                testState[paramKey] = {
                                    result: field.result || "",
                                    unit: field.unit || "",
                                    refRange: field.refRange || field.normalRange || ""
                                };
                                modified = true;
                            }
                        });
                    }
                }
                
                newState[testKey] = testState;
            });

            return modified ? newState : prev;
        });
    }, [open, report, lastLoadedId, templatesMap])

    const handleReloadTemplate = (testKey: string, serviceId: string) => {
        const serviceData = templatesMap[serviceId];
        if (!serviceData) return;

        const rawTemplateDescription = serviceData.templateDescription || "";
        const templateDescription = decodeTemplate(rawTemplateDescription);

        if (templateDescription) {
            updateParam(testKey, '__narrative', 'result', templateDescription, { unit: '', refRange: '' });
            toast.success("Template reloaded");
        }
    }

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

    const handleResultKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((!e.shiftKey && e.key === 'Enter') || e.key === 'ArrowDown') {
            e.preventDefault();
            const inputs = Array.from(document.querySelectorAll<HTMLTextAreaElement>('textarea[data-result-input="true"]'));
            const currentIndex = inputs.indexOf(e.currentTarget);
            if (currentIndex > -1 && currentIndex < inputs.length - 1) {
                const nextInput = inputs[currentIndex + 1];
                nextInput.focus();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const inputs = Array.from(document.querySelectorAll<HTMLTextAreaElement>('textarea[data-result-input="true"]'));
            const currentIndex = inputs.indexOf(e.currentTarget);
            if (currentIndex > 0) {
                const prevInput = inputs[currentIndex - 1];
                prevInput.focus();
            }
        }
    };

    const handleConfirm = async () => {
        if (!report) return
        if (!user) return toast.error("User not found")

        const blocks: DiagnosticBlock[] = [];
        const groups = groupTestsByGroup(report);

        groups.forEach(group => {
            blocks.push({ id: uuidv4(), type: 'header', headerText: group.groupName.toUpperCase() });

            group.tests.forEach((test) => {
                const testKey = test.id;
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

        // Get selected employee details
        const selectedCheckedBy = employees?.find(e => e.id === checkedBy);
        const selectedDoctor = employees?.find(e => e.id === authorizedDoctor);

        const payload = { 
            reportHeader, 
            blocks, 
            testResults: resultsState, 
            machineInfo, 
            preparedBy: user.fullName,
            checkedById: checkedBy,
            checkedByName: (selectedCheckedBy as any)?.name || "",
            checkedByDesignation: (selectedCheckedBy as any)?.designation?.name || (selectedCheckedBy as any)?.designation || "",
            authorizedDoctorId: authorizedDoctor,
            authorizedDoctorName: (selectedDoctor as any)?.name || "",
            authorizedDoctorDesignation: (selectedDoctor as any)?.designation?.name || (selectedDoctor as any)?.designation || "",
            doctorDegrees: (selectedDoctor as any)?.degrees || (selectedDoctor as any)?.qualifications || ""
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
            <DialogContent className="sm:max-w-[98vw] md:max-w-[95vw] w-[98vw] md:w-[95vw] h-[95dvh] max-h-[95dvh] p-0 flex flex-col overflow-hidden border-border shadow-2xl bg-background rounded-2xl">
                <DialogTitle className="sr-only">Result Entry Manager - {report?.patient?.name}</DialogTitle>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onOpenChange(false)} 
                    className="absolute top-4 right-6 h-11 w-11 rounded-2xl bg-muted/50 hover:bg-destructive/10 hover:text-destructive transition-all z-50"
                >
                    <span className="text-xl font-bold">×</span>
                </Button>
                
                {/* Premium Background Accents */}
                <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-primary/5 via-transparent to-transparent -z-10 pointer-events-none" />

                {/* Main Content: High-Density Result Table (Standard Scrollable Container) */}
                <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-muted/20 min-h-0">
                    {/* Subtle top shadow on scroll */}
                    <div className="sticky top-0 left-0 w-full h-4 bg-gradient-to-b from-foreground/5 to-transparent z-10 pointer-events-none" />
                    
                    <div className="px-4 py-4 md:px-6 pb-12">                        {groups.map((group, gIdx) => (
                            <div key={gIdx} className="mb-8 last:mb-0">
                                {/* Group Header Badge */}
                                <div className="flex items-center gap-4 mb-4">
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
                                                {group.tests.map((test) => {
                                                    const testKey = test.id;
                                                    const templateService = templatesMap[test.serviceId];
                                                    
                                                    let template = templateService?.testResultTemplate || test.service?.testResultTemplate || [];
                                                    if (typeof template === 'string') {
                                                        try { template = JSON.parse(template); } catch(e) { template = []; }
                                                    }
                                                    
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
                                                                            <Button 
                                                                                variant="outline" 
                                                                                size="sm" 
                                                                                onClick={() => handleReloadTemplate(testKey, test.serviceId)}
                                                                                className="h-8 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest border-primary/20 hover:bg-primary/10 transition-all active:scale-95"
                                                                            >
                                                                                <History className="h-3 w-3 text-primary" />
                                                                                Reload Template
                                                                            </Button>
                                                                        </div>
                                                                        <div className="p-4 md:p-6 bg-background/50 backdrop-blur-md">
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
                                                                                            <Textarea 
                                                                                                data-result-input="true"
                                                                                                onKeyDown={handleResultKeyDown}
                                                                                                value={data.result}
                                                                                                onChange={e => updateParam(testKey, paramKey, 'result', e.target.value, defaultData)}
                                                                                                rows={1}
                                                                                                className={cn(
                                                                                                    "min-h-9 rounded-xl bg-background border-border text-[13px] font-black transition-all focus-visible:ring-primary/20 hover:border-primary/30 shadow-sm px-4 py-2 resize text-center",
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
                                                                                    <Textarea 
                                                                                        value={data.unit}
                                                                                        onChange={e => updateParam(testKey, paramKey, 'unit', e.target.value, defaultData)}
                                                                                        rows={1}
                                                                                        className={cn(
                                                                                            "min-h-9 rounded-xl bg-muted/20 border-transparent text-center text-[11px] font-bold text-muted-foreground/80 transition-all hover:bg-background hover:border-border focus-visible:ring-primary/20 shadow-sm px-4 py-2 resize",
                                                                                            !data.unit && "opacity-30"
                                                                                        )}
                                                                                        placeholder="Unit"
                                                                                    />
                                                                                    <Edit3 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/30 opacity-0 group-hover/input:opacity-100 transition-all pointer-events-none" />
                                                                                </div>
                                                                            </TableCell>

                                                                            <TableCell className="px-8 py-3">
                                                                                <div className="relative group/input">
                                                                                    <Textarea 
                                                                                        value={data.refRange}
                                                                                        onChange={e => updateParam(testKey, paramKey, 'refRange', e.target.value, defaultData)}
                                                                                        rows={1}
                                                                                        className={cn(
                                                                                            "min-h-9 rounded-xl bg-muted/20 border-transparent text-center text-[10px] font-bold text-muted-foreground/70 italic transition-all hover:bg-background hover:border-border focus-visible:ring-primary/20 shadow-sm px-4 py-2 resize",
                                                                                            !data.refRange && "opacity-30"
                                                                                        )}
                                                                                        placeholder="Reference"
                                                                                    />
                                                                                    <Edit3 className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/30 opacity-0 group-hover/input:opacity-100 transition-all pointer-events-none" />
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
                    <div className="px-10 py-2.5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-2">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-widest px-1">
                                    <Microscope className="h-3.5 w-3.5" />
                                    <span>Methodology & Equipment</span>
                                </div>
                                <Input 
                                    value={machineInfo} 
                                    onChange={e => setMachineInfo(e.target.value)}
                                    className="h-9 rounded-xl bg-muted/40 border-border text-[11px] font-bold focus-visible:ring-primary/20 shadow-inner px-4"
                                    placeholder="e.g. Automated Analyzer..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-widest px-1">
                                    <Activity className="h-3.5 w-3.5" />
                                    <span>Clinical Interpretation</span>
                                </div>
                                <Textarea 
                                    value={reportNotes} 
                                    onChange={e => setReportNotes(e.target.value)}
                                    className="h-9 min-h-[36px] rounded-xl bg-muted/40 border-border text-[11px] font-medium resize-none py-2 focus-visible:ring-primary/20 shadow-inner px-4"
                                    placeholder="Additional observations..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-widest px-1">
                                    <UserCog className="h-3.5 w-3.5" />
                                    <span>Checked By (Technologist/Manager)</span>
                                </div>
                                <SearchableSelect 
                                    value={checkedBy} 
                                    onChange={setCheckedBy}
                                    options={technologists.map(emp => ({
                                        id: emp.id,
                                        name: `${emp.name} (${typeof emp.designation === 'string' ? emp.designation : emp.designation?.name || "Staff"})`
                                    }))}
                                    placeholder="Select who checked the report..."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-primary font-black text-[9px] uppercase tracking-widest px-1">
                                    <Activity className="h-3.5 w-3.5" />
                                    <span>Reporting Doctor (Authorized By)</span>
                                </div>
                                <SearchableSelect 
                                    value={authorizedDoctor} 
                                    onChange={setAuthorizedDoctor}
                                    options={doctors.map(emp => ({
                                        id: emp.id,
                                        name: `${emp.name} (${typeof emp.designation === 'string' ? emp.designation : emp.designation?.name || "Doctor"})`
                                    }))}
                                    placeholder="Select authorized reporting doctor..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center py-2 border-t border-border/50">
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
