"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePharmacyGraph, usePharmacyStats, usePurchases, useSales } from "@/hooks/pharmacy-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Link } from "@/i18n/navigation"
import { useStoreContext } from "@/store/use-store-context"
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js'

import { endOfDay, formatDistanceToNow, startOfMonth } from "date-fns"
import { AlertTriangle, CreditCard, DollarSign, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Line } from "react-chartjs-2"
import { DateRange } from "react-day-picker"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const revenueData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
  datasets: [
    {
      label: "Revenue",
      data: [4500, 5200, 4800, 6100, 5800, 7200, 8500],
      fill: true,
      backgroundColor: "rgba(34, 197, 94, 0.1)",
      borderColor: "rgb(34, 197, 94)",
      tension: 0.4,
    },
  ],
}

import { DatePickerWithRange } from "@/components/ui/date-range-picker"

export function Overview() {
  const { activeStoreId } = useStoreContext()
  const { formatCurrency } = useCurrency()
  const [date, setDate] = useState<DateRange | undefined>()

  useEffect(() => {
    setDate({
        from: startOfMonth(new Date()),
        to: endOfDay(new Date()),
    })
  }, [])

  const startDate = date?.from ? date.from.toISOString() : undefined
  const endDate = date?.to ? date.to.toISOString() : undefined

  const { data: statsRes, isLoading: loadingStats } = usePharmacyStats({ 
    branchId: activeStoreId || undefined, 
    startDate, 
    endDate 
  })

  // Memoize all-time params to prevent infinite loop
  // using branchId: undefined to get GLOBAL medicine count
  const allTimeParams = useMemo(() => ({
    branchId: undefined,
    startDate: '2000-01-01',
    endDate: new Date().toISOString().split('T')[0]
  }), [])

  // Fetch all-time stats for inventory counts
  const { data: allTimeStatsRes } = usePharmacyStats(allTimeParams)
  
  const { data: graphRes, isLoading: loadingGraph } = usePharmacyGraph({ 
    branchId: activeStoreId || undefined, 
    startDate, 
    endDate, 
    days: !startDate ? 7 : undefined 
  })

  // Recent Activity Data
  const { data: salesRes, isLoading: loadingSales } = useSales({ limit: 5, branchId: activeStoreId || undefined })
  const { data: purchasesRes, isLoading: loadingPurchases } = usePurchases({ limit: 5, branchId: activeStoreId || undefined })

  const stats = statsRes?.data
  const allTimeStats = allTimeStatsRes?.data
  const graphData = graphRes?.data || []
  const loading = loadingStats || loadingGraph

  const chartData = {
    labels: graphData.map(d => new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: "Sales",
        data: graphData.map(d => d.sales),
        fill: true,
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderColor: "rgb(34, 197, 94)",
        tension: 0.4,
      },
      {
        label: "Purchases",
        data: graphData.map(d => d.purchases),
        fill: true,
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderColor: "rgb(99, 102, 241)",
        tension: 0.4,
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <DatePickerWithRange date={date} setDate={setDate} />
            <Button asChild>
                <Link href="/pharmacy/pos">New Sale</Link>
            </Button>
            <Button variant="outline">Download Report</Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-3 w-[120px]" />
                </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalSales || 0)}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {stats?.salesCount || 0} sales processed
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stock</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-3 w-[120px]" />
                </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{allTimeStats?.totalMedicines || 0} Items</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  Across all categories
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-3 w-[120px]" />
                </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalPurchases || 0)}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {stats?.purchasesCount || 0} purchase orders
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-3 w-[120px]" />
                </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.lowStockCount || 0} Items</div>
                <p className="text-xs text-muted-foreground text-orange-600 flex items-center mt-1">
                  Requires immediate attention
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4 overflow-hidden">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue performance for the current year.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {loading ? (
                <Skeleton className="h-[350px] w-full" />
            ) : (
                <div className="h-[350px] w-full min-w-0">
                    <Line 
                        data={chartData} 
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: {
                                mode: 'index',
                                intersect: false,
                            },
                            scales: {
                                y: { 
                                    beginAtZero: true, 
                                    grid: { color: 'rgba(0,0,0,0.05)' },
                                    ticks: { callback: (value) => formatCurrency(Number(value)) } 
                                },
                                x: { grid: { display: false } }
                            },
                            plugins: {
                                legend: { 
                                    display: true,
                                    position: 'top',
                                    align: 'end',
                                    labels: {
                                        usePointStyle: true,
                                        boxWidth: 6,
                                        font: { size: 12 }
                                    }
                                },
                                tooltip: {
                                    backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                    padding: 12,
                                    titleFont: { size: 13 },
                                    bodyFont: { size: 12 },
                                    displayColors: true,
                                    callbacks: {
                                        label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                                    }
                                }
                            }
                        }} 
                    />
                </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || loadingSales || loadingPurchases ? (
                <div className="space-y-8">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center">
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-3 w-[100px]" />
                            </div>
                            <Skeleton className="h-4 w-[60px] ml-auto" />
                        </div>
                    ))}
                </div>
            ) : (
                <ActivityFeed 
                    sales={salesRes?.data?.sales || []} 
                    purchases={purchasesRes?.data?.purchases || []}
                    formatCurrency={formatCurrency}
                />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
function ActivityFeed({ sales, purchases, formatCurrency }: { sales: any[], purchases: any[], formatCurrency: any }) {
    // Merge and format activities
    const activities = [
        ...sales.map(s => ({
            id: s.id,
            title: `Sale ${s.invoiceNumber}`,
            desc: `Sold to ${s.patient?.name || 'Walk-in'}`,
            time: new Date(s.createdAt),
            amount: `+${formatCurrency(s.totalPrice)}`,
            color: "text-emerald-600"
        })),
        ...purchases.map(p => ({
            id: p.id,
            title: `Purchase ${p.poNumber || 'Order'}`,
            desc: `From ${p.supplier?.name || 'Unknown'}`,
            time: new Date(p.createdAt),
            amount: `-${formatCurrency(p.totalPrice)}`,
            color: "text-orange-600"
        }))
    ]
    .sort((a, b) => b.time.getTime() - a.time.getTime())
    .slice(0, 5)

    if (activities.length === 0) {
        return <div className="text-sm text-muted-foreground text-center py-4">No recent activity detected.</div>
    }

    return (
        <div className="space-y-8">
            {activities.map((item) => (
                <div key={item.id} className="flex items-center">
                    <div className="space-y-1 overflow-hidden">
                        <p className="text-sm font-medium leading-none truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            {item.desc} • {formatDistanceToNow(item.time, { addSuffix: true })}
                        </p>
                    </div>
                    <div className={`ml-auto font-medium text-sm whitespace-nowrap pl-2 ${item.color || ""}`}>
                        {item.amount}
                    </div>
                </div>
            ))}
        </div>
    )
}
