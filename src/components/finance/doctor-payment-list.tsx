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
import { format, startOfDay, endOfDay } from "date-fns"
import { ChevronLeft, ChevronRight, Loader2, Search, Wallet, Printer } from "lucide-react"
import { useMemo, useState } from "react"
import { DoctorPaymentDialog } from "./doctor-payment-dialog"
import { FilterPopover } from "@/components/shared/filter-popover"
import { useSettingsStore } from "@/store/use-settings-store"
import { PermissionGuard } from "@/components/shared/permission-guard"

export function DoctorPaymentList() {
    const { activeStoreId, stores } = useStoreContext()
    const activeStore = stores.find(s => s.id === activeStoreId)
    const { general } = useSettingsStore()
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
        startDate: startDate ? startOfDay(new Date(startDate)).toISOString() : undefined,
        endDate: endDate ? endOfDay(new Date(endDate)).toISOString() : undefined,
    })

    

    const charges: ConsultationCharge[] = data?.data || []
    const totalPages = data?.meta?.totalPages || 1

    // Selection logic
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            console.log("Doctor Payment List — Selected IDs Updated:", Array.from(next));
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

    useMemo(() => {
        if (selectedCharges.length > 0) {
            console.log("Doctor Payment List — Selected Charges:", selectedCharges);
            console.log("Doctor Payment List — Selected Total:", selectedTotal);
        }
    }, [selectedCharges, selectedTotal]);

    const activeFilterCount = [doctorFilter, startDate, endDate].filter(Boolean).length

    // Get the doctor name for the print report
    const filteredDoctorName = doctorFilter 
        ? (doctors.find((d: any) => (d.employeeId || d.id) === doctorFilter)?.fullName || "Doctor")
        : ""

    const grandTotal = charges.reduce((sum, c) => sum + Number(c.commissionAmount || 0), 0)

    const handlePrintPending = () => {
        const printContent = document.getElementById('pending-print-content')?.innerHTML;
        if (!printContent) return;

        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed; width:100vw; height:100vh; left:-100vw; top:-100vh; border:none;';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Pending Commission Report</title>
                        ${Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(el => el.outerHTML).join('\n')}
                        <style>
                            @page { size: A4; margin: 0; }
                            body { background: white !important; margin: 0; padding: 0; font-family: sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; display: flex; justify-content: center; }
                            .print-container { width: 210mm; min-height: 297mm; padding: 10mm; box-sizing: border-box; }
                        </style>
                    </head>
                    <body>
                        <div class="print-container">
                            ${printContent}
                        </div>
                    </body>
                </html>
            `);
            iframeDoc.close();

            setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 500);
        }
    }

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

                        <PermissionGuard permission="transaction:update">
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
                        </PermissionGuard>

                        {/* Print Report Button */}
                        {charges.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={handlePrintPending}
                                className="gap-2 h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-wider"
                            >
                                <Printer className="h-4 w-4" />
                                Print Report
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
                                <TableHead className="text-right">Payable</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : charges.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium">
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

            {/* Hidden Print Layout for Pending Commissions */}
            <div className="hidden">
                <div id="pending-print-content" className="w-full text-black bg-white">
                    <div className="text-center mb-4 pb-2 border-b-2 border-black">
                        <div className="flex justify-center mb-1">
                            <img src={activeStore?.logoUrl || "/Logo.png"} alt="Logo" style={{ height: '60px', width: 'auto' }} />
                        </div>
                        <h1 className="text-2xl font-black uppercase leading-tight m-0">{general?.hospitalName || activeStore?.name || "HOSPITAL NAME"}</h1>
                        <p className="text-xs font-bold leading-tight m-0">{general?.address || activeStore?.address || "Address"}</p>
                        <p className="text-xs font-bold leading-tight m-0">Ph: {general?.phone || activeStore?.phone || "Phone"}</p>
                        <div className="mt-4 inline-block border-2 border-black rounded-full px-6 py-1 font-black tracking-widest text-sm uppercase">
                            DOCTOR PENDING COMMISSION REPORT
                        </div>
                    </div>

                    <div className="border-2 border-black mb-4 flex flex-col font-bold text-sm">
                        <div className="grid grid-cols-2 border-b border-black">
                            <div className="p-2 border-r border-black">
                                Doctor: {filteredDoctorName || "All Doctors"}
                            </div>
                            <div className="p-2">
                                Date: {startDate && endDate 
                                    ? `${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`
                                    : startDate ? `From ${format(new Date(startDate), 'dd MMM yyyy')}`
                                    : endDate ? `Until ${format(new Date(endDate), 'dd MMM yyyy')}`
                                    : 'All Dates'
                                }
                            </div>
                        </div>
                        <div className="grid grid-cols-2">
                            <div className="p-2 border-r border-black">
                                Total Records: {charges.length}
                            </div>
                            <div className="p-2">
                                Report Generated: {format(new Date(), 'dd MMM yyyy, hh:mm a')}
                            </div>
                        </div>
                    </div>

                    <table className="w-full text-left border-collapse border-2 border-black font-bold text-xs mb-8">
                        <thead>
                            <tr className="border-b-2 border-black bg-gray-100">
                                <th className="p-2 border-r border-black w-10 text-center">SL</th>
                                <th className="p-2 border-r border-black">Date</th>
                                <th className="p-2 border-r border-black">Doctor</th>
                                <th className="p-2 border-r border-black">Sale / Appointment</th>
                                <th className="p-2 border-r border-black text-right w-24">Total</th>
                                <th className="p-2 text-right w-24">Payable</th>
                            </tr>
                        </thead>
                        <tbody>
                            {charges.map((ch, idx) => (
                                <tr key={ch.id} className="border-b border-black">
                                    <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                                    <td className="p-2 border-r border-black">{format(new Date(ch.createdAt), 'dd MMM yyyy')}</td>
                                    <td className="p-2 border-r border-black">{ch.doctor?.fullName || ch.doctor?.name || '—'}</td>
                                    <td className="p-2 border-r border-black">{ch.sale?.invoiceNumber || ch.appointment?.serialNumber || '—'}</td>
                                    <td className="p-2 border-r border-black text-right">{formatCurrency(Number(ch.totalAmount || 0))}</td>
                                    <td className="p-2 text-right">{formatCurrency(Number(ch.commissionAmount || 0))}</td>
                                </tr>
                            ))}
                            <tr className="border-t-2 border-black bg-gray-100">
                                <td colSpan={5} className="p-2 border-r border-black text-right uppercase tracking-wider">Grand Total Payable</td>
                                <td className="p-2 text-right text-sm">{formatCurrency(grandTotal)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="flex justify-between mt-24 pt-2 font-bold text-sm">
                        <div className="w-48 text-center border-t border-black pt-1">
                            Prepared By
                        </div>
                        <div className="w-48 text-center border-t border-black pt-1">
                            Authorized Signature
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
