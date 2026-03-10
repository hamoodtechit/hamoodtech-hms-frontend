"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEnterResult } from "@/hooks/diagnostic-queries"
import { useEmployees } from "@/hooks/hr-queries"
import { DiagnosticReport } from "@/types/diagnostic"
import { Activity, Loader2, Plus, Trash2, User } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ResultEntryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: DiagnosticReport | null
    onSuccess?: () => void
}

export function ResultEntryDialog({ open, onOpenChange, report, onSuccess }: ResultEntryDialogProps) {
    const [technicianId, setTechnicianId] = useState("")
    const [results, setResults] = useState<{ parameter: string, value: string }[]>([
        { parameter: "", value: "" }
    ])
    const [reportNotes, setReportNotes] = useState("")

    const { data: employeesRes, isLoading: loadingEmployees } = useEmployees({ limit: 100 })
    const employees = employeesRes?.data || []
    
    const enterResult = useEnterResult()

    const addParameter = () => {
        setResults([...results, { parameter: "", value: "" }])
    }

    const removeParameter = (index: number) => {
        setResults(results.filter((_, i) => i !== index))
    }

    const updateParameter = (index: number, field: 'parameter' | 'value', val: string) => {
        const newResults = [...results]
        newResults[index][field] = val
        setResults(newResults)
    }

    const handleConfirm = async () => {
        if (!report) return
        if (!technicianId) return toast.error("Please select a technician")
        
        const resultObject: Record<string, string> = {}
        const validResults = results.filter(r => r.parameter.trim() !== "")
        
        if (validResults.length === 0) return toast.error("Please enter at least one result parameter")
        
        validResults.forEach(r => {
            resultObject[r.parameter] = r.value
        })

        try {
            const payload = {
                technicianId,
                result: resultObject,
                reportNotes
            }
            console.log("ENTER_RESULT_PAYLOAD:", { id: report.id, data: payload })
            
            const res = await enterResult.mutateAsync({
                id: report.id,
                data: payload
            })
            console.log("ENTER_RESULT_RESPONSE:", res)
            
            toast.success("Test results entered successfully")
            setTechnicianId("")
            setResults([{ parameter: "", value: "" }])
            setReportNotes("")
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            toast.error("Failed to enter results")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2 text-blue-600">
                        <Activity className="w-6 h-6" />
                        Result Entry
                    </DialogTitle>
                    <DialogDescription>
                        Enter findings for **{report?.diagnosticTest?.name}** for patient **{report?.patient?.name}**.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <User className="w-3 h-3" /> Technician In Charge
                        </Label>
                        <Select value={technicianId} onValueChange={setTechnicianId}>
                            <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none">
                                <SelectValue placeholder="Select technician..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-2xl border-blue-100">
                                {loadingEmployees ? (
                                    <div className="p-4 flex items-center justify-center">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    </div>
                                ) : employees.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id} className="rounded-lg m-1">
                                        {emp.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Result Findings
                            </Label>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={addParameter}
                                className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add Parameter
                            </Button>
                        </div>
                        
                        <div className="space-y-3">
                            {results.map((res, index) => (
                                <div key={index} className="flex items-start gap-2 group">
                                    <div className="flex-1">
                                        <Input 
                                            placeholder="Parameter (e.g., Hemoglobin)" 
                                            value={res.parameter}
                                            onChange={(e) => updateParameter(index, 'parameter', e.target.value)}
                                            className="h-10 rounded-xl bg-muted/30 border-none focus-visible:ring-blue-500/20 text-xs font-bold"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <Input 
                                            placeholder="Value (e.g., 14.5 g/dL)" 
                                            value={res.value}
                                            onChange={(e) => updateParameter(index, 'value', e.target.value)}
                                            className="h-10 rounded-xl bg-muted/30 border-none focus-visible:ring-blue-500/20 text-xs font-medium"
                                        />
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => removeParameter(index)}
                                        disabled={results.length === 1}
                                        className="h-10 w-10 text-destructive hover:bg-destructive/5 rounded-xl transition-all opacity-30 group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Internal Notes / Observations</Label>
                        <Textarea 
                            placeholder="Add any specific observations or technician notes..."
                            className="min-h-[80px] rounded-xl bg-muted/30 border-none focus-visible:ring-blue-500/20 text-xs"
                            value={reportNotes}
                            onChange={(e) => setReportNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t">
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl font-bold"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirm}
                        disabled={!technicianId || results.some(r => r.parameter === "") || enterResult.isPending}
                        className="rounded-xl px-8 font-black shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700"
                    >
                        {enterResult.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit for Verification
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
