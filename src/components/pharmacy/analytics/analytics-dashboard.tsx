"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { DollarSign, Package, TrendingUp } from "lucide-react"
import { Bar, Doughnut, Line } from "react-chartjs-2"

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

import { Skeleton } from "@/components/ui/skeleton"
import { usePharmacyGraph, usePharmacyStats, useTopSellingProducts } from "@/hooks/pharmacy-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useStoreContext } from "@/store/use-store-context"
import { TopSellingProduct } from "@/types/pharmacy"

import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { addDays } from "date-fns"
import { useState } from "react"
import { DateRange } from "react-day-picker"

export function AnalyticsDashboard() {
  const { activeStoreId } = useStoreContext()
  const { formatCurrency } = useCurrency()
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  })

  // Format dates for API
  const startDate = date?.from ? date.from.toISOString() : undefined
  const endDate = date?.to ? date.to.toISOString() : undefined
  
  const { data: stats, isLoading: statsLoading } = usePharmacyStats({ 
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

  const { data: topProductsResponse, isLoading: topProductsLoading } = useTopSellingProducts({
    branchId: activeStoreId || undefined,
    startDate,
    endDate,
    days: !startDate ? 30 : undefined
  })

  if (statsLoading || graphLoading || topProductsLoading) {
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
  const graphDataItems = graphResponse?.data || []
  const topProducts = topProductsResponse?.data || []

  // Average Order Value
  const avgOrderValue = pStats?.salesCount ? (pStats.totalSales / pStats.salesCount) : 0

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

  const topProductsData = {
    labels: topProducts.map((p: TopSellingProduct) => p.name),
    datasets: [
      {
        label: 'Units Sold',
        data: topProducts.map((p: TopSellingProduct) => p.unitsSold),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(199, 199, 199, 0.8)',
          'rgba(83, 102, 255, 0.8)',
        ],
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
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center space-x-2">
                <DatePickerWithRange date={date} setDate={setDate} />
            </div>
        </div>
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(pStats?.totalSales || 0)}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                         Cumulative sales performance
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</div>
                    <p className="text-xs text-muted-foreground flex items-center">
                         Revenue per transaction
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pStats?.salesCount || 0}</div>
                     <p className="text-xs text-muted-foreground flex items-center">
                        Total POS sales processed
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pStats?.lowStockCount || 0}</div>
                    <p className="text-xs text-muted-foreground">
                        Requires attention
                    </p>
                </CardContent>
            </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Sales Overview</CardTitle>
                    <CardDescription>Daily revenue for the current week.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[300px] w-full">
                        <Line 
                            data={salesData} 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'top' as const },
                                }
                            }} 
                        />
                    </div>
                </CardContent>
            </Card>
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Inventory Health</CardTitle>
                    <CardDescription>Stock status distribution.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <Doughnut 
                            data={stockData} 
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { position: 'bottom' as const },
                                }
                            }} 
                        />
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
             <Card className="col-span-7">
                <CardHeader>
                    <CardTitle>Top Selling Products</CardTitle>
                    <CardDescription>Most popular items by units sold.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="h-[300px] w-full">
                        <Bar 
                            data={topProductsData} 
                             options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
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
