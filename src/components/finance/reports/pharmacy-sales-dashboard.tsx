"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePharmacySalesReport } from "@/hooks/report-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useStoreContext } from "@/store/use-store-context"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { endOfDay, format, startOfMonth } from "date-fns"
import { useEffect, useMemo, useState } from "react"
import { DateRange } from "react-day-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { IPharmacySaleItem, IPharmacyReturnItem } from "@/types/report"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
    ArrowUpDown,
    Banknote,
    ChevronDown,
    ChevronRight,
    CreditCard,
    FileDown,
    Pill,
    RotateCcw,
    ShoppingCart,
    TrendingDown,
    Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type SaleSortField = "slNo" | "patientNumber" | "invoiceNumber" | "totalPrice" | "discountAmount" | "taxAmount" | "netAmount" | "paid" | "due" | "createdBy" | "createdAt"
type ReturnSortField = "slNo" | "patientNumber" | "invoiceNumber" | "totalReturn" | "taxAmount" | "createdAt"
type SortDir = "asc" | "desc"

export function PharmacySalesDashboard() {
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const [date, setDate] = useState<DateRange | undefined>()
    const [activeTab, setActiveTab] = useState("outdoor-sales")

    // Sort state per tab
    const [saleSortField, setSaleSortField] = useState<SaleSortField>("slNo")
    const [saleSortDir, setSaleSortDir] = useState<SortDir>("asc")
    const [returnSortField, setReturnSortField] = useState<ReturnSortField>("slNo")
    const [returnSortDir, setReturnSortDir] = useState<SortDir>("asc")

    // Expanded payment rows
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    useEffect(() => {
        setDate({
            from: startOfMonth(new Date()),
            to: endOfDay(new Date()),
        })
    }, [])

    const { data: reportData, isLoading } = usePharmacySalesReport({
        branchId: activeStoreId || undefined,
        startDate: date?.from ? format(date.from, "yyyy-MM-dd") : undefined,
        endDate: date?.to ? format(endOfDay(date.to), "yyyy-MM-dd") : undefined,
    })

    const data = reportData?.data

    const outdoorSales = data?.outdoorSales || []
    const indoorSales = data?.indoorSales || []
    const outdoorReturns = data?.outdoorReturns || []
    const indoorReturns = data?.indoorReturns || []

    // Sort sales
    const handleSaleSort = (field: SaleSortField) => {
        if (saleSortField === field) {
            setSaleSortDir(prev => (prev === "asc" ? "desc" : "asc"))
        } else {
            setSaleSortField(field)
            setSaleSortDir("desc")
        }
    }

    const handleReturnSort = (field: ReturnSortField) => {
        if (returnSortField === field) {
            setReturnSortDir(prev => (prev === "asc" ? "desc" : "asc"))
        } else {
            setReturnSortField(field)
            setReturnSortDir("desc")
        }
    }

    const sortSales = (items: IPharmacySaleItem[]) => {
        return [...items].sort((a, b) => {
            const aVal = a[saleSortField]
            const bVal = b[saleSortField]
            const modifier = saleSortDir === "asc" ? 1 : -1
            if (typeof aVal === "number" && typeof bVal === "number") return (aVal - bVal) * modifier
            return String(aVal).localeCompare(String(bVal)) * modifier
        })
    }

    const sortReturns = (items: IPharmacyReturnItem[]) => {
        return [...items].sort((a, b) => {
            const aVal = a[returnSortField]
            const bVal = b[returnSortField]
            const modifier = returnSortDir === "asc" ? 1 : -1
            if (typeof aVal === "number" && typeof bVal === "number") return (aVal - bVal) * modifier
            return String(aVal).localeCompare(String(bVal)) * modifier
        })
    }

    const sortedOutdoorSales = useMemo(() => sortSales(outdoorSales), [outdoorSales, saleSortField, saleSortDir])
    const sortedIndoorSales = useMemo(() => sortSales(indoorSales), [indoorSales, saleSortField, saleSortDir])
    const sortedOutdoorReturns = useMemo(() => sortReturns(outdoorReturns), [outdoorReturns, returnSortField, returnSortDir])
    const sortedIndoorReturns = useMemo(() => sortReturns(indoorReturns), [indoorReturns, returnSortField, returnSortDir])

    const toggleRow = (invoiceNumber: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev)
            if (next.has(invoiceNumber)) {
                next.delete(invoiceNumber)
            } else {
                next.add(invoiceNumber)
            }
            return next
        })
    }

    // Render helpers (NOT components — avoids the "created during render" issue)
    const renderSaleSortHeader = (field: SaleSortField, children: string) => (
        <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=active]:text-primary font-semibold"
            data-state={saleSortField === field ? "active" : ""}
            onClick={() => handleSaleSort(field)}
        >
            {children}
            <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
        </Button>
    )

    const renderReturnSortHeader = (field: ReturnSortField, children: string) => (
        <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=active]:text-primary font-semibold"
            data-state={returnSortField === field ? "active" : ""}
            onClick={() => handleReturnSort(field)}
        >
            {children}
            <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
        </Button>
    )

    // CSV Export
    const handleExportCSV = () => {
        if (!data) return

        let csvContent = "data:text/csv;charset=utf-8,"

        // Outdoor Sales
        csvContent += "OUTDOOR SALES\n"
        csvContent += "SL No,Patient No,Invoice No,Total Price,Discount,Tax,Net Amount,Paid,Due,Created By,Date\n"
        outdoorSales.forEach(s => {
            csvContent += `${s.slNo},${s.patientNumber},${s.invoiceNumber},${s.totalPrice},${s.discountAmount},${s.taxAmount},${s.netAmount},${s.paid},${s.due},${s.createdBy || ''},${s.createdAt ? format(new Date(s.createdAt), 'yyyy-MM-dd') : ''}\n`
        })

        // Indoor Sales
        csvContent += "\nINDOOR SALES\n"
        csvContent += "SL No,Patient No,Invoice No,Total Price,Discount,Tax,Net Amount,Paid,Due,Created By,Date\n"
        indoorSales.forEach(s => {
            csvContent += `${s.slNo},${s.patientNumber},${s.invoiceNumber},${s.totalPrice},${s.discountAmount},${s.taxAmount},${s.netAmount},${s.paid},${s.due},${s.createdBy || ''},${s.createdAt ? format(new Date(s.createdAt), 'yyyy-MM-dd') : ''}\n`
        })

        // Outdoor Returns
        if (outdoorReturns.length > 0) {
            csvContent += "\nOUTDOOR RETURNS\n"
            csvContent += "SL No,Patient No,Invoice No,Return Amount,Tax,Date\n"
            outdoorReturns.forEach(r => {
                csvContent += `${r.slNo},${r.patientNumber},${r.invoiceNumber},${r.totalReturn},${r.taxAmount},${r.createdAt ? format(new Date(r.createdAt), 'yyyy-MM-dd') : ''}\n`
            })
        }

        // Indoor Returns
        if (indoorReturns.length > 0) {
            csvContent += "\nINDOOR RETURNS\n"
            csvContent += "SL No,Patient No,Invoice No,Return Amount,Tax,Date\n"
            indoorReturns.forEach(r => {
                csvContent += `${r.slNo},${r.patientNumber},${r.invoiceNumber},${r.totalReturn},${r.taxAmount},${r.createdAt ? format(new Date(r.createdAt), 'yyyy-MM-dd') : ''}\n`
            })
        }

        // Summary
        csvContent += "\nSUMMARY\n"
        csvContent += `Total Price,${data.totalPrice}\n`
        csvContent += `Discount,${data.discountAmount}\n`
        csvContent += `Tax,${data.taxAmount}\n`
        csvContent += `Net Amount,${data.netAmount}\n`
        csvContent += `Paid,${data.paid}\n`
        csvContent += `Due,${data.due}\n`
        csvContent += `Total Return,${data.totalReturn}\n`

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        const startDate = date?.from ? format(date.from, 'yyyyMMdd') : ''
        const endDate = date?.to ? format(date.to, 'yyyyMMdd') : ''
        link.setAttribute("download", `pharmacy_sales_report_${startDate}_to_${endDate}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Compute subtotals for sale lists
    const computeSaleSubtotals = (items: IPharmacySaleItem[]) => ({
        totalPrice: items.reduce((sum, s) => sum + s.totalPrice, 0),
        discountAmount: items.reduce((sum, s) => sum + s.discountAmount, 0),
        taxAmount: items.reduce((sum, s) => sum + s.taxAmount, 0),
        netAmount: items.reduce((sum, s) => sum + s.netAmount, 0),
        paid: items.reduce((sum, s) => sum + s.paid, 0),
        due: items.reduce((sum, s) => sum + s.due, 0),
    })

    const computeReturnSubtotals = (items: IPharmacyReturnItem[]) => ({
        totalReturn: items.reduce((sum, r) => sum + r.totalReturn, 0),
        taxAmount: items.reduce((sum, r) => sum + r.taxAmount, 0),
    })

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Skeleton className="h-8 w-[260px] mb-2" />
                        <Skeleton className="h-4 w-[180px]" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-[260px]" />
                        <Skeleton className="h-10 w-[120px]" />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-[120px] mb-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-[200px]" /></CardHeader>
                    <CardContent className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                    </CardContent>
                </Card>
            </div>
        )
    }

    const renderSalesTable = (sales: IPharmacySaleItem[], emptyMessage: string) => {
        const subtotals = computeSaleSubtotals(sales)
        return (
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="w-8"></TableHead>
                            <TableHead className="w-12 text-center">{renderSaleSortHeader("slNo", "#")}</TableHead>
                            <TableHead>{renderSaleSortHeader("patientNumber", "Patient No")}</TableHead>
                            <TableHead>{renderSaleSortHeader("invoiceNumber", "Invoice No")}</TableHead>
                            <TableHead className="text-right">{renderSaleSortHeader("totalPrice", "Total Price")}</TableHead>
                            <TableHead className="text-right">{renderSaleSortHeader("discountAmount", "Discount")}</TableHead>
                            <TableHead className="text-right">{renderSaleSortHeader("taxAmount", "Tax")}</TableHead>
                            <TableHead className="text-right">{renderSaleSortHeader("netAmount", "Net Amount")}</TableHead>
                            <TableHead className="text-right">{renderSaleSortHeader("paid", "Paid")}</TableHead>
                            <TableHead className="text-right">{renderSaleSortHeader("due", "Due")}</TableHead>
                            <TableHead>{renderSaleSortHeader("createdBy", "Created By")}</TableHead>
                            <TableHead>{renderSaleSortHeader("createdAt", "Date")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sales.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={12} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <ShoppingCart className="h-8 w-8 opacity-30" />
                                        <p className="font-medium">{emptyMessage}</p>
                                        <p className="text-sm">Try adjusting the date range or branch filter.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {sales.map((sale) => {
                                    const isExpanded = expandedRows.has(sale.invoiceNumber)
                                    const hasPayments = sale.payments && sale.payments.length > 0
                                    return (
                                        <>
                                            <TableRow
                                                key={sale.invoiceNumber}
                                                className="hover:bg-muted/50 cursor-pointer"
                                                onClick={() => hasPayments && toggleRow(sale.invoiceNumber)}
                                            >
                                                <TableCell className="w-8 px-2">
                                                    {hasPayments && (
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                            {isExpanded
                                                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                            }
                                                        </Button>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center font-medium">{sale.slNo}</TableCell>
                                                <TableCell className="font-mono text-xs">{sale.patientNumber}</TableCell>
                                                <TableCell className="font-mono text-xs">{sale.invoiceNumber}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(sale.totalPrice)}</TableCell>
                                                <TableCell className="text-right text-orange-600">{formatCurrency(sale.discountAmount)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(sale.taxAmount)}</TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(sale.netAmount)}</TableCell>
                                                <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(sale.paid)}</TableCell>
                                                <TableCell className="text-right">
                                                    {sale.due > 0
                                                        ? <span className="text-rose-600 font-medium">{formatCurrency(sale.due)}</span>
                                                        : <span className="text-muted-foreground">{formatCurrency(0)}</span>
                                                    }
                                                </TableCell>
                                                <TableCell className="text-sm">{sale.createdBy || '-'}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {sale.createdAt ? format(new Date(sale.createdAt), "dd MMM yyyy") : '-'}
                                                </TableCell>
                                            </TableRow>
                                            {/* Expanded payment details */}
                                            {isExpanded && hasPayments && (
                                                <TableRow key={`${sale.invoiceNumber}-payments`} className="bg-muted/20 hover:bg-muted/30">
                                                    <TableCell colSpan={12} className="p-0">
                                                        <div className="px-6 py-3 ml-8 border-l-2 border-primary/20">
                                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                                                Payment Transactions ({sale.payments.length})
                                                            </p>
                                                            <div className="grid gap-2">
                                                                {sale.payments.map((payment, pIdx) => (
                                                                    <div
                                                                        key={pIdx}
                                                                        className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm rounded-md bg-background/60 px-3 py-2 border"
                                                                    >
                                                                        <span className="text-muted-foreground whitespace-nowrap">
                                                                            {format(new Date(payment.date), "dd MMM yyyy, hh:mm a")}
                                                                        </span>
                                                                        <span className="font-semibold text-emerald-600">
                                                                            {formatCurrency(payment.amount)}
                                                                        </span>
                                                                        <Badge variant="secondary" className="capitalize text-xs">
                                                                            <CreditCard className="h-3 w-3 mr-1" />
                                                                            {payment.paymentMethod}
                                                                        </Badge>
                                                                        {payment.receiveAccount && (
                                                                            <span className="text-xs text-muted-foreground">
                                                                                → {payment.receiveAccount}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
                                    )
                                })}
                                {/* Subtotals */}
                                <TableRow className="bg-muted/60 font-bold hover:bg-muted/60">
                                    <TableCell colSpan={4} className="text-right">Sub Total:</TableCell>
                                    <TableCell className="text-right">{formatCurrency(subtotals.totalPrice)}</TableCell>
                                    <TableCell className="text-right text-orange-700">{formatCurrency(subtotals.discountAmount)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(subtotals.taxAmount)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(subtotals.netAmount)}</TableCell>
                                    <TableCell className="text-right text-emerald-700">{formatCurrency(subtotals.paid)}</TableCell>
                                    <TableCell className="text-right text-rose-700">{formatCurrency(subtotals.due)}</TableCell>
                                    <TableCell colSpan={2}></TableCell>
                                </TableRow>
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>
        )
    }

    const renderReturnsTable = (returns: IPharmacyReturnItem[], emptyMessage: string) => {
        const subtotals = computeReturnSubtotals(returns)
        return (
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead className="w-12 text-center">{renderReturnSortHeader("slNo", "#")}</TableHead>
                            <TableHead>{renderReturnSortHeader("patientNumber", "Patient No")}</TableHead>
                            <TableHead>{renderReturnSortHeader("invoiceNumber", "Invoice No")}</TableHead>
                            <TableHead className="text-right">{renderReturnSortHeader("totalReturn", "Return Amount")}</TableHead>
                            <TableHead className="text-right">{renderReturnSortHeader("taxAmount", "Tax")}</TableHead>
                            <TableHead>{renderReturnSortHeader("createdAt", "Date")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {returns.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <RotateCcw className="h-8 w-8 opacity-30" />
                                        <p className="font-medium">{emptyMessage}</p>
                                        <p className="text-sm">No returns recorded in this period.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {returns.map((ret) => (
                                    <TableRow key={`${ret.invoiceNumber}-${ret.slNo}`} className="hover:bg-muted/50">
                                        <TableCell className="text-center font-medium">{ret.slNo}</TableCell>
                                        <TableCell className="font-mono text-xs">{ret.patientNumber}</TableCell>
                                        <TableCell className="font-mono text-xs">{ret.invoiceNumber}</TableCell>
                                        <TableCell className="text-right text-rose-600 font-medium">{formatCurrency(ret.totalReturn)}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(ret.taxAmount)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {ret.createdAt ? format(new Date(ret.createdAt), "dd MMM yyyy") : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {/* Subtotals */}
                                <TableRow className="bg-muted/60 font-bold hover:bg-muted/60">
                                    <TableCell colSpan={3} className="text-right">Total Return:</TableCell>
                                    <TableCell className="text-right text-rose-700">{formatCurrency(subtotals.totalReturn)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(subtotals.taxAmount)}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pharmacy Sales Report</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Detailed pharmacy sales, returns, and payment transactions.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <DatePickerWithRange date={date} setDate={setDate} />
                    <Button variant="outline" className="gap-2" onClick={handleExportCSV} disabled={!data}>
                        <FileDown className="h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Net Amount */}
                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
                        <Banknote className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">{formatCurrency(data?.netAmount || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Gross: {formatCurrency(data?.totalPrice || 0)}
                        </p>
                    </CardContent>
                </Card>

                {/* Total Paid */}
                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                        <Wallet className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(data?.paid || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Collected within selected dates
                        </p>
                    </CardContent>
                </Card>

                {/* Total Due */}
                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Due</CardTitle>
                        <TrendingDown className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{formatCurrency(data?.due || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Remaining for this period
                        </p>
                    </CardContent>
                </Card>

                {/* Total Returns */}
                <Card className="border-l-4 border-l-rose-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                        <RotateCcw className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600">{formatCurrency(data?.totalReturn || 0)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {outdoorReturns.length + indoorReturns.length} return transaction(s)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabbed Data Tables */}
            <Card>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <CardTitle>Sales & Returns</CardTitle>
                            <TabsList>
                                <TabsTrigger value="outdoor-sales" className="gap-1.5">
                                    <ShoppingCart className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Outdoor Sales</span>
                                    <span className="sm:hidden">Outdoor</span>
                                    {outdoorSales.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{outdoorSales.length}</Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="indoor-sales" className="gap-1.5">
                                    <Pill className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Indoor Sales</span>
                                    <span className="sm:hidden">Indoor</span>
                                    {indoorSales.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{indoorSales.length}</Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="outdoor-returns" className="gap-1.5">
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Outdoor Returns</span>
                                    <span className="sm:hidden">Out Ret.</span>
                                    {outdoorReturns.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{outdoorReturns.length}</Badge>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="indoor-returns" className="gap-1.5">
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Indoor Returns</span>
                                    <span className="sm:hidden">In Ret.</span>
                                    {indoorReturns.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{indoorReturns.length}</Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TabsContent value="outdoor-sales" className="mt-0">
                            {renderSalesTable(sortedOutdoorSales, "No outdoor sales data found")}
                        </TabsContent>
                        <TabsContent value="indoor-sales" className="mt-0">
                            {renderSalesTable(sortedIndoorSales, "No indoor sales data found")}
                        </TabsContent>
                        <TabsContent value="outdoor-returns" className="mt-0">
                            {renderReturnsTable(sortedOutdoorReturns, "No outdoor returns found")}
                        </TabsContent>
                        <TabsContent value="indoor-returns" className="mt-0">
                            {renderReturnsTable(sortedIndoorReturns, "No indoor returns found")}
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
    )
}
