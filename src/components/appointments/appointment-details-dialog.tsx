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

        const printContent = `
            <div class="receipt-container">
                <!-- Header -->
                <div class="header">
                    <img src="${activeBranch?.logoUrl || '/Logo.png'}" alt="Logo" class="hospital-logo" />
                    <h1 class="hospital-name">${activeBranch?.name || 'PATWARY GENERAL HOSPITAL'}</h1>
                    <p class="hospital-info">${activeBranch?.address || ''}</p>
                    <p class="hospital-info">Ph: ${activeBranch?.phone || ''}</p>
                    
                    <div class="slip-tag">
                        Appointment Slip
                    </div>
                </div>

                <!-- Info Grid -->
                <div class="info-grid">
                    <div class="grid-row border-b">
                        <div class="grid-cell border-r">
                            <span class="label">Patient Name:</span>
                            <span class="value uppercase">${appointment?.patient?.name}</span>
                        </div>
                        <div class="grid-cell">
                            <span class="label">Reg. ID:</span>
                            <span class="value">${appointment?.patient?.patientNumber || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="grid-row border-b">
                        <div class="grid-cell border-r">
                            <span class="label">Consultant:</span>
                            <span class="value uppercase">${appointment?.doctor?.fullName || appointment?.doctor?.name || 'N/A'}</span>
                        </div>
                        <div class="grid-cell">
                            <span class="label">Department:</span>
                            <span class="value uppercase">${appointment?.department?.name || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="grid-row">
                        <div class="grid-cell border-r">
                            <span class="label">Appt Date:</span>
                            <span class="value">${appointment?.date ? format(new Date(appointment.date), "dd/MM/yyyy") : 'N/A'}</span>
                        </div>
                        <div class="grid-cell">
                            <span class="label">Time / Sl:</span>
                            <span class="value">${appointment?.timeSlot} / ${appointment?.serialNumber?.split('-')?.[1] || appointment?.serialNumber || '—'}</span>
                        </div>
                    </div>
                </div>

                <!-- Main Content Table -->
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="text-right">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Consultation Fee</td>
                            <td class="text-right font-bold">${appointment?.fee || '—'}</td>
                        </tr>
                        <tr>
                            <td>Room / Chamber</td>
                            <td class="text-right">${appointment?.chamberOrRoomNumber || 'Consultation Room'}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Note Section -->
                <div class="notes-section">
                    <div class="notes-header">Instructions / Note:</div>
                    <div class="notes-body">${appointment?.note || "Please arrive 15 minutes early."}</div>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <div class="signature-box">
                        <div class="sig-line"></div>
                        <div class="sig-label">Authorized Signature</div>
                    </div>
                    <div class="print-meta">
                        Printed on: ${format(new Date(), "dd/MM/yyyy p")}
                    </div>
                </div>
            </div>
        `;

        doc.open()
        doc.write(`
            <html>
                <head>
                    <title>Appointment Slip - ${appointment?.patient?.name}</title>
                    <style>
                        @page { size: A5; margin: 5mm; }
                        body { 
                            font-family: 'Segoe UI', Arial, sans-serif; 
                            color: #000; 
                            margin: 0; 
                            padding: 0;
                            background: white;
                        }
                        .receipt-container { 
                            width: 100%; 
                            padding: 2mm; 
                            box-sizing: border-box;
                        }
                        .header { text-align: center; margin-bottom: 5mm; }
                        .hospital-logo { height: 50px; margin-bottom: 2mm; }
                        .hospital-name { font-size: 20px; font-weight: 900; text-transform: uppercase; margin: 0; line-height: 1; }
                        .hospital-info { font-size: 10px; font-weight: 700; margin: 2px 0; opacity: 0.8; }
                        
                        .slip-tag { 
                            display: inline-block;
                            border: 1px solid #000;
                            padding: 2px 15px;
                            border-radius: 20px;
                            font-size: 12px;
                            font-weight: 900;
                            text-transform: uppercase;
                            margin-top: 3mm;
                            letter-spacing: 1px;
                        }

                        .info-grid { border: 1px solid #000; margin-bottom: 5mm; }
                        .grid-row { display: flex; }
                        .grid-cell { flex: 1; padding: 6px 10px; display: flex; align-items: center; gap: 8px; }
                        .border-b { border-bottom: 1px dashed #000; }
                        .border-r { border-right: 1px dashed #000; }
                        .label { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #444; min-width: 65px; }
                        .value { font-size: 11px; font-weight: 700; }
                        .uppercase { text-transform: uppercase; }

                        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 5mm; }
                        .items-table th { text-align: left; padding: 4px 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #000; border-top: 1px solid #000; }
                        .items-table td { padding: 6px 10px; font-size: 11px; font-weight: 600; border-bottom: 1px dashed #eee; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: 900; }

                        .notes-section { border: 1px dotted #000; padding: 3mm; margin-bottom: 10mm; background: #fafafa; }
                        .notes-header { font-size: 9px; font-weight: 900; text-transform: uppercase; margin-bottom: 1mm; opacity: 0.6; }
                        .notes-body { font-size: 10px; font-weight: 600; line-height: 1.4; }

                        .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15mm; }
                        .signature-box { text-align: center; width: 45mm; }
                        .sig-line { border-top: 1px solid #000; margin-bottom: 2mm; }
                        .sig-label { font-size: 9px; font-weight: 800; text-transform: uppercase; }
                        .print-meta { font-size: 8px; font-weight: 600; color: #666; font-family: monospace; }

                        .page-break { page-break-after: always; height: 10mm; border-bottom: 1px dashed #ccc; margin: 10mm 0; }
                    </style>
                </head>
                <body>
                    ${printContent}
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
            <div className="p-5 rounded-2xl bg-secondary/10 border border-secondary/20 backdrop-blur-sm flex flex-col gap-4">
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
                        <div className="flex flex-col md:flex-row gap-6 pb-8">
                            <div className="flex-1 flex flex-col gap-6" ref={printRef}>
                                {/* Patient Info */}
                                <DetailSection icon={User} title="Patient Information">
                                    <Field label="Full Name" value={appointment?.patient?.name} icon={User} />
                                    <div className="flex gap-4">
                                        <Field label="Phone" value={appointment?.patient?.phone} icon={Phone} className="flex-1" />
                                        <Field label="Patient ID" value={appointment?.patient?.patientNumber} className="flex-1" />
                                    </div>
                                    <Field label="Address" value={appointment?.patient?.address} icon={MapPin} />
                                </DetailSection>
                            </div>
                            
                            <div className="flex-1 flex flex-col gap-6">
                                {/* Medical Professional Info */}
                                <DetailSection icon={Stethoscope} title="Medical Info">
                                    <Field label="Treating Doctor" value={appointment?.doctor?.fullName || appointment?.doctor?.name || appointment?.doctor?.username} icon={User} />
                                    <div className="flex gap-4">
                                        <Field label="Department" value={appointment?.department?.name} icon={Building2} className="flex-1" />
                                        <Field label="Time Slot" value={appointment?.timeSlot} icon={Clock} className="flex-1" />
                                    </div>
                                    <div className="flex gap-4">
                                        <Field label="Room / Serial" value={appointment?.serialNumber?.replace('-', '/')} icon={Building2} className="flex-1" />
                                        {appointment?.referralPerson && (
                                            <Field label="Referral Source" value={appointment.referralPerson.name} icon={User} className="flex-1" />
                                        )}
                                    </div>
                                    
                                    <div className="pt-3 border-t border-secondary/20 flex flex-col md:flex-row md:items-start gap-3 md:gap-6">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-70 shrink-0 md:pt-1">
                                            <FileText className="h-3 w-3 text-primary/60" />
                                            <span>Clinical Note:</span>
                                        </div>
                                        <div className={cn(
                                            "flex-1 transition-all duration-300",
                                            isEditing ? "bg-background p-3 rounded-xl border-2 border-primary/20 shadow-inner" : ""
                                        )}>
                                            {isEditing ? (
                                                <textarea 
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                    className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold leading-relaxed min-h-[40px] resize-none"
                                                    placeholder="Update clinical notes..."
                                                />
                                            ) : (
                                                <p className="text-xs font-bold leading-relaxed text-foreground/80">
                                                    {appointment?.note || "—"}
                                                </p>
                                            )}
                                        </div>
                                        {isEditing && (
                                            <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-black uppercase bg-primary/5 text-primary border-primary/20 shrink-0">Editing</Badge>
                                        )}
                                    </div>
                                </DetailSection>
                            </div>
                        </div>
                    )}
                    
                    <Separator className="opacity-50 my-6" />

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pb-4">
                        <span>CREATED: {appointment?.createdAt && format(new Date(appointment.createdAt), "PPP p")}</span>
                        <span>LAST UPDATED: {appointment?.updatedAt && format(new Date(appointment.updatedAt), "PPP p")}</span>
                    </div>
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
