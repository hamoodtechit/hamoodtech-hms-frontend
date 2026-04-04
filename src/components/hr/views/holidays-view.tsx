"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Calendar, Search, Loader2, ArrowLeft, ArrowRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useHolidays, useDeleteHoliday } from "@/hooks/hr-queries"
import { useBranches } from "@/hooks/pharmacy-queries"
import { useStoreContext } from "@/store/use-store-context"
import { HolidayDialog } from "@/components/hr/holiday-dialog"
import { HolidayFilters, HolidayFilterValues } from "@/components/hr/hr-filters"
import { HolidayDetailsDialog } from "@/components/hr/holiday-details-dialog"
import { FilterPopover } from "@/components/shared/filter-popover"
import { Holiday } from "@/types/hr"
import { format } from "date-fns"
import { PermissionGuard } from "@/components/shared/permission-guard"

export function HolidaysView() {
  const { activeStoreId } = useStoreContext()
  
  // State
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<HolidayFilterValues>({
      branchId: activeStoreId || undefined
  })
  const [page, setPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedHolidayId, setSelectedHolidayId] = useState<string | null>(null)
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Data
  const { data: holidaysRes, isLoading } = useHolidays({
    searchTerm,
    ...filters,
    page,
    limit: 10,
  })

  const { data: branchesRes } = useBranches({ limit: 100 })
  const deleteMutation = useDeleteHoliday()

  const holidays = holidaysRes?.data || []
  const meta = holidaysRes?.meta
  const branches = branchesRes?.data || []

  // Handlers
  const handleAdd = () => {
    setSelectedHoliday(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (holiday: Holiday) => {
    setSelectedHoliday(holiday)
    setIsDialogOpen(true)
  }

  const handleViewDetails = (id: string) => {
    setSelectedHolidayId(id)
    setIsDetailsOpen(true)
  }

  const handleDelete = (id: string) => {

    setDeleteId(id)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      toast.success("Holiday deleted successfully")
      setIsDeleteOpen(false)
    } catch {
      toast.error("Failed to delete holiday")
    }
  }

  const activeFilterCount = Object.values(filters).filter(v => !!v).length

  return (
    <PermissionGuard permission="user:read">
      <div className="space-y-6 max-w-400 mx-auto p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Public Holidays</h1>
            <p className="text-muted-foreground">Manage and schedule holidays across your branches.</p>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Holiday
          </Button>
        </div>

        <Card className="border-none shadow-premium bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Holiday Calendar
              </CardTitle>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder="Search holidays..."
                          className="pl-8 h-9 text-xs"
                          value={searchTerm}
                          onChange={(e) => {
                              setSearchTerm(e.target.value)
                              setPage(1)
                          }}
                      />
                  </div>
                  <FilterPopover 
                      activeFilterCount={activeFilterCount}
                      onReset={() => {
                          setFilters({})
                          setSearchTerm("")
                          setPage(1)
                      }}
                  >
                      <HolidayFilters 
                        values={filters} 
                        onChange={(v) => {
                            setFilters(v)
                            setPage(1)
                        }} 
                        branches={branches} 
                      />
                  </FilterPopover>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="rounded-xl border overflow-hidden bg-background/30 transition-all shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Holiday Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-muted-foreground text-center">Duration / Date Range</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-muted-foreground w-25">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-48 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40" />
                        <p className="mt-2 text-sm text-muted-foreground">Syncing records...</p>
                      </TableCell>
                    </TableRow>
                  ) : holidays.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-48 text-center text-muted-foreground">
                        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-lg font-medium">No holidays found</p>
                        <p className="text-xs">Try adjusting your filters or search term.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    holidays.map((holiday) => (
                      <TableRow key={holiday.id} className="group hover:bg-muted/30 transition-colors border-b last:border-0">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm leading-tight text-foreground/90 group-hover:text-primary transition-colors">
                              {holiday.name}
                            </span>
                            {holiday.nameBangla && (
                                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight mt-0.5">
                                    {holiday.nameBangla}
                                </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-xs text-muted-foreground bg-muted/5">
                            <div className="flex items-center justify-center gap-2">
                                <Calendar className="h-3 w-3 text-primary/50" />
                                {format(new Date(holiday.startDate), "dd MMM yyyy")} - {format(new Date(holiday.endDate), "dd MMM yyyy")}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 rounded-full transition-colors">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 p-1 shadow-lg">
                              <DropdownMenuItem onClick={() => handleViewDetails(holiday.id)} className="cursor-pointer rounded-md">
                                <span className="mr-2 h-4 w-4 flex items-center justify-center opacity-70">👁️</span>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(holiday)} className="cursor-pointer rounded-md">
                                <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(holiday.id)}
                                className="text-destructive focus:text-destructive cursor-pointer rounded-md"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Holiday
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
                    <p className="text-sm text-muted-foreground font-medium">
                        Showing results <span className="text-foreground">{(page - 1) * 10 + 1}</span> to <span className="text-foreground">{Math.min(page * 10, meta.totalItems)}</span> of <span className="text-foreground">{meta.totalItems}</span>
                    </p>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 hover:bg-primary/5"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={!meta.hasPreviousPage}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Prev
                        </Button>
                        <div className="flex items-center px-2">
                             <span className="text-sm font-bold text-primary px-3 py-1 bg-primary/10 rounded-md">
                                 {page}
                             </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 hover:bg-primary/5"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={!meta.hasNextPage}
                        >
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </div>
            )}
          </CardContent>
        </Card>

        <HolidayDetailsDialog
          id={selectedHolidayId}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          branches={branches}
        />

        <HolidayDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          holiday={selectedHoliday}
          branches={branches}
        />

        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">Delete Holiday?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently remove the <strong>{holidays.find(h => h.id === deleteId)?.name}</strong> holiday. This action cannot be reversed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-4">
              <AlertDialogCancel className="rounded-xl px-6">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-white hover:bg-destructive/90 rounded-xl px-6 border-none"
              >
                Delete Forever
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PermissionGuard>
  )
}
