"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFinanceExpenseReport, useFinanceIncomeReport } from "@/hooks/finance-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useStoreContext } from "@/store/use-store-context"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { endOfDay, format, startOfMonth } from "date-fns"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { IncomeGroup, ExpenseGroup } from "@/types/finance"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { createRoot } from 'react-dom/client'
import { FinanceStatementReport } from "./finance-statement-report"
import { DollarSign, ArrowUpRight, ArrowDownRight, Wallet, FileDown, Printer, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function FinanceReportsDashboard() {
  const { activeStoreId, stores } = useStoreContext()
  const { formatCurrency } = useCurrency()
  const [date, setDate] = useState<DateRange | undefined>()
  const [saleType, setSaleType] = useState<string>("all")

  useEffect(() => {
    setDate({
        from: startOfMonth(new Date()),
        to: endOfDay(new Date()),
    })
  }, [])

  const startDate = date?.from ? format(date.from, 'yyyy-MM-dd') : undefined
  const endDate = date?.to ? format(date.to, 'yyyy-MM-dd') : undefined

  const { data: incomeData, isLoading: incomeLoading } = useFinanceIncomeReport({
    branchId: activeStoreId || undefined,
    startDate: date?.from ? date.from.toISOString() : undefined,
    endDate: date?.to ? endOfDay(date.to).toISOString() : undefined,
    type: saleType === "all" ? undefined : saleType
  }, { enabled: !!date?.from && !!date?.to })

  const { data: expenseData, isLoading: expenseLoading } = useFinanceExpenseReport({
    branchId: activeStoreId || undefined,
    startDate: date?.from ? date.from.toISOString() : undefined,
    endDate: date?.to ? endOfDay(date.to).toISOString() : undefined
  }, { enabled: !!date?.from && !!date?.to })

  if (incomeLoading || expenseLoading) {
    return (
      <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
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

  const incomeResponse = incomeData?.data
  const expenseResponse = expenseData?.data

  const totalIncome = incomeResponse?.summary?.totalCollection || 0
  const totalExpense = expenseResponse?.summary?.totalExpenditure || 0
  const cashInHand = totalIncome - totalExpense

  const handleExportCSV = () => {
    if (!incomeResponse && !expenseResponse) {
        return
    }

    let csvContent = "data:text/csv;charset=utf-8,"

    // INCOME
    csvContent += "INCOME REPORT\n"
    if (incomeResponse?.groups) {
        csvContent += "Type,SL No,Patient No,Patient Name,Invoice No,Total Price,Discount,Tax,Net Amount,Paid,Due,Created By\n"
        incomeResponse.groups.forEach((group: IncomeGroup) => {
            group.sales.forEach((s: any) => {
                csvContent += `${group.type},${s.slNo},${s.patientNumber},${s.patientName},${s.invoiceNumber},${s.totalPrice},${s.discountAmount},${s.taxAmount},${s.netAmount},${s.paid},${s.due},${s.createdBy || ''}\n`
            })
            csvContent += `SUBTOTAL,,,,,,,,,${group.subTotals.paid},${group.subTotals.due},\n`
        })
    } else {
        csvContent += "No income data\n"
    }

    // EXPENSE
    csvContent += "\nEXPENSE REPORT\n"
    if (expenseResponse?.groups) {
        csvContent += "Category,SL No,Date,Expense No,Note,Recorded By,Amount\n"
        expenseResponse.groups.forEach((group: ExpenseGroup) => {
            group.expenses.forEach((e: any) => {
                csvContent += `${group.category},${e.slNo},${format(new Date(e.date), 'yyyy-MM-dd')},${e.expenseNumber},"${e.note || ''}",${e.recordedBy},${e.amount}\n`
            })
            csvContent += `SUBTOTAL,,,,,,${group.subTotals.amount}\n`
        })
    } else {
        csvContent += "No expense data\n"
    }

    // SUMMARY
    csvContent += "\nSUMMARY\n"
    csvContent += `Total Income,${totalIncome}\n`
    csvContent += `Total Expenditure,${totalExpense}\n`
    csvContent += `Cash in Hand,${cashInHand}\n`

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `finance_report_${startDate}_to_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrintReport = () => {
    if (!date?.from || !date?.to) {
        return
    }

    const printWindow = window.open('', '_blank')
    if (printWindow) {
        printWindow.document.write('<html><head><title>Finance Income & Expense Statement</title>')
        printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">')
        printWindow.document.write('</head><body><div id="report-root"></div></body></html>')
        printWindow.document.close()
        
        const container = printWindow.document.getElementById('report-root')
        if (container) {
            const root = createRoot(container)
            const activeBranch = stores.find(s => s.id === activeStoreId)
            root.render(
              <FinanceStatementReport 
                incomeData={incomeResponse} 
                expenseData={expenseResponse} 
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
            <h2 className="text-3xl font-bold tracking-tight">Finance Reports</h2>
            <div className="flex flex-wrap items-center gap-2">
                <Select value={saleType} onValueChange={setSaleType}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="appointment">Appointment</SelectItem>
                        <SelectItem value="hospital">Hospital</SelectItem>
                        <SelectItem value="admission">Admission</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                </Select>
                <DatePickerWithRange date={date} setDate={setDate} />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <FileDown className="h-4 w-4" />
                            Download Report
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem className="gap-2" onClick={handlePrintReport}>
                            <Printer className="h-4 w-4" />
                            Print Finance Statement
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={handleExportCSV}>
                            <FileDown className="h-4 w-4" />
                            Export Finance (CSV)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        {/* Global Stats Header */}
        <div className="grid gap-4 md:grid-cols-3">
            {/* Cash in Hand */}
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cash in Hand</CardTitle>
                    <Wallet className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-700">{formatCurrency(cashInHand)}</div>
                </CardContent>
            </Card>

            {/* Total Income */}
            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Income (Collection)</CardTitle>
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</div>
                </CardContent>
            </Card>

            {/* Total Expenditure */}
            <Card className="border-l-4 border-l-rose-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenditure</CardTitle>
                    <ArrowDownRight className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalExpense)}</div>
                </CardContent>
            </Card>
        </div>

        {/* Income Report */}
        <Card>
            <CardHeader>
                <CardTitle>Income Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
                {(!incomeResponse?.groups || incomeResponse.groups.length === 0) ? (
                    <div className="text-center py-8 text-muted-foreground italic">
                        No income data available for the selected dates.
                    </div>
                ) : (
                    <div className="space-y-8">
                        {incomeResponse.groups.map((group: IncomeGroup, index: number) => (
                            <div key={index}>
                                <h3 className="font-bold text-lg mb-4 capitalize">{group.type.toLowerCase()} Sales</h3>
                                <div className="rounded-md border overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">SL No</th>
                                                <th className="px-4 py-3 font-medium">Patient No</th>
                                                <th className="px-4 py-3 font-medium">Patient Name</th>
                                                <th className="px-4 py-3 font-medium">Invoice No</th>
                                                <th className="px-4 py-3 font-medium text-right">Total Price</th>
                                                <th className="px-4 py-3 font-medium text-right">Discount</th>
                                                <th className="px-4 py-3 font-medium text-right">Tax</th>
                                                <th className="px-4 py-3 font-medium text-right">Net Amount</th>
                                                <th className="px-4 py-3 font-medium text-right">Paid</th>
                                                <th className="px-4 py-3 font-medium text-right">Due</th>
                                                <th className="px-4 py-3 font-medium">Created By</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {group.sales.map((sale) => (
                                                <tr key={sale.slNo} className="hover:bg-muted/50">
                                                    <td className="px-4 py-2">{sale.slNo}</td>
                                                    <td className="px-4 py-2">{sale.patientNumber}</td>
                                                    <td className="px-4 py-2">{sale.patientName}</td>
                                                    <td className="px-4 py-2">{sale.invoiceNumber}</td>
                                                    <td className="px-4 py-2 text-right">{formatCurrency(sale.totalPrice)}</td>
                                                    <td className="px-4 py-2 text-right">{formatCurrency(sale.discountAmount)}</td>
                                                    <td className="px-4 py-2 text-right">{formatCurrency(sale.taxAmount)}</td>
                                                    <td className="px-4 py-2 text-right">{formatCurrency(sale.netAmount)}</td>
                                                    <td className="px-4 py-2 text-right text-emerald-600 font-medium">{formatCurrency(sale.paid)}</td>
                                                    <td className="px-4 py-2 text-right text-rose-600">{formatCurrency(sale.due)}</td>
                                                    <td className="px-4 py-2">{sale.createdBy || '-'}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-muted/50 font-bold">
                                                <td colSpan={4} className="px-4 py-3 text-right">Sub Total:</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(group.subTotals.totalPrice)}</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(group.subTotals.discountAmount)}</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(group.subTotals.taxAmount)}</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(group.subTotals.netAmount)}</td>
                                                <td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(group.subTotals.paid)}</td>
                                                <td className="px-4 py-3 text-right text-rose-700">{formatCurrency(group.subTotals.due)}</td>
                                                <td className="px-4 py-3"></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Expense Report */}
        <Card>
            <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
                {(!expenseResponse?.groups || expenseResponse.groups.length === 0) ? (
                    <div className="text-center py-8 text-muted-foreground italic">
                        No expense data available for the selected dates.
                    </div>
                ) : (
                    <div className="space-y-8">
                        {expenseResponse.groups.map((group: ExpenseGroup, index: number) => (
                            <div key={index}>
                                <h3 className="font-bold text-lg mb-4">{group.category} Expenses</h3>
                                <div className="rounded-md border overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">SL No</th>
                                                <th className="px-4 py-3 font-medium">Date</th>
                                                <th className="px-4 py-3 font-medium">Expense No</th>
                                                <th className="px-4 py-3 font-medium">Note</th>
                                                <th className="px-4 py-3 font-medium">Recorded By</th>
                                                <th className="px-4 py-3 font-medium text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {group.expenses.map((expense) => (
                                                <tr key={expense.slNo} className="hover:bg-muted/50">
                                                    <td className="px-4 py-2">{expense.slNo}</td>
                                                    <td className="px-4 py-2 whitespace-nowrap">{format(new Date(expense.date), 'dd MMM yyyy')}</td>
                                                    <td className="px-4 py-2">{expense.expenseNumber}</td>
                                                    <td className="px-4 py-2 max-w-md truncate" title={expense.note}>{expense.note}</td>
                                                    <td className="px-4 py-2">{expense.recordedBy}</td>
                                                    <td className="px-4 py-2 text-right font-medium">{formatCurrency(expense.amount)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-muted/50 font-bold">
                                                <td colSpan={5} className="px-4 py-3 text-right">Category Sub Total:</td>
                                                <td className="px-4 py-3 text-right text-rose-700">{formatCurrency(group.subTotals.amount)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  )
}
