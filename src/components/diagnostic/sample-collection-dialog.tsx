"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCollectSample, useUpdateReport } from "@/hooks/diagnostic-queries"
import { DiagnosticReport } from "@/types/diagnostic"
import { Beaker, Loader2, Printer } from "lucide-react"
import { useEffect, useState } from "react"

import { toast } from "sonner"
import { SampleLabelDialog } from "./sample-label-dialog"
import { useAuthStore } from "@/store/use-auth-store"
import { cn } from "@/lib/utils"


interface SampleCollectionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: DiagnosticReport | null
    onSuccess?: () => void
}

export function SampleCollectionDialog({ open, onOpenChange, report, onSuccess }: SampleCollectionDialogProps) {
    const [collectedById, setCollectedById] = useState("")
    const [sampleDetails, setSampleDetails] = useState("")
    const [labelOpen, setLabelOpen] = useState(false)
    const [isCollected, setIsCollected] = useState(false)
    
    const { user } = useAuthStore()


    // Auto-select current user as collector
    useEffect(() => {
        if (open && user && !collectedById) {
            const currentUserId = user.employeeId || user.id;
            setCollectedById(currentUserId);
        }
    }, [open, user, collectedById]);

    
    // Filter lab technicians or similar roles if needed, but for now show all employees
    const { mutateAsync: updateReport, isPending } = useUpdateReport()

    const handleConfirm = async () => {
        if (!report) return
        
        try {
            const payload = {
                collectedById,
                sampleDetails: sampleDetails || "Sample Collected",
                isSampleCollected: true,
                status: 'sample-collected' as const
            }
           
            await updateReport({
                id: report.id,
                data: payload
            })
            
            toast.success("Sample collection recorded")
            setIsCollected(true)
            onSuccess?.()
        } catch (error) {
            toast.error("Failed to record sample collection")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2 text-indigo-600">
                        <Beaker className="w-6 h-6" />
                        Sample Collection
                    </DialogTitle>
                    <DialogDescription>
                        Confirm collection for <strong>{report?.patient?.name}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-5">
                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Required Tests</span>
                        <div className="flex flex-wrap gap-2">
                            {report?.diagnosticTests?.map((dt, idx) => (
                                <Badge key={idx} variant="outline" className="bg-white border-indigo-200 text-indigo-700 font-bold px-3 py-1 rounded-lg">
                                    {dt.service?.name || dt.itemName}
                                </Badge>
                            )) || <Badge variant="secondary">{report?.diagnosticTestId}</Badge>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Sample Details / Notes (Optional)</Label>
                        <Textarea 
                            placeholder="e.g., 5ml Blood, First morning urine..."
                            className="min-h-[80px] rounded-xl bg-muted/30 border-none focus-visible:ring-indigo-500/20 text-sm"
                            value={sampleDetails}
                            onChange={(e) => setSampleDetails(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t flex flex-row items-center justify-between gap-3">
                    <Button 
                        variant="ghost" 
                        onClick={() => {
                            if (isCollected) {
                                setCollectedById("")
                                setSampleDetails("")
                                setIsCollected(false)
                            }
                            onOpenChange(false)
                        }}
                        className="rounded-xl font-bold h-11 flex-1"
                    >
                        {isCollected ? "Close" : "Not Now"}
                    </Button>
                    
                    {isCollected ? (
                        <Button 
                            onClick={() => setLabelOpen(true)}
                            className="rounded-xl px-8 font-black shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 h-11 flex-1 animate-in zoom-in duration-300"
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print Label
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleConfirm}
                            disabled={isPending}
                            className="rounded-xl px-8 font-black shadow-lg shadow-indigo-600/20 bg-indigo-600 hover:bg-indigo-700 h-11 flex-[2]"
                        >
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" /> : <Beaker className="mr-2 h-4 w-4" />}
                            Confirm Collection
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>

            <SampleLabelDialog 
                open={labelOpen}
                onOpenChange={setLabelOpen}
                report={report}
            />
        </Dialog>
    )
}
