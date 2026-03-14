"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEnterResult } from "@/hooks/diagnostic-queries"
import { useEmployees } from "@/hooks/hr-queries"
import { usePermissions } from "@/hooks/use-permissions"
import { DiagnosticReport, DiagnosticResult, ResultMode, ResultTableRow } from "@/types/diagnostic"
import { Activity, Beaker, Bold, ClipboardList, FileText, Italic, List, Loader2, Plus, Save, Trash2, Underline, User, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ResultEntryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: DiagnosticReport | null
    onSuccess?: () => void
}

function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder?: string }) {
    const handleCommand = (cmd: string) => {
        document.execCommand(cmd, false);
    };

    return (
        <div className="flex flex-col rounded-2xl bg-background border border-border/50 shadow-inner overflow-hidden">
            <div className="flex items-center gap-1 p-2 bg-muted/30 border-b border-border/30 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => handleCommand('bold')} className="h-8 w-8 p-0 rounded-md">
                    <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleCommand('italic')} className="h-8 w-8 p-0 rounded-md">
                    <Italic className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleCommand('underline')} className="h-8 w-8 p-0 rounded-md">
                    <Underline className="h-3.5 w-3.5" />
                </Button>
                <div className="w-px h-4 bg-border/50 mx-1" />
                <Button variant="ghost" size="sm" onClick={() => handleCommand('insertUnorderedList')} className="h-8 w-8 p-0 rounded-md">
                    <List className="h-3.5 w-3.5" />
                </Button>
            </div>
            <div 
                className="p-6 min-h-[300px] outline-none font-medium leading-[1.8] text-sm overflow-y-auto"
                contentEditable
                dangerouslySetInnerHTML={{ __html: value }}
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                data-placeholder={placeholder}
            />
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

export function ResultEntryDialog({ open, onOpenChange, report, onSuccess }: ResultEntryDialogProps) {
    const { hasPermission } = usePermissions()
    const [mode, setMode] = useState<ResultMode>("table")
    const [technicianId, setTechnicianId] = useState("")
    const [reportHeader, setReportHeader] = useState("")
    const [machineInfo, setMachineInfo] = useState("")
    const [reportNotes, setReportNotes] = useState("")
    const [consultantName, setConsultantName] = useState("")
    const [doctorDegrees, setDoctorDegrees] = useState("")
    
    // Table mode state
    const [rows, setRows] = useState<ResultTableRow[]>([
        { parameter: "", value: "", unit: "", referenceRange: "" }
    ])

    // Narrative mode state
    const [content, setContent] = useState("")
    const [interpretation, setInterpretation] = useState("")
    const [preparedBy, setPreparedBy] = useState("")

    const { data: employeesRes, isLoading: loadingEmployees } = useEmployees({ limit: 100 })
    const employees = employeesRes?.data || []

    const enterResult = useEnterResult()

    // Initialize/Reset
    useEffect(() => {
        if (open && report) {
            const testName = report.diagnosticTest?.name;
            const defaultHeader = (testName || "DIAGNOSTIC").toUpperCase() + " REPORT";
            
            setReportHeader(defaultHeader)
            
            // Try to load any existing result if editing
            if (report.result && typeof report.result === 'object' && 'mode' in report.result) {
                const res = report.result as DiagnosticResult
                setMode(res.mode || 'table')
                setReportHeader(res.reportHeader || defaultHeader)
                setMachineInfo(res.machineInfo || "")
                if (res.mode === 'table' && res.rows) setRows(res.rows)
                if (res.mode === 'narrative') {
                    setContent(res.content || "")
                    setInterpretation(res.interpretation || "")
                    setPreparedBy(res.preparedBy || "")
                }
                setConsultantName(res.consultantName || (report.saleItem as any)?.sale?.doctor?.name || "")
                setDoctorDegrees(res.doctorDegrees || "")
            } else {
                // If no result exists yet, determine default mode
                // Priority 1: User granular permissions (from on-the-fly request)
                const isRadiologyUser = hasPermission('radiology:create');
                const isPathologyUser = hasPermission('pathology:create');

                if (isRadiologyUser && !isPathologyUser) {
                    setMode('narrative');
                } else if (isPathologyUser && !isRadiologyUser) {
                    setMode('table');
                } else {
                    // Priority 2: Sale type from billing
                    const saleType = (report.saleItem as any)?.sale?.type;
                    if (saleType === 'radiology') {
                        setMode('narrative');
                    } else {
                        setMode('table');
                    }
                }

                // Pre-fill consultant from sale even if no result yet
                const saleDoc = (report.saleItem as any)?.sale?.doctor?.name;
                if (saleDoc) setConsultantName(saleDoc);
            }
        }
    }, [open, report, hasPermission])

    const addRow = () => {
        setRows([...rows, { parameter: "", value: "", unit: "", referenceRange: "" }])
    }

    const removeRow = (index: number) => {
        setRows(rows.filter((_, i) => i !== index))
    }

    const updateRow = (index: number, field: keyof ResultTableRow, val: any) => {
        const next = [...rows]
        next[index] = { ...next[index], [field]: val }
        setRows(next)
    }

    // Template Logic
    const saveTemplate = () => {
        if (!report?.diagnosticTestId) return
        const templateData = { mode, reportHeader, machineInfo, rows, content, interpretation, consultantName, doctorDegrees }
        localStorage.setItem(`diag_template_${report.diagnosticTestId}`, JSON.stringify(templateData))
        toast.success("Template saved for this test type")
    }

    const loadTemplate = () => {
        if (!report?.diagnosticTestId) return
        const saved = localStorage.getItem(`diag_template_${report.diagnosticTestId}`)
        if (!saved) return toast.error("No template found for this test")
        
        try {
            const data = JSON.parse(saved)
            if (data.mode) setMode(data.mode)
            if (data.reportHeader) setReportHeader(data.reportHeader)
            if (data.machineInfo) setMachineInfo(data.machineInfo)
            if (data.rows) setRows(data.rows)
            if (data.content) setContent(data.content)
            if (data.interpretation) setInterpretation(data.interpretation)
            if (data.consultantName) setConsultantName(data.consultantName)
            if (data.doctorDegrees) setDoctorDegrees(data.doctorDegrees)
            toast.success("Template loaded")
        } catch {
            toast.error("Failed to load template")
        }
    }

    const handleConfirm = async () => {
        if (!report) return
        if (!technicianId) return toast.error("Please select a technician")

        if (mode === 'table') {
            const validRows = rows.filter(r => r.parameter.trim() !== "")
            if (validRows.length === 0) return toast.error("Please enter at least one parameter")
        } else { // narrative mode
            if (!content.trim()) return toast.error("Please enter findings content")
        }

        const payload: DiagnosticResult = {
            mode,
            reportHeader,
            machineInfo,
            consultantName,
            doctorDegrees,
            rows: mode === 'table' ? rows.filter(r => r.parameter.trim() !== "") : undefined,
            content: mode === 'narrative' ? content : undefined,
            interpretation: mode === 'narrative' ? interpretation : undefined,
            preparedBy: mode === 'narrative' ? preparedBy : undefined,
        }

        try {
            await enterResult.mutateAsync({ 
                id: report.id, 
                data: {
                    technicianId,
                    result: payload,
                    reportNotes,
                    status: 'pending-verification'
                } 
            })

            toast.success("Results updated successfully")
            onOpenChange(false)
            onSuccess?.()
        } catch {
            toast.error("Failed to update results")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden flex flex-col h-[90vh]">
                <DialogHeader className="p-6 pb-2 shrink-0 border-b bg-muted/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2 text-blue-600">
                                <Activity className="w-6 h-6" />
                                Patient Result Entry
                            </DialogTitle>
                            <DialogDescription>
                                Finding entry for <strong>{report?.diagnosticTest?.name}</strong> — {report?.patient?.name}
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={loadTemplate} className="rounded-xl h-9 gap-2 font-bold bg-amber-500/5 text-amber-600 border-amber-500/20 hover:bg-amber-500/10">
                                <Zap className="w-3.5 h-3.5" /> Load Template
                            </Button>
                            <Button variant="outline" size="sm" onClick={saveTemplate} className="rounded-xl h-9 gap-2 font-bold bg-emerald-500/5 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10">
                                <Save className="w-3.5 h-3.5" /> Save Template
                            </Button>
                        </div>
                    </div>
                </DialogHeader>                <div className="flex-1 overflow-hidden">
                    <Tabs value={mode} onValueChange={(v) => setMode(v as ResultMode)} className="h-full flex flex-col">
                        <div className="px-6 py-4 flex items-center justify-between shrink-0 border-b bg-muted/5">
                            <TabsList className="grid w-[300px] grid-cols-2 rounded-xl h-11 p-1 bg-muted/50">
                                <TabsTrigger value="table" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <ClipboardList className="w-4 h-4 mr-2" /> Table Mode
                                </TabsTrigger>
                                <TabsTrigger value="narrative" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                    <FileText className="w-4 h-4 mr-2" /> Narrative Mode
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                            <div className="space-y-8 pb-10">
                                {/* General Report Settings */}
                                <div className="grid grid-cols-2 gap-6 p-4 rounded-2xl bg-muted/20 border border-border/50">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <FileText className="w-3 h-3" /> Report Header Title
                                        </Label>
                                        <Input 
                                            value={reportHeader} 
                                            onChange={e => setReportHeader(e.target.value)} 
                                            placeholder="e.g. BIOCHEMISTRY REPORT"
                                            className="h-10 rounded-xl bg-background border-none font-bold placeholder:font-normal shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Activity className="w-3 h-3" /> Machine / Technique Info
                                        </Label>
                                        <Input 
                                            value={machineInfo} 
                                            onChange={e => setMachineInfo(e.target.value)} 
                                            placeholder="e.g. Rayto Chemistry Analyzer..."
                                            className="h-10 rounded-xl bg-background border-none text-xs shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <User className="w-3 h-3 text-amber-500" /> Referred Consultant
                                        </Label>
                                        <Input 
                                            value={consultantName} 
                                            onChange={e => setConsultantName(e.target.value)} 
                                            placeholder="Doctor Name (e.g. Dr. Ebrahim)"
                                            className="h-10 rounded-xl bg-background border-none font-bold shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <ClipboardList className="w-3 h-3 text-indigo-500" /> Pathologist Degrees
                                        </Label>
                                        <Input 
                                            value={doctorDegrees} 
                                            onChange={e => setDoctorDegrees(e.target.value)} 
                                            placeholder="e.g. MBBS, BCS (Health) CMU"
                                            className="h-10 rounded-xl bg-background border-none text-xs shadow-sm"
                                        />
                                    </div>
                                </div>

                                <TabsContent value="table" className="m-0 space-y-4 focus-visible:ring-0">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Beaker className="w-3 h-3 text-blue-600" /> Result Entry Data
                                        </Label>
                                        <Button variant="ghost" size="sm" onClick={addRow} className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg border border-primary/20">
                                            <Plus className="w-3 h-3 mr-1" /> Add Parameter
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-[1.5fr_1fr_0.8fr_1.5fr_150px_auto] gap-2 px-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground italic">
                                            <span>Parameter / Header</span>
                                            <span className="text-center">Result</span>
                                            <span className="text-center">Unit</span>
                                            <span>Ref Range</span>
                                            <span className="text-center">Formats</span>
                                            <span></span>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {rows.map((row, idx) => (
                                                <div key={idx} className={cn(
                                                    "grid grid-cols-[1.5fr_1fr_0.8fr_1.5fr_150px_auto] gap-2 items-center group p-2 rounded-xl transition-all border",
                                                    row.isHeader ? "bg-blue-500/10 border-blue-500/20 shadow-sm" : "bg-muted/10 border-transparent hover:bg-muted/30 hover:border-border"
                                                )}>
                                                    <Input 
                                                        value={row.parameter} 
                                                        onChange={e => updateRow(idx, 'parameter', e.target.value)}
                                                        className={cn(
                                                            "h-9 border-none bg-transparent shadow-none text-xs focus-visible:ring-0", 
                                                            row.isHeader ? "font-black uppercase tracking-tight text-blue-600 placeholder:text-blue-400" : "font-semibold placeholder:text-muted-foreground/30"
                                                        )}
                                                        placeholder={row.isHeader ? "SECTION HEADER" : "Parameter name"}
                                                    />
                                                    <Input 
                                                        value={row.value} 
                                                        onChange={e => updateRow(idx, 'value', e.target.value)}
                                                        disabled={row.isHeader}
                                                        className={cn(
                                                            "h-9 border border-border/50 bg-background text-xs text-center rounded-lg shadow-sm focus-visible:ring-primary", 
                                                            row.isAbnormal && "text-red-600 font-black border-red-300 bg-red-50", 
                                                            row.isHeader && "opacity-0 cursor-default"
                                                        )}
                                                        placeholder="Result"
                                                    />
                                                    <Input 
                                                        value={row.unit} 
                                                        onChange={e => updateRow(idx, 'unit', e.target.value)}
                                                        disabled={row.isHeader}
                                                        className={cn("h-9 border-none bg-transparent text-xs text-center shadow-none", row.isHeader && "opacity-0 cursor-default")}
                                                        placeholder="Unit"
                                                    />
                                                    <Input 
                                                        value={row.referenceRange} 
                                                        onChange={e => updateRow(idx, 'referenceRange', e.target.value)}
                                                        disabled={row.isHeader}
                                                        className={cn("h-9 border-none bg-transparent text-[10px] shadow-none italic placeholder:text-muted-foreground/30", row.isHeader && "opacity-0 cursor-default")}
                                                        placeholder="Ref Range"
                                                    />
                                                    
                                                    <div className="flex items-center justify-center gap-1.5 shrink-0">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => updateRow(idx, 'isBold', !row.isBold)}
                                                            className={cn("h-7 w-7 rounded-md transition-all", row.isBold ? "bg-blue-600 text-white shadow-sm" : "bg-muted/30 text-muted-foreground hover:bg-muted/50")}
                                                            title="Toggle Bold"
                                                        >
                                                            <Bold className="h-3 w-3" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => updateRow(idx, 'isAbnormal', !row.isAbnormal)}
                                                            className={cn("h-7 w-7 rounded-md transition-all", row.isAbnormal ? "bg-red-600 text-white shadow-sm" : "bg-muted/30 text-muted-foreground hover:bg-muted/50")}
                                                            title="Toggle Abnormal Flag"
                                                        >
                                                            <Zap className="h-3 w-3" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => updateRow(idx, 'isHeader', !row.isHeader)}
                                                            className={cn("h-7 w-7 rounded-md transition-all", row.isHeader ? "bg-indigo-600 text-white shadow-sm" : "bg-muted/30 text-muted-foreground hover:bg-muted/50")}
                                                            title="Toggle Section Header"
                                                        >
                                                            <ClipboardList className="h-3 w-3" />
                                                        </Button>
                                                    </div>

                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => removeRow(idx)}
                                                        className="h-7 w-7 rounded-md text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="narrative" className="m-0 space-y-6 focus-visible:ring-0">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <FileText className="w-3 h-3 text-blue-600" /> Clinical Findings
                                            </Label>
                                            <RichTextEditor 
                                                value={content} 
                                                onChange={setContent}
                                                placeholder="Enter descriptive findings (e.g. LIVER: Normal in size...)"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <Zap className="w-3 h-3 text-amber-500" /> Impression / Recommendation
                                            </Label>
                                            <Textarea 
                                                value={interpretation} 
                                                onChange={e => setInterpretation(e.target.value)}
                                                placeholder="Summary impression of the test results..."
                                                className="min-h-[100px] rounded-xl bg-background border border-border/50 font-bold p-4 shadow-inner focus-visible:ring-primary"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                <User className="w-3 h-3" /> Prepared / Signed By (Text)
                                            </Label>
                                            <Input 
                                                value={preparedBy} 
                                                onChange={e => setPreparedBy(e.target.value)}
                                                placeholder="e.g. Dr. Salman Patwary"
                                                className="h-11 rounded-xl bg-background border border-border/50 font-bold"
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Technician Selection & Notes */}
                                <div className="pt-8 border-t border-dashed mt-10 grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <User className="w-4 h-4 text-blue-600" /> Technician In Charge
                                        </Label>
                                        <Select value={technicianId} onValueChange={setTechnicianId}>
                                            <SelectTrigger className="h-12 rounded-xl bg-background border border-border/50 shadow-sm focus:ring-2 focus:ring-primary/20">
                                                <SelectValue placeholder="Select performing technician..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl shadow-2xl">
                                                {loadingEmployees ? (
                                                    <div className="p-4 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
                                                ) : employees.map(emp => (
                                                    <SelectItem key={emp.id} value={emp.id} className="rounded-lg m-1">{emp.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground italic">Required for report finalization</p>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Internal Audit Notes</Label>
                                        <Input 
                                            value={reportNotes} 
                                            onChange={e => setReportNotes(e.target.value)}
                                            placeholder="Confidential technician notes..."
                                            className="h-12 rounded-xl bg-background border border-border/50 shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t shrink-0 flex items-center justify-between">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold h-12 px-8 hover:bg-red-50 hover:text-red-600 transition-colors">
                        Close Without Saving
                    </Button>
                    <div className="flex gap-3">
                        <Button 
                            onClick={handleConfirm}
                            disabled={!technicianId || enterResult.isPending}
                            className="rounded-xl h-12 px-12 font-black shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 transition-all active:scale-95 disabled:grayscale"
                        >
                            {enterResult.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Finalize Report & Submit
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
