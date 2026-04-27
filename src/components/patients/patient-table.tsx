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
    LucidePhone,
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
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={
                                fixedVisitType
                                    ? `Search ${fixedVisitType.toUpperCase()} patients…`
                                    : "Search by name, MRN, phone…"
                            }
                            className="pl-10 h-11 bg-card/50 border-border/50 focus:ring-primary/20"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                        />
                        {isFetching && !isLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] text-muted-foreground bg-background/50 px-2 py-1 rounded-md border border-border/50 backdrop-blur-sm animate-in fade-in duration-300">
                                <RefreshCcw className="h-3 w-3 animate-spin" />
                                <span>Syncing…</span>
                            </div>
                        )}
                    </div>

                    {/* Advanced filters via FilterPopover */}
                    <FilterPopover
                        activeFilterCount={activeFilterCount}
                        onReset={handleReset}
                        title="Advanced Filters"
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
                            className="gap-2 text-muted-foreground hover:text-foreground shrink-0 h-11"
                            onClick={handleReset}
                        >
                            <X className="h-4 w-4" /> Clear
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {fixedVisitType && (
                        <Badge
                            className={cn(
                                "shrink-0 capitalize text-[10px] font-bold px-3 py-1.5 rounded-full border shadow-sm",
                                VISIT_TYPE_COLORS[fixedVisitType]
                            )}
                        >
                            {fixedVisitType.toUpperCase()}
                        </Badge>
                    )}

                    {hasPermission("patient:create") && (
                        <Button className="gap-2 h-11 px-5 shadow-lg shadow-primary/10" onClick={handleAdd}>
                            <UserPlus className="h-4 w-4" /> Add Patient
                        </Button>
                    )}
                </div>
            </div>

            {/* Premium Table Layout */}
            <div className="overflow-x-auto pb-4">
                <table className="w-full border-separate border-spacing-y-3 min-w-[1000px]">
                    <thead>
                        <tr className="text-muted-foreground/80 text-[10px] font-bold uppercase tracking-widest">
                            <th className="px-6 py-3 text-left font-bold bg-slate-50 dark:bg-slate-800/60 rounded-l-xl border-y border-l border-border/30">Patient Details</th>
                            <th className="px-6 py-3 text-left font-bold bg-slate-50 dark:bg-slate-800/60 border-y border-border/30">Demographics</th>
                            <th className="px-6 py-3 text-left font-bold bg-slate-50 dark:bg-slate-800/60 border-y border-border/30">Visit Info</th>
                            <th className="px-6 py-3 text-left font-bold bg-slate-50 dark:bg-slate-800/60 border-y border-border/30">Department / Status</th>
                            <th className="px-6 py-3 text-right font-bold bg-slate-50 dark:bg-slate-800/60 rounded-r-xl border-y border-r border-border/30">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="bg-card/30 rounded-xl">
                                    <td className="px-6 py-4 rounded-l-xl"><Skeleton className="h-12 w-12 rounded-full inline-block mr-3" /><div className="inline-block align-middle space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24" /></div></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-6 w-12 rounded-md" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-3 w-32" /></td>
                                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-md mb-2" /><Skeleton className="h-4 w-28" /></td>
                                    <td className="px-6 py-4 rounded-r-xl text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></td>
                                </tr>
                            ))
                        ) : patients.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-20 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-3">
                                        <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center">
                                            <Search className="h-8 w-8 text-muted-foreground/40" />
                                        </div>
                                        <p className="text-muted-foreground text-sm font-medium">
                                            {fixedVisitType
                                                ? `No ${fixedVisitType.toUpperCase()} patients match your filters.`
                                                : "No patients found."}
                                        </p>
                                        <Button variant="outline" size="sm" onClick={handleReset}>Reset Filters</Button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            patients.map((patient: any, idx: number) => {
                                const trimmedName = (patient.name || "").trim();
                                const initials = trimmedName.split(/\s+/).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || "??";
                                
                                // Real data only
                                const visitDate = patient.createdAt;
                                const doctorName = patient.doctor?.fullName || "—";
                                const visitType = patient.visitType || "OPD";
                                
                                return (
                                    <tr 
                                        key={patient.id} 
                                        className={cn(
                                            "group transition-all duration-200 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-border/40",
                                            isFetching && "opacity-50"
                                        )}
                                    >
                                        {/* Patient Details */}
                                        <td className="px-6 py-5 rounded-l-2xl border-y border-l border-border/40 group-hover:border-primary/30">
                                            <div className="flex items-center gap-4">
                                                <div className="h-11 w-11 rounded-full flex items-center justify-center text-xs font-bold shadow-inner bg-primary/10 text-primary dark:bg-primary/20 border border-primary/10">
                                                    {initials}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                                                        {patient.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                            {patient.patientNumber || "No ID"}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1">
                                                            <LucidePhone className="h-2.5 w-2.5" />
                                                            {patient.phone || "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Demographics */}
                                        <td className="px-6 py-5 border-y border-border/40 group-hover:border-primary/30">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                                    {patient.age}y • {patient.gender === 'male' ? 'M' : patient.gender === 'female' ? 'F' : 'O'}
                                                </span>
                                                <Badge className={cn(
                                                    "w-fit text-[10px] h-5 font-bold shadow-none border",
                                                    patient.bloodGroup 
                                                        ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/20" 
                                                        : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                )}>
                                                    {patient.bloodGroup || "Unknown"}
                                                </Badge>
                                            </div>
                                        </td>

                                        {/* Visit Info */}
                                        <td className="px-6 py-5 border-y border-border/40 group-hover:border-primary/30">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                                    {new Date(visitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground font-medium">
                                                    {doctorName}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Department / Status */}
                                        <td className="px-6 py-5 border-y border-border/40 group-hover:border-primary/30">
                                            <div className="flex flex-col gap-2">
                                                <Badge variant="outline" className="w-fit text-[10px] h-5 font-bold uppercase bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/50 px-2 rounded">
                                                    {visitType}
                                                </Badge>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600 shadow-sm" />
                                                    <span className="text-[11px] font-bold text-muted-foreground">
                                                        {status}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-5 rounded-r-2xl border-y border-r border-border/40 group-hover:border-primary/30 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 p-2">
                                                    <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground uppercase tracking-widest font-bold">Options</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        className="rounded-md"
                                                        onClick={() => {
                                                            setPaymentPatient({ id: patient.id, name: patient.name })
                                                            setIsPaymentOpen(true)
                                                        }}
                                                    >
                                                        <CreditCard className="mr-3 h-4 w-4 text-emerald-500" /> 
                                                        <span className="font-medium">Collect Dues</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="my-1" />
                                                    <DropdownMenuItem className="rounded-md" asChild>
                                                        <Link href={`/sales?patientId=${patient.id}`}>
                                                            <Eye className="mr-3 h-4 w-4" /> 
                                                            <span className="font-medium">View Sales</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="rounded-md" asChild>
                                                        <Link href={`/diagnostic/reports?patientId=${patient.id}`}>
                                                            <FileText className="mr-3 h-4 w-4" /> 
                                                            <span className="font-medium">Diagnostic Reports</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    {hasPermission("patient:update") && (
                                                        <DropdownMenuItem className="rounded-md" onClick={() => handleEdit(patient)}>
                                                            <Edit className="mr-3 h-4 w-4 text-amber-500" /> 
                                                            <span className="font-medium">Edit Profile</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator className="my-1" />
                                                    {hasPermission("patient:delete") && (
                                                        <DropdownMenuItem className="rounded-md text-destructive focus:bg-destructive/10">
                                                            <Trash2 className="mr-3 h-4 w-4" /> 
                                                            <span className="font-medium">Delete Record</span>
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Premium Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <p className="text-xs font-medium text-muted-foreground">
                        Showing <span className="text-foreground">{(meta.page - 1) * meta.pageSize + 1} to {Math.min(meta.page * meta.pageSize, meta.totalItems)}</span> of <span className="text-foreground">{meta.totalItems}</span> records
                    </p>
                    
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            className="h-9 px-3 text-xs font-bold text-muted-foreground hover:bg-card border border-transparent hover:border-border/50"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={!meta.hasPreviousPage}
                        >
                            Previous
                        </Button>

                        {Array.from({ length: meta.totalPages }).map((_, i) => {
                            const p = i + 1;
                            // Show limited pages if many
                            if (meta.totalPages > 5 && Math.abs(p - meta.page) > 1 && p !== 1 && p !== meta.totalPages) {
                                if (p === 2 || p === meta.totalPages - 1) return <span key={p} className="px-1 text-muted-foreground/50">...</span>;
                                return null;
                            }
                            
                            return (
                                <Button
                                    key={p}
                                    variant={p === meta.page ? "default" : "ghost"}
                                    size="icon"
                                    className={cn(
                                        "h-9 w-9 text-xs font-bold rounded-md transition-all",
                                        p === meta.page ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-card border border-transparent hover:border-border/50"
                                    )}
                                    onClick={() => setPage(p)}
                                >
                                    {p}
                                </Button>
                            )
                        })}

                        <Button
                            variant="ghost"
                            className="h-9 px-3 text-xs font-bold text-muted-foreground hover:bg-card border border-transparent hover:border-border/50"
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
