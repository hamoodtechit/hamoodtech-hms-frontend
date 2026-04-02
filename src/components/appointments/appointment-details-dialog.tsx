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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { APPOINTMENT_KEYS, useAppointment } from "@/hooks/appointment-queries"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useAddSalePayment } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Appointment, AppointmentStatus } from "@/types/appointment"
import { Sale } from "@/types/sales"
import { useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
    Building2,
    Calendar,
    Clock,
    CreditCard,
    DollarSign,
    FileText,
    Loader2,
    MapPin,
    Phone,
    Receipt,
    Stethoscope,
    User,
    Wallet
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface AppointmentDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointmentId: string | null
}

export function AppointmentDetailsDialog({ open, onOpenChange, appointmentId }: AppointmentDetailsDialogProps) {
    const { data: response, isLoading } = useAppointment(appointmentId || "")
    const { formatCurrency } = useCurrency()
    
    // Response now contains { appointment, sale }
    const appointment = response?.data?.appointment
    const sale = response?.data?.sale
    const queryClient = useQueryClient()

    const [isPaying, setIsPaying] = useState(false)

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
                                <Field label="Full Name" value={appointment?.patient?.name} icon={User} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Phone" value={appointment?.patient?.phone} icon={Phone} />
                                    <Field label="Patient ID" value={appointment?.patient?.patientNumber} />
                                </div>
                                <Field label="Address" value={appointment?.patient?.address} icon={MapPin} />
                            </DetailSection>

                            {/* Medical Professional Info */}
                            <DetailSection icon={Stethoscope} title="Medical Context">
                                <Field label="Treating Doctor" value={appointment?.doctor?.name} icon={User} />
                                <Field label="Department" value={appointment?.department?.name} icon={Building2} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Time Slot" value={appointment?.timeSlot} icon={Clock} />
                                    <Field label="Purpose" value={appointment?.purpose} className="capitalize" />
                                </div>
                            </DetailSection>

                            {/* Billing & Payment Info - Only show if fee is present */}
                            {(appointment?.fees || sale) && (
                                <DetailSection icon={Receipt} title="Billing & Payment" className="md:col-span-2">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-4">
                                            <Field label="Invoice Number" value={sale?.invoiceNumber} icon={FileText} />
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Payment Status</span>
                                                <Badge variant={sale?.paymentStatus === 'paid' ? 'default' : 'destructive'} className="capitalize h-5 py-0">
                                                    {sale?.paymentStatus || 'pending'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-2 col-span-2 bg-background/50 p-4 rounded-xl border border-primary/5">
                                            <div className="flex justify-between items-center text-sm font-medium">
                                                <span className="text-muted-foreground">Consultation Fee</span>
                                                <span>{formatCurrency(Number(appointment?.fees || sale?.totalPrice || 0))}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-medium text-emerald-600">
                                                <span>Paid Amount</span>
                                                <span>{formatCurrency(Number(sale?.paidAmount || 0))}</span>
                                            </div>
                                            
                                            {/* Show due if balance exists (either via sale or appointment fees) */}
                                            {(() => {
                                                const totalDue = sale ? Number(sale.dueAmount || 0) : Number(appointment?.fees || 0);
                                                if (totalDue <= 0) return null;
                                                
                                                return (
                                                    <>
                                                        <Separator className="my-2" />
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Due</span>
                                                            <span className="text-lg font-black text-destructive">{formatCurrency(totalDue)}</span>
                                                        </div>

                                                        {!isPaying && (
                                                            <Button 
                                                                className="w-full mt-4 bg-primary hover:bg-primary/90 rounded-xl"
                                                                onClick={() => setIsPaying(true)}
                                                            >
                                                                <DollarSign className="h-4 w-4 mr-2" />
                                                                Process Payment
                                                            </Button>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {isPaying && sale && (
                                        <PaymentForm 
                                            sale={sale} 
                                            appointment={appointment}
                                            onCancel={() => setIsPaying(false)} 
                                            onSuccess={() => {
                                                setIsPaying(false)
                                                queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.details(appointmentId) })
                                            }}
                                        />
                                    )}
                                </DetailSection>
                            )}

                            {/* Additional Info */}
                            <div className="md:col-span-2 space-y-3 pt-4">
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

function PaymentForm({ sale, appointment, onCancel, onSuccess }: { sale: Sale, appointment?: Appointment, onCancel: () => void, onSuccess: () => void }) {
    const { data: accountsRes } = useFinanceAccounts({ limit: 100 })
    const accounts = accountsRes?.data || []
    const addPaymentMutation = useAddSalePayment()
    
    const [accountId, setAccountId] = useState("")
    const [paymentMethod, setPaymentMethod] = useState<string>("cash")
    const [paymentAmount, setPaymentAmount] = useState<number | undefined>(Number(sale.dueAmount))
    const [paymentNote, setPaymentNote] = useState("")

    useEffect(() => {
        // Update default account when method changes
        const matchingAccount = accounts.find(a => a.type === paymentMethod)
        if (matchingAccount) setAccountId(matchingAccount.id)
    }, [paymentMethod, accounts])

    const handleProcessPayment = async () => {
        if (!accountId) return toast.error("Please select a payment account")
        if (!paymentAmount || paymentAmount <= 0) return toast.error("Amount must be greater than 0")

        try {
            await addPaymentMutation.mutateAsync({
                id: sale.id,
                data: {
                    accountId,
                    amount: paymentAmount,
                    paymentMethod: paymentMethod as any,
                    note: paymentNote || `Appointment Payment - ${appointment?.serialNumber || ''}`
                }
            })
            onSuccess()
        } catch (error) {
            // Error toast handled in mutation hook
        }
    }

    return (
        <div className="mt-4 p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                    <Wallet className="h-4 w-4" />
                    Record Payment
                </h4>
                <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 w-8 p-0 rounded-full">
                    ×
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="rounded-xl border-primary/10">
                            <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                            {['cash', 'card', 'online', 'cheque', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer'].map(method => (
                                <SelectItem key={method} value={method}>
                                    <span className="capitalize">{method}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="account">Target Account</Label>
                    <Select value={accountId} onValueChange={setAccountId}>
                        <SelectTrigger id="account" className="rounded-xl border-primary/10">
                            <SelectValue placeholder="Select payment account" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>
                                    <div className="flex items-center gap-2">
                                        {acc.type === 'cash' ? <Wallet className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                                        <span>{acc.name}</span>
                                        <span className="text-[10px] text-muted-foreground ml-2 capitalize">({acc.type})</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="amount">Payment Amount</Label>
                    <SmartNumberInput 
                        id="amount"
                        prefix="Tk"
                        value={paymentAmount} 
                        onChange={setPaymentAmount}
                        className="rounded-xl border-primary/10"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="note">Payment Note (Optional)</Label>
                    <Input 
                        id="note"
                        value={paymentNote} 
                        onChange={(e) => setPaymentNote(e.target.value)}
                        placeholder="e.g. Received via bKash"
                        className="rounded-xl border-primary/10"
                    />
                </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={onCancel} className="rounded-lg">Cancel</Button>
                <Button 
                    size="sm" 
                    onClick={handleProcessPayment} 
                    disabled={addPaymentMutation.isPending}
                    className="rounded-lg h-9 px-6 bg-primary hover:bg-primary/90 font-bold"
                >
                    {addPaymentMutation.isPending && <Loader2 className="h-3 w-3 mr-2 animate-spin" />}
                    Confirm Payment
                </Button>
            </div>
        </div>
    )
}
