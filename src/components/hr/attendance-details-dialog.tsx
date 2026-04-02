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

    const getStatusBadge = (record: Attendance) => {
        if (record.absent === "True") return <Badge variant="destructive">Absent</Badge>
        if (Number(record.late) > 0) return <Badge className="bg-orange-500 hover:bg-orange-600">Late: {record.late}m</Badge>
        if (record.holiday === "True") return <Badge variant="secondary">Holiday</Badge>
        if (record.weekEnd === "True") return <Badge variant="outline">Weekend</Badge>
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Present</Badge>
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
                                    {attendance.employeeName}
                                </DialogTitle>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest bg-background/50 backdrop-blur-sm">
                                        {attendance.employeeNumber || "NO ID"}
                                    </Badge>
                                    <span className="text-muted-foreground text-xs font-medium">•</span>
                                    <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
                                        {attendance.department || "General"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(attendance)}
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh] p-8 pt-2">
                    <div className="grid gap-8">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Work Time</p>
                                <p className="text-xl font-black text-primary">{attendance.workTime || "00:00"}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600 mb-1">Late Min</p>
                                <p className="text-xl font-black text-orange-700">{attendance.late || "0"}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">OT Hours</p>
                                <p className="text-xl font-black text-emerald-700">{attendance.otTime || "00:00"}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1">Real Time</p>
                                <p className="text-xl font-black text-blue-700">{attendance.realTime || "00:00"}</p>
                            </div>
                        </div>

                        {/* Timing Info */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                <History className="h-4 w-4" />
                                <h3 className="uppercase tracking-widest">Duty Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-xl bg-secondary/20 border border-secondary/50">
                                <DetailItem icon={Calendar} label="Log Date" value={attendance.date} />
                                <DetailItem icon={Fingerprint} label="Shift" value={attendance.shift || "Standard"} />
                                <DetailItem icon={Info} label="Exception" value={attendance.exception} />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-5 rounded-xl bg-background border shadow-sm">
                                <DetailItem icon={Clock} label="Clock In" value={attendance.clockIn} className="text-emerald-600" />
                                <DetailItem icon={Clock} label="Clock Out" value={attendance.clockOut} className="text-orange-600" />
                                <Separator orientation="vertical" className="h-10 hidden md:block" />
                                <DetailItem icon={Timer} label="Work Hour" value={attendance.workTime} />
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Detailed Metrics */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                    <Info className="h-4 w-4" />
                                    <h3 className="uppercase tracking-widest">Attendance Status</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-5 p-5 rounded-xl bg-background border shadow-sm">
                                    <DetailItem icon={Info} label="Absent" value={attendance.absent === "True" ? "Yes" : "No"} />
                                    <DetailItem icon={Calendar} label="Weekend" value={attendance.weekEnd === "True" ? "Yes" : "No"} />
                                    <DetailItem icon={Calendar} label="Holiday" value={attendance.holiday === "True" ? "Yes" : "No"} />
                                    <DetailItem icon={Timer} label="Late Frequency" value={attendance.late} />
                                </div>
                            </section>

                            {/* Additional Metrics */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                    <Timer className="h-4 w-4" />
                                    <h3 className="uppercase tracking-widest">Shift Timings</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-5 p-5 rounded-xl bg-background border shadow-sm">
                                    <DetailItem icon={Clock} label="On Duty" value={attendance.onDuty} />
                                    <DetailItem icon={Clock} label="Off Duty" value={attendance.offDuty} />
                                    <DetailItem icon={Timer} label="Early Out" value={attendance.early} />
                                    <DetailItem icon={Timer} label="Normal Time" value={attendance.normal} />
                                </div>
                            </section>
                        </div>

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
