"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDepartmentSalesReport } from "@/hooks/report-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useStoreContext } from "@/store/use-store-context"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { endOfDay, format, startOfMonth } from "date-fns"
import { useMemo, useState, type ReactNode } from "react"
import { DateRange } from "react-day-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { IDepartmentSalesItem } from "@/types/report"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"

type SortField = "departmentName" | "totalSaleCount" | "totalAmount" | "totalDiscount" | "netAmount"
type SortDir = "asc" | "desc"

export function DepartmentSalesDashboard() {
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfDay(new Date()),
    })
    const [sortField, setSortField] = useState<SortField>("netAmount")
    const [sortDir, setSortDir] = useState<SortDir>("desc")

    const { data: reportData, isLoading } = useDepartmentSalesReport({
        branchId: activeStoreId || undefined,
        startDate: date?.from ? format(date.from, "yyyy-MM-dd") : undefined,
        endDate: date?.to ? format(endOfDay(date.to), "yyyy-MM-dd") : undefined,
    })

    const departments: IDepartmentSalesItem[] = reportData?.data || []

    // Aggregated totals
    const totals = useMemo(() => {
        return departments.reduce(
            (acc, d) => ({
                totalSaleCount: acc.totalSaleCount + (d.totalSaleCount || 0),
                totalAmount: acc.totalAmount + (d.totalAmount || 0),
                totalDiscount: acc.totalDiscount + (d.totalDiscount || 0),
                netAmount: acc.netAmount + (d.netAmount || 0),
            }),
            { totalSaleCount: 0, totalAmount: 0, totalDiscount: 0, netAmount: 0 }
        )
    }, [departments])

    // Sorting
    const sortedDepartments = useMemo(() => {
        return [...departments].sort((a, b) => {
            const aVal = a[sortField]
            const bVal = b[sortField]
            if (typeof aVal === "string" && typeof bVal === "string") {
                return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
            }
            return sortDir === "asc"
                ? (aVal as number) - (bVal as number)
                : (bVal as number) - (aVal as number)
        })
    }, [departments, sortField, sortDir])

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
                    <h2 className="text-3xl font-bold tracking-tight">Department Sales Report</h2>
                    <p className="text-muted-foreground mt-1">
                        Sales performance breakdown by department
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <DatePickerWithRange date={date} setDate={setDate} />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-violet-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
                        <Layers className="h-4 w-4 text-violet-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-violet-700">{departments.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Departments with sales</p>
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
                        Department-wise Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 hover:bg-muted/40">
                                    <TableHead className="w-12 text-center">#</TableHead>
                                    <TableHead>
                                        {renderSortHeader("departmentName", "Department Name")}
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
                                {sortedDepartments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <Activity className="h-8 w-8 opacity-30" />
                                                <p className="font-medium">No department sales data found</p>
                                                <p className="text-sm">Try adjusting the date range or branch filter.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <>
                                        {sortedDepartments.map((department, idx) => (
                                            <TableRow key={department.departmentId} className="hover:bg-muted/30 transition-colors">
                                                <TableCell className="text-center text-muted-foreground font-mono text-xs">
                                                    {idx + 1}
                                                </TableCell>
                                                <TableCell className="font-semibold">{department.departmentName}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center justify-center min-w-[2.5rem] rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                                        {department.totalSaleCount}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    {formatCurrency(department.totalAmount)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm text-amber-600">
                                                    {formatCurrency(department.totalDiscount)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm font-semibold text-emerald-600">
                                                    {formatCurrency(department.netAmount)}
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
