"use client"

import { EmployeeDetailsDialog } from "@/components/hr/employee-details-dialog"
import { EmployeeDialog } from "@/components/hr/employee-dialog"
import { EmployeeFilters, EmployeeFilterValues } from "@/components/hr/hr-filters"
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
import { useDeleteEmployee, useDepartments, useDesignations, useEmployees } from "@/hooks/hr-queries"
import { useBranches } from "@/hooks/pharmacy-queries"
import { cn } from "@/lib/utils"
import { useStoreContext } from "@/store/use-store-context"
import { Employee } from "@/types/hr"
import { Briefcase, Edit, Eye, Loader2, MapPin, Phone, Plus, Search, Trash2, User } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function EmployeesPage() {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [filters, setFilters] = useState<EmployeeFilterValues>({})
    
    const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const { activeStoreId } = useStoreContext()

    const activeFilterCount = Object.values(filters).filter(v => !!v).length

    const resetFilters = () => {
        setFilters({})
        setSearch("")
        setPage(1)
    }

    const { data: employeesRes, isLoading, refetch } = useEmployees({ 
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
    const { data: designationsRes } = useDesignations({ 
        branchId: activeStoreId || undefined,
        departmentId: filters.departmentId, 
        limit: 100 
    })
    const deleteMutation = useDeleteEmployee()

    const employees = employeesRes?.data || []
    const branches = branchesRes?.data || []
    const departments = departmentsRes?.data || []
    const designations = designationsRes?.data || []

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this employee record?")) {
            try {
                await deleteMutation.mutateAsync(id)
                toast.success("Employee deleted successfully")
            } catch (error) {
                toast.error("Failed to delete employee")
            }
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            active: "bg-emerald-50 text-emerald-700 border-emerald-200",
            inactive: "bg-gray-50 text-gray-700 border-gray-200",
            on_leave: "bg-amber-50 text-amber-700 border-amber-200",
            terminated: "bg-destructive/10 text-destructive border-destructive/20"
        }
        return (
            <Badge variant="outline" className={cn("capitalize font-semibold", variants[status] || "")}>
                {status.replace('_', ' ')}
            </Badge>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
                    <p className="text-muted-foreground">Manage hospital staff and medical professionals.</p>
                </div>
                <Button onClick={() => {
                    setSelectedEmployee(null)
                    setEmployeeDialogOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Employee
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                           <h3 className="font-semibold text-lg">Employee List</h3>
                           <p className="text-sm text-muted-foreground">Detailed list of all hospital staff.</p>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, phone, email..."
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
                                <EmployeeFilters 
                                    values={filters}
                                    onChange={(v) => {
                                        setFilters(v)
                                        setPage(1)
                                    }}
                                    departments={departments}
                                    designations={designations}
                                />
                            </FilterPopover>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Status</TableHead>
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
                            ) : employees.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No employees found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.map((emp) => (
                                    <TableRow key={emp.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="font-semibold text-sm leading-tight">{emp.name}</div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[9px] bg-secondary px-1.5 py-0.5 rounded font-mono text-muted-foreground uppercase border shrink-0">
                                                            {emp.employeeNumber || 'NO ID'}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter truncate opacity-70">
                                                            {emp.employeeType}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                    {emp.phone}
                                                </div>
                                                <div className="flex items-center gap-1.5 truncate max-w-[150px]" title={emp.address}>
                                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                                    {emp.address}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-xs">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <Briefcase className="h-3 w-3 text-muted-foreground" />
                                                    {emp.designation?.name || '-'}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    {emp.department?.name || '-'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(emp.status)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        setSelectedEmployee(emp)
                                                        setDetailsDialogOpen(true)
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => {
                                                        setSelectedEmployee(emp)
                                                        setEmployeeDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(emp.id)}
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

            <EmployeeDialog 
                open={employeeDialogOpen}
                onOpenChange={setEmployeeDialogOpen}
                employee={selectedEmployee}
                onSuccess={refetch}
            />

            <EmployeeDetailsDialog 
                open={detailsDialogOpen}
                onOpenChange={setDetailsDialogOpen}
                employeeId={selectedEmployee?.id || null}
            />
        </div>
    )
}
