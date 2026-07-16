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
    User,
    Info
} from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { PermissionGuard } from "@/components/shared/permission-guard"

export function AttendanceView() {
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
        limit: 100,
        ...filters
    })

    const { data: branchesRes } = useBranches({ limit: 100 })
    const { data: employeesRes } = useEmployees({ 
        branchId: activeStoreId || undefined, 
        limit: 1000 
    })
   

    const rawData: any = attendanceRes?.data
    const attendanceRecords = Array.isArray(rawData) ? rawData : (rawData?.data || [])
    const meta = !Array.isArray(rawData) ? rawData?.meta : null
    
    const employees = employeesRes?.data || []
    const activeFilterCount = Object.values(filters).filter(v => !!v).length

    const resetFilters = () => {
        setFilters({})
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
                                        onChange={(v) => setFilters(v)}
                                        employees={employees}
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
                                        <TableHead>Clock In</TableHead>
                                        <TableHead>Clock Out</TableHead>
                                        <TableHead>Work / Late / OT</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : attendanceRecords.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No attendance records found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        attendanceRecords.map((record: any) => (
                                            <TableRow key={record.id} className="group hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border">
                                                            <User className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm leading-tight hover:text-primary cursor-pointer transition-colors">
                                                                {record.employeeName || "Unknown Employee"}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                                                ID: {record.employeeNumber || record.employeeId || "N/A"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {record.date ? format(new Date(record.date), "dd MMM yyyy") : "N/A"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 font-medium">
                                                        <Clock className="h-3.5 w-3.5 text-emerald-500" />
                                                        {record.clockIn || "--:--"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 font-medium">
                                                        <Clock className="h-3.5 w-3.5 text-rose-500" />
                                                        {record.clockOut || "--:--"}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        {record.workTime !== "0" && record.workTime && (
                                                            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-fit">
                                                                Work: {record.workTime}m
                                                            </span>
                                                        )}
                                                        {record.late !== "0" && record.late && (
                                                            <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full w-fit">
                                                                Late: {record.late}m
                                                            </span>
                                                        )}
                                                        {record.otTime !== "0" && record.otTime && (
                                                            <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full w-fit">
                                                                OT: {record.otTime}m
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {record.absent === "True" ? (
                                                        <Badge variant="destructive" className="uppercase text-[10px] tracking-wider px-2">Absent</Badge>
                                                    ) : (
                                                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 uppercase text-[10px] tracking-wider px-2">Present</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleView(record)}>
                                                                <Info className="mr-2 h-4 w-4" />
                                                                Details
                                                            </DropdownMenuItem>
                                                            {hasPermission('attendance:update') && (
                                                                <DropdownMenuItem onClick={() => handleEdit(record)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </DropdownMenuItem>
                                                            )}
                                                            {hasPermission('attendance:delete') && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10" onClick={() => handleDeleteClick(record.id)}>
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
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
                        <div className="flex items-center justify-between px-2 py-4">
                            <div className="text-sm text-muted-foreground">
                                Showing page {page} {meta?.totalPages ? `of ${meta.totalPages}` : ""} ({meta?.total || attendanceRecords.length} total records)
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1 || isLoading}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={(meta ? page >= meta.totalPages : attendanceRecords.length < 100) || isLoading}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <AttendanceDialog 
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    attendance={selectedAttendance as any} // Might not be compatible with new attendance model, but keeping prop
                    onSuccess={() => refetch()}
                />

                <AttendanceDetailsDialog 
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    attendance={selectedAttendance}
                />

                <ImportAttendanceDialog 
                    open={importOpen}
                    onOpenChange={setImportOpen}
                    branchId={activeStoreId || ""}
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
