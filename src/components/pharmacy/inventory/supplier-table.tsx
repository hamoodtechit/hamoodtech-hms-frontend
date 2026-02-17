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
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useDeleteSupplier, useSuppliers } from "@/hooks/pharmacy-queries"
import { Supplier } from "@/types/pharmacy"
import { Edit, Plus, Search, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { SupplierDialog } from "./supplier-dialog"

export function SupplierTable() {
    const [search, setSearch] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const { data: suppliersRes, isLoading: loading } = useSuppliers({ search, limit: 100 })
    const suppliers = suppliersRes?.data || []
    
    const deleteMutation = useDeleteSupplier()

    const handleEdit = (supplier: Supplier) => {
        setSupplierToEdit(supplier)
        setDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await deleteMutation.mutateAsync(deleteId)
            toast.success("Supplier deleted successfully")
        } catch (error) {
            toast.error("Failed to delete supplier")
        } finally {
            setDeleteId(null)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search suppliers..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={() => {
                    setSupplierToEdit(null)
                    setDialogOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Supplier
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">
                                    <div className="flex items-center justify-center">
                                        <Plus className="h-6 w-6 animate-spin text-primary" />
                                        <span className="ml-2">Loading suppliers...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : !suppliers || suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No suppliers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell>
                                        <div className="font-medium">{supplier.name}</div>
                                        {supplier.nameBangla && (
                                            <div className="text-xs text-muted-foreground">{supplier.nameBangla}</div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{supplier.phone}</div>
                                        <div className="text-xs text-muted-foreground">{supplier.email}</div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-sm">
                                        {supplier.address}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => handleEdit(supplier)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeleteId(supplier.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <SupplierDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                supplierToEdit={supplierToEdit}
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the supplier
                            from your records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
