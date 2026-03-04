"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { pharmacyService } from "@/services/pharmacy-service"
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js'
import { AlertTriangle, DollarSign, FileDown, Package, Printer } from "lucide-react"
import { Doughnut, Line } from "react-chartjs-2"
import { createRoot } from 'react-dom/client'
import { toast } from "sonner"
import { PharmacySalesReport } from "../reports/pharmacy-sales-report"

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { usePharmacyGraph, usePharmacyStats, usePharmacySummary } from "@/hooks/pharmacy-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useStoreContext } from "@/store/use-store-context"

import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { endOfDay, format, startOfMonth } from "date-fns"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"

export function AnalyticsDashboard() {
  const { activeStoreId, stores } = useStoreContext()
  const { formatCurrency } = useCurrency()
  const [date, setDate] = useState<DateRange | undefined>()

  useEffect(() => {
    setDate({
        from: startOfMonth(new Date()),
        to: endOfDay(new Date()),
    })
  }, [])

  const handleDownloadReport = async (type: 'print' | 'excel') => {
    if (!date?.from || !date?.to) {
        toast.error("Please select a date range")
        return
    }

    try {
        const loadingToast = toast.loading("Generating report...")
        const data = await pharmacyService.getSalesReport({
            branchId: activeStoreId || 'default-branch',
            startDate: format(date.from, 'yyyy-MM-dd'),
            endDate: format(date.to, 'yyyy-MM-dd')
        })
        toast.dismiss(loadingToast)

        if (type === 'print') {
            const printWindow = window.open('', '_blank')
            if (printWindow) {
                printWindow.document.write('<html><head><title>Pharmacy Sales Statement</title>')
                // Add tailwind for printing if needed, or just standard styles
                printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">')
                printWindow.document.write('</head><body><div id="report-root"></div></body></html>')
                printWindow.document.close()
                
                const container = printWindow.document.getElementById('report-root')
                if (container) {
                    const root = createRoot(container)
                    const activeBranch = stores.find(s => s.id === activeStoreId)
                    root.render(<PharmacySalesReport data={data.data} dateRange={{ from: date.from, to: date.to }} activeBranch={activeBranch} />)
                    
                    // Give it a moment to render then print
                    setTimeout(() => {
                        printWindow.print()
                        // printWindow.close()
                    }, 1000)
                }
            }
        } else {
            // Excel/CSV logic — Outdoor Sales
            const outdoorSales = data.data.outdoor?.sales || []
            const outdoorReturns = data.data.outdoor?.returns || []
            const summary = data.data.summary || {}

            let csvContent = "data:text/csv;charset=utf-8,"

            // Sales header & rows
            const salesHeaders = ["SL No", "Patient ID", "Bill ID", "Total Price", "Discount", "Tax", "Net Amount", "Paid", "Due", "Created By"]
            csvContent += "OUTDOOR SALES\n"
            csvContent += salesHeaders.join(",") + "\n"
            csvContent += outdoorSales.map((s: any) =>
                [s.slNo, s.patientNumber, s.invoiceNumber, s.totalPrice, s.discountAmount, s.taxAmount, s.netAmount, s.paid, s.due, s.createdBy].join(",")
            ).join("\n")

            // Returns
            if (outdoorReturns.length > 0) {
                const returnHeaders = ["SL No", "Patient ID", "Invoice", "Total Return", "Tax", "Date"]
                csvContent += "\n\nOUTDOOR RETURNS\n"
                csvContent += returnHeaders.join(",") + "\n"
                csvContent += outdoorReturns.map((r: any) =>
                    [r.slNo, r.patientNumber, r.invoiceNumber, r.totalReturn, r.taxAmount, r.createdAt ? format(new Date(r.createdAt), 'yyyy-MM-dd') : ''].join(",")
                ).join("\n")
            }

            // Summary
            csvContent += "\n\nSUMMARY\n"
            csvContent += `Gross Sale,${summary.totalSale || 0}\n`
            csvContent += `Total Return,${summary.totalReturn || 0}\n`
            csvContent += `Total Discount,${summary.totalDiscount || 0}\n`
            csvContent += `Net Sales,${summary.netSales || 0}\n`
            csvContent += `Total Collection,${summary.totalCollection || 0}\n`
            csvContent += `Net Collection,${summary.netCollection || 0}\n`
            
            const encodedUri = encodeURI(csvContent)
            const link = document.createElement("a")
            link.setAttribute("href", encodedUri)
            link.setAttribute("download", `pharmacy_sales_report_${format(date.from, 'yyyyMMdd')}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    } catch (error) {
        toast.error("Failed to generate report")
    }
  }

  // Format dates for API
  const startDate = date?.from ? format(date.from, 'yyyy-MM-dd') : undefined
  const endDate = date?.to ? format(date.to, 'yyyy-MM-dd') : undefined
  
  const { data: stats, isLoading: statsLoading } = usePharmacyStats({ 
    branchId: activeStoreId || undefined,
    startDate,
    endDate
  })

  const { data: summaryRes, isLoading: summaryLoading } = usePharmacySummary({
    branchId: activeStoreId || undefined,
    startDate,
    endDate
  })
  
  const { data: graphResponse, isLoading: graphLoading } = usePharmacyGraph({ 
    branchId: activeStoreId || undefined,
    startDate,
    endDate,
    // If no date range is selected, default to 7 days, otherwise don't send days
    days: !startDate ? 7 : undefined 
  })

  if (statsLoading || graphLoading || summaryLoading) {
    return (
      <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                  <Card key={i}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <Skeleton className="h-4 w-[100px]" />
                          <Skeleton className="h-4 w-4" />
                      </CardHeader>
                      <CardContent>
                          <Skeleton className="h-8 w-[120px] mb-2" />
                          <Skeleton className="h-3 w-[150px]" />
                      </CardContent>
                  </Card>
              ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4 h-[400px]">
                  <CardHeader><Skeleton className="h-6 w-[200px]" /></CardHeader>
                  <CardContent><Skeleton className="h-full w-full" /></CardContent>
              </Card>
              <Card className="col-span-3 h-[400px]">
                  <CardHeader><Skeleton className="h-6 w-[150px]" /></CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <Skeleton className="h-48 w-48 rounded-full" />
                  </CardContent>
              </Card>
          </div>
      </div>
    )
  }

  const pStats = stats?.data
  const summary = summaryRes?.data
  const graphDataItems = graphResponse?.data || []

  const salesData = {
    labels: graphDataItems.map(d => new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })),
    datasets: [
      {
        label: 'Sales ($)',
        data: graphDataItems.map(d => d.sales),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Purchases ($)',
        data: graphDataItems.map(d => d.purchases),
        borderColor: 'rgb(244, 63, 94)',
        backgroundColor: 'rgba(244, 63, 94, 0.5)',
        tension: 0.3,
        fill: true,
      },
    ],
  }

  const outOfStock = pStats?.outOfStockCount || 0
  const lowStock = pStats?.lowStockCount || 0
  const sufficient = (pStats?.totalMedicines || 0) - lowStock - outOfStock

  const stockData = {
    labels: ['Sufficient', 'Low Stock', 'Out of Stock'],
    datasets: [
      {
        data: [sufficient, lowStock, outOfStock],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center space-x-2">
                <DatePickerWithRange date={date} setDate={setDate} />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <FileDown className="h-4 w-4" />
                            Download Report
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2" onClick={() => handleDownloadReport('print')}>
                            <FileDown className="h-4 w-4" />
                            Download PDF Statement
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => handleDownloadReport('print')}>
                            <Printer className="h-4 w-4" />
                            Print Statement
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onClick={() => handleDownloadReport('excel')}>
                            <FileDown className="h-4 w-4" />
                            Export Excel (CSV)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        {/* Financial KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sales Revenue (Gross)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(summary?.sales?.totalAmount || 0)}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                         Net: {formatCurrency(summary?.sales?.netSales || 0)} 
                         <span className="text-emerald-500 ml-1">({summary?.sales?.count || 0} Tx)</span>
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                    <Package className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pStats?.lowStockCount || 0}</div>
                    <p className="text-xs text-muted-foreground">
                        Medicines requiring attention
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Medicine Inventory</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pStats?.totalMedicines || 0}</div>
                    <p className="text-xs text-muted-foreground">
                         Total distinct medicines
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{pStats?.expiringIn30Days || 0}</div>
                    <p className="text-xs text-muted-foreground">
                         Expiring within 30 days
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
            <Card className="lg:col-span-4">
                <CardHeader>
                    <CardTitle>Sales Overview</CardTitle>
                    <CardDescription>Daily revenue for the current week.</CardDescription>
                </CardHeader>
                <CardContent className="px-1 sm:px-4">
                    <div className="h-[250px] sm:h-[300px] w-full">
                        <Line 
                            data={salesData} 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { 
                                        position: 'top' as const,
                                        labels: {
                                            usePointStyle: true,
                                            boxWidth: 6,
                                            boxHeight: 6,
                                            padding: 10,
                                            font: { size: 10 }
                                        }
                                    },
                                }
                            }} 
                        />
                    </div>
                </CardContent>
            </Card>
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Inventory Health</CardTitle>
                    <CardDescription>Stock status distribution.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <div className="h-[250px] sm:h-[300px] w-full flex items-center justify-center">
                        <Doughnut 
                            data={stockData} 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { 
                                        position: 'bottom' as const,
                                        labels: {
                                            usePointStyle: true,
                                            padding: 10,
                                            font: { size: 10 }
                                        }
                                    },
                                }
                            }} 
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}

