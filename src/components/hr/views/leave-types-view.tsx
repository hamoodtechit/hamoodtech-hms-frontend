"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, Loader2, ArrowLeft, ArrowRight, MoreHorizontal, Settings2 } from "lucide-react"
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
import { toast } from "sonner"
import { useLeaveTypes, useDeleteLeaveType } from "@/hooks/hr-queries"
import { useBranches } from "@/hooks/pharmacy-queries"
import { useStoreContext } from "@/store/use-store-context"
import { LeaveType } from "@/types/hr"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { LeaveTypeDialog } from "@/components/hr/leave-type-dialog"
import { LeaveTypeDetailsDialog } from "@/components/hr/leave-type-details-dialog"

export function LeaveTypesView() {
  const { activeStoreId } = useStoreContext()
  const branchId = activeStoreId === 'all' ? undefined : activeStoreId

  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<string | null>(null)
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null)
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: branchData } = useBranches({ page: 1, limit: 100 })
  const branches = branchData?.data || []
  const deleteMutation = useDeleteLeaveType()

  const { data: leaveTypeResponse, isLoading } = useLeaveTypes({
    page,
    limit: 10,
    searchTerm: debouncedSearch,
    branchId: branchId ? String(branchId) : undefined
  })

  // Normalize data array
  let leaveTypes: LeaveType[] = []
  let meta = null
  
  if (leaveTypeResponse) {
    if (leaveTypeResponse.data && Array.isArray(leaveTypeResponse.data)) {
        leaveTypes = leaveTypeResponse.data
        meta = leaveTypeResponse.meta
    }
  }

  const handleEdit = (leaveType: LeaveType) => {
    setSelectedLeaveType(leaveType)
    setIsDialogOpen(true)
  }

  const handleViewDetails = (id: string) => {
    setSelectedLeaveTypeId(id)
    setIsDetailsOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success("Leave type deleted successfully")
    } catch {
      toast.error("Failed to delete leave type")
    } finally {
      setIsDeleteDialogOpen(false)
      setDeleteId(null)
    }
  }

  return (
    <PermissionGuard permission="employee:read">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 w-full max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary/90 to-primary/60 bg-clip-text text-transparent">Leave Types</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage leave categories and policies for your organization.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
                onClick={() => {
                    setSelectedLeaveType(null)
                    setIsDialogOpen(true)
                }}
                className="shadow-sm hover:shadow transition-all"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Leave Type
            </Button>
          </div>
        </div>

        <Card className="border-border/50 shadow-sm border-t-4 border-t-primary/20">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col space-y-1.5">
                <CardTitle className="text-lg">Leave Type Directory</CardTitle>
                <CardDescription>View and manage all available leave types.</CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64 group">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Search leave types..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-background focus-visible:ring-primary/20"
                    />
                  </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-xl border overflow-hidden bg-background/30 transition-all shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Type Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Max Days/Year</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Payment Status</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground w-25">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-48 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40" />
                        <p className="mt-2 text-sm text-muted-foreground">Loading configurations...</p>
                      </TableCell>
                    </TableRow>
                  ) : leaveTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                        <Settings2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-lg font-medium">No leave types found</p>
                        <p className="text-xs">Create your first leave type policy to get started.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaveTypes.map((leaveType) => (
                      <TableRow key={leaveType.id} className="group hover:bg-muted/30 transition-colors border-b last:border-0">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm leading-tight text-foreground/90 group-hover:text-primary transition-colors">
                              {leaveType.name}
                            </span>
                            {leaveType.nameBangla && (
                                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight mt-0.5">
                                    {leaveType.nameBangla}
                                </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-sm text-foreground/80">
                            {leaveType.maxDaysPerYear} Days
                        </TableCell>
                        <TableCell className="text-center">
                            {leaveType.isPaid ? (
                                <Badge variant="default" className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200">Paid</Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-rose-200">Unpaid</Badge>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 rounded-full transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 p-1 shadow-lg">
                              <DropdownMenuItem onClick={() => handleViewDetails(leaveType.id)} className="cursor-pointer rounded-md">
                                <span className="mr-2 h-4 w-4 flex items-center justify-center opacity-70">👁️</span>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(leaveType)} className="cursor-pointer rounded-md">
                                <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                                Edit Policies
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(leaveType.id)}
                                className="text-destructive focus:text-destructive cursor-pointer rounded-md"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Type
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
                        let pageNum = i + 1;
                        if (meta.totalPages > 5) {
                            if (meta.page > 3) {
                                pageNum = meta.page - 2 + i;
                            }
                            if (pageNum > meta.totalPages) {
                                pageNum = meta.totalPages - (4 - i);
                            }
                        }
                        return (
                        <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="icon"
                            className={`h-8 w-8 ${page === pageNum ? 'shadow-sm' : ''}`}
                            onClick={() => setPage(pageNum)}
                        >
                            {pageNum}
                        </Button>
                        )
                    })}
                    </div>
                    <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
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

        <LeaveTypeDetailsDialog
          id={selectedLeaveTypeId}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          branches={branches}
        />

        <LeaveTypeDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          leaveType={selectedLeaveType}
          branches={branches}
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent className="sm:max-w-[425px]">
                <AlertDialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full border-4 border-rose-100 flex items-center justify-center mb-4 bg-rose-50 text-rose-600">
                        <Trash2 className="h-5 w-5" />
                    </div>
                    <AlertDialogTitle className="text-center text-xl">Delete Leave Type</AlertDialogTitle>
                    <AlertDialogDescription className="text-center pt-2">
                        Are you sure you want to delete this leave type? This action cannot be undone and may affect historical leave records.
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
                        ) : 'Yes, Delete Leave Type'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGuard>
  )
}
