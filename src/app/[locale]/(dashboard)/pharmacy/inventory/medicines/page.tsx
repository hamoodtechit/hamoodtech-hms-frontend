"use client"

import { BatchList } from "@/components/pharmacy/inventory/batch-list"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Link } from "@/i18n/navigation"
import { pharmacyService } from "@/services/pharmacy-service"
import { Medicine, PharmacyMeta } from "@/types/pharmacy"
import {
    ArrowLeft,
    Edit,
    Eye,
    Loader2,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Search,
    Trash2
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { MedicineDetailsDialog } from "./components/medicine-details-dialog"
import { MedicineDialog } from "./components/medicine-dialog"

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PharmacyMeta | null>(null)
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null)
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  // Delete State
  const [deletingMedicine, setDeletingMedicine] = useState<Medicine | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedMedicineForStock, setSelectedMedicineForStock] = useState<Medicine | null>(null)

  const loadMedicines = async () => {
    try {
      setLoading(true)
      const response = await pharmacyService.getMedicines({ 
        page, 
        limit: 10, 
        search 
      })
      setMedicines(response.data)
      setMeta(response.meta)
    } catch (error) {
      toast.error("Failed to load medicines")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMedicines()
    }, 500)
    return () => clearTimeout(timer)
  }, [page, search])

  const handleCreate = () => {
    setEditingMedicine(null)
    setDialogOpen(true)
  }

  const handleEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine)
    setDialogOpen(true)
  }

  const handleViewDetails = (medicine: Medicine) => {
    setSelectedMedicine(medicine)
    setDetailsOpen(true)
  }

  const handleDeleteClick = (medicine: Medicine) => {
    setDeletingMedicine(medicine)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingMedicine) return
    try {
      await pharmacyService.deleteMedicine(deletingMedicine.id)
      toast.success("Medicine deleted successfully")
      loadMedicines()
    } catch (error) {
      toast.error("Failed to delete medicine")
    } finally {
      setDeleteConfirmOpen(false)
      setDeletingMedicine(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/pharmacy/inventory">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Medicine List</h1>
            <p className="text-muted-foreground">Manage medicine definitions and configurations.</p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Medicine
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>All Medicines</CardTitle>
              <CardDescription>
                A list of all registered medicines in the system.
              </CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, generic, or barcode..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Medicine Info</TableHead>
                  <TableHead className="font-semibold">Category/Brand</TableHead>
                  <TableHead className="font-semibold text-center">Price (Sale)</TableHead>
                  <TableHead className="font-semibold text-center">Stock</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span>Fetching medicines...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : medicines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No medicines found.
                    </TableCell>
                  </TableRow>
                ) : (
                  medicines.map((medicine) => (
                    <TableRow key={medicine.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-primary">{medicine.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">{medicine.genericName || 'No Generic'}</span>
                          {medicine.barcode && (
                             <Badge variant="outline" className="w-fit text-[10px] h-4 px-1 mt-1 font-mono">
                                {medicine.barcode}
                             </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary" className="w-fit font-normal text-[10px]">
                            {medicine.category?.name || 'N/A'}
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground">{medicine.brand?.name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col">
                           <span className="font-bold text-emerald-600">${Number(medicine.salePrice).toFixed(2)}</span>
                           <span className="text-[10px] text-muted-foreground line-through">MRP: ${Number(medicine.mrp).toFixed(2)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                           <span className={`text-sm font-bold ${(medicine.stock || medicine.stocks?.reduce((acc, s) => acc + Number(s.quantity), 0) || 0) <= medicine.reorderLevel ? 'text-destructive' : 'text-primary'}`}>
                             {medicine.stock || medicine.stocks?.reduce((acc, s) => acc + Number(s.quantity), 0) || 0}
                           </span>
                           <span className="text-[10px] text-muted-foreground uppercase">{medicine.unit || 'Units'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {medicine.isActive ? (
                          <Badge className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails(medicine)}>
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(medicine)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSelectedMedicineForStock(medicine)}>
                                <RefreshCw className="mr-2 h-4 w-4" /> Manage Stock / Batches
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteClick(medicine)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Medicine
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between py-4">
               <p className="text-sm text-muted-foreground italic">
                  Showing {(meta.page - 1) * meta.pageSize + 1} to {Math.min(meta.page * meta.pageSize, meta.totalItems)} of {meta.totalItems} medicines
               </p>
               <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!meta.hasPreviousPage}
                >
                    Previous
                </Button>
                <div className="text-xs font-medium px-4">
                    Page {meta.page} of {meta.totalPages}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                    disabled={!meta.hasNextPage}
                >
                    Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <MedicineDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={loadMedicines}
        medicineToEdit={editingMedicine}
      />

      <MedicineDetailsDialog 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
        medicine={selectedMedicine}
      />

      <Dialog open={!!selectedMedicineForStock} onOpenChange={(open) => !open && setSelectedMedicineForStock(null)}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Batch Details: {selectedMedicineForStock?.name}</DialogTitle>
            </DialogHeader>
            {selectedMedicineForStock && <BatchList itemId={selectedMedicineForStock.id} initialStocks={selectedMedicineForStock.stocks} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete <strong>{deletingMedicine?.name}</strong>. 
                    This action cannot be undone and will remove all associated stock data.
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
  )
}
