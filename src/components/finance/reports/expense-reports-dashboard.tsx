"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { useFinanceExpenseReport } from "@/hooks/finance-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useStoreContext } from "@/store/use-store-context"
import { ExpenseGroup } from "@/types/finance"
import { endOfDay, format, startOfMonth } from "date-fns"
import { Download, FileText } from "lucide-react"
import { createRoot } from "react-dom/client"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { ExpenseReportPrint } from "./expense-report-print"

export function ExpenseReportsDashboard() {
  const { activeStoreId, stores } = useStoreContext()
  const { formatCurrency } = useCurrency()
  const [date, setDate] = useState<DateRange | undefined>()

  useEffect(() => {
    setDate({ from: startOfMonth(new Date()), to: endOfDay(new Date()) })
  }, [])

  const { data, isLoading } = useFinanceExpenseReport({
    branchId: activeStoreId || undefined,
    startDate: date?.from?.toISOString(),
    endDate: date?.to ? endOfDay(date.to).toISOString() : undefined,
  }, { enabled: !!date?.from && !!date?.to })

  const report = data?.data
  const totalExpense = report?.summary?.totalExpenditure || 0

  const handlePrintReport = () => {
    if (!report || !date?.from || !date.to) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write('<html><head><title>Expense Report</title>')
    printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">')
    printWindow.document.write('</head><body><div id="report-root"></div></body></html>')
    printWindow.document.close()

    const container = printWindow.document.getElementById("report-root")
    if (!container) return

    const root = createRoot(container)
    const activeBranch = stores.find((store) => store.id === activeStoreId)
    root.render(<ExpenseReportPrint reportData={report} dateRange={{ from: date.from, to: date.to }} activeBranch={activeBranch} />)

    window.setTimeout(() => printWindow.print(), 1000)
  }

  if (isLoading) return <div className="space-y-6"><Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card><Card className="h-[400px]"><CardHeader><Skeleton className="h-6 w-48" /></CardHeader></Card></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-3xl font-bold tracking-tight">Expense Report</h2><p className="text-muted-foreground">Review expense records and download a PDF report.</p></div><div className="flex flex-wrap items-center gap-2"><DatePickerWithRange date={date} setDate={setDate} /><Button onClick={handlePrintReport} disabled={!report} className="gap-2"><Download className="h-4 w-4" /> Download PDF</Button></div></div>
      <Card className="max-w-md border-l-4 border-l-rose-500 shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Expenditure</CardTitle><FileText className="h-4 w-4 text-rose-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-rose-600">{formatCurrency(totalExpense)}</div></CardContent></Card>
      <Card><CardHeader><CardTitle>Expense Breakdown</CardTitle></CardHeader><CardContent>{!report?.groups?.length ? <div className="py-8 text-center italic text-muted-foreground">No expense data available for the selected dates.</div> : <div className="space-y-8">{report.groups.map((group: ExpenseGroup, index: number) => <div key={index}><h3 className="mb-4 text-lg font-bold">{group.category} Expenses</h3><div className="overflow-x-auto rounded-md border"><table className="w-full text-left text-sm"><thead className="bg-muted text-muted-foreground"><tr><th className="px-4 py-3 font-medium">SL No</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Expense No</th><th className="px-4 py-3 font-medium">Note</th><th className="px-4 py-3 font-medium">Recorded By</th><th className="px-4 py-3 text-right font-medium">Amount</th></tr></thead><tbody className="divide-y">{group.expenses.map((expense) => <tr key={expense.slNo} className="hover:bg-muted/50"><td className="px-4 py-2">{expense.slNo}</td><td className="whitespace-nowrap px-4 py-2">{format(new Date(expense.date), "dd MMM yyyy")}</td><td className="px-4 py-2">{expense.expenseNumber}</td><td className="max-w-md truncate px-4 py-2" title={expense.note}>{expense.note || "-"}</td><td className="px-4 py-2">{expense.recordedBy || "-"}</td><td className="px-4 py-2 text-right font-medium">{formatCurrency(expense.amount)}</td></tr>)}<tr className="bg-muted/50 font-bold"><td colSpan={5} className="px-4 py-3 text-right">Category Sub Total:</td><td className="px-4 py-3 text-right text-rose-700">{formatCurrency(group.subTotals.amount)}</td></tr></tbody></table></div></div>)}</div>}</CardContent></Card>
    </div>
  )
}
