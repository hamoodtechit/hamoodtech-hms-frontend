"use client"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useServiceSalesReport } from "@/hooks/report-queries"
import { useDiagnosticTests } from "@/hooks/diagnostic-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useStoreContext } from "@/store/use-store-context"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { FilterPopover } from "@/components/shared/filter-popover"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { endOfDay, format, startOfMonth } from "date-fns"
import { useMemo, useState, type ReactNode } from "react"
import { DateRange } from "react-day-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { IServiceSalesItem } from "@/types/report"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Activity,
    ArrowUpDown,
    BadgePercent,
    Layers,
    ShoppingCart,
    TrendingUp,
    FileDown,
    Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type SortField = "serviceName" | "totalSaleCount" | "totalAmount" | "totalDiscount" | "netAmount"
type SortDir = "asc" | "desc"

export function ServiceSalesDashboard() {
    const { stores, activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfDay(new Date()),
    })
    const [sortField, setSortField] = useState<SortField>("netAmount")
    const [sortDir, setSortDir] = useState<SortDir>("desc")
    const [serviceId, setServiceId] = useState<string>("")

    const { data: testsData, isLoading: isLoadingTests } = useDiagnosticTests({ branchId: activeStoreId || undefined })
    
    const { data: reportData, isLoading } = useServiceSalesReport({
        branchId: activeStoreId || undefined,
        startDate: date?.from ? format(date.from, "yyyy-MM-dd") : undefined,
        endDate: date?.to ? format(endOfDay(date.to), "yyyy-MM-dd") : undefined,
        serviceId: serviceId || undefined,
    })

    const services: IServiceSalesItem[] = reportData?.data || []

    // Aggregated totals
    const totals = useMemo(() => {
        return services.reduce(
            (acc, s) => ({
                totalSaleCount: acc.totalSaleCount + (s.totalSaleCount || 0),
                totalAmount: acc.totalAmount + (s.totalAmount || 0),
                totalDiscount: acc.totalDiscount + (s.totalDiscount || 0),
                netAmount: acc.netAmount + (s.netAmount || 0),
            }),
            { totalSaleCount: 0, totalAmount: 0, totalDiscount: 0, netAmount: 0 }
        )
    }, [services])

    // Sorting
    const sortedServices = useMemo(() => {
        return [...services].sort((a, b) => {
            const aVal = a[sortField]
            const bVal = b[sortField]
            if (typeof aVal === "string" && typeof bVal === "string") {
                return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
            }
            return sortDir === "asc"
                ? (aVal as number) - (bVal as number)
                : (bVal as number) - (aVal as number)
        })
    }, [services, sortField, sortDir])

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(prev => (prev === "asc" ? "desc" : "asc"))
        } else {
            setSortField(field)
            setSortDir("desc")
        }
    }

    const renderSortHeader = (field: SortField, children: ReactNode) => (
        <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=active]:text-primary font-semibold"
            data-state={sortField === field ? "active" : ""}
            onClick={() => handleSort(field)}
        >
            {children}
            <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
        </Button>
    )

    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,"
        csvContent += "Service Name,Sale Count,Total Amount,Discount,Net Amount\n"

        if (sortedServices.length > 0) {
            sortedServices.forEach(service => {
                const row = [
                    `"${service.serviceName}"`,
                    service.totalSaleCount,
                    service.totalAmount,
                    service.totalDiscount,
                    service.netAmount
                ]
                csvContent += row.join(",") + "\n"
            })
            
            // Grand Total
            csvContent += `\n"GRAND TOTAL",${totals.totalSaleCount},${totals.totalAmount},${totals.totalDiscount},${totals.netAmount}\n`
        } else {
            csvContent += "No data available\n"
        }

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        
        const startStr = date?.from ? format(date.from, "yyyy-MM-dd") : "all"
        const endStr = date?.to ? format(date.to, "yyyy-MM-dd") : "all"
        
        link.setAttribute("download", `service_sales_report_${startStr}_to_${endStr}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const handlePrintReport = () => {
        const printContent = document.getElementById('service-sales-print-content')?.innerHTML
        if (!printContent) return
        
        const activeBranch = stores.find(s => s.id === activeStoreId)
        const logoSrc = activeBranch?.logoUrl || "/Logo.png"
        const hospitalName = activeBranch?.name || "PATWARY GENERAL HOSPITAL"
        
        const startDateStr = date?.from ? format(date.from, "dd MMM yyyy") : ""
        const endDateStr = date?.to ? format(date.to, "dd MMM yyyy") : ""
        const dateStr = startDateStr && endDateStr ? `From ${startDateStr} to ${endDateStr}` : ""

        const iframe = document.createElement('iframe')
        iframe.style.cssText = 'position:fixed; width:100vw; height:100vh; left:-100vw; top:-100vh; border:none;'
        document.body.appendChild(iframe)

        const iframeDoc = iframe.contentWindow?.document
        if (iframeDoc) {
            iframeDoc.open()
            iframeDoc.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Service Sales Report</title>
                        ${Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(el => el.outerHTML).join('\n')}
                        <style>
                            @page { size: A4; margin: 0; }
                            body { background: white !important; margin: 0; padding: 0; font-family: sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; display: flex; justify-content: center; }
                            .print-container { width: 210mm; min-height: 297mm; padding: 10mm; box-sizing: border-box; font-family: sans-serif; }
                            /* Fix scrollbars on print */
                            * { overflow: visible !important; overflow-x: visible !important; overflow-y: visible !important; }
                            ::-webkit-scrollbar { display: none !important; }
                            table { font-size: 10px !important; border-collapse: collapse !important; width: 100% !important; border: 1px solid black !important; }
                            th, td { border: 1px solid black !important; padding: 4px !important; color: black !important; }
                            thead tr { background-color: #f9fafb !important; }
                        </style>
                    </head>
                    <body>
                        <div class="print-container">
                            <!-- Header matching Pharmacy Sales Report -->
                            <div class="flex flex-col items-center mb-6" style="display: flex; flex-direction: column; align-items: center; margin-bottom: 24px;">
                                <img src="${logoSrc}" alt="Hospital Logo" class="h-16 w-auto mb-2" style="height: 64px; width: auto; margin-bottom: 8px;" />
                                <div class="text-center" style="text-align: center;">
                                    <h1 class="text-2xl font-bold uppercase" style="font-size: 24px; font-weight: bold; text-transform: uppercase;">${hospitalName}</h1>
                                    <h2 class="text-xl font-bold underline mt-1" style="font-size: 20px; font-weight: bold; text-decoration: underline; margin-top: 4px;">Service Sales Statement</h2>
                                    <p class="text-sm mt-2" style="font-size: 14px; margin-top: 8px;">
                                        ${dateStr}
                                    </p>
                                </div>
                            </div>
                            
                            ${printContent}
                        </div>
                    </body>
                </html>
            `)
            iframeDoc.close()

            setTimeout(() => {
                iframe.contentWindow?.focus()
                iframe.contentWindow?.print()
                setTimeout(() => {
                    document.body.removeChild(iframe)
                }, 1000)
            }, 500)
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Skeleton className="h-8 w-[260px] mb-2" />
                        <Skeleton className="h-4 w-[340px]" />
                    </div>
                    <Skeleton className="h-10 w-[280px]" />
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
                        {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Service Sales Report</h2>
                    <p className="text-muted-foreground mt-1">
                        Sales performance breakdown by individual service
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <FilterPopover 
                        activeFilterCount={serviceId ? 1 : 0}
                        onReset={() => setServiceId("")}
                        className="w-[300px]"
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Service / Test</label>
                                <SearchableSelect 
                                    value={serviceId}
                                    onChange={setServiceId}
                                    options={testsData?.data?.map(t => ({ id: t.id, name: t.name })) || []}
                                    loading={isLoadingTests}
                                    placeholder="Select a service..."
                                    allLabel="All Services"
                                />
                            </div>
                        </div>
                    </FilterPopover>
                    <DatePickerWithRange date={date} setDate={setDate} />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <FileDown className="h-4 w-4" />
                                Download
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={handlePrintReport}>
                                <Printer className="h-4 w-4" />
                                Print / PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={handleExportCSV}>
                                <FileDown className="h-4 w-4" />
                                Export CSV
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-violet-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                        <Layers className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-violet-700">{services.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Unique services sold</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">{formatCurrency(totals.totalAmount)}</div>
                        <p className="text-xs text-muted-foreground mt-1">{totals.totalSaleCount} total transactions</p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Discount</CardTitle>
                        <BadgePercent className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-700">{formatCurrency(totals.totalDiscount)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totals.totalAmount > 0
                                ? `${((totals.totalDiscount / totals.totalAmount) * 100).toFixed(1)}% of gross sales`
                                : "No sales yet"
                            }
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-700">{formatCurrency(totals.netAmount)}</div>
                        <p className="text-xs text-muted-foreground mt-1">After all discounts</p>
                    </CardContent>
                </Card>
            </div>

            {/* Data Table */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Service-wise Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent id="service-sales-print-content">
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="w-12 text-center">#</TableHead>
                                    <TableHead>
                                        {renderSortHeader("serviceName", "Service Name")}
                                    </TableHead>
                                    <TableHead className="text-center">
                                        {renderSortHeader("totalSaleCount", "Sale Count")}
                                    </TableHead>
                                    <TableHead className="text-right">
                                        {renderSortHeader("totalAmount", "Total Amount")}
                                    </TableHead>
                                    <TableHead className="text-right">
                                        {renderSortHeader("totalDiscount", "Discount")}
                                    </TableHead>
                                    <TableHead className="text-right">
                                        {renderSortHeader("netAmount", "Net Amount")}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedServices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Activity className="h-8 w-8 opacity-30" />
                                                <p className="font-medium">No service sales data found</p>
                                                <p className="text-sm">Try adjusting the date range or branch filter.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <>
                                        {sortedServices.map((service, idx) => (
                                            <TableRow key={service.serviceId} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="text-center text-muted-foreground font-mono text-xs">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="font-semibold">{service.serviceName}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center justify-center min-w-[2.5rem] rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                                        {service.totalSaleCount}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    {formatCurrency(service.totalAmount)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm text-amber-600">
                                                    {formatCurrency(service.totalDiscount)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm font-semibold text-emerald-600">
                                                    {formatCurrency(service.netAmount)}
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {/* Grand Total Row */}
                                        <TableRow className="bg-muted/50 font-bold border-t-2">
                                            <TableCell colSpan={2} className="text-right uppercase text-xs tracking-wider">
                                                Grand Total
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center justify-center min-w-[2.5rem] rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                                                    {totals.totalSaleCount}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatCurrency(totals.totalAmount)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-amber-700">
                                                {formatCurrency(totals.totalDiscount)}
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-emerald-700">
                                                {formatCurrency(totals.netAmount)}
                                            </TableCell>
                                        </TableRow>
                                    </>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
