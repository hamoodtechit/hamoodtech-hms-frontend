"use client"

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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { useAmbulanceBookings, useDeleteAmbulanceBooking } from "@/hooks/ambulance-booking-queries"
import { useDebounce } from "@/hooks/use-debounce"
import { usePermissions } from "@/hooks/use-permissions"
import { useStoreContext } from "@/store/use-store-context"
import { AmbulanceBooking } from "@/types/ambulance"
import { Calendar, ChevronLeft, ChevronRight, Plus, Search, Truck, Filter } from "lucide-react"
import { useState } from "react"
import { BookingDialog } from "./components/booking-dialog"
import { BookingTable } from "./components/booking-table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function AmbulanceBookingsPage() {
    const { hasPermission } = usePermissions()
    const { activeStoreId } = useStoreContext()
    
    // State
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch] = useDebounce(searchTerm, 500)
    const [statusFilter, setStatusFilter] = useState<string>("all")
    
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingBooking, setEditingBooking] = useState<AmbulanceBooking | null>(null)
    const [deletingBooking, setDeletingBooking] = useState<AmbulanceBooking | null>(null)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

    // Queries
    const { data: bookingRes, isLoading } = useAmbulanceBookings({
        page,
        limit,
        search: debouncedSearch,
        branchId: activeStoreId || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
    })

    const bookings = Array.isArray(bookingRes?.data) ? bookingRes.data : []
    const pagination = bookingRes?.meta

    // Actions
    const deleteMutation = useDeleteAmbulanceBooking()

    const handleCreate = () => {
        setEditingBooking(null)
        setDialogOpen(true)
    }

    const handleEdit = (booking: AmbulanceBooking) => {
        setEditingBooking(booking)
        setDialogOpen(true)
    }

    const handleDeleteClick = (booking: AmbulanceBooking) => {
        setDeletingBooking(booking)
        setDeleteConfirmOpen(true)
    }

    const confirmDelete = async () => {
        if (!deletingBooking) return
        await deleteMutation.mutateAsync(deletingBooking.id)
        setDeleteConfirmOpen(false)
        setDeletingBooking(null)
    }

    return (
        <PermissionGuard permission="ambulance-booking:read">
            <div className="space-y-8 p-8 max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <Calendar className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight uppercase">Booking Directory</h1>
                        </div>
                        <p className="text-muted-foreground font-medium max-w-lg">Track real-time transport logs, manage patient dispatches, and coordinate emergency fleet response.</p>
                    </div>
                    {hasPermission('ambulance-booking:create') && (
                        <Button 
                            onClick={handleCreate} 
                            className="h-12 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl shadow-zinc-500/10 transition-all active:scale-95 group"
                        >
                            <Plus className="mr-2 h-5 w-5 transition-transform group-hover:rotate-90" /> 
                            <span className="font-bold tracking-tight">Record Transport Request</span>
                        </Button>
                    )}
                </div>

                {/* Filters & Content */}
                <Card className="border-none shadow-2xl shadow-zinc-200/50 dark:shadow-none bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Search */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70 ml-1">Universal Search</label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    <Input
                                        placeholder="Patient name, guardian, or phone..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value)
                                            setPage(1)
                                        }}
                                        className="h-12 pl-11 pr-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200/50 focus-visible:ring-primary shadow-sm"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70 ml-1 flex items-center gap-1.5">
                                    <Filter className="h-3 w-3" /> Status Categorization
                                </label>
                                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
                                    <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border-zinc-200/50 shadow-sm font-bold">
                                        <SelectValue placeholder="Show all statuses" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-2xl border-none">
                                        <SelectItem value="all">All Request Statuses</SelectItem>
                                        <SelectItem value="pending">Pending Requests</SelectItem>
                                        <SelectItem value="confirmed">Dispatched/Confirmed</SelectItem>
                                        <SelectItem value="completed">Completed Trips</SelectItem>
                                        <SelectItem value="cancelled">Cancelled/Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Info Card */}
                            <div className="hidden lg:flex items-center gap-4 p-4 rounded-3xl bg-primary/5 border border-primary/10">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Truck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-70">Total Records</p>
                                    <p className="text-lg font-black tracking-tight">{pagination?.totalItems || 0} Bookings Found</p>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-8 pt-4">
                        <BookingTable 
                            bookings={bookings} 
                            loading={isLoading} 
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                        />

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-8 py-6 border-t border-zinc-200/50">
                                <p className="text-xs text-muted-foreground font-medium">
                                    Displaying <span className="text-foreground font-bold">{bookings.length}</span> entries per page • 
                                    Page <span className="text-foreground font-bold">{page}</span> of {pagination.totalPages}
                                </p>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1 || isLoading}
                                        className="h-10 w-10 rounded-xl"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                    
                                    <div className="flex items-center gap-2">
                                        {Array.from({ length: Math.min(5, (pagination?.totalPages || 0)) }).map((_, i) => {
                                            const pageNum = i + 1;
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={page === pageNum ? "default" : "ghost"}
                                                    size="sm"
                                                    onClick={() => setPage(pageNum)}
                                                    className="h-10 w-10 rounded-xl font-bold"
                                                    disabled={isLoading}
                                                >
                                                    {pageNum}
                                                </Button>
                                            )
                                        })}
                                        {pagination.totalPages > 5 && <span className="px-2 text-muted-foreground font-black">...</span>}
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                        disabled={page === pagination.totalPages || isLoading}
                                        className="h-10 w-10 rounded-xl"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dialogs */}
                <BookingDialog 
                    open={dialogOpen} 
                    onOpenChange={setDialogOpen} 
                    bookingToEdit={editingBooking}
                />

                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl sm:max-w-[450px] p-8">
                        <AlertDialogHeader className="space-y-4">
                            <div className="h-16 w-16 rounded-3xl bg-destructive/10 flex items-center justify-center mb-2 mx-auto">
                                <Truck className="h-8 w-8 text-destructive" />
                            </div>
                            <div className="text-center">
                                <AlertDialogTitle className="text-2xl font-black tracking-tight uppercase">Void Dispatch Request?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm font-medium text-zinc-500 mt-2">
                                    Are you sure you want to cancel the booking for <strong className="text-foreground">{deletingBooking?.patientName}</strong>? 
                                    This action will release the assigned vehicle and cannot be undone.
                                </AlertDialogDescription>
                            </div>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-8 flex-col-reverse sm:flex-row gap-3">
                            <AlertDialogCancel className="h-12 w-full rounded-2xl font-bold border-none bg-zinc-100 hover:bg-zinc-200 transition-all">Keep Booking</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={confirmDelete}
                                className="h-12 w-full rounded-2xl bg-destructive hover:bg-destructive/90 text-white font-bold transition-all shadow-lg shadow-destructive/20"
                            >
                                {deleteMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Proceed to Cancel"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PermissionGuard>
    )
}

function Loader2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
