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
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"

const escapeHtml = (value: string | number | undefined) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character)

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

  const downloadPdf = () => {
    if (!report || !date?.from || !date.to) return

    const rows = report.groups.flatMap((group: ExpenseGroup) => [
      `<tr class="category"><td colspan="6">${escapeHtml(group.category)} Expenses</td></tr>`,
      ...group.expenses.map((expense) => `<tr><td>${escapeHtml(expense.slNo)}</td><td>${escapeHtml(format(new Date(expense.date), "dd MMM yyyy"))}</td><td>${escapeHtml(expense.expenseNumber)}</td><td>${escapeHtml(expense.note || "-")}</td><td>${escapeHtml(expense.recordedBy || "-")}</td><td class="amount">${escapeHtml(Number(expense.amount).toFixed(2))}</td></tr>`),
      `<tr class="subtotal"><td colspan="5">Category Sub Total</td><td class="amount">${escapeHtml(Number(group.subTotals.amount).toFixed(2))}</td></tr>`,
    ]).join("")
    const branch = stores.find((store) => store.id === activeStoreId)
    const printWindow = window.open("", "_blank", "noopener,noreferrer")
    if (!printWindow) return

    printWindow.document.write(`<!doctype html><html><head><title>Expense Report</title><style>body{font-family:Arial,sans-serif;color:#111;margin:32px}h1,h2,p{text-align:center;margin:0 0 8px}h1{font-size:22px}h2{font-size:17px}.summary{margin:24px 0;padding:12px;border:1px solid #111;text-align:right;font-weight:bold}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #333;padding:7px;text-align:left}th{background:#f1f5f9}.category td{background:#fff1f2;font-weight:bold}.subtotal td{background:#f8fafc;font-weight:bold}.amount{text-align:right}@media print{body{margin:12mm}}</style></head><body><h1>${escapeHtml(branch?.name || "Hospital")}</h1><h2>Expense Report</h2><p>${escapeHtml(format(date.from, "dd MMM yyyy"))} to ${escapeHtml(format(date.to, "dd MMM yyyy"))}</p><div class="summary">Total Expenditure: ${escapeHtml(Number(totalExpense).toFixed(2))}</div><table><thead><tr><th>SL No</th><th>Date</th><th>Expense No</th><th>Note</th><th>Recorded By</th><th class="amount">Amount</th></tr></thead><tbody>${rows || '<tr><td colspan="6" style="text-align:center">No expense data available.</td></tr>'}</tbody></table></body></html>`)
    printWindow.document.close()
    printWindow.focus()
    window.setTimeout(() => printWindow.print(), 300)
  }

  if (isLoading) return <div className="space-y-6"><Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card><Card className="h-[400px]"><CardHeader><Skeleton className="h-6 w-48" /></CardHeader></Card></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-3xl font-bold tracking-tight">Expense Report</h2><p className="text-muted-foreground">Review expense records and download a PDF report.</p></div><div className="flex flex-wrap items-center gap-2"><DatePickerWithRange date={date} setDate={setDate} /><Button onClick={downloadPdf} disabled={!report} className="gap-2"><Download className="h-4 w-4" /> Download PDF</Button></div></div>
      <Card className="max-w-md border-l-4 border-l-rose-500 shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Expenditure</CardTitle><FileText className="h-4 w-4 text-rose-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-rose-600">{formatCurrency(totalExpense)}</div></CardContent></Card>
      <Card><CardHeader><CardTitle>Expense Breakdown</CardTitle></CardHeader><CardContent>{!report?.groups?.length ? <div className="py-8 text-center italic text-muted-foreground">No expense data available for the selected dates.</div> : <div className="space-y-8">{report.groups.map((group: ExpenseGroup, index: number) => <div key={index}><h3 className="mb-4 text-lg font-bold">{group.category} Expenses</h3><div className="overflow-x-auto rounded-md border"><table className="w-full text-left text-sm"><thead className="bg-muted text-muted-foreground"><tr><th className="px-4 py-3 font-medium">SL No</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Expense No</th><th className="px-4 py-3 font-medium">Note</th><th className="px-4 py-3 font-medium">Recorded By</th><th className="px-4 py-3 text-right font-medium">Amount</th></tr></thead><tbody className="divide-y">{group.expenses.map((expense) => <tr key={expense.slNo} className="hover:bg-muted/50"><td className="px-4 py-2">{expense.slNo}</td><td className="whitespace-nowrap px-4 py-2">{format(new Date(expense.date), "dd MMM yyyy")}</td><td className="px-4 py-2">{expense.expenseNumber}</td><td className="max-w-md truncate px-4 py-2" title={expense.note}>{expense.note || "-"}</td><td className="px-4 py-2">{expense.recordedBy || "-"}</td><td className="px-4 py-2 text-right font-medium">{formatCurrency(expense.amount)}</td></tr>)}<tr className="bg-muted/50 font-bold"><td colSpan={5} className="px-4 py-3 text-right">Category Sub Total:</td><td className="px-4 py-3 text-right text-rose-700">{formatCurrency(group.subTotals.amount)}</td></tr></tbody></table></div></div>)}</div>}</CardContent></Card>
    </div>
  )
}
