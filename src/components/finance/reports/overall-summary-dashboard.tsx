"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useOverallSummaryReport } from "@/hooks/report-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useStoreContext } from "@/store/use-store-context"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { endOfDay, format, startOfMonth } from "date-fns"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { ISalesByType } from "@/types/report"
import { Button } from "@/components/ui/button"
import { 
    DollarSign, 
    ArrowUpRight, 
    ArrowDownRight, 
    Wallet, 
    Activity, 
    TrendingUp, 
    FileText, 
    Users, 
    HeartHandshake,
    Stethoscope,
    Printer,
    FileDown
} from "lucide-react"
import { createRoot } from 'react-dom/client'
import { OverallSummaryPrint } from "./overall-summary-print"

export function OverallSummaryDashboard() {
  const { activeStoreId, stores } = useStoreContext()
  const { formatCurrency } = useCurrency()
  const [date, setDate] = useState<DateRange | undefined>()

  useEffect(() => {
    setDate({
        from: startOfMonth(new Date()),
        to: endOfDay(new Date()),
    })
  }, [])

  const { data: reportData, isLoading } = useOverallSummaryReport({
    branchId: activeStoreId || undefined,
    startDate: date?.from ? date.from.toISOString() : undefined,
    endDate: date?.to ? endOfDay(date.to).toISOString() : undefined,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
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
          <Card className="h-[400px]">
              <CardHeader><Skeleton className="h-6 w-[200px]" /></CardHeader>
              <CardContent><Skeleton className="h-full w-full" /></CardContent>
          </Card>
      </div>
    )
  }

  const response = reportData?.data
  const summary = response?.summary
  const consultations = response?.consultations
  const referrals = response?.referrals
  const salesByType = response?.salesByType || []

  const handlePrintReport = () => {
    if (!date?.from || !date?.to || !response) {
        return
    }

    const printWindow = window.open('', '_blank')
    if (printWindow) {
        printWindow.document.write('<html><head><title>Overall Financial Summary</title>')
        printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">')
        printWindow.document.write('</head><body><div id="report-root"></div></body></html>')
        printWindow.document.close()
        
        const container = printWindow.document.getElementById('report-root')
        if (container) {
            const root = createRoot(container)
            const activeBranch = stores.find(s => s.id === activeStoreId)
            root.render(
              <OverallSummaryPrint 
                reportData={response} 
                dateRange={{ from: date.from, to: date.to }} 
                activeBranch={activeBranch} 
              />
            )
            
            setTimeout(() => {
                printWindow.print()
            }, 1000)
        }
    }
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Overall Summary Report</h2>
                <p className="text-muted-foreground mt-1">High-level financial overview across all departments</p>
            </div>
            <div className="flex items-center gap-2">
                <DatePickerWithRange date={date} setDate={setDate} />
                <Button variant="outline" className="gap-2" onClick={handlePrintReport}>
                    <Printer className="h-4 w-4" />
                    Print / PDF
                </Button>
            </div>
        </div>

        {/* Global Stats Header - Row 1 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-700">{formatCurrency(summary?.totalSales || 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Gross invoice amount</p>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
                    <Wallet className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(summary?.totalPaid || 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total amount received</p>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Dues</CardTitle>
                    <TrendingUp className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-rose-600">{formatCurrency(summary?.totalDues || 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Outstanding balances</p>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{formatCurrency(summary?.totalDiscount || 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total discount given</p>
                </CardContent>
            </Card>
        </div>

        {/* Row 2 (Expenses & Purchases) */}
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-slate-50 dark:bg-slate-900 border-l-4 border-l-slate-400">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <FileText className="h-4 w-4 text-slate-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{formatCurrency(summary?.totalExpenses || 0)}</div>
                </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950 border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                    <FileText className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{formatCurrency(summary?.totalPurchases || 0)}</div>
                </CardContent>
            </Card>

            <Card className="bg-teal-50 dark:bg-teal-950 border-l-4 border-l-teal-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Purchase Payments</CardTitle>
                    <Wallet className="h-4 w-4 text-teal-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-teal-700 dark:text-teal-400">{formatCurrency(summary?.totalPurchasesPaid || 0)}</div>
                </CardContent>
            </Card>
        </div>

        {/* Row 3 (Profits) */}
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-indigo-50 dark:bg-indigo-950 border-l-4 border-l-indigo-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{formatCurrency(summary?.grossProfit || 0)}</div>
                </CardContent>
            </Card>

            <Card className="bg-emerald-50 dark:bg-emerald-950 border-l-4 border-l-emerald-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-bold">Net Profit</CardTitle>
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(summary?.netProfit || 0)}</div>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            {/* Consultations */}
            <Card>
                <CardHeader className="bg-muted/30 border-b pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Stethoscope className="h-5 w-5 text-blue-500" />
                        Consultations
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-dashed pb-2">
                            <span className="text-sm font-medium text-muted-foreground">Charge Collected</span>
                            <span className="font-bold">{formatCurrency(consultations?.chargePaid || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-dashed pb-2">
                            <span className="text-sm font-medium text-muted-foreground">Charge Due</span>
                            <span className="font-bold text-rose-600">{formatCurrency(consultations?.chargeDue || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2">
                            <span className="text-sm font-medium text-muted-foreground">Commission Paid</span>
                            <span className="font-bold text-amber-600">{formatCurrency(consultations?.commissionPaid || 0)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Referrals */}
            <Card>
                <CardHeader className="bg-muted/30 border-b pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <HeartHandshake className="h-5 w-5 text-purple-500" />
                        Referrals / Agents
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-dashed pb-2">
                            <span className="text-sm font-medium text-muted-foreground">Total Commission</span>
                            <span className="font-bold">{formatCurrency(referrals?.totalCommission || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-dashed pb-2">
                            <span className="text-sm font-medium text-muted-foreground">Commission Paid</span>
                            <span className="font-bold text-emerald-600">{formatCurrency(referrals?.commissionPaid || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2">
                            <span className="text-sm font-medium text-muted-foreground">Commission Due</span>
                            <span className="font-bold text-rose-600">{formatCurrency(referrals?.commissionDue || 0)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Sales by Type */}
        <Card>
            <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-indigo-500" />
                    Departmental Sales Breakdown
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider">Department</th>
                                <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider text-right">Total Sales</th>
                                <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider text-right">Discounts</th>
                                <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider text-right">Collection</th>
                                <th className="px-6 py-4 font-medium uppercase text-xs tracking-wider text-right">Dues</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {salesByType.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                        No sales data available for the selected period.
                                    </td>
                                </tr>
                            ) : (
                                salesByType.map((sale: ISalesByType, index: number) => (
                                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-semibold capitalize">{sale.type}</td>
                                        <td className="px-6 py-4 text-right">{formatCurrency(sale.totalSales)}</td>
                                        <td className="px-6 py-4 text-right text-amber-600">{formatCurrency(sale.totalDiscount)}</td>
                                        <td className="px-6 py-4 text-right text-emerald-600 font-medium">{formatCurrency(sale.totalPaid)}</td>
                                        <td className="px-6 py-4 text-right text-rose-600 font-medium">{formatCurrency(sale.totalDues)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
