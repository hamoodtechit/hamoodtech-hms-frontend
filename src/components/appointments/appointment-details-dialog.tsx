"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAppointment, useUpdateAppointment } from "@/hooks/appointment-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Appointment, AppointmentStatus } from "@/types/appointment"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
    Building2,
    Calendar,
    Clock,
    FileText,
    Loader2,
    MapPin,
    Phone,
    Printer,
    Save,
    Stethoscope,
    User,
    X
} from "lucide-react"
import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { useStoreContext } from "@/store/use-store-context"

interface AppointmentDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointmentId: string | null
}

export function AppointmentDetailsDialog({ open, onOpenChange, appointmentId }: AppointmentDetailsDialogProps) {
    const { data: response, isLoading } = useAppointment(appointmentId || "")
    const updateMutation = useUpdateAppointment()
    const { stores, activeStoreId } = useStoreContext()
    const activeBranch = stores.find(s => s.id === activeStoreId) || stores[0]
    
    const appointment = response?.data?.appointment
    const [status, setStatus] = useState<AppointmentStatus>("pending")
    const [note, setNote] = useState("")
    const [isEditing, setIsEditing] = useState(false)
    const printRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (appointment) {
            setStatus(appointment.status)
            setNote(appointment.note || "")
        }
    }, [appointment])

    if (!appointmentId) return null

    const handleUpdate = async () => {
        try {
            await updateMutation.mutateAsync({
                id: appointmentId,
                data: { status, note }
            })
            toast.success("Appointment updated successfully")
            setIsEditing(false)
        } catch (error) {
            toast.error("Failed to update appointment")
        }
    }

    const handlePrint = () => {
        const content = printRef.current?.innerHTML
        if (!content) return

        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '100%'
        iframe.style.bottom = '100%'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = 'none'
        document.body.appendChild(iframe)

        const doc = iframe.contentWindow?.document
        if (!doc) return

        doc.open()
        doc.write(`
            <html>
                <head>
                    <title>Appointment Slip - ${appointment?.patient?.name}</title>
                    <style>
                        @page { size: A5; margin: 0; }
                        body { 
                            font-family: 'Inter', system-ui, -apple-system, sans-serif; 
                            color: #000; 
                            line-height: 1.4; 
                            padding: 0; 
                            margin: 0; 
                            background: white;
                            -webkit-print-color-adjust: exact;
                        }
                        .print-container { 
                            width: 148mm; 
                            height: 210mm;
                            margin: 0 auto; 
                            background: white; 
                            padding: 10mm; 
                            box-sizing: border-box; 
                            display: flex;
                            flex-direction: column;
                        }
                        .header { text-align: center; margin-bottom: 8mm; border-bottom: 2px solid #000; padding-bottom: 4mm; }
                        .hospital-name { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; }
                        .hospital-info { font-size: 10px; font-weight: 600; color: #444; margin-top: 2px; }
                        
                        .slip-title { 
                            background: #000; 
                            color: #fff; 
                            text-align: center; 
                            padding: 4px; 
                            font-weight: 900; 
                            text-transform: uppercase; 
                            letter-spacing: 2px;
                            font-size: 14px;
                            margin: 6mm 0;
                        }

                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-bottom: 8mm; }
                        .info-item { border: 1px solid #eee; padding: 3mm; border-radius: 4px; }
                        .info-label { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #666; margin-bottom: 1mm; }
                        .info-value { font-size: 13px; font-weight: 700; color: #000; }

                        .main-section { border: 2px solid #000; padding: 6mm; border-radius: 8px; margin-bottom: 8mm; position: relative; }
                        .section-tag { 
                            position: absolute; 
                            top: -10px; 
                            left: 20px; 
                            background: white; 
                            padding: 0 10px; 
                            font-size: 10px; 
                            font-weight: 900; 
                            text-transform: uppercase; 
                        }

                        .detail-row { display: flex; justify-content: space-between; padding: 3mm 0; border-bottom: 1px dashed #ddd; }
                        .detail-row:last-child { border-bottom: none; }
                        .detail-label { font-size: 11px; font-weight: 700; color: #555; }
                        .detail-value { font-size: 12px; font-weight: 900; }

                        .notes-box { background: #f9f9f9; padding: 4mm; border-radius: 4px; border-left: 4px solid #000; margin-top: 4mm; }
                        .notes-label { font-size: 9px; font-weight: 800; text-transform: uppercase; margin-bottom: 1mm; }
                        .notes-content { font-size: 11px; font-weight: 600; line-height: 1.5; }

                        .footer { margin-top: auto; padding-top: 10mm; display: flex; justify-content: space-between; align-items: flex-end; }
                        .signature { text-align: center; width: 40mm; }
                        .sig-line { border-top: 1px solid #000; margin-bottom: 2mm; }
                        .sig-text { font-size: 9px; font-weight: 800; text-transform: uppercase; }

                        .qr-space { width: 25mm; height: 25mm; background: #eee; border-radius: 4px; }
                        
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <div class="header">
                            <h1 class="hospital-name">${activeBranch?.name || 'HOSPITAL MANAGEMENT'}</h1>
                            <div class="hospital-info">${activeBranch?.address || ''}</div>
                            <div class="hospital-info">${activeBranch?.phone || ''}</div>
                        </div>

                        <div class="slip-title">Appointment Slip</div>

                        <div class="info-grid">
                            <div class="info-item">
                                <div class="info-label">Patient Name</div>
                                <div class="info-value">${appointment?.patient?.name}</div>
                            </div>
                            <div class="info-item">
                                <div class="info-label">Patient ID / Phone</div>
                                <div class="info-value">${appointment?.patient?.patientNumber || appointment?.patient?.phone}</div>
                            </div>
                        </div>

                        <div class="main-section">
                            <div class="section-tag">Schedule Details</div>
                            <div class="detail-row">
                                <span class="detail-label">Appointment Date</span>
                                <span class="detail-value">${appointment?.date ? format(new Date(appointment.date), "MMMM dd, yyyy") : '—'}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Time Slot</span>
                                <span class="detail-value">${appointment?.timeSlot}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Room / Serial</span>
                                <span class="detail-value">${appointment?.serialNumber?.replace('-', '/')}</span>
                            </div>
                        </div>

                        <div class="main-section">
                            <div class="section-tag">Clinical Assignment</div>
                            <div class="detail-row">
                                <span class="detail-label">Consultant Doctor</span>
                                <span class="detail-value">${appointment?.doctor?.fullName || appointment?.doctor?.name || appointment?.doctor?.username}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Department</span>
                                <span class="detail-value">${appointment?.department?.name}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Chamber No</span>
                                <span class="detail-value">${appointment?.chamberOrRoomNumber || 'Consultation Room'}</span>
                            </div>
                        </div>

                        <div class="notes-box">
                            <div class="notes-label">Patient Instructions</div>
                            <div class="notes-content">${appointment?.note || "Please arrive 15 minutes before your scheduled time. Bring all previous medical reports and current prescriptions."}</div>
                        </div>

                        <div class="footer">
                            <div class="signature">
                                <div class="sig-line"></div>
                                <div class="sig-text">Authorized Signature</div>
                            </div>
                            <div style="font-size: 8px; font-weight: 700; color: #999; text-transform: uppercase;">
                                Generated on: ${format(new Date(), "PPP p")}
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        `)
        doc.close()

        setTimeout(() => {
            iframe.contentWindow?.focus()
            iframe.contentWindow?.print()
            setTimeout(() => {
                document.body.removeChild(iframe)
            }, 1000)
        }, 500)
    }

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

    const DetailSection = ({ icon: Icon, title, children, className }: { icon: any, title: string, children: React.ReactNode, className?: string }) => (
        <section className={cn("space-y-3", className)}>
            <div className="flex items-center gap-2 text-primary font-bold text-[11px] uppercase tracking-[0.2em]">
                <Icon className="h-3.5 w-3.5" />
                <h3>{title}</h3>
            </div>
            <div className="p-5 rounded-2xl bg-secondary/10 border border-secondary/20 backdrop-blur-sm grid gap-4">
                {children}
            </div>
        </section>
    )

    const Field = ({ label, value, icon: Icon, className }: { label: string, value: any, icon?: any, className?: string }) => (
        <div className={cn("flex flex-col gap-1", className)}>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
            <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4 text-primary/60" />}
                <span className="text-sm font-semibold">{value || "—"}</span>
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] bg-background/95 backdrop-blur-xl">
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
                                        {appointment?.patient?.name}
                                    </DialogTitle>
                                    <div className="flex items-center gap-3">
                                        {isEditing ? (
                                            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                                <SelectTrigger className="h-7 w-32 text-[10px] font-black uppercase rounded-full border-primary/20">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                                    <SelectItem value="pending" className="text-[10px] font-bold">PENDING</SelectItem>
                                                    <SelectItem value="confirmed" className="text-[10px] font-bold">CONFIRMED</SelectItem>
                                                    <SelectItem value="in-progress" className="text-[10px] font-bold">IN PROGRESS</SelectItem>
                                                    <SelectItem value="completed" className="text-[10px] font-bold">COMPLETED</SelectItem>
                                                    <SelectItem value="cancelled" className="text-[10px] font-bold text-destructive">CANCELLED</SelectItem>
                                                    <SelectItem value="no-show" className="text-[10px] font-bold">NO SHOW</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            appointment && getStatusBadge(appointment.status)
                                        )}
                                        <Separator orientation="vertical" className="h-4" />
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {appointment?.date && format(new Date(appointment.date), "EEEE, MMM do, yyyy")}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 no-print">
                                <Button 
                                    onClick={handlePrint} 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-11 px-5 rounded-2xl gap-2 font-black text-xs uppercase tracking-widest border-primary/20 hover:bg-primary/5 transition-all"
                                >
                                    <Printer className="h-4 w-4" /> Print Slip
                                </Button>
                                {isEditing ? (
                                    <Button 
                                        onClick={handleUpdate} 
                                        disabled={updateMutation.isPending}
                                        size="sm" 
                                        className="h-11 px-5 rounded-2xl gap-2 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                                    >
                                        {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={() => setIsEditing(true)} 
                                        size="sm" 
                                        className="h-11 px-5 rounded-2xl gap-2 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                                    >
                                        Update
                                    </Button>
                                )}
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
                            <div className="flex flex-col gap-6" ref={printRef}>
                                {/* This is just for printing ref content if needed, but we used innerHTML of a hidden/different structure above. Actually I'll use a better approach for printRef later if needed, for now the innerHTML trick in handlePrint uses the state data. */}
                            </div>
                            
                            {/* Patient Info */}
                            <DetailSection icon={User} title="Patient Information">
                                <Field label="Full Name" value={appointment?.patient?.name} icon={User} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Phone" value={appointment?.patient?.phone} icon={Phone} />
                                    <Field label="Patient ID" value={appointment?.patient?.patientNumber} />
                                </div>
                                <Field label="Address" value={appointment?.patient?.address} icon={MapPin} />
                            </DetailSection>

                            {/* Medical Professional Info */}
                            <DetailSection icon={Stethoscope} title="Medical Info">
                                <Field label="Treating Doctor" value={appointment?.doctor?.fullName || appointment?.doctor?.name || appointment?.doctor?.username} icon={User} />
                                <Field label="Department" value={appointment?.department?.name} icon={Building2} />
                                    <Field label="Time Slot" value={appointment?.timeSlot} icon={Clock} />
                                    <Field label="Room / Serial" value={appointment?.serialNumber?.replace('-', '/')} icon={Building2} />
                                {appointment?.referralPerson && (
                                    <Field label="Referral Source" value={appointment.referralPerson.name} icon={User} />
                                )}
                            </DetailSection>


                            {/* Additional Info */}
                            <div className="md:col-span-2 space-y-3 pt-4">
                                <div className="flex items-center justify-between gap-2 text-primary font-bold text-[11px] uppercase tracking-[0.2em]">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-3.5 w-3.5" />
                                        <h3>Clinical Notes / Instructions</h3>
                                    </div>
                                    {isEditing && (
                                        <span className="text-[9px] text-muted-foreground animate-pulse">EDITING MODE</span>
                                    )}
                                </div>
                                <div className={cn(
                                    "p-6 rounded-2xl transition-all duration-300",
                                    isEditing ? "bg-background border-2 border-primary/20 shadow-inner" : "bg-secondary/5 border border-dashed border-secondary/40"
                                )}>
                                    {isEditing ? (
                                        <textarea 
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 text-sm leading-relaxed min-h-[120px] resize-none"
                                            placeholder="Update clinical notes or special instructions for the patient..."
                                        />
                                    ) : (
                                        <p className="whitespace-pre-wrap text-sm leading-relaxed min-h-[100px]">
                                            {appointment?.note || "No special clinical notes provided for this appointment."}
                                        </p>
                                    )}
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
                
                <div className="p-6 bg-secondary/5 border-t border-secondary/10 flex justify-end gap-3">
                    {isEditing && (
                        <Button variant="ghost" className="rounded-xl px-6 font-bold text-xs uppercase" onClick={() => setIsEditing(false)}>
                            Cancel Edits
                        </Button>
                    )}
                    <Button variant="outline" className="rounded-xl px-8 hover:bg-background font-bold text-xs uppercase" onClick={() => onOpenChange(false)}>
                        Close Details
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
