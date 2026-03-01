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
import { useAppointment } from "@/hooks/appointment-queries"
import { AppointmentStatus } from "@/types/appointment"
import { format } from "date-fns"
import {
    Building2,
    Calendar,
    Clock,
    FileText,
    Loader2,
    MapPin,
    Phone,
    Stethoscope,
    User
} from "lucide-react"

interface AppointmentDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointmentId: string | null
}

export function AppointmentDetailsDialog({ open, onOpenChange, appointmentId }: AppointmentDetailsDialogProps) {
    const { data: appointmentRes, isLoading } = useAppointment(appointmentId || "")
    const appointment = appointmentRes?.data

    if (!appointmentId) return null

    const getStatusBadge = (status: AppointmentStatus) => {
        switch (status) {
            case "pending":
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Pending</Badge>
            case "confirmed":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600 font-medium tracking-wide">Confirmed</Badge>
            case "in-progress":
                return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>
            case "completed":
                return <Badge className="bg-slate-700 hover:bg-slate-800">Completed</Badge>
            case "cancelled":
                return <Badge variant="destructive">Cancelled</Badge>
            case "no-show":
                return <Badge variant="secondary">No Show</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const DetailSection = ({ icon: Icon, title, children }: { icon: any, title: string, children: React.ReactNode }) => (
        <section className="space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-[0.2em]">
                <Icon className="h-3.5 w-3.5" />
                <h3>{title}</h3>
            </div>
            <div className="p-5 rounded-2xl bg-secondary/10 border border-secondary/20 backdrop-blur-sm grid gap-4">
                {children}
            </div>
        </section>
    )

    const Field = ({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) => (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4 text-primary/60" />}
                <span className="text-sm font-semibold">{value || "—"}</span>
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] bg-background/95 backdrop-blur-xl">
                <div className="absolute top-0 left-0 w-full h-[150px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent -z-10" />
                
                <DialogHeader className="p-8 pb-4">
                    {isLoading ? (
                        <div className="flex items-center gap-4">
                            <DialogTitle className="sr-only">Loading Appointment Details</DialogTitle>
                            <div className="h-14 w-14 rounded-2xl bg-muted animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-[22px] bg-primary/15 flex items-center justify-center border-b-4 border-primary/30 shadow-lg">
                                    <Clock className="h-8 w-8 text-primary" />
                                </div>
                                <div className="space-y-1.5">
                                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                        {appointment?.serialNumber}
                                    </DialogTitle>
                                    <div className="flex items-center gap-3">
                                        {appointment && getStatusBadge(appointment.status)}
                                        <Separator orientation="vertical" className="h-4" />
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {appointment?.date && format(new Date(appointment.date), "EEEE, MMM do, yyyy")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogHeader>

                <ScrollArea className="max-h-[75vh] px-8 py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                            {/* Patient Info */}
                            <DetailSection icon={User} title="Patient Information">
                                <Field label="Full Name" value={appointment?.patient.name} icon={User} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Phone" value={appointment?.patient.phone} icon={Phone} />
                                    <Field label="Patient ID" value={appointment?.patient.patientNumber} />
                                </div>
                                <Field label="Address" value={appointment?.patient.address} icon={MapPin} />
                            </DetailSection>

                            {/* Medical Professional Info */}
                            <DetailSection icon={Stethoscope} title="Medical Context">
                                <Field label="Treating Doctor" value={appointment?.doctor.name} icon={User} />
                                <Field label="Department" value={appointment?.department.name} icon={Building2} />
                                <Field label="Time Slot" value={appointment?.timeSlot} icon={Clock} />
                            </DetailSection>

                            {/* Additional Info */}
                            <div className="md:col-span-2 space-y-3">
                                <div className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-[0.2em]">
                                    <FileText className="h-3.5 w-3.5" />
                                    <h3>Clinical Notes / Instructions</h3>
                                </div>
                                <div className="p-6 rounded-2xl bg-secondary/5 border border-dashed border-secondary/40 whitespace-pre-wrap text-sm leading-relaxed min-h-[100px]">
                                    {appointment?.note || "No special clinical notes provided for this appointment."}
                                </div>
                            </div>

                            <Separator className="md:col-span-2 opacity-50" />

                            <div className="md:col-span-2 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                                <span>CREATED: {appointment?.createdAt && format(new Date(appointment.createdAt), "PPP p")}</span>
                                <span>LAST UPDATED: {appointment?.updatedAt && format(new Date(appointment.updatedAt), "PPP p")}</span>
                            </div>
                        </div>
                    )}
                </ScrollArea>
                
                <div className="p-6 bg-secondary/5 border-t border-secondary/10 flex justify-end">
                    <Button variant="outline" className="rounded-xl px-8 hover:bg-background" onClick={() => onOpenChange(false)}>
                        Close Details
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
