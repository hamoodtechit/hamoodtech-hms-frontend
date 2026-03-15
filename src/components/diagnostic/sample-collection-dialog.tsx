"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCollectSample } from "@/hooks/diagnostic-queries"
import { useEmployees } from "@/hooks/hr-queries"
import { DiagnosticReport } from "@/types/diagnostic"
import { Beaker, Loader2, User } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface SampleCollectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: DiagnosticReport | null
    onSuccess?: () => void
}

export function SampleCollectionDialog({ open, onOpenChange, report, onSuccess }: SampleCollectionDialogProps) {
    const [collectedById, setCollectedById] = useState("")
    const [sampleDetails, setSampleDetails] = useState("")

    const { data: employeesRes, isLoading: loadingEmployees } = useEmployees({ limit: 100 })
    const employees = employeesRes?.data || []
    
    // Filter lab technicians or similar roles if needed, but for now show all employees
    const collectSample = useCollectSample()

    const handleConfirm = async () => {
        if (!report) return
        if (!collectedById) return toast.error("Please select who collected the sample")
        if (!sampleDetails) return toast.error("Please enter sample details")

        try {
            const payload = {
                collectedById,
                sampleDetails
            }
           
            
            const res = await collectSample.mutateAsync({
                id: report.id,
                data: payload
            })
            
            
            toast.success("Sample collection recorded")
            setCollectedById("")
            setSampleDetails("")
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            toast.error("Failed to record sample collection")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2 text-indigo-600">
                        <Beaker className="w-6 h-6" />
                        Sample Collection
                    </DialogTitle>
                    <DialogDescription>
                        Record details for the sample collected from **{report?.patient?.name}**.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-5">
                    <div className="bg-muted/50 p-4 rounded-xl border border-border flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Test Required</span>
                        <span className="font-bold text-sm">{report?.diagnosticTest?.name}</span>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <User className="w-3 h-3" /> Collected By
                        </Label>
                        <Select value={collectedById} onValueChange={setCollectedById}>
                            <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none">
                                <SelectValue placeholder="Select technician..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-2xl border-indigo-100">
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

                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sample Details</Label>
                        <Textarea 
                            placeholder="e.g., 5ml Blood in EDTA tube, First morning urine..."
                            className="min-h-[100px] rounded-xl bg-muted/30 border-none focus-visible:ring-indigo-500/20"
                            value={sampleDetails}
                            onChange={(e) => setSampleDetails(e.target.value)}
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
                        disabled={!collectedById || !sampleDetails || collectSample.isPending}
                        className="rounded-xl px-8 font-black shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700"
                    >
                        {collectSample.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Collection
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
