"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useConsultationPayments, useConsultationPayment } from "@/hooks/finance-queries"
import { useStoreContext } from "@/store/use-store-context"
import { useCurrency } from "@/hooks/use-currency"
import { ConsultationPayment } from "@/types/finance"
import { format, startOfDay, endOfDay } from "date-fns"
import { ChevronLeft, ChevronRight, Eye, Loader2, Search, Printer } from "lucide-react"
import { useState, useMemo } from "react"
import { FilterPopover } from "@/components/shared/filter-popover"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { useSettingsStore } from "@/store/use-settings-store"
import { useUsers } from "@/hooks/user-queries"

export function DoctorPaymentHistory() {
    const { activeStoreId, stores } = useStoreContext()
    const activeStore = stores.find(s => s.id === activeStoreId)
    const { general } = useSettingsStore()
    const { formatCurrency } = useCurrency()

    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [doctorFilter, setDoctorFilter] = useState("")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [detailId, setDetailId] = useState("")
    const [detailOpen, setDetailOpen] = useState(false)

    const { data: usersRes } = useUsers({ branchId: activeStoreId || undefined, limit: 1000 })
    const doctors = useMemo(() =>
        (usersRes?.data || []).filter((u: any) => u.role?.name?.toLowerCase() === 'doctor'),
        [usersRes]
    )

    const { data, isLoading } = useConsultationPayments({
        page,
        limit: 20,
        branchId: activeStoreId || undefined,
        search: search || undefined,
        doctorId: doctorFilter || undefined,
        startDate: startDate ? startOfDay(new Date(startDate)).toISOString() : undefined,
        endDate: endDate ? endOfDay(new Date(endDate)).toISOString() : undefined,
    })

  

    const { data: detailRes, isLoading: detailLoading } = useConsultationPayment(detailId)
    
    const detailPayment = detailRes?.data

    useMemo(() => {
        if (detailOpen && detailPayment) {
            console.log("Doctor Payment History — Detail Payment Data:", detailPayment);
        }
    }, [detailOpen, detailPayment]);

    const payments: ConsultationPayment[] = data?.data || []
    const totalPages = data?.meta?.totalPages || 1

    const methodLabel = (m: string) => {
        switch (m) {
            case "cash": return "Cash"
            case "bank_transfer": return "Bank Transfer"
            case "cheque": return "Cheque"
            case "mfs": return "Mobile Banking"
            default: return m
        }
    }

    const handlePrint = () => {
        const printContent = document.getElementById('receipt-print-content')?.innerHTML;
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
                        <title>Payment Voucher - ${detailPayment?.paymentNumber || ''}</title>
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

    const activeFilterCount = [doctorFilter, startDate, endDate].filter(Boolean).length

    return (
        <>
            <Card className="border-none shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="p-4 bg-card/80 border-b">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by voucher number..."
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
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50 text-[11px] uppercase tracking-wider font-bold">
                            <TableRow>
                                <TableHead className="pl-6">Voucher</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Doctor</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium">
                                        No payment history found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.map((payment) => (
                                    <TableRow key={payment.id} className="group hover:bg-muted/30">
                                        <TableCell className="pl-6">
                                            <Badge variant="outline" className="font-bold text-xs">
                                                {payment.paymentNumber}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">
                                            {format(new Date(payment.createdAt), "dd MMM yyyy")}
                                        </TableCell>
                                        <TableCell className="font-bold text-sm">
                                            {payment.doctor?.fullName || payment.doctor?.name || "—"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-[10px] capitalize">
                                                {methodLabel(payment.paymentMethod)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">
                                            {payment.account?.name || "—"}
                                        </TableCell>
                                        <TableCell className="text-right font-black text-emerald-600 text-sm">
                                            {formatCurrency(Number(payment.totalAmount || 0))}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => {
                                                    setDetailId(payment.id)
                                                    setDetailOpen(true)
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
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

            {/* Detail Dialog */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="flex flex-row items-center justify-between">
                        <DialogTitle className="flex items-center gap-2">
                            Payment Details — {detailPayment?.paymentNumber || ""}
                        </DialogTitle>
                        {detailPayment && (
                            <Button size="sm" variant="outline" className="gap-2 shrink-0 h-8 mr-6" onClick={handlePrint}>
                                <Printer className="h-4 w-4" /> Print
                            </Button>
                        )}
                    </DialogHeader>

                    {detailLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : detailPayment ? (
                        <>
                        {/* Hidden Print Layout matching other vouchers */}
                        <div className="hidden">
                            <div id="receipt-print-content" className="w-full text-black bg-white">
                                <div className="text-center mb-4 pb-2 border-b-2 border-black">
                                    <div className="flex justify-center mb-1">
                                        <img src={activeStore?.logoUrl || "/Logo.png"} alt="Logo" style={{ height: '60px', width: 'auto' }} />
                                    </div>
                                    <h1 className="text-2xl font-black uppercase leading-tight m-0">{general?.hospitalName || activeStore?.name || "HOSPITAL NAME"}</h1>
                                    <p className="text-xs font-bold leading-tight m-0">{general?.address || activeStore?.address || "Address"}</p>
                                    <p className="text-xs font-bold leading-tight m-0">Ph: {general?.phone || activeStore?.phone || "Phone"}</p>
                                    <div className="mt-4 inline-block border-2 border-black rounded-full px-6 py-1 font-black tracking-widest text-sm uppercase">
                                        DOCTOR PAYMENT VOUCHER
                                    </div>
                                </div>

                                <div className="border-2 border-black mb-4 flex flex-col font-bold text-sm">
                                    <div className="grid grid-cols-2 border-b border-black">
                                        <div className="p-2 border-r border-black">
                                            Voucher No: {detailPayment?.paymentNumber || ""}
                                        </div>
                                        <div className="p-2">
                                            Date: {format(new Date(detailPayment.createdAt), "dd MMM yyyy, hh:mm a")}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2">
                                        <div className="p-2 border-r border-black flex items-center">
                                            Doctor: <span className="ml-2 uppercase">{detailPayment.doctor?.fullName || detailPayment.doctor?.name || "—"}</span>
                                        </div>
                                        <div className="p-2 flex items-center">
                                            Method / Acc: <span className="ml-2 uppercase">{methodLabel(detailPayment.paymentMethod)}{detailPayment.account?.name ? ` - ${detailPayment.account.name}` : ''}</span>
                                        </div>
                                    </div>
                                </div>

                                <table className="w-full text-left border-collapse border-2 border-black font-bold text-xs mb-8">
                                    <thead>
                                        <tr className="border-b-2 border-black bg-gray-100">
                                            <th className="p-2 border-r border-black w-12 text-center">SL</th>
                                            <th className="p-2 border-r border-black">Sale / Appointment</th>
                                            <th className="p-2 border-r border-black">Patient</th>
                                            <th className="p-2 border-r border-black text-right w-24">Total</th>
                                            <th className="p-2 text-right w-28">Payable</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailPayment.charges && detailPayment.charges.length > 0 ? (
                                            detailPayment.charges.map((ch: any, idx: number) => (
                                                <tr key={ch.id} className="border-b border-black">
                                                    <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                                                    <td className="p-2 border-r border-black">{ch.sale?.invoiceNumber || ch.appointment?.serialNumber || "—"}</td>
                                                    <td className="p-2 border-r border-black">{ch.sale?.patient?.name || ch.appointment?.patient?.name || "—"}</td>
                                                    <td className="p-2 border-r border-black text-right">{formatCurrency(Number(ch.totalAmount || ch.serviceAmount || 0))}</td>
                                                    <td className="p-2 text-right">{formatCurrency(Number(ch.commissionAmount || ch.chargeAmount || 0))}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="p-4 text-center">No charges found.</td>
                                            </tr>
                                        )}
                                        <tr className="border-t-2 border-black bg-gray-100">
                                            <td colSpan={4} className="p-2 border-r border-black text-right uppercase tracking-wider">Total Paid</td>
                                            <td className="p-2 text-right text-sm">{formatCurrency(Number(detailPayment.totalAmount || 0))}</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <div className="flex justify-between mt-24 pt-2 font-bold text-sm">
                                    <div className="w-48 text-center border-t border-black pt-1">
                                        Receiver's Signature
                                    </div>
                                    <div className="w-48 text-center border-t border-black pt-1">
                                        Authorized Signature
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Visible Dialog Content */}
                        <div id="payment-detail-content" className="space-y-6">
                            {/* Summary */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground text-xs font-bold uppercase">Doctor</p>
                                    <p className="font-bold">{detailPayment.doctor?.fullName || detailPayment.doctor?.name || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-bold uppercase">Date</p>
                                    <p className="font-bold">{format(new Date(detailPayment.createdAt), "dd MMM yyyy, hh:mm a")}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-bold uppercase">Method / Account</p>
                                    <p className="font-bold"><span className="capitalize">{methodLabel(detailPayment.paymentMethod)}</span>{detailPayment.account?.name ? ` — ${detailPayment.account.name}` : ''}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs font-bold uppercase">Total Paid</p>
                                    <p className="font-black text-lg text-emerald-600">{formatCurrency(Number(detailPayment.totalAmount || 0))}</p>
                                </div>
                                {detailPayment.note && (
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground text-xs font-bold uppercase">Note</p>
                                        <p className="font-medium">{detailPayment.note}</p>
                                    </div>
                                )}
                            </div>

                            {/* Charges breakdown */}
                            {detailPayment.charges && detailPayment.charges.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-3">Charges Included ({detailPayment.charges.length})</p>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="text-[10px] uppercase">
                                                <TableHead>Sale / Appointment</TableHead>
                                                <TableHead>Patient</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead className="text-right">Payable</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {detailPayment.charges.map((ch: any) => (
                                                <TableRow key={ch.id}>
                                                    <TableCell className="text-xs">
                                                        {ch.sale?.invoiceNumber || ch.appointment?.serialNumber || "—"}
                                                    </TableCell>
                                                    <TableCell className="text-xs">
                                                        {ch.sale?.patient?.name || ch.appointment?.patient?.name || "—"}
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs">{formatCurrency(Number(ch.totalAmount || ch.serviceAmount || 0))}</TableCell>
                                                    <TableCell className="text-right text-xs font-bold">{formatCurrency(Number(ch.commissionAmount || ch.chargeAmount || 0))}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                        </>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">Payment not found.</p>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
