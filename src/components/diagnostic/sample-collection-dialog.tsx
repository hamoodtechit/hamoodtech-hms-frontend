"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCollectSample } from "@/hooks/diagnostic-queries"
import { DiagnosticReport } from "@/types/diagnostic"
import { Beaker, Loader2, Printer } from "lucide-react"
import { useEffect, useState } from "react"

import { toast } from "sonner"
import { SampleLabelDialog } from "./sample-label-dialog"
import { useAuthStore } from "@/store/use-auth-store"


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
    const collectSample = useCollectSample()

    const handleConfirm = async () => {
        if (!report) return
        // if (!collectedById) return toast.error("Please select who collected the sample")
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
            setIsCollected(true)
            // We don't clear details yet so the user can see them before printing/closing
            setLabelOpen(true)
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
                        onClick={() => {
                            if (isCollected) {
                                setCollectedById("")
                                setSampleDetails("")
                                setIsCollected(false)
                                onSuccess?.()
                            }
                            onOpenChange(false)
                        }}
                        className="rounded-xl font-bold"
                    >
                        {isCollected ? "Close" : "Cancel"}
                    </Button>
                    
                    {isCollected ? (
                        <Button 
                            onClick={() => setLabelOpen(true)}
                            className="rounded-xl px-8 font-black shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 animate-in zoom-in duration-300"
                        >
                            <Printer className="mr-2 h-4 w-4" />
                            Print Label
                        </Button>
                    ) : (
                        <Button 
                            onClick={handleConfirm}
                            disabled={!sampleDetails || collectSample.isPending}
                            className="rounded-xl px-8 font-black shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700"
                        >
                            {collectSample.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
