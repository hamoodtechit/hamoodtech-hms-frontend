"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useFinanceIncomeReport } from "@/hooks/finance-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useStoreContext } from "@/store/use-store-context"
import { IncomeGroup } from "@/types/finance"
import { endOfDay, format, startOfMonth } from "date-fns"
import { ArrowUpRight, FileDown, Filter } from "lucide-react"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"

export function FinanceReportsDashboard() {
  const { activeStoreId } = useStoreContext()
  const { formatCurrency } = useCurrency()
  const [date, setDate] = useState<DateRange | undefined>()
  const [saleType, setSaleType] = useState("all")

  useEffect(() => {
    setDate({ from: startOfMonth(new Date()), to: endOfDay(new Date()) })
  }, [])

  const startDate = date?.from ? format(date.from, "yyyy-MM-dd") : undefined
  const endDate = date?.to ? format(date.to, "yyyy-MM-dd") : undefined
  const { data: incomeData, isLoading } = useFinanceIncomeReport({
    branchId: activeStoreId || undefined,
    startDate: date?.from?.toISOString(),
    endDate: date?.to ? endOfDay(date.to).toISOString() : undefined,
    type: saleType === "all" ? undefined : saleType,
  }, { enabled: !!date?.from && !!date?.to })

  const incomeResponse = incomeData?.data
  const totalIncome = incomeResponse?.summary?.totalCollection || 0

  const handleExportCSV = () => {
    if (!incomeResponse) return

    let csvContent = "data:text/csv;charset=utf-8,INCOME REPORT\n"
    csvContent += "Type,SL No,Patient No,Patient Name,Invoice No,Total Price,Discount,Tax,Net Amount,Paid,Due,Created By\n"
    incomeResponse.groups?.forEach((group: IncomeGroup) => {
      group.sales.forEach((sale) => {
        csvContent += `${group.type},${sale.slNo},${sale.patientNumber},${sale.patientName},${sale.invoiceNumber},${sale.totalPrice},${sale.discountAmount},${sale.taxAmount},${sale.netAmount},${sale.paid},${sale.due},${sale.createdBy || ""}\n`
      })
    })

    const link = document.createElement("a")
    link.href = encodeURI(csvContent)
    link.download = `sales_report_${startDate}_to_${endDate}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return <div className="space-y-6"><Card><CardHeader><Skeleton className="h-5 w-40" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card><Card className="h-[400px]"><CardHeader><Skeleton className="h-6 w-48" /></CardHeader></Card></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h2 className="text-3xl font-bold tracking-tight">Sales & Finance</h2><p className="text-muted-foreground">Review income and sales collections.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={saleType} onValueChange={setSaleType}><SelectTrigger className="w-[180px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Filter by type" /></SelectTrigger><SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="appointment">Appointment</SelectItem><SelectItem value="hospital">Hospital</SelectItem><SelectItem value="admission">Admission</SelectItem><SelectItem value="emergency">Emergency</SelectItem></SelectContent></Select>
          <DatePickerWithRange date={date} setDate={setDate} />
          <Button variant="outline" className="gap-2" onClick={handleExportCSV}><FileDown className="h-4 w-4" /> Export Sales (CSV)</Button>
        </div>
      </div>

      <div className="grid max-w-md gap-4"><Card className="border-l-4 border-l-emerald-500 shadow-sm"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Income (Collection)</CardTitle><ArrowUpRight className="h-4 w-4 text-emerald-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</div></CardContent></Card></div>

      <Card>
        <CardHeader><CardTitle>Income Breakdown</CardTitle></CardHeader>
        <CardContent>
          {!incomeResponse?.groups?.length ? <div className="py-8 text-center italic text-muted-foreground">No income data available for the selected dates.</div> : <div className="space-y-8">
            {incomeResponse.groups.map((group: IncomeGroup, index: number) => <div key={index}>
              <h3 className="mb-4 text-lg font-bold capitalize">{group.type.toLowerCase()} Sales</h3>
              <div className="overflow-x-auto rounded-md border"><table className="w-full text-left text-sm"><thead className="bg-muted text-muted-foreground"><tr><th className="px-4 py-3 font-medium">SL No</th><th className="px-4 py-3 font-medium">Patient No</th><th className="px-4 py-3 font-medium">Patient Name</th><th className="px-4 py-3 font-medium">Invoice No</th><th className="px-4 py-3 text-right font-medium">Total Price</th><th className="px-4 py-3 text-right font-medium">Discount</th><th className="px-4 py-3 text-right font-medium">Tax</th><th className="px-4 py-3 text-right font-medium">Net Amount</th><th className="px-4 py-3 text-right font-medium">Paid</th><th className="px-4 py-3 text-right font-medium">Due</th><th className="px-4 py-3 font-medium">Created By</th></tr></thead>
                <tbody className="divide-y">{group.sales.map((sale) => <tr key={sale.slNo} className="hover:bg-muted/50"><td className="px-4 py-2">{sale.slNo}</td><td className="px-4 py-2">{sale.patientNumber}</td><td className="px-4 py-2">{sale.patientName}</td><td className="px-4 py-2">{sale.invoiceNumber}</td><td className="px-4 py-2 text-right">{formatCurrency(sale.totalPrice)}</td><td className="px-4 py-2 text-right">{formatCurrency(sale.discountAmount)}</td><td className="px-4 py-2 text-right">{formatCurrency(sale.taxAmount)}</td><td className="px-4 py-2 text-right">{formatCurrency(sale.netAmount)}</td><td className="px-4 py-2 text-right font-medium text-emerald-600">{formatCurrency(sale.paid)}</td><td className="px-4 py-2 text-right text-rose-600">{formatCurrency(sale.due)}</td><td className="px-4 py-2">{sale.createdBy || "-"}</td></tr>)}
                <tr className="bg-muted/50 font-bold"><td colSpan={4} className="px-4 py-3 text-right">Sub Total:</td><td className="px-4 py-3 text-right">{formatCurrency(group.subTotals.totalPrice)}</td><td className="px-4 py-3 text-right">{formatCurrency(group.subTotals.discountAmount)}</td><td className="px-4 py-3 text-right">{formatCurrency(group.subTotals.taxAmount)}</td><td className="px-4 py-3 text-right">{formatCurrency(group.subTotals.netAmount)}</td><td className="px-4 py-3 text-right text-emerald-700">{formatCurrency(group.subTotals.paid)}</td><td className="px-4 py-3 text-right text-rose-700">{formatCurrency(group.subTotals.due)}</td><td /></tr></tbody></table></div>
            </div>)}
          </div>}
        </CardContent>
      </Card>
    </div>
  )
}
