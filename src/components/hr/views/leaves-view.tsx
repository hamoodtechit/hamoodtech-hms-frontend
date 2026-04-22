"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Search, Loader2, ArrowLeft, ArrowRight, MoreHorizontal, CalendarRange, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useLeaves, useDeleteLeave, useEmployees } from "@/hooks/hr-queries"
import { useBranches } from "@/hooks/pharmacy-queries"
import { useStoreContext } from "@/store/use-store-context"
import { Leave } from "@/types/hr"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { LeaveDialog } from "@/components/hr/leave-dialog"
import { LeaveSummary } from "@/components/hr/leave-summary"
import { ApproveLeaveDialog } from "@/components/hr/approve-leave-dialog"
import { format, isValid } from "date-fns"

const safeFormat = (value: string | null | undefined, fmt: string, fallback = 'N/A') => {
  if (!value) return fallback
  const d = new Date(value)
  return isValid(d) ? format(d, fmt) : fallback
}

export function LeavesView() {
  const { activeStoreId } = useStoreContext()
  const branchId = activeStoreId === 'all' ? undefined : activeStoreId

  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>("all")

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null)
  const [selectedLeaveStatus, setSelectedLeaveStatus] = useState<string>('pending')
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: branchData } = useBranches({ page: 1, limit: 100 })
  const branches = branchData?.data || []
  
  const { data: employeeData } = useEmployees({ branchId: branchId ? String(branchId) : undefined, limit: 100 })
  const employeesList = employeeData?.data || []
  
  const deleteMutation = useDeleteLeave()

  const { data: leavesResponse, isLoading } = useLeaves({
    page,
    limit: 10,
    searchTerm: debouncedSearch,
    branchId: branchId ? String(branchId) : undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
    employeeId: filterEmployeeId !== "all" ? filterEmployeeId : undefined
  })

  // Normalize data array
  let leavesData: Leave[] = []
  let meta = null
  
  if (leavesResponse) {
    if (leavesResponse.data && Array.isArray(leavesResponse.data)) {
        leavesData = leavesResponse.data
        meta = leavesResponse.meta
    }
  }

  const handleApprove = (leave: Leave) => {
    setSelectedLeaveId(leave.id)
    setSelectedLeaveStatus(leave.status)
    setIsApproveOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success("Leave request deleted successfully")
    } catch {
      toast.error("Failed to delete leave request")
    } finally {
      setIsDeleteDialogOpen(false)
      setDeleteId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-rose-200">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200">Pending</Badge>;
    }
  }

  return (
    <PermissionGuard permission="employee:read">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary/90 to-primary/60 bg-clip-text text-transparent">Leave Requests</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage employee leave requests, approvals and history.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
                onClick={() => setIsDialogOpen(true)}
                className="shadow-sm hover:shadow transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> Apply Leave
            </Button>
          </div>
        </div>

        {filterEmployeeId !== "all" && (
          <LeaveSummary employeeId={filterEmployeeId} />
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col space-y-1.5">
                <CardTitle className="text-lg">Leave Directory</CardTitle>
                <CardDescription>View and manage all employee leave requests.</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setPage(1); }}>
                    <SelectTrigger className="w-full sm:w-[150px] bg-background">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterEmployeeId} onValueChange={(val) => { setFilterEmployeeId(val); setPage(1); }}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-background">
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Employees</SelectItem>
                      {employeesList.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="relative flex-1 sm:w-64 group w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                      className="pl-9 bg-background focus-visible:ring-primary/20"
                    />
                  </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40" />
                        <p className="mt-2 text-sm text-muted-foreground">Loading leave requests...</p>
                      </TableCell>
                    </TableRow>
                  ) : leavesData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                        <CalendarRange className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-lg font-medium">No leave requests found</p>
                        <p className="text-xs">Apply for a leave to get started.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    leavesData.map((leave) => (
                      <TableRow key={leave.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm leading-tight text-foreground/90 group-hover:text-primary transition-colors">
                              {leave.employee?.name || 'Unknown Employee'}
                            </span>
                            {leave.employee?.designation?.name && (
                                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight mt-0.5">
                                    {leave.employee.designation.name}
                                </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-muted-foreground font-medium uppercase tracking-wider text-[11px]">
                            {leave.leaveType?.name || 'Leave'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="text-sm font-medium">
                                {safeFormat(leave.startDate, "MMM d")} - {safeFormat(leave.endDate, "MMM d, yyyy")}
                            </div>
                        </TableCell>
                        <TableCell>
                            {getStatusBadge(leave.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 rounded-full transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 p-1 shadow-lg">
                              <DropdownMenuItem onClick={() => handleApprove(leave)} className="cursor-pointer rounded-md">
                                <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                                Action Request
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(leave.id)}
                                className="text-destructive focus:text-destructive cursor-pointer rounded-md"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Request
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

            {/* Pagination Controls */}
            {meta && meta.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
                <div className="text-sm text-muted-foreground/80 font-medium bg-muted/30 px-3 py-1.5 rounded-md border border-border/50">
                    Showing <span className="text-foreground font-bold">{((meta.page - 1) * meta.pageSize) + 1}</span> to <span className="text-foreground font-bold">{Math.min(meta.page * meta.pageSize, meta.totalItems)}</span> of <span className="text-foreground font-bold">{meta.totalItems}</span> entries
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!meta.hasPreviousPage}
                    className="h-8 shadow-sm"
                    >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>
                    <div className="flex items-center gap-1.5">
                    {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
                        let pageNum = page;
                        if (meta.totalPages <= 5) {
                        pageNum = i + 1;
                        } else if (page > 3 && page < meta.totalPages - 1) {
                        pageNum = page - 2 + i;
                        } else if (page >= meta.totalPages - 1) {
                        pageNum = meta.totalPages - 4 + i;
                        } else {
                        pageNum = i + 1;
                        }
                        
                        return (
                        <Button
                            key={i}
                            variant={page === pageNum ? "default" : "outline"}
                            size="icon"
                            onClick={() => setPage(pageNum)}
                            className={`h-8 w-8 shadow-sm ${page === pageNum ? "bg-primary text-primary-foreground font-bold" : "font-medium"}`}
                        >
                            {pageNum}
                        </Button>
                        );
                    })}
                    </div>
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    disabled={!meta.hasNextPage}
                    className="h-8 shadow-sm"
                    >
                    Next <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
                </div>
            )}
          </CardContent>
        </Card>

        <LeaveDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />

        <ApproveLeaveDialog
          id={selectedLeaveId}
          open={isApproveOpen}
          onOpenChange={setIsApproveOpen}
          currentStatus={selectedLeaveStatus}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="sm:max-w-[425px]">
                <AlertDialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full border-4 border-rose-100 flex items-center justify-center mb-4 bg-rose-50 text-rose-600">
                        <Trash2 className="h-5 w-5" />
                    </div>
                    <AlertDialogTitle className="text-center text-xl">Delete Leave Request</AlertDialogTitle>
                    <AlertDialogDescription className="text-center pt-2">
                        Are you sure you want to delete this leave request? This action cannot be undone and will remove it from the employee&apos;s history.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center gap-2 pt-4">
                    <AlertDialogCancel disabled={deleteMutation.isPending} className="mt-0">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={(e) => {
                            e.preventDefault();
                            confirmDelete();
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
                        ) : 'Yes, Delete Request'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGuard>
  )
}
