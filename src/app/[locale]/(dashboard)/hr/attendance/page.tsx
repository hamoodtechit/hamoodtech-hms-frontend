"use client"

import { AttendanceDetailsDialog } from "@/components/hr/attendance-details-dialog"
import { AttendanceDialog } from "@/components/hr/attendance-dialog"
import { AttendanceFilters, AttendanceFilterValues } from "@/components/hr/hr-filters"
import { ImportAttendanceDialog } from "@/components/hr/import-attendance-dialog"
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAttendance, useDeleteAttendance, useDepartments, useEmployees } from "@/hooks/hr-queries"
import { useBranches } from "@/hooks/pharmacy-queries"
import { usePermissions } from "@/hooks/use-permissions"
import { cn } from "@/lib/utils"
import { useStoreContext } from "@/store/use-store-context"
import { Attendance } from "@/types/hr"
import { 
    Calendar,
    ChevronLeft, 
    ChevronRight, 
    Clock, 
    FileUp, 
    Loader2, 
    MoreHorizontal,
    Pencil,
    Plus, 
    Search, 
    Trash2,
    User 
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function AttendancePage() {
    const { hasPermission } = usePermissions()
    const { activeStoreId } = useStoreContext()
    
    // State
    const [searchTerm, setSearchTerm ] = useState("")
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState<AttendanceFilterValues>({})
    const [dialogOpen, setDialogOpen] = useState(false)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [importOpen, setImportOpen] = useState(false)
    const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const deleteMutation = useDeleteAttendance()

    const handleAdd = () => {
        setSelectedAttendance(null)
        setDialogOpen(true)
    }

    const handleEdit = (attendance: Attendance) => {
        setSelectedAttendance(attendance)
        setDialogOpen(true)
    }

    const handleView = (attendance: Attendance) => {
        setSelectedAttendance(attendance)
        setDetailsOpen(true)
    }

    const handleDeleteClick = (id: string) => {
        setDeleteId(id)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!deleteId) return
        try {
            await deleteMutation.mutateAsync(deleteId)
            toast.success("Attendance record deleted")
            setDeleteDialogOpen(false)
            setDeleteId(null)
        } catch {
            toast.error("Failed to delete attendance record")
        }
    }

    // Data fetching
    const { data: attendanceRes, isLoading, refetch } = useAttendance({
        page,
        limit: 10,
        searchTerm,
        branchId: filters.branchId || activeStoreId || undefined,
        ...filters
    })

    const { data: branchesRes } = useBranches({ limit: 100 })
    const { data: employeesRes } = useEmployees({ 
        branchId: filters.branchId || activeStoreId || undefined, 
        limit: 1000 
    })
    const { data: departmentsRes } = useDepartments({ 
        branchId: filters.branchId || activeStoreId || undefined, 
        limit: 100 
    })

    const attendanceRecords = attendanceRes?.data || []
    const branches = branchesRes?.data || []
    const meta = attendanceRes?.meta
    const activeFilterCount = Object.values(filters).filter(v => !!v).length

    const resetFilters = () => {
        setFilters({})
        setSearchTerm("")
        setPage(1)
    }

    const getStatusBadge = (record: Attendance) => {
        if (record.absent === "True") return <Badge variant="destructive">Absent</Badge>
        if (record.holiday === "True") return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Holiday</Badge>
        if (record.weekEnd === "True") return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Weekend</Badge>
        
        const isLate = record.late && record.late !== "0" && record.late !== ""
        return (
            <Badge variant="outline" className={cn(
                "capitalize font-semibold",
                isLate ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
            )}>
                {isLate ? `Late (${record.late}m)` : "On Time"}
            </Badge>
        )
    }

    return (
        <PermissionGuard permission="user:read">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
                        <p className="text-muted-foreground">Monitor and manage employee daily attendance and working hours.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            className="gap-2"
                            onClick={() => setImportOpen(true)}
                        >
                            <FileUp className="h-4 w-4" />
                            Import
                        </Button>
                        {hasPermission('employee:create') && (
                            <Button onClick={handleAdd}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Attendance
                            </Button>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                               <h3 className="font-semibold text-lg">Daily Attendance Logs</h3>
                               <p className="text-sm text-muted-foreground">Full records of clock-in/out activities.</p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search employee..."
                                        className="pl-8 h-9"
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value)
                                            setPage(1)
                                        }}
                                    />
                                </div>
                                <FilterPopover 
                                    activeFilterCount={activeFilterCount}
                                    onReset={resetFilters}
                                    title="Attendance Filters"
                                >
                                    <AttendanceFilters 
                                        values={filters}
                                        onChange={(v) => {
                                            setFilters(v)
                                            setPage(1)
                                        }}
                                        employees={employeesRes?.data || []}
                                        departments={departmentsRes?.data || []}
                                        branches={branches}
                                    />
                                </FilterPopover>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Employee</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Clock In/Out</TableHead>
                                        <TableHead>Shift Info</TableHead>
                                        <TableHead>Work Time</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : attendanceRecords.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                No attendance records found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        attendanceRecords.map((record) => (
                                            <TableRow key={record.id} className="group hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border">
                                                            <User className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm leading-tight hover:text-primary cursor-pointer transition-colors">
                                                                {record.employeeName}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                                                {record.employeeNumber || record.department || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {record.date}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-sm font-medium">
                                                            <Clock className="h-3.5 w-3.5 text-emerald-500" />
                                                            {record.clockIn || '--:--'}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm font-medium">
                                                            <Clock className="h-3.5 w-3.5 text-amber-500" />
                                                            {record.clockOut || '--:--'}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-xs text-muted-foreground">
                                                        <span>Shift: {record.shift || 'Default'}</span>
                                                        <span>Duty: {record.onDuty || '-'} to {record.offDuty || '-'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-sm text-primary">
                                                            {record.workTime || '00:00'}
                                                        </span>
                                                        {record.otTime && record.otTime !== "0" && (
                                                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest bg-emerald-50 px-1 rounded border border-emerald-100 self-start">
                                                                OT: {record.otTime}
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(record)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(record)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleView(record)}>
                                                            <Search className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleDeleteClick(record.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {meta && meta.totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(page * 10, meta.totalItems)}</span> of <span className="font-medium">{meta.totalItems}</span> records
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={!meta.hasPreviousPage}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(meta.totalPages)].map((_, i) => (
                                            <Button
                                                key={i}
                                                variant={page === i + 1 ? "default" : "outline"}
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => setPage(i + 1)}
                                            >
                                                {i + 1}
                                            </Button>
                                        ))}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={!meta.hasNextPage}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <AttendanceDialog 
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    attendance={selectedAttendance}
                    onSuccess={() => refetch()}
                    branches={branches}
                />

                <AttendanceDetailsDialog 
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    attendance={selectedAttendance}
                />

                <ImportAttendanceDialog 
                    open={importOpen}
                    onOpenChange={setImportOpen}
                    branchId={filters.branchId || activeStoreId || ""}
                    onSuccess={() => refetch()}
                />

                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the attendance record.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PermissionGuard>
    )
}
