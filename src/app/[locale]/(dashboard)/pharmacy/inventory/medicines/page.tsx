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
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useDeleteMedicine, useManufacturers, useMedicines, usePharmacyEntities } from "@/hooks/pharmacy-queries"
import { useCurrency } from "@/hooks/use-currency"
import { usePermissions } from "@/hooks/use-permissions"
import { Link } from "@/i18n/navigation"
import { Medicine } from "@/types/pharmacy"
import {
    ArrowLeft,
    Edit,
    Eye,
    Filter,
    Loader2,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Upload
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useDebounce } from "use-debounce"
import { ImportMedicinesDialog } from "./components/import-medicines-dialog"
import { MedicineDetailsDialog } from "./components/medicine-details-dialog"
import { MedicineDialog } from "./components/medicine-dialog"

export default function MedicinesPage() {
  const { hasPermission } = usePermissions()
  const { formatCurrency } = useCurrency()
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 500)
  const [page, setPage] = useState(1)
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null)
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  // Delete State
  const [deletingMedicine, setDeletingMedicine] = useState<Medicine | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedMedicineForStock, setSelectedMedicineForStock] = useState<Medicine | null>(null)

  // Filter State
  const [filterName, setFilterName] = useState("")
  const [filterGeneric, setFilterGeneric] = useState("")
  const [filterBarcode, setFilterBarcode] = useState("")
  const [filterCategoryId, setFilterCategoryId] = useState("all")
  const [filterBrandId, setFilterBrandId] = useState("all")
  const [filterGroupId, setFilterGroupId] = useState("all")
  const [filterManufacturerId, setFilterManufacturerId] = useState("all")
  const [filterDosageForm, setFilterDosageForm] = useState("")
  const [filterStrength, setFilterStrength] = useState("")
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)

  const queryParams = {
    page,
    limit: 10,
    search: debouncedSearch,
    name: filterName || undefined,
    genericName: filterGeneric || undefined,
    barcode: filterBarcode || undefined,
    categoryId: filterCategoryId === 'all' ? undefined : filterCategoryId,
    brandId: filterBrandId === 'all' ? undefined : filterBrandId,
    groupId: filterGroupId === 'all' ? undefined : filterGroupId,
    medicineManufacturerId: filterManufacturerId === 'all' ? undefined : filterManufacturerId,
    dosageForm: filterDosageForm || undefined,
    strength: filterStrength || undefined,
    isActive: filterActive
  }

  // Data Fetching Hooks
  const { data: medicinesRes, isLoading: loading } = useMedicines(queryParams)
  const medicines = medicinesRes?.data || []
  const meta = medicinesRes?.meta || null

  const { data: categoriesRes } = usePharmacyEntities('categories')
  const categories = categoriesRes?.data || []

  const { data: brandsRes } = usePharmacyEntities('brands')
  const brands = brandsRes?.data || []

  const { data: groupsRes } = usePharmacyEntities('groups')
  const groups = groupsRes?.data || []

  const { data: manufacturersRes } = useManufacturers()
  const manufacturers = manufacturersRes?.data || []

  const deleteMutation = useDeleteMedicine()

  const resetFilters = () => {
    setFilterName("")
    setFilterGeneric("")
    setFilterBarcode("")
    setFilterCategoryId("all")
    setFilterBrandId("all")
    setFilterGroupId("all")
    setFilterManufacturerId("all")
    setFilterDosageForm("")
    setFilterStrength("")
    setFilterActive(undefined)
    setSearch("")
    setPage(1)
  }

  // ... existing handlers ...
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
      await deleteMutation.mutateAsync(deletingMedicine.id)
      toast.success("Medicine deleted successfully")
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
            <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Medicine List</h1>
                {meta?.totalItems !== undefined && (
                    <Badge variant="outline" className="text-base px-2 py-0.5 border-primary/20 bg-primary/5 text-primary">
                        {meta.totalItems}
                    </Badge>
                )}
            </div>
            <p className="text-muted-foreground">Manage medicine definitions and configurations.</p>
          </div>
        </div>

        {hasPermission('medicine:create') && (
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" /> Import
                </Button>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Add Medicine
                </Button>
            </div>
        )}
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
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-60">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Quick search..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[800px] p-4" align="end">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium leading-none">Filter Medicines</h4>
                            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-auto p-0 text-muted-foreground hover:text-primary">
                                Reset Filters
                            </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="filName">Medicine Name</Label>
                                <Input id="filName" value={filterName} onChange={e => setFilterName(e.target.value)} placeholder="Filter by name" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filGeneric">Generic Name</Label>
                                <Input id="filGeneric" value={filterGeneric} onChange={e => setFilterGeneric(e.target.value)} placeholder="Filter by generic" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filBarcode">Barcode</Label>
                                <Input id="filBarcode" value={filterBarcode} onChange={e => setFilterBarcode(e.target.value)} placeholder="Filter by barcode" />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Brand</Label>
                                <Select value={filterBrandId} onValueChange={setFilterBrandId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Brands" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Brands</SelectItem>
                                        {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Group</Label>
                                <Select value={filterGroupId} onValueChange={setFilterGroupId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Groups" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Groups</SelectItem>
                                        {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="filDosage">Dosage Form</Label>
                                <Input id="filDosage" value={filterDosageForm} onChange={e => setFilterDosageForm(e.target.value)} placeholder="e.g. Tablet" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filStrength">Strength</Label>
                                <Input id="filStrength" value={filterStrength} onChange={e => setFilterStrength(e.target.value)} placeholder="e.g. 500mg" />
                            </div>
                             <div className="space-y-2">
                                <Label>Manufacturer</Label>
                                <Select value={filterManufacturerId} onValueChange={setFilterManufacturerId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Manufacturers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Manufacturers</SelectItem>
                                        {manufacturers.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Medicine Info</TableHead>
                  <TableHead className="font-semibold">Generic Name</TableHead>
                  <TableHead className="font-semibold">Strength</TableHead>
                  <TableHead className="font-semibold">Dosage Form</TableHead>
                  <TableHead className="font-semibold">Manufacturer</TableHead>
                  <TableHead className="font-semibold text-center">Price (Sale)</TableHead>
                  <TableHead className="font-semibold text-center">Stock</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span>Fetching medicines...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : medicines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      No medicines found matching filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  medicines.map((medicine) => (
                    <TableRow key={medicine.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-primary">{medicine.name}</span>
                          {medicine.barcode && (
                             <Badge variant="outline" className="w-fit text-[10px] h-4 px-1 mt-1 font-mono">
                                {medicine.barcode}
                             </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                         <span className="text-xs text-muted-foreground font-medium">{medicine.genericName || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium">{medicine.strength || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium">{medicine.dosageForm || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium">{medicine.medicineManufacturer?.name || 'N/A'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col">
                           <span className="font-bold text-emerald-600">{formatCurrency(medicine.salePrice)}</span>
                           <span className="text-[10px] text-muted-foreground line-through">MRP: {formatCurrency(medicine.mrp)}</span>
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
                              {hasPermission('medicine:update') && (
                                <>
                                    <DropdownMenuItem onClick={() => handleEdit(medicine)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedMedicineForStock(medicine)}>
                                        <RefreshCw className="mr-2 h-4 w-4" /> Manage Stock / Batches
                                    </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              {hasPermission('medicine:delete') && (
                                <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDeleteClick(medicine)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Medicine
                                </DropdownMenuItem>
                              )}
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
        medicineToEdit={editingMedicine}
      />

      <ImportMedicinesDialog 
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen} 
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
