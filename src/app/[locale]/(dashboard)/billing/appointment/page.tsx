"use client"

import { AppointmentDetailsDialog } from "@/components/appointments/appointment-details-dialog"
import { AppointmentDialog } from "@/components/appointments/appointment-dialog"
import { AppointmentSaleDialog } from "@/components/appointments/appointment-sale-dialog"
import { AppointmentPaymentDialog } from "@/components/appointments/appointment-payment-dialog"
import { AppointmentReceiptDialog } from "@/components/appointments/appointment-receipt-dialog"
import { AppointmentFilters, AppointmentFilterValues } from "@/components/appointments/appointment-filters"
import { FilterPopover } from "@/components/shared/filter-popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAppointments, useCancelAppointment } from "@/hooks/appointment-queries"
import { useDepartments } from "@/hooks/hr-queries"
import { useUsers } from "@/hooks/user-queries"
import { usePatients } from "@/hooks/patient-queries"
import { useStoreContext } from "@/store/use-store-context"
import { Appointment, AppointmentStatus } from "@/types/appointment"
import { format } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, Clock, Edit, Eye, Loader2, Plus, Search, ShoppingCart, Stethoscope, Trash2, Printer, Wallet, X, AlertTriangle } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { useState } from "react"
import { toast } from "sonner"
import { PermissionGuard } from "@/components/shared/permission-guard"
import Link from "next/link"
import { useCurrency } from "@/hooks/use-currency"
import { Sale } from "@/types/sales"

export default function AppointmentHistoryPage() {
    const { hasPermission } = usePermissions()
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState<AppointmentFilterValues>({})
    
    const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

    // Sale & Payment dialogs
    const [saleDialogOpen, setSaleDialogOpen] = useState(false)
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
    const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
    const [lastCreatedSale, setLastCreatedSale] = useState<Sale | any | null>(null)
    
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()

    // Fetch Lists
    const { data, isLoading, refetch } = useAppointments({
        page,
        limit: 100,
        search,
        branchId: activeStoreId || undefined,
        ...filters,
        startDate: filters.startDate ? new Date(filters.startDate + 'T00:00:00').toISOString() : undefined,
        endDate: filters.endDate ? (() => {
            const d = new Date(filters.endDate + 'T00:00:00');
            d.setHours(23, 59, 59, 999);
            return d.toISOString();
        })() : undefined,
    })

    const { data: deptsRes } = useDepartments({ branchId: activeStoreId || undefined, limit: 100 })
    const { data: usersRes } = useUsers({ branchId: activeStoreId || undefined, limit: 1000 })
    const { data: patsRes } = usePatients({ limit: 100 })

    const cancelMutation = useCancelAppointment()

    const handleCancel = async (id: string) => {
        try {
            await cancelMutation.mutateAsync(id)
            toast.success("Appointment cancelled successfully")
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to cancel appointment")
        }
    }

    const getStatusBadge = (status: AppointmentStatus) => {
        switch (status) {
            case "pending": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
            case "confirmed": return <Badge className="bg-emerald-500">Confirmed</Badge>
            case "in-progress": return <Badge className="bg-blue-500">In Progress</Badge>
            case "completed": return <Badge variant="secondary">Completed</Badge>
            case "cancelled": return <Badge variant="destructive">Cancelled</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    const appointments = data?.data || []
    const totalPages = data?.meta?.totalPages || 1

    return (
        <PermissionGuard permission="appointment:read">
            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-primary">Appointment History</h1>
                        <p className="text-muted-foreground text-sm font-medium">Registry logs & previous schedules.</p>
                    </div>
                    <Link href="/appointments">
                        <Button className="h-11 px-6 rounded-2xl gap-2 font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" /> Book Appointment
                        </Button>
                    </Link>
                </div>

                <Card className="border-none shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="p-4 bg-card/80 border-b">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by Serial Number or Patient..."
                                    className="pl-10 h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-primary/20"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <FilterPopover 
                                activeFilterCount={Object.values(filters).filter(Boolean).length}
                                onReset={() => setFilters({})}
                            >
                                <AppointmentFilters 
                                    values={filters}
                                    onChange={setFilters}
                                    departments={deptsRes?.data || []}
                                    doctors={usersRes?.data?.filter(u => u.role?.name?.toLowerCase() === 'doctor').map(u => ({ id: u.id, name: u.fullName || u.username })) || []}
                                    patients={patsRes?.data?.map(p => ({ id: p.id, name: p.name })) || []}
                                />
                            </FilterPopover>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50 text-[11px] uppercase tracking-wider font-bold">
                                <TableRow>
                                    <TableHead className="pl-6">Appointment / Serial</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Professional</TableHead>
                                    <TableHead>Fees</TableHead>
                                    <TableHead>Paid</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-72 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                                                <span className="text-sm font-medium text-muted-foreground">Fetching Appointments...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : appointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-72 text-center text-muted-foreground">
                                            No appointments found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    appointments.map((apt) => (
                                        <TableRow key={apt.id} className="group hover:bg-muted/30 transition-colors">
                                            <TableCell className="pl-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                                                        <Calendar className="h-3 w-3 mb-0.5 opacity-60" />
                                                        {format(new Date(apt.date), "dd/MM")}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-sm text-foreground">{apt.serialNumber?.replace('-', '/')}</div>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold">
                                                            <Clock className="h-3 w-3" /> {apt.timeSlot}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-foreground/80">{apt.patient.name}</span>
                                                    <span className="text-[10px] font-mono bg-muted w-fit px-1 rounded text-muted-foreground uppercase">{apt.patient.patientNumber}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-primary/5 text-primary">
                                                        <Stethoscope className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm text-foreground/80">{apt.doctor.fullName || apt.doctor.name || apt.doctor.username}</div>
                                                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{apt.department.name}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-sm text-foreground/80">
                                                    {apt.fees ? formatCurrency(Number(apt.fees)) : '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-bold text-sm text-emerald-600">
                                                    {apt.sale?.paidAmount ? formatCurrency(Number(apt.sale.paidAmount)) : '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[150px] truncate text-[11px] text-muted-foreground font-medium" title={apt.note}>
                                                    {apt.note || '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(apt.status)}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="h-8 w-8 rounded-lg hover:bg-primary/5 hover:text-primary"
                                                        onClick={() => {
                                                            setSelectedAppointment(apt)
                                                            setDetailsDialogOpen(true)
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {hasPermission('appointment:update') && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg hover:bg-primary/5 hover:text-primary"
                                                            onClick={() => {
                                                                setSelectedAppointment(apt)
                                                                setAppointmentDialogOpen(true)
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission('sale:create') && apt.fees && Number(apt.fees) > 0 && !apt.sale && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 text-muted-foreground"
                                                            onClick={() => {
                                                                setSelectedAppointment(apt)
                                                                setSaleDialogOpen(true)
                                                            }}
                                                            title="Record Sale"
                                                        >
                                                            <ShoppingCart className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {apt.sale && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 text-muted-foreground"
                                                                onClick={() => {
                                                                    setLastCreatedSale(apt.sale)
                                                                    setReceiptDialogOpen(true)
                                                                }}
                                                                title="Print Receipt"
                                                            >
                                                                <Printer className="h-4 w-4" />
                                                            </Button>
                                                            {hasPermission('sale:create') && apt.sale.paymentStatus !== 'paid' && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 text-muted-foreground"
                                                                    onClick={() => {
                                                                        setLastCreatedSale(apt.sale)
                                                                        setPaymentDialogOpen(true)
                                                                    }}
                                                                    title="Record Payment"
                                                                >
                                                                    <Wallet className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                    {hasPermission('appointment:update') && apt.status !== 'cancelled' && apt.status !== 'completed' && (
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                                                                    title="Cancel Appointment"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] rounded-3xl">
                                                                <div className="bg-destructive/5 px-6 pt-10 pb-8 flex flex-col items-center justify-center text-center relative">
                                                                    <div className="absolute top-0 left-0 w-full h-1 bg-destructive/20" />
                                                                    <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6 ring-8 ring-destructive/5">
                                                                        <AlertTriangle className="h-10 w-10 text-destructive" />
                                                                    </div>
                                                                    <AlertDialogTitle className="text-2xl font-black text-foreground tracking-tight">Cancel Appointment?</AlertDialogTitle>
                                                                    <AlertDialogDescription className="text-sm font-medium text-muted-foreground mt-3 text-center max-w-[300px] leading-relaxed">
                                                                        This will permanently <strong className="text-foreground">refund the patient</strong>, deduct cash, return stock, and remove commissions.
                                                                    </AlertDialogDescription>
                                                                </div>
                                                                <div className="p-6 bg-background flex flex-col-reverse sm:flex-row justify-end gap-3 border-t">
                                                                    <AlertDialogCancel className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[11px] w-full sm:w-auto mt-0 border-primary/20 hover:bg-primary/5">
                                                                        No, Keep It
                                                                    </AlertDialogCancel>
                                                                    <AlertDialogAction 
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            handleCancel(apt.id);
                                                                        }}
                                                                        className="h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20 w-full sm:w-auto"
                                                                        disabled={cancelMutation.isPending}
                                                                    >
                                                                        {cancelMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, Cancel"}
                                                                    </AlertDialogAction>
                                                                </div>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                                <span className="text-sm text-muted-foreground font-medium">
                                    Page <span className="text-foreground font-bold">{page}</span> of <span className="text-foreground font-bold">{totalPages}</span>
                                </span>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 px-3 rounded-lg border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1 || isLoading}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 px-3 rounded-lg border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages || isLoading}
                                    >
                                        Next <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <AppointmentDialog 
                    open={appointmentDialogOpen}
                    onOpenChange={setAppointmentDialogOpen}
                    appointment={selectedAppointment}
                    onSuccess={(createdAppointment?: any) => {
                        refetch()
                        // After creating a new appointment, auto-open the sale dialog
                        if (createdAppointment && !selectedAppointment) {
                            setSelectedAppointment(createdAppointment)
                            setTimeout(() => {
                                setSaleDialogOpen(true)
                            }, 300)
                        }
                    }}
                />

                <AppointmentDetailsDialog 
                    open={detailsDialogOpen}
                    onOpenChange={setDetailsDialogOpen}
                    appointmentId={selectedAppointment?.id || null}
                />

                <AppointmentSaleDialog
                    open={saleDialogOpen}
                    onOpenChange={setSaleDialogOpen}
                    appointment={selectedAppointment}
                    onSaleCreated={(sale) => {
                        setLastCreatedSale(sale)
                        refetch()
                        // If there's due, open payment dialog
                        if (Number(sale.dueAmount) > 0) {
                            setPaymentDialogOpen(true)
                        }
                    }}
                />

                <AppointmentPaymentDialog
                    open={paymentDialogOpen}
                    onOpenChange={setPaymentDialogOpen}
                    sale={lastCreatedSale}
                    onPaymentSuccess={() => {
                        refetch()
                        setLastCreatedSale(null)
                    }}
                />

                <AppointmentReceiptDialog
                    open={receiptDialogOpen}
                    onOpenChange={setReceiptDialogOpen}
                    transaction={lastCreatedSale}
                />
            </div>
        </PermissionGuard>
    )
}
