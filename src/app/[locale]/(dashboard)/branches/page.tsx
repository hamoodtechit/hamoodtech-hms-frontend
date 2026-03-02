"use client"

import { BranchDialog } from "@/components/layout/branch-dialog"
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
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useBranches, useDeleteBranch } from "@/hooks/pharmacy-queries"
import { useDebounce } from "@/hooks/use-debounce"
import { Branch } from "@/types/pharmacy"
import { Building2, Edit, Loader2, MapPin, Phone, Plus, Search, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function BranchesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 500)
  
  const { data: branchesRes, isLoading: loading, refetch } = useBranches({
    page,
    limit: 10,
    search: debouncedSearch
  })
  
  const branches = branchesRes?.data || []
  const pagination = branchesRes?.meta

  const [branchDialogOpen, setBranchDialogOpen] = useState(false)
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null)
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const deleteMutation = useDeleteBranch()

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const handleEdit = (branch: Branch) => {
    setBranchToEdit(branch)
    setBranchDialogOpen(true)
  }

  const handleDeleteClick = (branch: Branch) => {
    setBranchToDelete(branch)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!branchToDelete) return
    try {
      await deleteMutation.mutateAsync(branchToDelete.id)
      toast.success("Branch deleted successfully")
    } catch (error) {
      toast.error("Failed to delete branch")
    } finally {
      setDeleteConfirmOpen(false)
      setBranchToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branch Management</h1>
          <p className="text-muted-foreground">Manage your hospital units and departments across different locations.</p>
        </div>
        <Button onClick={() => { setBranchToEdit(null); setBranchDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add New Branch
        </Button>
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md">
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>All Branches</CardTitle>
            </div>
            <div className="relative w-full sm:w-64 lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search branches..." 
                    className="pl-9 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
          </div>
          <CardDescription>A list of all active hospital branches and their contact details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border bg-card overflow-hidden">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Branch Name</TableHead>
                    <TableHead>Contact & Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                                <p>Loading branch data...</p>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : branches.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                            No branches found matching your search.
                        </TableCell>
                    </TableRow>
                ) : (
                    branches.map((branch) => (
                    <TableRow key={branch.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                {branch.logoUrl ? (
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={branch.logoUrl} alt={branch.name} className="h-full w-full object-contain p-1" />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <Building2 className="h-5 w-5 text-primary" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-bold text-sm">{branch.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-mono">{branch.id}</p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {branch.address || "No address provided"}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Phone className="h-3.5 w-3.5" />
                                    {branch.phone || "No contact info"}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[10px] font-bold uppercase py-0.5">
                                Active
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(branch)}>
                                    <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/5" onClick={() => handleDeleteClick(branch)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between py-4 px-1">
                    <p className="text-[11px] text-muted-foreground">
                        Showing {(pagination.page - 1) * pagination.pageSize + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} of {pagination.totalItems} branches
                    </p>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={pagination.page <= 1}
                        >
                            Previous
                        </Button>
                        <div className="text-[11px] font-medium px-4">
                            Page {pagination.page} of {pagination.totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </CardContent>
      </Card>

      <BranchDialog 
        open={branchDialogOpen}
        onOpenChange={setBranchDialogOpen}
        onSuccess={() => refetch()}
        branchToEdit={branchToEdit}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the branch <strong>{branchToDelete?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
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
