"use client"

import { AdmissionDialog } from "@/components/patients/admission-dialog"
import { AdmissionDetailsDialog } from "@/components/patients/admission-details-dialog"
import { DischargeDialog } from "@/components/patients/discharge-dialog"
import { AdmissionFilters } from "@/components/patients/admission-filters"
import { AdmissionPrintDialog } from "@/components/patients/admission-print-dialog"
import { AddAdmissionServiceDialog } from "@/components/patients/add-service-dialog"
import { FilterPopover } from "@/components/shared/filter-popover"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBeds } from "@/hooks/facility-queries"
import { useAdmissions, usePatients, useDeleteAdmission } from "@/hooks/patient-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useStoreContext } from "@/store/use-store-context"
import { Admission, AdmissionQueryParams, AdmissionStatus } from "@/types/patient"
import { format } from "date-fns"
import { 
    Bed, 
    ChevronLeft, 
    ChevronRight, 
    Edit2,
    Eye,
    FileText, 
    Loader2, 
    Plus, 
    Printer, 
    Search, 
    Trash2,
    UserCheck,
    ClipboardCheck,
    CreditCard,
    MoreHorizontal
} from "lucide-react"
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { useRouter } from "@/i18n/navigation"

export default function IPDBillingPage() {
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [filters, setFilters] = useState<AdmissionQueryParams>({})
    const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null)
    const [admissionDialogOpen, setAdmissionDialogOpen] = useState(false)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [dischargeDialogOpen, setDischargeDialogOpen] = useState(false)
    const [addServiceDialogOpen, setAddServiceDialogOpen] = useState(false)
    const [printDialogOpen, setPrintDialogOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const router = useRouter()
    const { formatCurrency } = useCurrency()
    const { activeStoreId } = useStoreContext()

    const isValidBranchId = activeStoreId && activeStoreId !== 'default-branch'

    const { data: admissionsRes, isLoading, refetch } = useAdmissions({
        ...filters,
        search,
        branchId: isValidBranchId ? activeStoreId : undefined,
        page,
        limit: 10
    })

    const { data: patientsRes } = usePatients({ limit: 100 })
    const { data: bedsRes } = useBeds({ limit: 100 })
    const { mutate: deleteAdmission, isPending: isDeleting } = useDeleteAdmission()

    const admissions = admissionsRes?.data || []
    const totalPages = admissionsRes?.meta?.totalPages || 1

    const getStatusBadge = (status: AdmissionStatus) => {
        switch (status) {
            case "admitted":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600">Admitted</Badge>
            case "discharged":
                return <Badge variant="secondary">Discharged</Badge>
            case "transferred":
                return <Badge className="bg-blue-500">Transferred</Badge>
            case "cancelled":
                return <Badge variant="destructive">Cancelled</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <PermissionGuard permission={["patient:read", "sale:create"]}>
            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-primary">IPD Billing</h1>
                        <p className="text-muted-foreground text-sm font-medium">Manage hospitalizations, bed assignments, and inpatient billing.</p>
                    </div>
                    <Button 
                        onClick={() => {
                            setSelectedAdmission(null)
                            setAdmissionDialogOpen(true)
                        }}
                        className="rounded-xl shadow-lg shadow-primary/20 gap-2 h-11 px-6 font-extrabold uppercase tracking-tight"
                    >
                        <Plus className="h-5 w-5" /> Admit Patient
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-xl bg-card shadow-primary/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <UserCheck className="h-3.5 w-3.5 text-emerald-500" /> Currently Admitted
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-emerald-500">
                                {isLoading ? "..." : admissions.filter(a => a.status === 'admitted').length}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-xl bg-card shadow-primary/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-blue-500" /> Total Admissions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-blue-500">
                                {isLoading ? "..." : admissionsRes?.meta?.totalItems || 0}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-xl bg-card shadow-primary/5">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Bed className="h-3.5 w-3.5 text-orange-500" /> Items on Page
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black text-orange-500">
                                {admissions.length} <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Records</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-none shadow-2xl bg-card/50 backdrop-blur-xl overflow-hidden border border-white/5">
                    <CardHeader className="p-4 bg-muted/30 border-b border-white/5">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                                <Input
                                    placeholder="Search by Patient Name, UHID or Bed..."
                                    className="pl-10 h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-muted-foreground/50 transition-all font-medium"
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value)
                                        setPage(1)
                                    }}
                                />
                            </div>
                            <FilterPopover 
                                activeFilterCount={Object.values(filters).filter(Boolean).length}
                                onReset={() => setFilters({})}
                            >
                                <AdmissionFilters 
                                    values={filters}
                                    onChange={(v) => {
                                        setFilters(v)
                                        setPage(1)
                                    }}
                                    patients={patientsRes?.data || []}
                                    beds={bedsRes?.data || []}
                                />
                            </FilterPopover>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/40 text-[10px] uppercase tracking-widest font-black opacity-80 border-b border-white/5">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="pl-6 h-10">Patient / ID</TableHead>
                                    <TableHead className="h-10">Bed / Ward</TableHead>
                                    <TableHead className="h-10 text-center">Admission Date</TableHead>
                                    <TableHead className="h-10">Guardian / Info</TableHead>
                                    <TableHead className="h-10">Status</TableHead>
                                    <TableHead className="h-10">Balance</TableHead>
                                    <TableHead className="text-right pr-6 h-10">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={6} className="h-80 text-center">
                                            <div className="flex flex-col items-center gap-4 py-12">
                                                <div className="relative h-12 w-12">
                                                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <UserCheck className="h-5 w-5 text-primary animate-pulse" />
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                                                    Loading Records
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : admissions.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={6} className="h-80 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-40 py-12">
                                                <FileText className="h-12 w-12 mb-2" />
                                                <span className="text-sm font-black uppercase tracking-widest">No Admission Records</span>
                                                <p className="text-[10px] max-w-[200px] leading-relaxed">
                                                    There are currently no active patient admissions in this branch.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    admissions.map((adm) => (
                                        <TableRow key={adm.id} className="group hover:bg-primary/[0.02] border-b border-white/5 transition-all">
                                            <TableCell className="pl-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-extrabold text-foreground tracking-tight leading-none text-sm group-hover:text-primary transition-colors">{adm.patient?.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded text-primary uppercase shadow-sm">
                                                            {adm.patient?.patientNumber || adm.patient?.uhid || "N/A"}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Patient</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <Bed className="h-3 w-3 text-blue-500 opacity-60" />
                                                        <span className="font-black text-xs text-blue-500 tracking-tighter">{adm.bed?.bedNumber}</span>
                                                    </div>
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest ml-5">{adm.bed?.section?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-foreground/90 tabular-nums">{format(new Date(adm.admissionDate), "dd MMM yyyy")}</span>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50 tracking-widest">Confirmed Date</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-extrabold text-foreground/80 tracking-tight">{adm.guardianName}</span>
                                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter opacity-40">{adm.guardianRelation}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(adm.status)}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-rose-500">
                                                        {formatCurrency(Number(adm.patient?.balance || 0))}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6 py-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 bg-primary/5 hover:bg-primary/20 hover:text-primary rounded-lg border border-primary/10 transition-all focus-visible:ring-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-white/10 p-2 space-y-1">
                                                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-2 py-1.5 opacity-60">Actions</DropdownMenuLabel>
                                                        
                                                        <DropdownMenuItem 
                                                            className="cursor-pointer gap-2 font-bold text-xs rounded-lg px-2.5 focus:bg-primary/10 focus:text-primary transition-colors"
                                                            onClick={() => {
                                                                setSelectedAdmission(adm)
                                                                setDetailsDialogOpen(true)
                                                            }}
                                                        >
                                                            <Eye className="h-3.5 w-3.5 text-primary opacity-70" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        
                                                        <DropdownMenuItem 
                                                            className="cursor-pointer gap-2 font-bold text-xs rounded-lg px-2.5 focus:bg-primary/10 focus:text-primary transition-colors"
                                                            onClick={() => {
                                                                setSelectedAdmission(adm)
                                                                setAdmissionDialogOpen(true)
                                                            }}
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5 text-primary opacity-70" />
                                                            Edit Info
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem 
                                                            className="cursor-pointer gap-2 font-bold text-xs rounded-lg px-2.5 focus:bg-primary/10 focus:text-primary transition-colors"
                                                            onClick={() => {
                                                                setSelectedAdmission(adm)
                                                                setPrintDialogOpen(true)
                                                            }}
                                                        >
                                                            <Printer className="h-3.5 w-3.5 text-primary opacity-70" />
                                                            Print Admission
                                                        </DropdownMenuItem>
                                                        
                                                        <DropdownMenuSeparator className="bg-border/50 my-1.5 mx-1" />

                                                        <DropdownMenuItem 
                                                            className="cursor-pointer gap-2 font-bold text-xs rounded-lg px-2.5 focus:bg-blue-500/10 focus:text-blue-500 transition-colors"
                                                            disabled={adm.status !== 'admitted'}
                                                            onClick={() => {
                                                                setSelectedAdmission(adm)
                                                                setAddServiceDialogOpen(true)
                                                            }}
                                                        >
                                                            <Plus className="h-3.5 w-3.5 text-blue-500 opacity-80" />
                                                            Add Service / Bill
                                                        </DropdownMenuItem>

                                                        <DropdownMenuItem 
                                                            className="cursor-pointer gap-2 font-bold text-xs rounded-lg px-2.5 focus:bg-orange-500/10 focus:text-orange-500 transition-colors"
                                                            disabled={adm.status !== 'admitted'}
                                                            onClick={() => {
                                                                router.push(`/patients/${adm.patientId}/due-payment`)
                                                            }}
                                                        >
                                                            <CreditCard className="h-3.5 w-3.5 text-orange-500 opacity-80" />
                                                            Collect Dues
                                                        </DropdownMenuItem>
                                                        
                                                        <DropdownMenuSeparator className="bg-border/50 my-1.5 mx-1" />

                                                        <DropdownMenuItem 
                                                            className="cursor-pointer gap-2 font-bold text-xs rounded-lg px-2.5 focus:bg-emerald-500/10 focus:text-emerald-500 transition-colors"
                                                            disabled={adm.status !== 'admitted'}
                                                            onClick={() => {
                                                                setSelectedAdmission(adm)
                                                                setDischargeDialogOpen(true)
                                                            }}
                                                        >
                                                            <ClipboardCheck className="h-3.5 w-3.5 text-emerald-500 opacity-80" />
                                                            Discharge Patient
                                                        </DropdownMenuItem>
                                                        
                                                        <DropdownMenuSeparator className="bg-border/50 my-1.5 mx-1" />

                                                        <DropdownMenuItem 
                                                            className="cursor-pointer gap-2 font-bold text-xs rounded-lg px-2.5 text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors"
                                                            onClick={() => {
                                                                setDeleteId(adm.id)
                                                            }}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 opacity-80" />
                                                            Delete Record
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-between p-4 border-t border-white/5 bg-muted/10">
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">
                                    Page <span className="text-foreground">{page}</span> of <span className="text-foreground">{totalPages}</span>
                                </span>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1 || isLoading}
                                        className="h-8 rounded-lg border-white/10 hover:bg-primary/5 font-black text-[10px] uppercase"
                                    >
                                        <ChevronLeft className="h-3 w-3 mr-1" /> Prev
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages || isLoading}
                                        className="h-8 rounded-lg border-white/10 hover:bg-primary/5 font-black text-[10px] uppercase"
                                    >
                                        Next <ChevronRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <AdmissionDialog 
                    open={admissionDialogOpen}
                    onOpenChange={(op) => {
                        setAdmissionDialogOpen(op)
                        if (!op) setSelectedAdmission(null)
                    }}
                    admission={selectedAdmission}
                    onSuccess={(newAdmission) => {
                        refetch()
                        setSelectedAdmission(newAdmission)
                        setPrintDialogOpen(true)
                    }}
                />

                <AdmissionDetailsDialog 
                    open={detailsDialogOpen}
                    onOpenChange={setDetailsDialogOpen}
                    admissionId={selectedAdmission?.id || null}
                />

                <DischargeDialog 
                    open={dischargeDialogOpen}
                    onOpenChange={setDischargeDialogOpen}
                    admission={selectedAdmission}
                    onSuccess={() => {
                        refetch()
                    }}
                />

                <AdmissionPrintDialog 
                    open={printDialogOpen}
                    onOpenChange={setPrintDialogOpen}
                    admissionId={selectedAdmission?.id || null}
                />

                <AddAdmissionServiceDialog 
                    open={addServiceDialogOpen}
                    onOpenChange={setAddServiceDialogOpen}
                    admission={selectedAdmission}
                    onSuccess={(sale) => {
                        refetch()
                        if (sale && selectedAdmission?.patientId) {
                            router.push(`/patients/${selectedAdmission.patientId}/due-payment`)
                            setAddServiceDialogOpen(false)
                        }
                    }}
                />

                <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                    <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-black text-primary">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm font-medium">
                                This action cannot be undone. This will permanently delete the admission record
                                and free up the bed.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl font-bold uppercase tracking-tight h-11">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => {
                                    if (deleteId) {
                                        deleteAdmission(deleteId, {
                                            onSuccess: () => {
                                                setDeleteId(null)
                                                refetch()
                                            }
                                        })
                                    }
                                }}
                                className="rounded-xl font-extrabold uppercase tracking-tight h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Deleting..." : "Delete Admission"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PermissionGuard>
    )
}
