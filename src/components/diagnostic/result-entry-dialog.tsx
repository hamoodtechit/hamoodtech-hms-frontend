"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { useCreateReportTemplate, useDeleteReportTemplate, useEnterResult, useReportTemplates, useUpdateReportTemplate } from "@/hooks/diagnostic-queries"
import { useEmployees } from "@/hooks/hr-queries"
import { usePermissions } from "@/hooks/use-permissions"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useStoreContext } from "@/store/use-store-context"
import { useAuthStore } from "@/store/use-auth-store"
import { DiagnosticBlock, DiagnosticBlockType, DiagnosticReport, DiagnosticResult, ResultMode, ResultTableRow, DiagnosticColumnDef } from "@/types/diagnostic"
import { Activity, Beaker, Bold, ClipboardList, Columns, FileText, GripVertical, Italic, List, Loader2, Plus, Save, Settings2, Trash2, Type, Underline, User, Zap } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { v4 as uuidv4 } from "uuid"


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
    const { user } = useAuthStore()
    const { activeStoreId } = useStoreContext()
    // Block-based state
    const [blocks, setBlocks] = useState<DiagnosticBlock[]>([])
    
    // Legacy states (kept for backward sync if needed, but primary is blocks)
    const [mode, setMode] = useState<ResultMode>("table")
    const [reportHeader, setReportHeader] = useState("")
    const [machineInfo, setMachineInfo] = useState("")
    const [reportNotes, setReportNotes] = useState("")
    const [consultantName, setConsultantName] = useState("")
    const [consultantDesignation, setConsultantDesignation] = useState("")
    const [doctorDegrees, setDoctorDegrees] = useState("")
    const [doctorDesignation, setDoctorDesignation] = useState("")
    const [technicianId, setTechnicianId] = useState("")


    const { data: employeesRes, isLoading: loadingEmployees } = useEmployees({ limit: 100 })
    const employees = employeesRes?.data || []
    const doctors = employees.filter(emp => emp.employeeType?.toLowerCase() === 'doctor')
    
    const [doctorSearch, setDoctorSearch] = useState("")
    const [openDoctorSelect, setOpenDoctorSelect] = useState(false)

    const enterResult = useEnterResult()
    
    // Template Hooks
    const { data: templatesRes, isLoading: loadingTemplates, refetch: refetchTemplates } = useReportTemplates({ 
        diagnosticTestId: report?.diagnosticTestId || undefined,
        name: report?.diagnosticTest?.name || undefined,
        limit: 100 
    })
    const templates = templatesRes?.data || []
    
    const createTemplate = useCreateReportTemplate()
    const updateTemplate = useUpdateReportTemplate()
    const deleteTemplate = useDeleteReportTemplate()

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none")

    // Initialize/Reset
    useEffect(() => {
        if (open && report) {
            const testName = report.diagnosticTest?.name;
            const defaultHeader = (testName || "DIAGNOSTIC").toUpperCase() + " REPORT";
            setReportHeader(prev => prev || defaultHeader)

            // 1. Check for blocks (new version)
            const res = report.result as DiagnosticResult | null;
            
            if (res?.blocks && Array.isArray(res.blocks) && res.blocks.length > 0) {
                setBlocks(res.blocks);
                setMode(res.mode || 'table');
                setReportHeader(res.reportHeader || defaultHeader);
                setMachineInfo(res.machineInfo || "");
                setConsultantName(res.consultantName || "");
                setConsultantDesignation(res.consultantDesignation || "");
                setDoctorDegrees(res.doctorDegrees || "");
                setDoctorDesignation(res.doctorDesignation || "");
                setTechnicianId(report.technicianId || user?.id || "");
            } 
            // 2. Legacy Loader (convert old data to blocks)
            else if (res) {
                const legacyBlocks: DiagnosticBlock[] = [];
                setTechnicianId(report.technicianId || user?.id || "");
                
                // Convert rows to blocks
                if (res.rows && res.rows.length > 0) {
                    res.rows.forEach(row => {
                        legacyBlocks.push({
                            id: uuidv4(),
                            type: 'parameter',
                            parameter: row.parameter,
                            value: row.value,
                            unit: row.unit,
                            referenceRange: row.referenceRange,
                            isAbnormal: row.isAbnormal,
                            isBold: row.isBold,
                            isHeader: row.isHeader
                        });
                    });
                }
                
                // Convert content to blocks
                if (res.content) {
                    legacyBlocks.push({
                        id: uuidv4(),
                        type: 'narrative',
                        content: res.content
                    });
                }

                if (res.interpretation) {
                    legacyBlocks.push({
                        id: uuidv4(),
                        type: 'impression',
                        content: res.interpretation
                    });
                }

                setBlocks(legacyBlocks);
                setMode(res.mode || 'table');
                setReportHeader(res.reportHeader || defaultHeader);
                setMachineInfo(res.machineInfo || "");
                setConsultantName(res.consultantName || "");
                setConsultantDesignation(res.consultantDesignation || "");
                setDoctorDegrees(res.doctorDegrees || "");
                setDoctorDesignation(res.doctorDesignation || "");
                setTechnicianId(report.technicianId || user?.id || "");
            } else {
                // Initial empty state
                setTechnicianId(user?.id || "");
                setBlocks([{ id: uuidv4(), type: 'parameter', parameter: "", value: "", unit: "", referenceRange: "" }]);
                // Pre-fill consultant from sale
                const saleDoc = (report.saleItem as any)?.sale?.doctor;
                if (saleDoc?.name) setConsultantName(saleDoc.name);
                if (saleDoc?.designation?.name) setConsultantDesignation(saleDoc.designation.name);
            }
        }
    }, [open, report?.id, user?.id])


    const DEFAULT_COLUMNS: DiagnosticColumnDef[] = [
        { id: '1', label: 'Parameter', key: 'parameter', isVisible: true, width: '1.5fr' },
        { id: '2', label: 'Result', key: 'value', isVisible: true, width: '1fr' },
        { id: '3', label: 'Unit', key: 'unit', isVisible: true, width: '0.8fr' },
        { id: '4', label: 'Ref Range', key: 'referenceRange', isVisible: true, width: '1.5fr' }
    ]

    const addBlock = (type: DiagnosticBlockType, index?: number) => {
        const newBlock: DiagnosticBlock = {
            id: uuidv4(),
            type,
            parameter: "",
            value: "",
            unit: "",
            referenceRange: "",
            content: "",
            columnDefs: type === 'parameter' ? DEFAULT_COLUMNS : undefined,
            extraValues: {}
        }
        
        if (typeof index === 'number') {
            const next = [...blocks]
            next.splice(index + 1, 0, newBlock)
            setBlocks(next)
        } else {
            setBlocks([...blocks, newBlock])
        }
    }

    const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (!report?.result) return
        const fields = new Set<string>()
        if (report.result.machineInfo) fields.add('machineInfo')
        if (report.result.consultantName) fields.add('consultantName')
        if (report.result.consultantDesignation) fields.add('consultantDesignation')
        if (report.result.doctorDegrees) fields.add('doctorDegrees')
        if (report.result.doctorDesignation) fields.add('doctorDesignation')
        setVisibleFields(fields)
    }, [report])

    const toggleHeaderField = (field: string) => {
        const next = new Set(visibleFields)
        if (next.has(field)) next.delete(field)
        else next.add(field)
        setVisibleFields(next)
    }


    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id))
    }

    const updateBlock = (id: string, field: keyof DiagnosticBlock, val: any) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: val } : b))
    }

    const onDragEnd = (result: any) => {
        if (!result.destination) return
        const items = Array.from(blocks)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)
        setBlocks(items)
    }

    const toggleColumn = (blockId: string, colKey: string) => {
        setBlocks(blocks.map(b => {
            if (b.id !== blockId || !b.columnDefs) return b
            return {
                ...b,
                columnDefs: b.columnDefs.map(c => c.key === colKey ? { ...c, isVisible: !c.isVisible } : c)
            }
        }))
    }

    const removeColumn = (blockId: string, colKey: string) => {
        setBlocks(blocks.map(b => {
            if (b.id !== blockId || !b.columnDefs) return b
            return {
                ...b,
                columnDefs: b.columnDefs.filter(c => c.key !== colKey)
            }
        }))
    }

    const addCustomColumn = (blockId: string) => {
        const label = prompt("Enter column name:")
        if (!label) return
        const key = `custom_${uuidv4().substring(0, 4)}`
        
        setBlocks(blocks.map(b => {
            if (b.id !== blockId) return b
            const currentCols = b.columnDefs || DEFAULT_COLUMNS
            return {
                ...b,
                columnDefs: [...currentCols, { id: uuidv4(), label, key, isVisible: true, width: '1fr' }]
            }
        }))
    }



    // Template Logic
    const handleSaveTemplate = async () => {
        if (!report?.diagnosticTestId) return
        
        const name = prompt("Enter a name for this template:", report.diagnosticTest?.name || "New Template")
        if (!name) return

        const templateData = { 
            mode, 
            reportHeader, 
            machineInfo, 
            blocks,
            consultantName, 
            consultantDesignation,
            doctorDegrees,
            doctorDesignation
        }


        try {
            await createTemplate.mutateAsync({
                name,
                type: mode,
                description: `Template for ${report.diagnosticTest?.name}`,
                result: templateData,
                diagnosticTestId: report.diagnosticTestId,
                branchId: activeStoreId || ""
            })
            toast.success("Template saved successfully")
            refetchTemplates()
        } catch {
            toast.error("Failed to save template")
        }
    }

    const handleLoadTemplate = (templateId: string) => {
        if (templateId === "none") return
        const template = templates.find(t => t.id === templateId)
        if (!template) return
        
        try {
            const data = template.result as any
            if (data.blocks) setBlocks(data.blocks)
            else if (data.rows) {
                // Convert legacy rows to blocks
                setBlocks(data.rows.map((r: any) => ({
                    id: uuidv4(),
                    type: 'parameter',
                    ...r
                })))
            }
            if (data.reportHeader) setReportHeader(data.reportHeader)
            if (data.machineInfo) setMachineInfo(data.machineInfo)
            if (data.consultantName) setConsultantName(data.consultantName)
            if (data.consultantDesignation) setConsultantDesignation(data.consultantDesignation)
            if (data.doctorDegrees) setDoctorDegrees(data.doctorDegrees)
            if (data.doctorDesignation) setDoctorDesignation(data.doctorDesignation)

            setSelectedTemplateId(templateId)
            toast.success(`Template "${template.name}" loaded`)
        } catch {
            toast.error("Failed to load template data")
        }
    }

    const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (window.confirm("Are you sure you want to delete this template?")) {
            try {
                await deleteTemplate.mutateAsync(templateId)
                toast.success("Template deleted")
                if (selectedTemplateId === templateId) setSelectedTemplateId("none")
                refetchTemplates()
            } catch {
                toast.error("Failed to delete template")
            }
        }
    }

    const handleConfirm = async () => {
        if (!report) return
        if (!technicianId) return toast.error("Please select a technician")

        const payload: DiagnosticResult = {
            mode,
            reportHeader,
            machineInfo,
            consultantName,
            consultantDesignation,
            doctorDegrees,
            doctorDesignation,
            blocks: blocks.filter(b => (b.parameter?.trim() || b.content?.trim() || b.headerText?.trim()))
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
            <DialogContent className="max-w-[95vw] sm:max-w-[95vw] h-[92vh] p-0 gap-0 border-none bg-background shadow-2xl rounded-3xl overflow-hidden flex flex-col">
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
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col gap-1 min-w-[200px]">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Report Template</Label>
                                <Select value={selectedTemplateId} onValueChange={handleLoadTemplate}>
                                    <SelectTrigger className="h-9 rounded-xl border-amber-500/20 bg-amber-500/5 text-amber-700 font-bold text-xs ring-0 focus:ring-0">
                                        <div className="flex items-center gap-2">
                                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                                            <SelectValue placeholder="Select Template" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-2xl border-amber-500/10">
                                        <SelectItem value="none" className="text-xs font-medium">None (Standard)</SelectItem>
                                        {templates.map(t => (
                                            <SelectItem key={t.id} value={t.id} className="text-xs font-bold group">
                                                <div className="flex items-center justify-between w-full gap-4">
                                                    <span>{t.name}</span>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-5 w-5 rounded-md text-red-500 hover:bg-red-50 ml-auto opacity-0 group-hover:opacity-100"
                                                        onClick={(e) => handleDeleteTemplate(t.id, e)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleSaveTemplate} className="rounded-xl h-10 mt-5 gap-2 font-bold bg-emerald-500/5 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10">
                                <Save className="w-3.5 h-3.5" /> Save Current as Template
                            </Button>
                        </div>
                    </div>
                </DialogHeader>                <div className="flex-1 overflow-hidden">
                    <div className="h-full flex flex-col">
                        <div className="px-6 py-4 flex items-center justify-between shrink-0 border-b bg-muted/5">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mr-2">Add Block:</span>
                                <Button variant="outline" size="sm" onClick={() => addBlock('header')} className="h-9 rounded-lg gap-2 font-bold bg-blue-500/5 text-blue-600 border-blue-500/20">
                                    <Type className="w-3.5 h-3.5" /> Header
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => addBlock('parameter')} className="h-9 rounded-lg gap-2 font-bold bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                                    <Beaker className="w-3.5 h-3.5" /> Parameter
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => addBlock('narrative')} className="h-9 rounded-lg gap-2 font-bold bg-indigo-500/5 text-indigo-600 border-indigo-500/20">
                                    <FileText className="w-3.5 h-3.5" /> Narrative
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => addBlock('impression')} className="h-9 rounded-lg gap-2 font-bold bg-amber-500/5 text-amber-600 border-amber-500/20">
                                    <Zap className="w-3.5 h-3.5" /> Impression
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                            <div className="space-y-8 pb-10">
                                {/* General Report Settings */}
                                <div className="space-y-4 p-5 rounded-2xl bg-muted/20 border border-border/50 shadow-inner">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-1 w-full max-w-xl">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Report Header Title</Label>
                                            <Input 
                                                value={reportHeader} 
                                                onChange={e => setReportHeader(e.target.value)} 
                                                placeholder="e.g. REPORT OF COMPLETE BLOOD COUNT (CBC)"
                                                className="h-12 rounded-xl bg-background border-none text-sm font-black text-blue-700 shadow-sm"
                                            />
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" className="h-10 rounded-xl gap-2 font-bold bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 mt-5">
                                                    <Plus className="w-3.5 h-3.5" /> Add Metadata Info
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-2xl">
                                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Info To Add</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => toggleHeaderField('machineInfo')} className="rounded-lg m-1 cursor-pointer">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>Machine / Tech info</span>
                                                        {visibleFields.has('machineInfo') && <Zap className="w-3 h-3 text-amber-500" />}
                                                    </div>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleHeaderField('consultantName')} className="rounded-lg m-1 cursor-pointer">
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>Consultant Name</span>
                                                        {visibleFields.has('consultantName') && <Zap className="w-3 h-3 text-amber-500" />}
                                                    </div>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleHeaderField('consultantDesignation')} className="rounded-lg m-1 cursor-pointer">
                                                    <span>Consultant Designation</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleHeaderField('doctorDegrees')} className="rounded-lg m-1 cursor-pointer">
                                                    <span>Pathologist Degrees</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleHeaderField('doctorDesignation')} className="rounded-lg m-1 cursor-pointer">
                                                    <span>Pathologist Designation</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {visibleFields.has('machineInfo') && (
                                            <div className="space-y-1 group relative">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <Zap className="w-3 h-3 text-amber-500" /> Machine / Technique Info
                                                </Label>
                                                <Input 
                                                    value={machineInfo} 
                                                    onChange={e => setMachineInfo(e.target.value)} 
                                                    placeholder="e.g. Sysmex XN-1000 Automated Analyzer"
                                                    className="h-10 rounded-xl bg-background border-none text-xs shadow-sm pr-10"
                                                />
                                                <Button size="icon" variant="ghost" onClick={() => toggleHeaderField('machineInfo')} className="h-6 w-6 absolute right-2 top-6 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></Button>
                                            </div>
                                        )}
                                        {visibleFields.has('consultantName') && (
                                            <div className="space-y-1 group relative">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <User className="w-3 h-3 text-blue-500" /> Referred Consultant
                                                </Label>
                                                
                                                <Popover open={openDoctorSelect} onOpenChange={setOpenDoctorSelect}>
                                                    <PopoverTrigger asChild>
                                                        <div className="relative">
                                                            <Input 
                                                                value={consultantName} 
                                                                onChange={e => {
                                                                    setConsultantName(e.target.value)
                                                                    if (!openDoctorSelect) setOpenDoctorSelect(true)
                                                                }} 
                                                                placeholder="Search or type doctor name..."
                                                                className="h-10 rounded-xl bg-background border-none text-xs shadow-sm pr-10"
                                                            />
                                                            <Button size="icon" variant="ghost" onClick={() => toggleHeaderField('consultantName')} className="h-6 w-6 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </div>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="p-0 w-[400px] rounded-xl shadow-2xl border-blue-100" align="start">
                                                        <Command className="rounded-xl">
                                                            <CommandInput 
                                                                placeholder="Search clinic doctors..." 
                                                                value={doctorSearch}
                                                                onValueChange={setDoctorSearch}
                                                                className="h-10"
                                                            />
                                                            <CommandList className="max-h-[250px]">
                                                                <CommandEmpty className="p-4 text-xs text-muted-foreground flex flex-col items-center gap-2">
                                                                    No clinic doctor found.
                                                                    <Button 
                                                                        variant="outline" 
                                                                        size="sm" 
                                                                        className="h-7 text-[10px] rounded-lg"
                                                                        onClick={() => {
                                                                            setConsultantName(doctorSearch)
                                                                            setOpenDoctorSelect(false)
                                                                        }}
                                                                    >
                                                                        Use "{doctorSearch}" as manual entry
                                                                    </Button>
                                                                </CommandEmpty>
                                                                <CommandGroup heading="Clinic Doctors">
                                                                    {doctors.map(doc => (
                                                                        <CommandItem
                                                                            key={doc.id}
                                                                            value={doc.name}
                                                                            onSelect={() => {
                                                                                setConsultantName(doc.name)
                                                                                if (doc.designation?.name) {
                                                                                    setConsultantDesignation(doc.designation.name)
                                                                                    if (!visibleFields.has('consultantDesignation')) {
                                                                                        toggleHeaderField('consultantDesignation')
                                                                                    }
                                                                                }
                                                                                setOpenDoctorSelect(false)
                                                                                setDoctorSearch("")
                                                                            }}
                                                                            className="flex flex-col items-start gap-1 p-3 cursor-pointer rounded-lg m-1"
                                                                        >
                                                                            <span className="font-bold text-xs">{doc.name}</span>
                                                                            {doc.designation?.name && (
                                                                                <span className="text-[10px] text-muted-foreground italic">{doc.designation.name}</span>
                                                                            )}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        )}
                                        {visibleFields.has('consultantDesignation') && (
                                            <div className="space-y-1 group relative">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Consultant Designation</Label>
                                                <Input 
                                                    value={consultantDesignation} 
                                                    onChange={e => setConsultantDesignation(e.target.value)} 
                                                    placeholder="e.g. Cardiologist"
                                                    className="h-10 rounded-xl bg-background border-none text-xs shadow-sm pr-10"
                                                />
                                                <Button size="icon" variant="ghost" onClick={() => toggleHeaderField('consultantDesignation')} className="h-6 w-6 absolute right-2 top-6 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></Button>
                                            </div>
                                        )}
                                        {visibleFields.has('doctorDegrees') && (
                                            <div className="space-y-1 group relative">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <ClipboardList className="w-3 h-3 text-indigo-300" /> Pathologist Degrees
                                                </Label>
                                                <Input 
                                                    value={doctorDegrees} 
                                                    onChange={e => setDoctorDegrees(e.target.value)} 
                                                    placeholder="e.g. MBBS, BCS"
                                                    className="h-10 rounded-xl bg-background border-none text-xs shadow-sm pr-10"
                                                />
                                                <Button size="icon" variant="ghost" onClick={() => toggleHeaderField('doctorDegrees')} className="h-6 w-6 absolute right-2 top-6 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></Button>
                                            </div>
                                        )}
                                        {visibleFields.has('doctorDesignation') && (
                                            <div className="space-y-1 group relative">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                    <ClipboardList className="w-3 h-3 text-indigo-300" /> Pathologist Designation
                                                </Label>
                                                <Input 
                                                    value={doctorDesignation} 
                                                    onChange={e => setDoctorDesignation(e.target.value)} 
                                                    placeholder="e.g. Senior Pathologist"
                                                    className="h-10 rounded-xl bg-background border-none text-xs shadow-sm pr-10"
                                                />
                                                <Button size="icon" variant="ghost" onClick={() => toggleHeaderField('doctorDesignation')} className="h-6 w-6 absolute right-2 top-6 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* BLOCK BUILDER AREA */}
                                <DragDropContext onDragEnd={onDragEnd}>
                                    <Droppable droppableId="blocks">
                                        {(provided) => (
                                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                                {blocks.map((block, index) => (
                                                    <Draggable key={block.id} draggableId={block.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={cn(
                                                                    "group relative bg-background border rounded-2xl transition-all",
                                                                    snapshot.isDragging ? "shadow-2xl border-primary ring-4 ring-primary/10 z-50 scale-[1.02]" : "border-border/50 hover:border-border",
                                                                    block.type === 'header' && "bg-blue-500/5 border-blue-500/20",
                                                                    block.type === 'impression' && "bg-amber-500/5 border-amber-500/20"
                                                                )}
                                                            >
                                                                {/* Drag Handle */}
                                                                <div 
                                                                    {...provided.dragHandleProps}
                                                                    className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 bg-white border rounded-md shadow-sm z-10"
                                                                >
                                                                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                                                                </div>                                                                 {/* Block Actions */}
                                                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                                    {block.type === 'parameter' && (
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg bg-white border shadow-sm hover:text-indigo-600">
                                                                                    <Settings2 className="w-3.5 h-3.5" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl">
                                                                                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pb-1">Visible Columns</DropdownMenuLabel>
                                                                                {(block.columnDefs || DEFAULT_COLUMNS).map(col => {
                                                                                    const isCore = ['parameter', 'value', 'unit', 'referenceRange'].includes(col.key);
                                                                                    return (
                                                                                        <div key={col.key} className="flex items-center gap-1 group/item">
                                                                                            <DropdownMenuItem 
                                                                                                onClick={(e) => { e.preventDefault(); toggleColumn(block.id, col.key); }}
                                                                                                className="flex-1 flex items-center justify-between rounded-lg cursor-pointer"
                                                                                            >
                                                                                                <span className="text-xs font-bold">{col.label}</span>
                                                                                                <div className={cn("w-2.5 h-2.5 rounded-full", col.isVisible ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted border")} />
                                                                                            </DropdownMenuItem>
                                                                                            {!isCore && (
                                                                                                <Button 
                                                                                                    variant="ghost" 
                                                                                                    size="sm" 
                                                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeColumn(block.id, col.key); }}
                                                                                                    className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                                                                >
                                                                                                    <Trash2 className="w-3 h-3" />
                                                                                                </Button>
                                                                                            )}
                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem onClick={() => addCustomColumn(block.id)} className="text-xs font-black text-indigo-600 hover:text-indigo-700 bg-indigo-50/50 rounded-lg m-1 justify-center py-2 cursor-pointer">
                                                                                    <Plus className="w-3 h-3 mr-2" /> Add Custom Field
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    )}
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        onClick={() => addBlock(block.type, index)}
                                                                        className="h-7 w-7 rounded-lg bg-white border shadow-sm hover:text-blue-600"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        onClick={() => removeBlock(block.id)}
                                                                        className="h-7 w-7 rounded-lg bg-white border shadow-sm hover:text-red-600 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>


                                                                <div className="p-4">
                                                                    {block.type === 'header' && (
                                                                        <div className="flex items-center gap-3">
                                                                            <Type className="w-4 h-4 text-blue-600 shrink-0" />
                                                                            <Input 
                                                                                value={block.headerText || block.parameter} 
                                                                                onChange={e => updateBlock(block.id, 'headerText', e.target.value)}
                                                                                placeholder="Section Header (e.g. MICROSCOPY)"
                                                                                className="border-none bg-transparent h-10 text-lg font-black uppercase tracking-tight text-blue-700 placeholder:text-blue-300 focus-visible:ring-0"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {block.type === 'parameter' && (
                                                                        <div 
                                                                            className="grid gap-3 items-center" 
                                                                            style={{ 
                                                                                gridTemplateColumns: `${(block.columnDefs || DEFAULT_COLUMNS).filter(c => c.isVisible).map(c => c.width || '1fr').join(' ')} 80px` 
                                                                            }}
                                                                        >
                                                                            {(block.columnDefs || DEFAULT_COLUMNS).filter(c => c.isVisible).map(col => {
                                                                                const isCore = ['parameter', 'value', 'unit', 'referenceRange'].includes(col.key);
                                                                                const val = isCore ? (block as any)[col.key] : (block.extraValues?.[col.key] || "");
                                                                                
                                                                                return (
                                                                                    <Input 
                                                                                        key={col.key}
                                                                                        value={val} 
                                                                                        onChange={e => {
                                                                                            if (isCore) updateBlock(block.id, col.key as keyof DiagnosticBlock, e.target.value)
                                                                                            else {
                                                                                                const nextExtra = { ...(block.extraValues || {}), [col.key]: e.target.value }
                                                                                                updateBlock(block.id, 'extraValues', nextExtra)
                                                                                            }
                                                                                        }}
                                                                                        placeholder={col.label}
                                                                                        className={cn(
                                                                                            "h-10 border-none bg-muted/20 rounded-xl px-4",
                                                                                            col.key === 'parameter' && "font-bold",
                                                                                            col.key === 'parameter' && block.isHeader && "text-blue-700 uppercase",
                                                                                            col.key === 'value' && "text-center font-black bg-background border border-border/50 shadow-sm",
                                                                                            col.key === 'value' && block.isAbnormal && "bg-red-50 text-red-600 border-red-200 shadow-none",
                                                                                            !isCore && "italic text-indigo-600 bg-indigo-50/30"
                                                                                        )}
                                                                                    />
                                                                                )
                                                                            })}
                                                                            
                                                                            <div className="flex justify-end gap-1">
                                                                                <Button 
                                                                                    variant="ghost" 
                                                                                    size="icon" 
                                                                                    onClick={() => updateBlock(block.id, 'isAbnormal', !block.isAbnormal)}
                                                                                    className={cn("h-8 w-8 rounded-lg", block.isAbnormal ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-muted/30 text-muted-foreground")}
                                                                                >
                                                                                    <Zap className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button 
                                                                                    variant="ghost" 
                                                                                    size="icon" 
                                                                                    onClick={() => updateBlock(block.id, 'isBold', !block.isBold)}
                                                                                    className={cn("h-8 w-8 rounded-lg", block.isBold ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-muted/30 text-muted-foreground")}
                                                                                >
                                                                                    <Bold className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )}


                                                                    {(block.type === 'narrative' || block.type === 'impression') && (
                                                                        <div className="space-y-3">
                                                                            <div className="flex items-center gap-2">
                                                                                {block.type === 'narrative' ? <FileText className="w-4 h-4 text-indigo-600" /> : <Zap className="w-4 h-4 text-amber-500" />}
                                                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                                                    {block.type === 'narrative' ? 'Findings / Narrative' : 'Impression / Note'}
                                                                                </span>
                                                                            </div>
                                                                            {block.type === 'narrative' ? (
                                                                                <RichTextEditor 
                                                                                    value={block.content || ""} 
                                                                                    onChange={val => updateBlock(block.id, 'content', val)}
                                                                                    placeholder="Enter detailed clinical findings..."
                                                                                />
                                                                            ) : (
                                                                                <Textarea 
                                                                                    value={block.content || ""} 
                                                                                    onChange={e => updateBlock(block.id, 'content', e.target.value)}
                                                                                    placeholder="Summary impression..."
                                                                                    className="min-h-[100px] border-none bg-muted/20 rounded-2xl p-4 font-bold focus-visible:ring-0"
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                </DragDropContext>


                                {/* Technician Selection & Notes */}
                                <div className="pt-8 border-t border-dashed mt-10 grid grid-cols-2 gap-8">
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
                    </div>
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
