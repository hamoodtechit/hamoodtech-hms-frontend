"use client"

import { DepartmentDialog } from "@/components/hr/department-dialog"
import { DepartmentFilters, DepartmentFilterValues } from "@/components/hr/hr-filters"
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
import { usePermissions } from "@/hooks/use-permissions"
import { useDeleteDepartment, useDepartments } from "@/hooks/hr-queries"
import { useBranches } from "@/hooks/pharmacy-queries"
import { useStoreContext } from "@/store/use-store-context"
import { Department } from "@/types/hr"
import { Edit, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function DepartmentsPage() {
    const { hasPermission } = usePermissions()
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState<DepartmentFilterValues>({})
    const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false)
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
    const { activeStoreId } = useStoreContext()

    const activeFilterCount = Object.values(filters).filter(v => !!v).length

    const resetFilters = () => {
        setFilters({})
        setSearch("")
        setPage(1)
    }

    const { data: departmentsRes, isLoading, refetch } = useDepartments({ 
        page, 
        limit: 10, 
        search, 
        branchId: activeStoreId || undefined,
        ...filters 
    })
    const { data: branchesRes } = useBranches()
    const deleteMutation = useDeleteDepartment()

    const departments = departmentsRes?.data || []
    const branches = branchesRes?.data || []

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this department?")) {
            try {
                await deleteMutation.mutateAsync(id)
                toast.success("Department deleted successfully")
            } catch (error) {
                toast.error("Failed to delete department")
            }
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
                    <p className="text-muted-foreground">Manage departments across branches.</p>
                </div>
                {hasPermission('department:create') && (
                <Button onClick={() => {
                    setSelectedDepartment(null)
                    setDepartmentDialogOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Department
                </Button>
                )}
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                           <h3 className="font-semibold text-lg">Department List</h3>
                           <p className="text-sm text-muted-foreground">Detailed list of all departments.</p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search departments..."
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
                                <DepartmentFilters 
                                    values={filters}
                                    onChange={(v) => {
                                        setFilters(v)
                                        setPage(1)
                                    }}
                                />
                            </FilterPopover>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Bangla Name</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Description</TableHead>
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
                            ) : departments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No departments found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                departments.map((dept) => (
                                    <TableRow key={dept.id}>
                                        <TableCell className="font-medium">{dept.name}</TableCell>
                                        <TableCell>{dept.nameBangla || '-'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {branches.find(b => b.id === dept.branchId)?.name || dept.branchId}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={dept.description}>
                                            {dept.description || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {hasPermission('department:update') && (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedDepartment(dept)
                                                        setDepartmentDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                )}
                                                {hasPermission('department:delete') && (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(dept.id)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <DepartmentDialog 
                open={departmentDialogOpen}
                onOpenChange={setDepartmentDialogOpen}
                department={selectedDepartment}
                onSuccess={() => refetch()}
            />
        </div>
    )
}
