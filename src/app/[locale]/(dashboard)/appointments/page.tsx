"use client"

import { AppointmentDetailsDialog } from "@/components/appointments/appointment-details-dialog"
import { AppointmentDialog } from "@/components/appointments/appointment-dialog"
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
import { useAppointments, useDeleteAppointment } from "@/hooks/appointment-queries"
import { useDepartments, useEmployees } from "@/hooks/hr-queries"
import { usePatients } from "@/hooks/patient-queries"
import { useStoreContext } from "@/store/use-store-context"
import { Appointment, AppointmentStatus } from "@/types/appointment"
import { format } from "date-fns"
import { Calendar, ChevronLeft, ChevronRight, Clock, Edit, Eye, Loader2, Plus, Search, Stethoscope, Trash2 } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { useState } from "react"
import { toast } from "sonner"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function AppointmentsPage() {
    const { hasPermission } = usePermissions()
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState<AppointmentFilterValues>({})
    
    const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    
    const { activeStoreId } = useStoreContext()

    // Fetch Lists
    const { data, isLoading, refetch } = useAppointments({
        page,
        limit: 10,
        search,
        branchId: activeStoreId || undefined,
        ...filters
    })

    const { data: deptsRes } = useDepartments({ branchId: activeStoreId || undefined, limit: 100 })
    const { data: docsRes } = useEmployees({ branchId: activeStoreId || undefined, limit: 100 })
    const { data: patsRes } = usePatients({ limit: 100 })

    const deleteMutation = useDeleteAppointment()

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to cancel and delete this appointment?")) {
            try {
                await deleteMutation.mutateAsync(id)
                toast.success("Appointment deleted successfully")
            } catch (error) {
                toast.error("Failed to delete appointment")
            }
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
                        <h1 className="text-3xl font-black tracking-tight text-primary">Appointments</h1>
                        <p className="text-muted-foreground text-sm font-medium">Manage patient schedules and doctor availability.</p>
                    </div>
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
                                    doctors={docsRes?.data || []}
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
                                    <TableHead>Notes</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <{isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-72 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                                                <span className="text-sm font-medium text-muted-foreground">Fetching Appointments...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : appointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-72 text-center text-muted-foreground">
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
                                                        <div className="font-black text-sm text-foreground">{apt.serialNumber}</div>
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
                                                        <div className="font-bold text-sm text-foreground/80">{apt.doctor.name}</div>
                                                        <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{apt.department.name}</div>
                                                    </div>
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
                                                    {hasPermission('appointment:delete') && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg hover:bg-destructive/5 hover:text-destructive text-muted-foreground"
                                                            onClick={() => handleDelete(apt.id)}
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
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
                    onSuccess={refetch}
                />

                <AppointmentDetailsDialog 
                    open={detailsDialogOpen}
                    onOpenChange={setDetailsDialogOpen}
                    appointmentId={selectedAppointment?.id || null}
                />
            </div>
        </PermissionGuard>
    )
}
