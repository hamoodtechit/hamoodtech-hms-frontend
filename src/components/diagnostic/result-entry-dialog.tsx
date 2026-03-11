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

interface ResultRow {
    parameter: string
    value: string
    unit: string
    referenceRange: string
}

interface ResultEntryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: DiagnosticReport | null
    onSuccess?: () => void
}

export function ResultEntryDialog({ open, onOpenChange, report, onSuccess }: ResultEntryDialogProps) {
    const [technicianId, setTechnicianId] = useState("")
    const [results, setResults] = useState<ResultRow[]>([
        { parameter: "", value: "", unit: "", referenceRange: "" }
    ])
    const [reportNotes, setReportNotes] = useState("")

    const { data: employeesRes, isLoading: loadingEmployees } = useEmployees({ limit: 100 })
    const employees = employeesRes?.data || []

    const enterResult = useEnterResult()

    const addParameter = () => {
        setResults([...results, { parameter: "", value: "", unit: "", referenceRange: "" }])
    }

    const removeParameter = (index: number) => {
        setResults(results.filter((_, i) => i !== index))
    }

    const updateRow = (index: number, field: keyof ResultRow, val: string) => {
        const next = [...results]
        next[index] = { ...next[index], [field]: val }
        setResults(next)
    }

    const handleConfirm = async () => {
        if (!report) return
        if (!technicianId) return toast.error("Please select a technician")

        const validResults = results.filter(r => r.parameter.trim() !== "")
        if (validResults.length === 0) return toast.error("Please enter at least one result parameter")

        // Store rich result: { paramName: { value, unit, referenceRange } }
        const resultObject: Record<string, { value: string; unit: string; referenceRange: string }> = {}
        validResults.forEach(r => {
            resultObject[r.parameter] = {
                value: r.value,
                unit: r.unit,
                referenceRange: r.referenceRange,
            }
        })

        try {
            const payload = {
                technicianId,
                result: resultObject,
                reportNotes,
                status: 'pending-verification'
            }

            await enterResult.mutateAsync({ id: report.id, data: payload })

            toast.success("Test results entered successfully")
            setTechnicianId("")
            setResults([{ parameter: "", value: "", unit: "", referenceRange: "" }])
            setReportNotes("")
            onOpenChange(false)
            onSuccess?.()
        } catch {
            toast.error("Failed to enter results")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2 text-blue-600">
                        <Activity className="w-6 h-6" />
                        Result Entry
                    </DialogTitle>
                    <DialogDescription>
                        Enter findings for <strong>{report?.diagnosticTest?.name}</strong> — patient <strong>{report?.patient?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
                    {/* Technician */}
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <User className="w-3 h-3" /> Technician In Charge
                        </Label>
                        <Select value={technicianId} onValueChange={setTechnicianId}>
                            <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none">
                                <SelectValue placeholder="Select technician..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-2xl">
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

                    {/* Results table */}
                    <div className="space-y-3">
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

                        {/* Header row */}
                        <div className="grid grid-cols-[2fr_1fr_1fr_2fr_auto] gap-2 px-1">
                            {['Test / Parameter', 'Result', 'Unit', 'Reference Range', ''].map((h, i) => (
                                <span key={i} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{h}</span>
                            ))}
                        </div>

                        <div className="space-y-2">
                            {results.map((row, index) => (
                                <div key={index} className="grid grid-cols-[2fr_1fr_1fr_2fr_auto] gap-2 items-center group">
                                    <Input
                                        placeholder="e.g. Haemoglobin"
                                        value={row.parameter}
                                        onChange={e => updateRow(index, 'parameter', e.target.value)}
                                        className="h-9 rounded-xl bg-muted/30 border-none text-xs font-bold"
                                    />
                                    <Input
                                        placeholder="e.g. 14.5"
                                        value={row.value}
                                        onChange={e => updateRow(index, 'value', e.target.value)}
                                        className="h-9 rounded-xl bg-muted/30 border-none text-xs font-bold"
                                    />
                                    <Input
                                        placeholder="g/dL"
                                        value={row.unit}
                                        onChange={e => updateRow(index, 'unit', e.target.value)}
                                        className="h-9 rounded-xl bg-muted/30 border-none text-xs"
                                    />
                                    <Input
                                        placeholder="e.g. 13-18 g/dL"
                                        value={row.referenceRange}
                                        onChange={e => updateRow(index, 'referenceRange', e.target.value)}
                                        className="h-9 rounded-xl bg-muted/30 border-none text-xs"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeParameter(index)}
                                        disabled={results.length === 1}
                                        className="h-9 w-9 text-destructive hover:bg-destructive/5 rounded-xl opacity-30 group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Internal Notes</Label>
                        <Textarea
                            placeholder="Optional technician observations..."
                            className="min-h-[70px] rounded-xl bg-muted/30 border-none text-xs"
                            value={reportNotes}
                            onChange={e => setReportNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold">
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
