"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { usePatients } from "@/hooks/pharmacy-queries"
import { usePermissions } from "@/hooks/use-permissions"
import { Edit, Eye, MoreHorizontal, RefreshCcw, Search, Trash2, UserPlus } from "lucide-react"
import { useState } from "react"
import { useDebounce } from "use-debounce"

export function PatientTable() {
    const { hasPermission } = usePermissions()
    const [search, setSearch] = useState("")
    const [debouncedSearch] = useDebounce(search, 500)
    const [page, setPage] = useState(1)

    const { data: response, isLoading, isFetching } = usePatients({
        page,
        limit: 10,
        search: debouncedSearch,
    })

    const patients = response?.data || []
    const meta = response?.meta

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search patients by name or phone..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            setPage(1)
                        }}
                    />
                    {isFetching && !isLoading && (
                        <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[10px] text-muted-foreground animate-in fade-in duration-300">
                             <RefreshCcw className="h-3 w-3 animate-spin" />
                             <span>Syncing...</span>
                        </div>
                    )}
                </div>

                {hasPermission('patient:create') && (
                    <Button className="gap-2">
                        <UserPlus className="h-4 w-4" /> Add Patient
                    </Button>
                )}
            </div>

            <div className="rounded-md border bg-card overflow-x-auto">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Patient Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Age / Gender</TableHead>
                            <TableHead>Visit Type</TableHead>
                            <TableHead>Last Visit</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-[60px] rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : patients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No patients found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            patients.map((patient: any) => (
                                <TableRow key={patient.id} className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{patient.name}</span>
                                            {patient.nameBangla && (
                                                <span className="text-[10px] text-muted-foreground">{patient.nameBangla}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{patient.phone}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span>{patient.age} Years</span>
                                            <span className="text-xs text-muted-foreground capitalize">{patient.gender}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">
                                            {patient.visitType || 'N/A'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">
                                            {new Date(patient.createdAt).toLocaleDateString()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>
                                                    <Eye className="mr-2 h-4 w-4" /> View History
                                                </DropdownMenuItem>
                                                {hasPermission('patient:update') && (
                                                    <DropdownMenuItem>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Details
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                {hasPermission('patient:delete') && (
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Record
                                                    </DropdownMenuItem>
                                                )}
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
                <div className="flex items-center justify-between py-2">
                    <p className="text-xs text-muted-foreground">
                        Showing {(meta.page - 1) * meta.pageSize + 1} to {Math.min(meta.page * meta.pageSize, meta.totalItems)} of {meta.totalItems} records
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
        </div>
    )
}
