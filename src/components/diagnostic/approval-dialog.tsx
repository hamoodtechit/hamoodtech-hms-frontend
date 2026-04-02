"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useApproveReport } from "@/hooks/diagnostic-queries"
import { useEmployees } from "@/hooks/hr-queries"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/use-auth-store"
import { DiagnosticBlock, DiagnosticColumnDef, DiagnosticReport } from "@/types/diagnostic"
import { CheckCircle2, FileText, Info, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ApprovalDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: DiagnosticReport | null
    onSuccess?: () => void
}

const DEFAULT_COLUMNS: DiagnosticColumnDef[] = [
    { id: '1', label: 'Parameter', key: 'parameter', isVisible: true, width: '1.5fr' },
    { id: '2', label: 'Result', key: 'value', isVisible: true, width: '1fr' },
    { id: '3', label: 'Unit', key: 'unit', isVisible: true, width: '0.8fr' },
    { id: '4', label: 'Ref Range', key: 'referenceRange', isVisible: true, width: '1.2fr' }
]

export function ApprovalDialog({ open, onOpenChange, report, onSuccess }: ApprovalDialogProps) {
    const { user } = useAuthStore()
    const [approvedById, setApprovedById] = useState("")

    const { data: employeesRes, isLoading: loadingEmployees } = useEmployees({ limit: 100 })
    const employees = employeesRes?.data || []

    useEffect(() => {
        if (open && user?.id) {
            setApprovedById(user.id)
        }
    }, [open, user?.id])
    
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
            
            
            const res = await approveReport.mutateAsync({
                id: report.id,
                data: payload
            })
            
            
            toast.success("Report approved and finalized")
            setApprovedById("")
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            toast.error("Failed to approve report")
        }
    }


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
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
                                <FileText className="w-3 h-3" /> Review Findings
                            </div>
                            {report?.result && (report.result as any).reportHeader && (
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                    {(report.result as any).reportHeader}
                                </span>
                            )}
                        </div>
                        
                        <div className="border rounded-2xl overflow-hidden bg-card/50 shadow-inner">
                            {!report?.result ? (
                                <div className="p-8 text-center text-xs text-muted-foreground italic">
                                    No findings recorded.
                                </div>
                            ) : (report.result as any).blocks ? (
                                <div className="p-4 space-y-4">
                                    {(() => {
                                        const blocks = (report.result as any).blocks as DiagnosticBlock[];
                                        const renderedElements: React.ReactNode[] = [];
                                        let currentGroup: DiagnosticBlock[] = [];

                                        const renderGroup = (group: DiagnosticBlock[]) => {
                                            if (group.length === 0) return null;
                                            const firstBlock = group[0];
                                            return (
                                                <div key={`group-${group[0].id}`} className="overflow-x-auto rounded-xl border border-primary/10 bg-background/50 shadow-sm mb-4">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-primary/5 border-b border-primary/10">
                                                            <tr className="text-[10px] font-black uppercase tracking-wider text-primary/70">
                                                                {(firstBlock.columnDefs || DEFAULT_COLUMNS).filter(c => c.isVisible).map(col => (
                                                                    <th key={col.key} className="px-4 py-3 text-left font-black" style={{ width: col.width }}>
                                                                        {col.label}
                                                                    </th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-border/30">
                                                            {group.map((block) => (
                                                                <tr key={block.id} className={cn(
                                                                    "transition-colors",
                                                                    block.isHeader ? "bg-primary/5" : "hover:bg-muted/10",
                                                                    block.isAbnormal && "bg-red-50/50"
                                                                )}>
                                                                    {(block.columnDefs || DEFAULT_COLUMNS).filter(c => c.isVisible).map(col => {
                                                                        const val = (block as any)[col.key] || block.extraValues?.[col.key] || "";
                                                                        const isResult = col.key === 'value';
                                                                        const isParameter = col.key === 'parameter';

                                                                        return (
                                                                            <td key={col.key} className={cn(
                                                                                "px-4 py-2.5",
                                                                                isParameter && block.isHeader ? "font-black text-primary uppercase text-xs" : (isParameter ? "font-medium" : ""),
                                                                                block.isBold && "font-bold",
                                                                                isResult ? (block.isAbnormal ? "text-red-600 font-extrabold" : "font-bold") : ""
                                                                            )}>
                                                                                {block.isHeader && !isParameter ? "" : val}
                                                                                {isResult && block.isAbnormal && <span className="ml-1 text-[10px] text-red-500 font-black tracking-tighter">(ABNORMAL)</span>}
                                                                            </td>
                                                                        )
                                                                    })}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            );
                                        };

                                        blocks.forEach((block, idx) => {
                                            if (block.type === 'parameter') {
                                                currentGroup.push(block);
                                            } else {
                                                if (currentGroup.length > 0) {
                                                    renderedElements.push(renderGroup(currentGroup));
                                                    currentGroup = [];
                                                }

                                                if (block.type === 'header') {
                                                    renderedElements.push(
                                                        <div key={block.id} className="py-2 mb-2 border-b-2 border-primary/10">
                                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary/80 flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                                {block.content}
                                                            </h3>
                                                        </div>
                                                    );
                                                } else if (block.type === 'narrative' || block.type === 'impression') {
                                                    renderedElements.push(
                                                        <div key={block.id} className={cn(
                                                            "p-5 rounded-2xl border transition-all mb-4",
                                                            block.type === 'impression' ? "bg-amber-50/50 border-amber-200/50 shadow-sm" : "bg-muted/10 border-border/40"
                                                        )}>
                                                            <Label className={cn(
                                                                "text-[10px] font-black uppercase mb-3 block tracking-widest",
                                                                block.type === 'impression' ? "text-amber-700" : "text-muted-foreground/80"
                                                            )}>
                                                                {block.type === 'impression' ? '⚡ Clinical Conclusion (Impression)' : '📄 Detailed Findings'}
                                                            </Label>
                                                            <div 
                                                                className={cn(
                                                                    "text-sm leading-relaxed",
                                                                    block.type === 'impression' ? "font-bold text-amber-900 not-italic" : "font-medium text-foreground/80"
                                                                )}
                                                                dangerouslySetInnerHTML={{ __html: block.content || "" }}
                                                            />
                                                        </div>
                                                    );
                                                }
                                            }
                                        });

                                        if (currentGroup.length > 0) {
                                            renderedElements.push(renderGroup(currentGroup));
                                        }

                                        return renderedElements;
                                    })()}
                                </div>
                            ) : (report.result as any).mode === 'narrative' ? (
                                <div className="p-4 space-y-4">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Clinical Findings</Label>
                                        <div 
                                            className="text-sm leading-relaxed font-medium rich-text-preview" 
                                            dangerouslySetInnerHTML={{ __html: (report.result as any).content }}
                                        />
                                    </div>
                                    {(report.result as any).interpretation && (
                                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-amber-600">Impression</Label>
                                            <p className="text-sm font-bold text-amber-900 italic">{(report.result as any).interpretation}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30 border-b">
                                            <tr className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                                <th className="px-4 py-2 text-left">Parameter</th>
                                                <th className="px-4 py-2 text-center">Result</th>
                                                <th className="px-4 py-2 text-center">Unit</th>
                                                <th className="px-4 py-2 text-left">Ref Range</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {((report.result as any).rows || []).map((row: any, idx: number) => (
                                                <tr key={idx} className={cn(
                                                    "transition-colors",
                                                    row.isHeader ? "bg-blue-50/50" : "hover:bg-muted/10",
                                                    row.isAbnormal && "bg-red-50/30"
                                                )}>
                                                    <td className={cn(
                                                        "px-4 py-2",
                                                        row.isHeader ? "font-black text-blue-700 uppercase underline" : "font-medium",
                                                        row.isBold && "font-bold"
                                                    )}>
                                                        {row.parameter}
                                                    </td>
                                                    <td className={cn(
                                                        "px-4 py-2 text-center",
                                                        row.isAbnormal ? "text-red-600 font-extrabold" : "font-bold"
                                                    )}>
                                                        {row.isHeader ? "" : row.value}
                                                        {row.isAbnormal && <span className="ml-1">(H)</span>}
                                                    </td>
                                                    <td className="px-4 py-2 text-center text-muted-foreground">{row.unit}</td>
                                                    <td className="px-4 py-2 text-xs italic text-muted-foreground">{row.referenceRange}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
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
