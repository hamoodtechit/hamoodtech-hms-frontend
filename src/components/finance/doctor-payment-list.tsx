"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { useConsultationCharges } from "@/hooks/finance-queries"
import { useUsers } from "@/hooks/user-queries"
import { useStoreContext } from "@/store/use-store-context"
import { useCurrency } from "@/hooks/use-currency"
import { ConsultationCharge } from "@/types/finance"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Loader2, Search, Wallet } from "lucide-react"
import { useMemo, useState } from "react"
import { DoctorPaymentDialog } from "./doctor-payment-dialog"
import { FilterPopover } from "@/components/shared/filter-popover"

export function DoctorPaymentList() {
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()

    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [doctorFilter, setDoctorFilter] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [payDialogOpen, setPayDialogOpen] = useState(false)

    const { data: usersRes } = useUsers({ branchId: activeStoreId || undefined, limit: 1000 })
    const doctors = useMemo(() =>
        (usersRes?.data || []).filter((u: any) => u.role?.name?.toLowerCase() === 'doctor'),
        [usersRes]
    )

    const { data, isLoading, refetch } = useConsultationCharges({
        page,
        limit: 20,
        branchId: activeStoreId || undefined,
        isPaid: false,
        search: search || undefined,
        doctorId: doctorFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    })

    console.log("Consultation Charges API Response:", data)

    const charges: ConsultationCharge[] = data?.data || []
    const totalPages = data?.meta?.totalPages || 1

    // Selection logic
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        if (selectedIds.size === charges.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(charges.map(c => c.id)))
        }
    }

    const selectedCharges = charges.filter(c => selectedIds.has(c.id))

    // Validate: all selected must be same doctor
    const selectedDoctorIds = new Set(selectedCharges.map(c => c.doctorId))
    const isSameDoctor = selectedDoctorIds.size <= 1
    const selectedDoctorId = selectedCharges[0]?.doctorId || ""
    const selectedDoctorName = selectedCharges[0]?.doctor?.fullName || selectedCharges[0]?.doctor?.name || "Doctor"

    const selectedTotal = selectedCharges.reduce((sum, c) => sum + Number(c.commissionAmount || 0), 0)

    const activeFilterCount = [doctorFilter, startDate, endDate].filter(Boolean).length

    return (
        <>
            <Card className="border-none shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="p-4 bg-card/80 border-b">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by invoice or serial..."
                                className="pl-10 h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-primary/20"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <FilterPopover
                            activeFilterCount={activeFilterCount}
                            onReset={() => {
                                setDoctorFilter("")
                                setStartDate("")
                                setEndDate("")
                            }}
                        >
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-muted-foreground">Doctor</label>
                                    <SearchableSelect
                                        value={doctorFilter}
                                        onChange={setDoctorFilter}
                                        options={doctors.map((d: any) => ({
                                            id: d.employeeId || d.id,
                                            name: d.fullName || d.username,
                                        }))}
                                        placeholder="All Doctors"
                                        allLabel="All Doctors"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase text-muted-foreground">Date Range</label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="h-9 text-xs"
                                        />
                                        <Input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="h-9 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        </FilterPopover>

                        {selectedCharges.length > 0 && (
                            <Button
                                onClick={() => setPayDialogOpen(true)}
                                disabled={!isSameDoctor}
                                className="gap-2 h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20"
                            >
                                <Wallet className="h-4 w-4" />
                                Pay {formatCurrency(selectedTotal)} ({selectedCharges.length})
                            </Button>
                        )}
                    </div>
                    {selectedCharges.length > 0 && !isSameDoctor && (
                        <p className="text-xs text-destructive font-bold mt-2">
                            ⚠ Selected charges must belong to the same doctor to process payment.
                        </p>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50 text-[11px] uppercase tracking-wider font-bold">
                            <TableRow>
                                <TableHead className="w-12 pl-4">
                                    <Checkbox
                                        checked={charges.length > 0 && selectedIds.size === charges.length}
                                        onCheckedChange={toggleAll}
                                    />
                                </TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Sale / Appointment</TableHead>
                                <TableHead className="text-right">Total Amt</TableHead>
                                <TableHead className="text-right">Commission %</TableHead>
                                <TableHead className="text-right">Payable</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : charges.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">
                                        No pending commissions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                charges.map((charge) => (
                                    <TableRow key={charge.id} className="group hover:bg-muted/30">
                                        <TableCell className="pl-4">
                                            <Checkbox
                                                checked={selectedIds.has(charge.id)}
                                                onCheckedChange={() => toggleSelect(charge.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">
                                            {format(new Date(charge.createdAt), "dd MMM yyyy")}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-sm">
                                                {charge.doctor?.fullName || charge.doctor?.name || "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-medium">
                                                    {charge.sale?.invoiceNumber || charge.appointment?.serialNumber || "—"}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-sm">
                                            {formatCurrency(Number(charge.totalAmount || charge.serviceAmount || 0))}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className="text-[10px]">
                                                {Number(charge.commissionPercentage || 0)}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-black text-primary text-sm">
                                            {formatCurrency(Number(charge.commissionAmount || (charge as any).chargeAmount || 0))}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
                            <p className="text-xs font-medium text-muted-foreground">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <DoctorPaymentDialog
                open={payDialogOpen}
                onOpenChange={setPayDialogOpen}
                charges={selectedCharges}
                doctorName={selectedDoctorName}
                doctorId={selectedDoctorId}
                onSuccess={() => {
                    setSelectedIds(new Set())
                    refetch()
                }}
            />
        </>
    )
}
