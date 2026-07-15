"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Attendance } from "@/types/hr"
import { 
    Calendar, 
    Clock, 
    Fingerprint, 
    History, 
    Info, 
    Timer, 
    User as UserIcon 
} from "lucide-react"
import { format } from "date-fns"

interface AttendanceDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    attendance: Attendance | null
}

const DetailItem = ({ icon: Icon, label, value, className = "" }: { icon: any, label: string, value: any, className?: string }) => (
    <div className={`flex items-start gap-3 ${className}`}>
        <div className="mt-0.5 h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary/70" />
        </div>
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value || "—"}</p>
        </div>
    </div>
)

export function AttendanceDetailsDialog({ open, onOpenChange, attendance }: AttendanceDetailsDialogProps) {
    if (!attendance) return null

    const getVerifyTypeString = (type: number) => {
        switch(type) {
            case 1: return "Fingerprint"
            case 3: return "Password"
            case 4: return "Card"
            case 15: return "Face"
            default: return `Other (${type})`
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                
                <DialogHeader className="p-8 pb-4 relative">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-inner">
                                <UserIcon className="h-8 w-8 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle className="text-2xl font-bold tracking-tight">
                                    Attendance Record
                                </DialogTitle>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest bg-background/50 backdrop-blur-sm">
                                        UID: {attendance.uid}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {attendance.isDuplicate ? (
                                <Badge variant="outline" className="text-gray-400 bg-gray-50 border-gray-200">Duplicate Log</Badge>
                            ) : (
                                <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Valid Log</Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh] p-8 pt-2">
                    <div className="grid gap-8">
                        {/* Log Info */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                <History className="h-4 w-4" />
                                <h3 className="uppercase tracking-widest">Punch Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-xl bg-secondary/20 border border-secondary/50">
                                <DetailItem icon={Calendar} label="Punch Date & Time" value={format(new Date(attendance.punchTime), "dd MMM yyyy, hh:mm a")} />
                                <DetailItem icon={Fingerprint} label="Verify Type" value={getVerifyTypeString(attendance.verifyType)} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-xl bg-background border shadow-sm">
                                <DetailItem icon={Info} label="Device SN" value={attendance.deviceSn} />
                                <DetailItem icon={Info} label="Source" value={attendance.source || "Unknown"} />
                                <DetailItem icon={Info} label="Status Code" value={attendance.status !== null ? attendance.status.toString() : "N/A"} />
                            </div>
                        </section>



                        <Separator />
                        
                        <div className="flex justify-end pb-4">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Close Record
                            </Button>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
