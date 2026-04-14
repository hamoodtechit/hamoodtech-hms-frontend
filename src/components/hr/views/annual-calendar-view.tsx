"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Calendar, Search, Loader2, ArrowLeft, ArrowRight, MoreHorizontal, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { useAnnualCalendars, useDeleteAnnualCalendar } from "@/hooks/hr-queries"
import { useBranches } from "@/hooks/pharmacy-queries"
import { useStoreContext } from "@/store/use-store-context"
import { AnnualCalendarDialog } from "@/components/hr/annual-calendar-dialog"
import { AnnualCalendarFilters, AnnualCalendarFilterValues } from "@/components/hr/hr-filters"
import { AnnualCalendarDetailsDialog } from "@/components/hr/annual-calendar-details-dialog"
import { FilterPopover } from "@/components/shared/filter-popover"
import { AnnualCalendarComponent } from "@/components/hr/annual-calendar"
import { AnnualCalendar } from "@/types/hr"
import { format } from "date-fns"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { cn } from "@/lib/utils"

const getEventColor = (type: string) => {
  switch (type) {
    case 'holiday':
      return "#dc2626" // Rose 600
    case 'vacation':
      return "#2563eb" // Blue 600
    case 'event':
      return "#059669" // Emerald 600
    default:
      return "#4f46e5" // Indigo 600
  }
};

export function AnnualCalendarView() {
  const { activeStoreId } = useStoreContext()
  
  // State
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<AnnualCalendarFilterValues>({
      branchId: activeStoreId || undefined
  })
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null)
  const [selectedCalendar, setSelectedCalendar] = useState<AnnualCalendar | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null)

  // Data
  const { data: calendarsRes, isLoading } = useAnnualCalendars({
    searchTerm,
    ...filters,
    page,
    limit: 10,
  })

  const { data: branchesRes } = useBranches({ limit: 100 })
  const deleteMutation = useDeleteAnnualCalendar()

  const calendars = calendarsRes?.data || []
  const meta = calendarsRes?.meta
  const branches = branchesRes?.data || []

  // Handlers
  const handleAdd = () => {
    setSelectedCalendar(null)
    setIsDialogOpen(true)
  }

  const handleEdit = (calendar: AnnualCalendar) => {
    setSelectedCalendar(calendar)
    setIsDialogOpen(true)
  }

  const handleViewDetails = (id: string) => {
    setSelectedCalendarId(id)
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
      toast.success("Entry deleted successfully")
      setIsDeleteOpen(false)
    } catch {
      toast.error("Failed to delete entry")
    }
  }

  const activeFilterCount = Object.values(filters).filter(v => !!v).length

  return (
    <PermissionGuard permission="annual-calendar:read">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Annual Calendar</h1>
            <p className="text-muted-foreground">Manage and schedule holidays, vacations, and events across your branches.</p>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Entry
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Calendar View
              </CardTitle>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder="Search entries..."
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
                      <AnnualCalendarFilters 
                        values={filters} 
                        onChange={(v) => {
                            setFilters(v)
                            setPage(1)
                        }} 
                        branches={branches} 
                      />
                  </FilterPopover>

                  <div className="flex border rounded-lg p-1 bg-muted/30 ml-2">
                    <Button
                      variant={viewMode === "calendar" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2 gap-1.5"
                      onClick={() => setViewMode("calendar")}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 px-2 gap-1.5"
                      onClick={() => setViewMode("table")}
                    >
                      <List className="h-3.5 w-3.5" />
                    </Button>
                  </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "calendar" ? (
              <AnnualCalendarComponent 
                calendars={calendars}
                onSelectEvent={(cal) => handleViewDetails(cal.id)}
                onSelectSlot={(slot) => {
                  setSelectedCalendar(null)
                  setSelectedRange({
                    start: format(slot.start, "yyyy-MM-dd"),
                    end: format(slot.end, "yyyy-MM-dd")
                  })
                  setIsDialogOpen(true)
                }}
              />
            ) : (
              <>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Entry Details</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">Date Range</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-48 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40" />
                        <p className="mt-2 text-sm text-muted-foreground">Syncing records...</p>
                      </TableCell>
                    </TableRow>
                  ) : calendars.length === 0 ? (
                    <TableRow className="h-48 text-center text-muted-foreground">
                      <TableCell colSpan={4}>
                        <Calendar className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-lg font-medium">No entries found</p>
                        <p className="text-xs">Try adjusting your filters or search term.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    calendars.map((cal) => (
                      <TableRow 
                        key={cal.id} 
                        className="group hover:bg-muted/30 transition-colors border-l-4"
                        style={{ borderLeftColor: getEventColor(cal.type) }}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm leading-tight text-foreground/90 group-hover:text-primary transition-colors hover:cursor-pointer" onClick={() => handleViewDetails(cal.id)}>
                              {cal.name}
                            </span>
                            {cal.nameBangla && (
                                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-tight mt-0.5">
                                    {cal.nameBangla}
                                </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <Badge variant="outline" className={cn(
                                "capitalize text-[10px] h-5",
                                cal.type === 'holiday' ? "text-rose-600 border-rose-200 bg-rose-50" :
                                cal.type === 'vacation' ? "text-blue-600 border-blue-200 bg-blue-50" :
                                "text-emerald-600 border-emerald-200 bg-emerald-50"
                            )}>
                                {cal.type}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium text-xs text-muted-foreground bg-muted/5">
                            <div className="flex flex-col items-center justify-center gap-0.5">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3 text-primary/50" />
                                    {format(new Date(cal.startDate), "dd MMM yyyy")} - {format(new Date(cal.endDate), "dd MMM yyyy")}
                                </div>
                                <span className="text-[10px] font-bold text-primary/70">{cal.dayCount} {cal.dayCount === 1 ? 'Day' : 'Days'}</span>
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
                              <DropdownMenuItem onClick={() => handleViewDetails(cal.id)} className="cursor-pointer rounded-md">
                                <span className="mr-2 h-4 w-4 flex items-center justify-center opacity-70">👁️</span>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(cal)} className="cursor-pointer rounded-md">
                                <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                                Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(cal.id)}
                                className="text-destructive focus:text-destructive cursor-pointer rounded-md"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Entry
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
            </>
          )}
        </CardContent>
      </Card>

        <AnnualCalendarDetailsDialog
          id={selectedCalendarId}
          open={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          branches={branches}
        />

        <AnnualCalendarDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setSelectedRange(null)
          } }
          calendar={selectedCalendar}
          branches={branches}
          initialStartDate={selectedRange?.start}
          initialEndDate={selectedRange?.end}
        />

        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">Delete Entry?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently remove the <strong>{calendars.find(h => h.id === deleteId)?.name}</strong> from the calendar. This action cannot be reversed.
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
