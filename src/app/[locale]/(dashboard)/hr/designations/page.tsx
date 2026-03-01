"use client"

import { DesignationDialog } from "@/components/hr/designation-dialog"
import { DesignationFilters, DesignationFilterValues } from "@/components/hr/hr-filters"
import { FilterPopover } from "@/components/shared/filter-popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useDeleteDesignation, useDepartments, useDesignations } from "@/hooks/hr-queries"
import { useBranches } from "@/hooks/pharmacy-queries"
import { useStoreContext } from "@/store/use-store-context"
import { Designation } from "@/types/hr"
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function DesignationsPage() {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState<DesignationFilterValues>({})
    const [designationDialogOpen, setDesignationDialogOpen] = useState(false)
    const [selectedDesignation, setSelectedDesignation] = useState<Designation | null>(null)
    const { activeStoreId } = useStoreContext()

    const activeFilterCount = Object.values(filters).filter(v => !!v).length

    const resetFilters = () => {
        setFilters({})
        setSearch("")
        setPage(1)
    }

    const { data: designationsRes, isLoading, refetch } = useDesignations({ 
        page, 
        limit: 10, 
        search, 
        branchId: activeStoreId || undefined,
        ...filters
    })
    
    const { data: branchesRes } = useBranches()
    const { data: departmentsRes } = useDepartments({ 
        branchId: activeStoreId || undefined,
        limit: 100 
    })
    const deleteMutation = useDeleteDesignation()

    const designations = designationsRes?.data || []
    const branches = branchesRes?.data || []
    const departments = departmentsRes?.data || []

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this designation?")) {
            try {
                await deleteMutation.mutateAsync(id)
                toast.success("Designation deleted successfully")
            } catch (error) {
                toast.error("Failed to delete designation")
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Designations</h1>
                    <p className="text-muted-foreground">Manage job roles within departments.</p>
                </div>
                <Button onClick={() => {
                    setSelectedDesignation(null)
                    setDesignationDialogOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Designation
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                           <h3 className="font-semibold text-lg">Designation List</h3>
                           <p className="text-sm text-muted-foreground">Detailed list of all job roles.</p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search designations..."
                                    className="pl-8 h-9"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value)
                                        setPage(1)
                                    }}
                                />
                            </div>
                            <FilterPopover 
                                activeFilterCount={activeFilterCount}
                                onReset={resetFilters}
                            >
                                <DesignationFilters 
                                    values={filters}
                                    onChange={(v) => {
                                        setFilters(v)
                                        setPage(1)
                                    }}
                                    departments={departments}
                                />
                            </FilterPopover>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Designation</TableHead>
                                <TableHead>Bangla Name</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : designations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No designations found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                designations.map((desg) => (
                                    <TableRow key={desg.id}>
                                        <TableCell className="font-medium">{desg.name}</TableCell>
                                        <TableCell>{desg.nameBangla || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {desg.department?.name || desg.departmentId}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {branches.find(b => b.id === desg.branchId)?.name || desg.branchId}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedDesignation(desg)
                                                        setDesignationDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(desg.id)}
                                                    disabled={deleteMutation.isPending}
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
                </CardContent>
            </Card>

            <DesignationDialog 
                open={designationDialogOpen}
                onOpenChange={setDesignationDialogOpen}
                designation={selectedDesignation}
                onSuccess={refetch}
            />
        </div>
    )
}
