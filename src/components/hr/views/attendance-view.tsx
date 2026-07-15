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
   

    const attendanceRecords = attendanceRes?.data?.data || []
    
    // Provide a map for uid to Employee Name
    const employees = employeesRes?.data || []
    const uidToName = new Map<string | number, string>()
    employees.forEach((e: any) => {
        const uid = e.employeeNumber || e.id
        uidToName.set(Number(uid), e.name)
        uidToName.set(uid.toString(), e.name)
    })

    const activeFilterCount = Object.values(filters).filter(v => !!v).length

    const resetFilters = () => {
        setFilters({})
    }

    const getVerifyTypeBadge = (type: number) => {
        switch(type) {
            case 1: return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Fingerprint</Badge>
            case 3: return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Password</Badge>
            case 4: return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Card</Badge>
            case 15: return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Face</Badge>
            default: return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Other ({type})</Badge>
        }
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
                                        <TableHead>Device SN</TableHead>
                                        <TableHead>Punch Time</TableHead>
                                        <TableHead>Verify Type</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : attendanceRecords.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
                                                                {uidToName.get(record.uid) || "Unknown Employee"}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                                                                UID: {record.uid}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium text-xs">
                                                    {record.deviceSn}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {format(new Date(record.punchTime), "dd MMM yyyy, hh:mm a")}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getVerifyTypeBadge(record.verifyType)}
                                                </TableCell>
                                                <TableCell>
                                                    {record.isDuplicate ? (
                                                        <Badge variant="outline" className="text-gray-400 bg-gray-50 border-gray-200">Duplicate</Badge>
                                                    ) : (
                                                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Valid</Badge>
                                                    )}
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
                                Showing page {page} of {attendanceRes?.data?.meta?.totalPages || 1} ({attendanceRes?.data?.meta?.total || 0} total records)
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
                                    disabled={page >= (attendanceRes?.data?.meta?.totalPages || 1) || isLoading}
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
