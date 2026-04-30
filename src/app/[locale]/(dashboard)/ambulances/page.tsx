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
import { useAmbulances, useDeleteAmbulance } from "@/hooks/ambulance-queries"
import { useDebounce } from "@/hooks/use-debounce"
import { usePermissions } from "@/hooks/use-permissions"
import { Ambulance } from "@/types/ambulance"
import { ChevronLeft, ChevronRight, Plus, Search, Truck } from "lucide-react"
import { useState } from "react"
import { AmbulanceDialog } from "./components/ambulance-dialog"
import { AmbulanceTable } from "./components/ambulance-table"

export default function AmbulanceDirectoryPage() {
    const { hasPermission } = usePermissions()
    
    // State
    const [page, setPage] = useState(1)
    const [limit] = useState(10)
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch] = useDebounce(searchTerm, 500)
    
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingAmbulance, setEditingAmbulance] = useState<Ambulance | null>(null)
    const [deletingAmbulance, setDeletingAmbulance] = useState<Ambulance | null>(null)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

    // Queries
    const { data: ambulanceRes, isLoading } = useAmbulances({
        page,
        limit,
        search: debouncedSearch,
    })

    const ambulances = Array.isArray(ambulanceRes?.data) 
        ? ambulanceRes.data 
        : ((ambulanceRes?.data as any)?.ambulances || [])
    
    const pagination = ambulanceRes?.meta || (ambulanceRes?.data as any)?.pagination

    // Actions
    const deleteMutation = useDeleteAmbulance()

    const handleCreate = () => {
        setEditingAmbulance(null)
        setDialogOpen(true)
    }

    const handleEdit = (ambulance: Ambulance) => {
        setEditingAmbulance(ambulance)
        setDialogOpen(true)
    }

    const handleDeleteClick = (ambulance: Ambulance) => {
        setDeletingAmbulance(ambulance)
        setDeleteConfirmOpen(true)
    }

    const confirmDelete = async () => {
        if (!deletingAmbulance) return
        await deleteMutation.mutateAsync(deletingAmbulance.id)
        setDeleteConfirmOpen(false)
        setDeletingAmbulance(null)
    }

    return (
        <PermissionGuard permission="ambulance:read">
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Truck className="h-6 w-6 text-primary" />
                            <h1 className="text-3xl font-bold tracking-tight">Ambulance Directory</h1>
                        </div>
                        <p className="text-muted-foreground">Manage hospital emergency vehicles, drivers, and service status.</p>
                    </div>
                    {hasPermission('ambulance:create') && (
                        <Button onClick={handleCreate} className="shadow-md">
                            <Plus className="mr-2 h-4 w-4" /> Add Ambulance
                        </Button>
                    )}
                </div>

                {/* Main Content */}
                <Card className="border-none shadow-sm dark:bg-zinc-900/50">
                    <CardHeader className="pb-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle>Vehicles</CardTitle>
                                <CardDescription>
                                    Search and filter through the emergency transport fleet.
                                </CardDescription>
                            </div>
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by vehicle #, driver, or phone..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value)
                                        setPage(1) // Reset to first page on search
                                    }}
                                    className="pl-9 bg-white dark:bg-zinc-950"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <AmbulanceTable 
                            ambulances={ambulances} 
                            loading={isLoading} 
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                        />

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 py-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Showing <span className="font-medium text-foreground">{ambulances.length}</span> records • 
                                    Page <span className="font-medium text-foreground">{page}</span> of {pagination.totalPages}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1 || isLoading}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: pagination.totalPages }).map((_, i) => {
                                            const pageNum = i + 1;
                                            // Show only current, first, last, and neighbors
                                            if (
                                                pageNum === 1 || 
                                                pageNum === pagination.totalPages || 
                                                (pageNum >= page - 1 && pageNum <= page + 1)
                                            ) {
                                                return (
                                                    <Button
                                                        key={pageNum}
                                                        variant={page === pageNum ? "default" : "ghost"}
                                                        size="sm"
                                                        onClick={() => setPage(pageNum)}
                                                        className="h-8 w-8 p-0"
                                                        disabled={isLoading}
                                                    >
                                                        {pageNum}
                                                    </Button>
                                                )
                                            } else if (
                                                pageNum === page - 2 || 
                                                pageNum === page + 2
                                            ) {
                                                return <span key={pageNum} className="px-1 text-muted-foreground">...</span>
                                            }
                                            return null;
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                        disabled={page === pagination.totalPages || isLoading}
                                        className="h-8 w-8 p-0"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Dialogs */}
                <AmbulanceDialog 
                    open={dialogOpen} 
                    onOpenChange={setDialogOpen} 
                    ambulanceToEdit={editingAmbulance}
                />

                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Ambulance Record?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to remove <strong>{deletingAmbulance?.vehicleNumber}</strong> from the directory? 
                                This operation will permanently delete the record and driver information.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Keep Record</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={confirmDelete}
                                className="bg-destructive text-white hover:bg-destructive/90"
                            >
                                {deleteMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Remove Vehicle"}
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
