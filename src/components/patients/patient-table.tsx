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
import { FilterPopover } from "@/components/shared/filter-popover"
import { PatientFilters } from "./patient-filters"
import { PHARMACY_KEYS, usePatients } from "@/hooks/pharmacy-queries"
import { usePermissions } from "@/hooks/use-permissions"
import { Link } from "@/i18n/navigation"
import { Patient } from "@/types/pharmacy"
import { PatientQueryParams } from "@/types/patient"
import { cn } from "@/lib/utils"
import { useQueryClient } from "@tanstack/react-query"
import {
    CreditCard,
    Edit,
    Eye,
    FileText,
    MoreHorizontal,
    RefreshCcw,
    Search,
    Trash2,
    UserPlus,
    X,
} from "lucide-react"
import { useState } from "react"
import { useDebounce } from "use-debounce"
import { PatientDialog } from "./patient-dialog"
import { PharmacyPaymentDialog } from "@/components/pharmacy/pharmacy-payment-dialog"
import { useCurrency } from "@/hooks/use-currency"

const VISIT_TYPE_COLORS: Record<string, string> = {
    opd: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
    ipd: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
    emergency: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
}

interface PatientTableProps {
    visitType?: 'ipd' | 'opd' | 'emergency'
}

const DEFAULT_FILTERS: PatientQueryParams = {}

export function PatientTable({ visitType: fixedVisitType }: PatientTableProps) {
    const { hasPermission } = usePermissions()
    const [search, setSearch] = useState("")
    const [debouncedSearch] = useDebounce(search, 500)
    const [page, setPage] = useState(1)
    const { formatCurrency } = useCurrency()

    // Advanced filters state — managed as a single object for easy reset
    const [filters, setFilters] = useState<PatientQueryParams>(DEFAULT_FILTERS)

    // Modal state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const [isPaymentOpen, setIsPaymentOpen] = useState(false)
    const [paymentPatient, setPaymentPatient] = useState<{ id: string; name: string } | null>(null)
    const queryClient = useQueryClient()

    // Build final API params: fixedVisitType from URL always wins
    const queryParams: PatientQueryParams = {
        page,
        limit: 10,
        name: debouncedSearch || undefined,
        visitType: fixedVisitType ?? filters.visitType,
        gender: filters.gender,
        bloodGroup: filters.bloodGroup,
        district: filters.district || undefined,
        religion: filters.religion || undefined,
        maritalStatus: filters.maritalStatus,
        occupation: filters.occupation || undefined,
    }

    const { data: response, isLoading, isFetching } = usePatients(queryParams)
    const patients = response?.data || []
    const meta = response?.meta

    // Count active advanced filters (exclude visitType if it's locked by the page)
    const activeFilterCount = [
        filters.gender,
        filters.bloodGroup,
        filters.district,
        filters.religion,
        filters.maritalStatus,
        filters.occupation,
        !fixedVisitType && filters.visitType, // only count visitType filter if not locked
    ].filter(Boolean).length

    const handleFiltersChange = (updated: PatientQueryParams) => {
        setFilters(updated)
        setPage(1)
    }

    const handleReset = () => {
        setFilters(DEFAULT_FILTERS)
        setSearch("")
        setPage(1)
    }

    const handleAdd = () => {
        setSelectedPatient(null)
        setDialogOpen(true)
    }

    const handleEdit = (patient: Patient) => {
        setSelectedPatient(patient)
        setDialogOpen(true)
    }

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: PHARMACY_KEYS.patients(queryParams) })
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 w-full sm:max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={
                                fixedVisitType
                                    ? `Search ${fixedVisitType.toUpperCase()} patients…`
                                    : "Search by name, phone…"
                            }
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
                                <span>Syncing…</span>
                            </div>
                        )}
                    </div>

                    {/* Advanced filters via FilterPopover */}
                    <FilterPopover
                        activeFilterCount={activeFilterCount}
                        onReset={handleReset}
                        title="Patient Filters"
                    >
                        <PatientFilters
                            values={filters}
                            onChange={handleFiltersChange}
                            hideVisitType={!!fixedVisitType}
                        />
                    </FilterPopover>

                    {/* Clear all */}
                    {(activeFilterCount > 0 || search) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-muted-foreground shrink-0"
                            onClick={handleReset}
                        >
                            <X className="h-3.5 w-3.5" /> Clear
                        </Button>
                    )}
                </div>

                {/* Locked view badge */}
                {fixedVisitType && (
                    <Badge
                        className={cn(
                            "shrink-0 capitalize text-xs font-semibold px-3 py-1 border",
                            VISIT_TYPE_COLORS[fixedVisitType]
                        )}
                    >
                        {fixedVisitType.toUpperCase()} View
                    </Badge>
                )}

                {hasPermission("patient:create") && (
                    <Button className="gap-2 w-full sm:w-auto shrink-0" onClick={handleAdd}>
                        <UserPlus className="h-4 w-4" /> Add Patient
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card overflow-x-auto">
                <Table className="min-w-[820px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Patient Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Age / Gender</TableHead>
                            <TableHead>Visit Type</TableHead>
                            <TableHead>District</TableHead>
                            <TableHead>Registered</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-[60px] rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[90px]" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : patients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                                    {fixedVisitType
                                        ? `No ${fixedVisitType.toUpperCase()} patients match your filters.`
                                        : "No patients found."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            patients.map((patient: any) => (
                                <TableRow
                                    key={patient.id}
                                    className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span>{patient.name}</span>
                                            {patient.nameBangla && (
                                                <span className="text-[10px] text-muted-foreground">{patient.nameBangla}</span>
                                            )}
                                            {patient.patientNumber && (
                                                <span className="text-[10px] text-muted-foreground font-mono">{patient.patientNumber}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{patient.phone}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span>{patient.age} yrs</span>
                                            <span className="text-xs text-muted-foreground capitalize">{patient.gender}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "capitalize text-xs",
                                                patient.visitType && VISIT_TYPE_COLORS[patient.visitType]
                                            )}
                                        >
                                            {patient.visitType || "N/A"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">{patient.district || "—"}</span>
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
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setPaymentPatient({ id: patient.id, name: patient.name })
                                                        setIsPaymentOpen(true)
                                                    }}
                                                >
                                                    <CreditCard className="mr-2 h-4 w-4 text-emerald-600" /> Collect Dues
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/sales?patientId=${patient.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" /> View Sales
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/diagnostic/reports?patientId=${patient.id}`}>
                                                        <FileText className="mr-2 h-4 w-4" /> Diagnostic Reports
                                                    </Link>
                                                </DropdownMenuItem>
                                                {hasPermission("patient:update") && (
                                                    <DropdownMenuItem onClick={() => handleEdit(patient)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                {hasPermission("patient:delete") && (
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

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between py-2">
                    <p className="text-xs text-muted-foreground">
                        Showing {(meta.page - 1) * meta.pageSize + 1}–{Math.min(meta.page * meta.pageSize, meta.totalItems)} of {meta.totalItems} records
                    </p>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                            disabled={!meta.hasNextPage}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            <PatientDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={handleSuccess}
                patient={selectedPatient}
            />

            {paymentPatient && (
                <PharmacyPaymentDialog
                    open={isPaymentOpen}
                    onOpenChange={setIsPaymentOpen}
                    patientId={paymentPatient.id}
                    patientName={paymentPatient.name}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    )
}
