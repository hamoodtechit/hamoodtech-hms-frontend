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
import { ArrowDownRight, ArrowUpRight, DollarSign, Package, TrendingUp } from "lucide-react"
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

export function AnalyticsDashboard() {
  
  // Mock Data
  const salesData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Sales ($)',
        data: [1200, 1900, 1500, 2200, 2800, 3500, 2100],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.3,
      },
    ],
  }

  const topProductsData = {
    labels: ['Paracetamol', 'Amoxicillin', 'Insulin', 'Vitamin C', 'Masks'],
    datasets: [
      {
        label: 'Units Sold',
        data: [450, 320, 210, 180, 500],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
      },
    ],
  }

  const stockData = {
    labels: ['Sufficient', 'Low Stock', 'Out of Stock'],
    datasets: [
      {
        data: [85, 12, 3],
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
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue (Weekly)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$15,200</div>
                    <p className="text-xs text-muted-foreground flex items-center text-emerald-600">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                         +12.5% from last week
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$45.50</div>
                    <p className="text-xs text-muted-foreground flex items-center text-emerald-600">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                         +2.1% from last week
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">342</div>
                     <p className="text-xs text-muted-foreground flex items-center text-rose-600">
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                         -4% from last week
                    </p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">12</div>
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
