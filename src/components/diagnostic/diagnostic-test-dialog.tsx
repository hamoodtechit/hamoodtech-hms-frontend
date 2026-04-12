import { SearchableSelect } from "@/components/shared/searchable-select"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useCreateDiagnosticTest, useTestGroups, useUpdateDiagnosticTest } from "@/hooks/diagnostic-queries"
import { useDepartments } from "@/hooks/hr-queries"
import { useStoreContext } from "@/store/use-store-context"
import { DiagnosticTest, DiagnosticTestPayload } from "@/types/diagnostic"
import { Loader2, Plus, Trash2, Microscope, Search, Eye, EyeOff } from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { v4 as uuidv4 } from "uuid"
import { cn } from "@/lib/utils"

interface DiagnosticTestDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    test?: DiagnosticTest | null
    onSuccess?: () => void
}

function RichTextEditor({ value, onChange, placeholder }: { value: string; onChange: (val: string) => void; placeholder?: string }) {
    const [isSource, setIsSource] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);

    // Sync only when value changes EXTERNALLY (e.g., test data loaded)
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
        <div className="flex flex-col rounded-2xl bg-muted/20 border border-border shadow-inner overflow-hidden">
            <div className="flex items-center justify-between p-2 bg-card border-b border-border shrink-0">
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleCommand('bold')} className="h-8 w-8 p-0 rounded-md">
                        <strong>B</strong>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleCommand('italic')} className="h-8 w-8 p-0 rounded-md">
                        <em>I</em>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleCommand('underline')} className="h-8 w-8 p-0 rounded-md">
                        <u>U</u>
                    </Button>
                    <div className="w-[1px] h-4 bg-border mx-1" />
                    <Button variant="ghost" size="sm" onClick={() => handleCommand('insertUnorderedList')} className="h-8 w-8 p-0 rounded-md">
                        ul
                    </Button>
                </div>
                <Button 
                    variant={isSource ? "default" : "ghost"} 
                    size="sm" 
                    onClick={() => setIsSource(!isSource)}
                    className="h-8 px-2 text-[10px] font-black uppercase tracking-widest"
                >
                    {isSource ? "View Design" : "View Source"}
                </Button>
            </div>
            
            {isSource ? (
                <Textarea 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="min-h-60 rounded-none border-none bg-zinc-950 text-zinc-50 font-mono text-xs focus-visible:ring-0 p-6 leading-relaxed"
                />
            ) : (
                <div 
                    ref={editorRef}
                    className="p-6 min-h-60 outline-none font-medium leading-[1.8] text-sm overflow-y-auto bg-background prose prose-sm max-w-none"
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

export function DiagnosticTestDialog({ open, onOpenChange, test, onSuccess }: DiagnosticTestDialogProps) {
    const [loading, setLoading] = useState(false)
    const { activeStoreId } = useStoreContext()

    const { data: departmentsRes } = useDepartments({ branchId: activeStoreId || undefined, limit: 100 })
    const { data: testGroupsRes } = useTestGroups({ limit: 100 })


    const createMutation = useCreateDiagnosticTest()
    const updateMutation = useUpdateDiagnosticTest()

    const isEdit = !!test

    const [formData, setFormData] = useState<DiagnosticTestPayload>({
        branchId: activeStoreId || "",
        name: "",
        nameBangla: "",
        description: "",
        departmentId: "",
        testGroupId: "",
        price: 0,
        reportDays: 0,
        isDiagnosticTest: true,
        testResultTemplate: [], // For parameters
        templateType: 'table',
        type: 'pathology',
        templateDescription: "",
        machineName: "",
        machineDescription: ""
    })

    useEffect(() => {
        if (open) {
            if (test) {
                setFormData({
                    branchId: test.branchId || activeStoreId || "",
                    name: test.name,
                    nameBangla: test.nameBangla || "",
                    description: test.description || "",
                    departmentId: test.departmentId || "",
                    testGroupId: test.testGroupId || "",
                    price: test.price,
                    reportDays: test.reportDays || 0,
                    isDiagnosticTest: test.isDiagnosticTest ?? true,
                    testResultTemplate: Array.isArray(test.testResultTemplate) ? test.testResultTemplate : [],
                    templateType: test.templateType || 'table',
                    type: test.type || 'pathology',
                    templateDescription: test.templateDescription || "",
                    machineName: test.machineName || "",
                    machineDescription: test.machineDescription || ""
                })
            } else {
                setFormData({
                    branchId: activeStoreId || "",
                    name: "",
                    nameBangla: "",
                    description: "",
                    departmentId: "",
                    testGroupId: "",
                    price: 0,
                    reportDays: 0,
                    isDiagnosticTest: true,
                    testResultTemplate: [],
                    templateType: 'table',
                    type: 'pathology',
                    templateDescription: "",
                    machineName: "",
                    machineDescription: ""
                })
            }
        }
    }, [open, test, activeStoreId])

    const handleSave = async () => {
        // Validation: Name, Price, and BranchId are critical for clinical scoping.
        const effectiveBranchId = formData.branchId || activeStoreId

        if (!formData.name || formData.price === undefined || !effectiveBranchId || !formData.departmentId || !formData.testGroupId) {
            let errorMsg = "Please fill in all required fields."
            if (!effectiveBranchId) errorMsg = "No active branch selected. Please select a branch from the top header."
            else if (!formData.departmentId) errorMsg = "Please select a Clinical Department."
            else if (!formData.testGroupId) errorMsg = "Please select a Service Category / Group."
            
            toast.error(errorMsg)
            return
        }

        setLoading(true)
        try {
            // Clean payload: Filter out empty strings for optional fields ("no need to send blunk data")
            const rawPayload: any = {
                ...formData,
                price: Number(formData.price),
                testResultTemplate: formData.isDiagnosticTest && Array.isArray(formData.testResultTemplate) 
                    ? formData.testResultTemplate.map((p: any) => ({
                        ...p,
                        options: typeof p.options === 'string' 
                            ? p.options.split(",").map((s: string) => s.trim()).filter(Boolean) 
                            : Array.isArray(p.options) ? p.options : []
                    }))
                    : null
            }

            const cleanPayload: any = {}
            Object.keys(rawPayload).forEach(key => {
                const val = rawPayload[key]
                
                // Force effective branchId
                if (key === 'branchId') {
                    cleanPayload[key] = effectiveBranchId
                    return
                }

                // Mandatory fields OR non-empty values
                if (key === 'name' || key === 'price' || (val !== "" && val !== null && val !== undefined)) {
                    cleanPayload[key] = val
                }
            })

            if (isEdit && test) {
                await updateMutation.mutateAsync({
                    id: test.id,
                    data: cleanPayload
                })
                toast.success("Service updated successfully")
            } else {
                await createMutation.mutateAsync(cleanPayload)
                toast.success("Service created successfully")
            }
            onSuccess?.()
            onOpenChange(false)
        } catch {
            toast.error(isEdit ? "Failed to update test" : "Failed to create test")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl p-0 border-none shadow-2xl overflow-hidden bg-background/80 backdrop-blur-xl">
                <DialogHeader className="p-8 pb-4 bg-card border-b">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <Microscope className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black text-foreground tracking-tight">
                                {isEdit ? "Update Hospital Service" : "Register New Service"}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                Configure clinical details, pricing, and reporting parameters.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[75vh] p-8">
                    <div className="space-y-8">
                        {/* Section 1: Basic Information */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Basic Information</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-bold text-foreground">Service Name <span className="text-destructive">*</span></Label>
                                    <Input 
                                        id="name" 
                                        value={formData.name} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Complete Blood Count (CBC)"
                                        className="h-11 rounded-xl border-border bg-background shadow-sm focus:ring-2 focus:ring-primary transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nameBangla" className="text-sm font-bold text-foreground">Display Name (Bangla)</Label>
                                    <Input 
                                        id="nameBangla" 
                                        value={formData.nameBangla} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, nameBangla: e.target.value }))}
                                        placeholder="উদা: সিবিসি টেস্ট"
                                        className="h-11 rounded-xl border-border bg-background shadow-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-foreground flex items-center justify-between">
                                        Clinical Department <span className="text-destructive ml-1">*</span>
                                    </Label>
                                    <SearchableSelect 
                                        value={formData.departmentId || ""}
                                        onChange={(val) => setFormData(prev => ({ ...prev, departmentId: val }))}
                                        options={departmentsRes?.data?.map(d => ({ id: d.id, name: d.name })) || []}
                                        placeholder="Choose Department..."
                                        showAll={false}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-foreground flex items-center justify-between">
                                        Service Category / Group <span className="text-destructive ml-1">*</span>
                                    </Label>
                                    <SearchableSelect 
                                        value={formData.testGroupId || ""}
                                        onChange={(val) => setFormData(prev => ({ ...prev, testGroupId: val }))}
                                        options={testGroupsRes?.data?.map(g => ({ id: g.id, name: g.name })) || []}
                                        placeholder="Choose Category..."
                                        showAll={false}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Equipment & Technology */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Equipment & Technology</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-500/5 dark:bg-blue-500/10 p-6 rounded-2xl border border-blue-500/10 dark:border-blue-500/20">
                                <div className="space-y-2">
                                    <Label htmlFor="machineName" className="text-sm font-bold text-blue-700 dark:text-blue-300 flex items-center justify-between">
                                        Machine / Analyzer Name
                                        <span className="text-[10px] text-blue-500/60 font-normal italic">(For report automation)</span>
                                    </Label>
                                    <Input 
                                        id="machineName" 
                                        value={formData.machineName} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, machineName: e.target.value }))}
                                        placeholder="e.g. Siemens Advia 2120i"
                                        className="h-11 rounded-xl border-border bg-background shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="machineDescription" className="text-sm font-bold text-blue-700 dark:text-blue-300">Equipment Specifications</Label>
                                    <Input 
                                        id="machineDescription" 
                                        value={formData.machineDescription} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, machineDescription: e.target.value }))}
                                        placeholder="e.g. Automated Hematology System"
                                        className="h-11 rounded-xl border-border bg-background shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Pricing & Logistics */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pricing & Logistics</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-sm font-bold text-foreground">Standard Price <span className="text-destructive">*</span></Label>
                                    <SmartNumberInput 
                                        value={Number(formData.price) || undefined} 
                                        onChange={(val) => setFormData(prev => ({ ...prev, price: val || 0 }))}
                                        min={0}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reportDays" className="text-sm font-bold text-foreground flex items-center justify-between">
                                        Delivery Time (Days)
                                        <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span>
                                    </Label>
                                    <SmartNumberInput 
                                        value={formData.reportDays} 
                                        onChange={(val) => setFormData(prev => ({ ...prev, reportDays: val || 0 }))}
                                        min={0}
                                        placeholder="0 for same day"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="templateType" className="text-sm font-bold text-foreground">Reporting Mode</Label>
                                    <Select 
                                        value={formData.templateType} 
                                        onValueChange={(val: any) => setFormData(prev => ({ ...prev, templateType: val }))}
                                    >
                                        <SelectTrigger className="h-11 rounded-xl bg-background border-border">
                                            <SelectValue placeholder="Select Mode" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl">
                                            <SelectItem value="table">Table / Structured</SelectItem>
                                            <SelectItem value="narrative">Narrative / Descriptive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Diagnostic Configuration */}
                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between bg-blue-500/5 p-6 rounded-[2rem] border border-blue-500/10 shadow-sm transition-all hover:bg-blue-500/10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                        <Label htmlFor="isDiagnosticTest" className="text-base font-black text-blue-700 tracking-tight">Advanced Diagnostic Mode</Label>
                                    </div>
                                    <p className="text-xs text-blue-600/70 font-medium pl-4">Enable this to define structured clinical parameters for this service.</p>
                                </div>
                                <div className="flex items-center">
                                    <Switch 
                                        id="isDiagnosticTest" 
                                        checked={formData.isDiagnosticTest} 
                                        onCheckedChange={(val) => setFormData(prev => ({ ...prev, isDiagnosticTest: val }))}
                                        className="data-[state=checked]:bg-blue-600 scale-110"
                                    />
                                </div>
                            </div>

                            {formData.isDiagnosticTest && (
                                <div className="space-y-6 pt-2">
                                    {formData.templateType === 'table' ? (
                                        <>
                                            <div className="flex items-center justify-between bg-muted p-4 rounded-2xl border border-border">
                                                <div>
                                                    <h4 className="text-sm font-black text-foreground">Parameter Template</h4>
                                                    <p className="text-[10px] text-muted-foreground font-medium">Define variables for reporting</p>
                                                </div>
                                                <Button 
                                                    variant="default" 
                                                    size="sm" 
                                                    onClick={() => {
                                                        const next = Array.isArray(formData.testResultTemplate) ? [...formData.testResultTemplate] : []
                                                        next.push({ 
                                                            id: uuidv4(), 
                                                            name: "", 
                                                            result: "", 
                                                            unit: "", 
                                                            refRange: "", 
                                                            minRef: "", 
                                                            maxRef: "", 
                                                            unitEnabled: true, 
                                                            refRangeEnabled: true, 
                                                            fieldType: 'text', 
                                                            options: [] 
                                                        })
                                                        setFormData(prev => ({ ...prev, testResultTemplate: next }))
                                                    }}
                                                    className="h-9 rounded-xl px-4 bg-primary hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" /> Add Field
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                {Array.isArray(formData.testResultTemplate) && formData.testResultTemplate.map((param: any, idx: number) => (
                                                    <div key={param.id || idx} className="p-4 rounded-2xl bg-card border border-border shadow-sm relative group hover:border-primary/50 transition-colors">
                                                        <div className="grid grid-cols-12 gap-4">
                                                            <div className="col-span-12 md:col-span-3 space-y-1.5">
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Parameter Name</Label>
                                                                <Input 
                                                                    value={param.name}
                                                                    onChange={(e) => {
                                                                        const next = [...(formData.testResultTemplate as any[])]
                                                                        next[idx] = { ...next[idx], name: e.target.value }
                                                                        setFormData(prev => ({ ...prev, testResultTemplate: next }))
                                                                    }}
                                                                    placeholder="e.g. Hemoglobin"
                                                                    className="h-10 rounded-xl bg-muted/30 border-none focus-visible:ring-primary font-bold"
                                                                />
                                                            </div>
                                                            <div className="col-span-12 md:col-span-2 space-y-1.5">
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Input Type</Label>
                                                                <Select 
                                                                    value={param.fieldType || 'text'}
                                                                    onValueChange={(val) => {
                                                                        const next = [...(formData.testResultTemplate as any[])]
                                                                        next[idx] = { ...next[idx], fieldType: val as any }
                                                                        setFormData(prev => ({ ...prev, testResultTemplate: next }))
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-none focus:ring-primary">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="rounded-xl">
                                                                        <SelectItem value="text">Standard Text</SelectItem>
                                                                        <SelectItem value="dropdown">Dropdown Selection</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className={cn("col-span-12 md:col-span-3 space-y-1.5", param.fieldType === 'dropdown' ? "block" : "hidden")}>
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Dropdown Options (Comma separated)</Label>
                                                                <Input 
                                                                    value={Array.isArray(param.options) ? param.options.join(", ") : param.options || ""}
                                                                    onChange={(e) => {
                                                                        const next = [...(formData.testResultTemplate as any[])]
                                                                        // Store as raw string while typing to avoid cursor jumps/eating commas
                                                                        next[idx] = { ...next[idx], options: e.target.value }
                                                                        setFormData(prev => ({ ...prev, testResultTemplate: next }))
                                                                    }}
                                                                    placeholder="A+, B+, O+..."
                                                                    className="h-10 rounded-xl bg-indigo-500/5 border-indigo-500/20 text-indigo-700 font-bold focus-visible:ring-indigo-500"
                                                                />
                                                            </div>
                                                            <div className={cn("col-span-12 md:col-span-2 space-y-1.5", param.fieldType === 'dropdown' ? "hidden" : "block")}>
                                                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Default Result</Label>
                                                                <Input 
                                                                    value={param.result}
                                                                    onChange={(e) => {
                                                                        const next = [...(formData.testResultTemplate as any[])]
                                                                        next[idx] = { ...next[idx], result: e.target.value }
                                                                        setFormData(prev => ({ ...prev, testResultTemplate: next }))
                                                                    }}
                                                                    placeholder="N/A"
                                                                    className="h-10 rounded-xl bg-muted/30 border-none focus-visible:ring-primary font-medium"
                                                                />
                                                            </div>
                                                            <div className="col-span-6 md:col-span-2 space-y-1.5">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Unit</Label>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors"
                                                                        onClick={() => {
                                                                            const next = [...(formData.testResultTemplate as any[])]
                                                                            next[idx] = { ...next[idx], unitEnabled: !param.unitEnabled }
                                                                            setFormData(prev => ({ ...prev, testResultTemplate: next }))
                                                                        }}
                                                                    >
                                                                        {param.unitEnabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                                                    </Button>
                                                                </div>
                                                                <Input 
                                                                    value={param.unit}
                                                                    disabled={!param.unitEnabled}
                                                                    onChange={(e) => {
                                                                        const next = [...(formData.testResultTemplate as any[])]
                                                                        next[idx] = { ...next[idx], unit: e.target.value }
                                                                        setFormData(prev => ({ ...prev, testResultTemplate: next }))
                                                                    }}
                                                                    placeholder={param.unitEnabled ? "e.g. g/dL" : "Hidden"}
                                                                    className={`h-10 rounded-xl bg-muted/30 border-none focus-visible:ring-primary font-medium ${!param.unitEnabled ? 'opacity-50 grayscale' : ''}`}
                                                                />
                                                            </div>
                                                            <div className="col-span-12 md:col-span-2 space-y-3">
                                                                <div className="flex items-center justify-between border-b border-border/50 pb-1">
                                                                    <Label className="text-[9px] font-black uppercase tracking-widest text-primary/70">Ref Boundaries</Label>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[8px] font-bold text-muted-foreground uppercase">Min</Label>
                                                                        <Input 
                                                                            value={param.minRef || ""}
                                                                            onChange={(e) => {
                                                                                const next = [...(formData.testResultTemplate as any[])]
                                                                                next[idx] = { ...next[idx], minRef: e.target.value }
                                                                                setFormData(prev => ({ ...prev, testResultTemplate: next }))
                                                                            }}
                                                                            placeholder="0.0"
                                                                            className="h-8 rounded-lg bg-orange-500/5 border-orange-500/10 text-[10px] text-orange-600 font-bold"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[8px] font-bold text-muted-foreground uppercase">Max</Label>
                                                                        <Input 
                                                                            value={param.maxRef || ""}
                                                                            onChange={(e) => {
                                                                                const next = [...(formData.testResultTemplate as any[])]
                                                                                next[idx] = { ...next[idx], maxRef: e.target.value }
                                                                                setFormData(prev => ({ ...prev, testResultTemplate: next }))
                                                                            }}
                                                                            placeholder="10.0"
                                                                            className="h-8 rounded-lg bg-rose-500/5 border-rose-500/10 text-[10px] text-rose-600 font-bold"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-span-12 md:col-span-2 space-y-1.5">
                                                                <div className="flex items-center justify-between">
                                                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">Reference Range</Label>
                                                                    <Button 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors"
                                                                        onClick={() => {
                                                                            const next = [...(formData.testResultTemplate as any[])]
                                                                            next[idx] = { ...next[idx], refRangeEnabled: !param.refRangeEnabled }
                                                                            setFormData(prev => ({ ...prev, testResultTemplate: next }))
                                                                        }}
                                                                    >
                                                                        {param.refRangeEnabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                                                    </Button>
                                                                </div>
                                                                <Textarea 
                                                                    value={param.refRange}
                                                                    disabled={!param.refRangeEnabled}
                                                                    onChange={(e) => {
                                                                        const next = [...(formData.testResultTemplate as any[])]
                                                                        next[idx] = { ...next[idx], refRange: e.target.value }
                                                                        setFormData(prev => ({ ...prev, testResultTemplate: next }))
                                                                    }}
                                                                    placeholder={param.refRangeEnabled ? "Standard range..." : "Hidden"}
                                                                    rows={1}
                                                                    className={`min-h-11 rounded-xl bg-muted/30 border-none focus-visible:ring-primary leading-tight py-2.5 ${!param.refRangeEnabled ? 'opacity-50 grayscale' : ''}`}
                                                                />
                                                            </div>
                                                        </div>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            onClick={() => {
                                                                const next = [...(formData.testResultTemplate as any[])]
                                                                next.splice(idx, 1)
                                                                setFormData(prev => ({ ...prev, testResultTemplate: next }))
                                                            }}
                                                            className="h-8 w-8 absolute -right-3 -top-3 rounded-full bg-background border border-border shadow-lg text-destructive opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}

                                                {(!formData.testResultTemplate || formData.testResultTemplate.length === 0) && (
                                                    <div className="py-12 text-center border-2 border-dashed rounded-[2rem] border-border bg-muted/30 flex flex-col items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                                            <Plus className="h-5 w-5 text-muted-foreground" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-bold text-muted-foreground">No parameters defined yet.</p>
                                                            <p className="msg-info text-[10px] text-muted-foreground max-w-50 mx-auto">Click "Add Field" to start building your test reporting template.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/20">
                                                <div>
                                                    <h4 className="text-sm font-black text-indigo-700">Narrative Template Editor</h4>
                                                    <p className="text-[10px] text-indigo-600 font-medium">Draft the default clinical story for this service.</p>
                                                </div>
                                            </div>
                                            <RichTextEditor 
                                                value={formData.templateDescription || ""} 
                                                onChange={(val) => setFormData(prev => ({ ...prev, templateDescription: val }))}
                                                placeholder="Enter default clinical wording (e.g. Findings show...)"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-4 pt-4 pb-8">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                                    <Label htmlFor="description" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Additional Notes</Label>
                                </div>
                                <Textarea 
                                    id="description" 
                                    value={formData.description} 
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Any internal notes or special instructions for this service..."
                                    className="min-h-25 rounded-3xl border-border bg-card shadow-inner"
                                />
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-8 pt-4 bg-card border-t flex items-center justify-between sm:justify-between">
                    <p className="text-[10px] text-muted-foreground font-medium italic hidden sm:block">* All clinical changes are reflected instantly in pathology/radiology modules.</p>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => onOpenChange(false)} 
                            disabled={loading}
                            className="h-11 px-6 rounded-xl border-border font-bold text-muted-foreground hover:bg-muted"
                        >
                            Discard
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={loading}
                            className="h-11 px-8 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-black tracking-tight"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Update Service" : "Confirm & Save"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
