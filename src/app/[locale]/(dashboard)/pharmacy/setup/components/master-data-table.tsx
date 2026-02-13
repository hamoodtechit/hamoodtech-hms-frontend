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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import { pharmacyService } from "@/services/pharmacy-service"
import { PharmacyEntity, PharmacyEntityType, PharmacyMeta } from "@/types/pharmacy"
import { ChevronLeft, ChevronRight, Edit, Loader2, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { MasterDataDialog } from "./master-data-dialog"

interface MasterDataTableProps {
  type: PharmacyEntityType
  title: string
}

export function MasterDataTable({ type, title }: MasterDataTableProps) {
  const [entities, setEntities] = useState<PharmacyEntity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PharmacyMeta | null>(null)
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntity, setEditingEntity] = useState<PharmacyEntity | null>(null)
  const [deletingEntity, setDeletingEntity] = useState<PharmacyEntity | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const loadEntities = async () => {
    try {
      setLoading(true)
      const response = await pharmacyService.getEntities(type, { 
        page, 
        limit: 10, 
        search 
      })
      setEntities(response.data)
      setMeta(response.meta)
    } catch (error) {
      toast.error(`Failed to load ${title.toLowerCase()}s`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
        loadEntities()
    }, 500)
    return () => clearTimeout(timer)
  }, [type, page, search])

  const handleCreate = () => {
    setEditingEntity(null)
    setDialogOpen(true)
  }

  const handleEdit = (entity: PharmacyEntity) => {
    setEditingEntity(entity)
    setDialogOpen(true)
  }

  const handleDeleteClick = (entity: PharmacyEntity) => {
    setDeletingEntity(entity)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingEntity) return
    try {
      await pharmacyService.deleteEntity(type, deletingEntity.id)
      toast.success(`${title} deleted successfully`)
      loadEntities()
    } catch (error) {
      toast.error(`Failed to delete ${title.toLowerCase()}`)
    } finally {
      setDeleteConfirmOpen(false)
      setDeletingEntity(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${title.toLowerCase()}s...`}
            className="pl-9"
            value={search}
            onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
            }}
          />
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add {title}
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name (English)</TableHead>
              <TableHead>Name (Bangla)</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                   <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading...
                   </div>
                </TableCell>
              </TableRow>
            ) : entities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No {title.toLowerCase()}s found.
                </TableCell>
              </TableRow>
            ) : (
              entities.map((entity) => (
                <TableRow key={entity.id}>
                  <TableCell className="font-medium">{entity.name}</TableCell>
                  <TableCell>{entity.nameBangla || '-'}</TableCell>
                  <TableCell>{new Date(entity.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(entity)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(entity)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
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

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!meta.hasPreviousPage}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <div className="text-sm font-medium">
            Page {meta.page} of {meta.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
            disabled={!meta.hasNextPage}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <MasterDataDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadEntities}
        entityToEdit={editingEntity}
        type={type}
        title={title}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {title.toLowerCase()} <strong>{deletingEntity?.name}</strong>.
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
