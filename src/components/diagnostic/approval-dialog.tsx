"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useApproveReport } from "@/hooks/diagnostic-queries"
import { useEmployees } from "@/hooks/hr-queries"
import { DiagnosticReport } from "@/types/diagnostic"
import { CheckCircle2, FileText, Info, Loader2, User } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface ApprovalDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: DiagnosticReport | null
    onSuccess?: () => void
}

export function ApprovalDialog({ open, onOpenChange, report, onSuccess }: ApprovalDialogProps) {
    const [approvedById, setApprovedById] = useState("")

    const { data: employeesRes, isLoading: loadingEmployees } = useEmployees({ limit: 100 })
    const employees = employeesRes?.data || []
    
    // In a real system, we'd filter for specialists/pathologists
    const approveReport = useApproveReport()

    const handleConfirm = async () => {
        if (!report) return
        if (!approvedById) return toast.error("Please select an approving pathologist")

        try {
            const payload = {
                approvedById,
                digitalSignature: "verified-digital-signature"
            }
            console.log("APPROVE_REPORT_PAYLOAD:", { id: report.id, data: payload })
            
            const res = await approveReport.mutateAsync({
                id: report.id,
                data: payload
            })
            console.log("APPROVE_REPORT_RESPONSE:", res)
            
            toast.success("Report approved and finalized")
            setApprovedById("")
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            toast.error("Failed to approve report")
        }
    }

    const results = report?.result ? Object.entries(report.result) : []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="w-6 h-6" />
                        Final Approval
                    </DialogTitle>
                    <DialogDescription>
                        Review the findings below and provide final sign-off for **{report?.patient?.name}**.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* Report Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-xl bg-muted/30 border">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground opacity-70">Patient Phone</Label>
                            <p className="font-bold text-sm">{report?.patient?.phone || '—'}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/30 border">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground opacity-70">Test Name</Label>
                            <p className="font-bold text-sm">{report?.diagnosticTest?.name}</p>
                        </div>
                    </div>

                    {/* Findings Review */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                            <FileText className="w-3 h-3" /> Review Findings
                        </div>
                        <div className="border rounded-xl overflow-hidden divide-y bg-card/50">
                            {results.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground italic">
                                    No findings recorded.
                                </div>
                            ) : results.map(([param, value]) => (
                                <div key={param} className="flex justify-between p-3 text-sm">
                                    <span className="font-medium text-muted-foreground">{param}</span>
                                    <span className="font-bold text-foreground">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Technician Notes */}
                    {report?.reportNotes && (
                        <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-500">
                                <Info className="w-3 h-3" /> Technician Notes
                            </div>
                            <p className="text-sm text-foreground font-medium italic">"{report.reportNotes}"</p>
                        </div>
                    )}

                    <Separator />

                    {/* Approval Action */}
                    <div className="space-y-3 pt-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <User className="w-3 h-3" /> Approving Pathologist
                        </Label>
                        <Select value={approvedById} onValueChange={setApprovedById}>
                            <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-none font-bold">
                                <SelectValue placeholder="Select specialist..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-2xl border-emerald-100">
                                {loadingEmployees ? (
                                    <div className="p-4 flex items-center justify-center">
                                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                                    </div>
                                ) : employees.map(emp => (
                                    <SelectItem key={emp.id} value={emp.id} className="rounded-lg m-1">
                                        {emp.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t">
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl font-bold"
                    >
                        Review Later
                    </Button>
                    <Button 
                        onClick={handleConfirm}
                        disabled={!approvedById || approveReport.isPending}
                        className="rounded-xl px-10 font-black shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700"
                    >
                        {approveReport.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Final Sign-off
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
