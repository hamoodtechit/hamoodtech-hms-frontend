"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
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
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CreditCard, DollarSign, Users } from "lucide-react"
import { Line } from "react-chartjs-2"

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

const patientData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "New Patients",
        data: [12, 19, 15, 22, 28, 14, 8],
        backgroundColor: "rgba(99, 102, 241, 0.8)",
        borderRadius: 4,
      },
    ],
  }

export function Overview() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center gap-2">
            <Button asChild>
                <Link href="/pharmacy/pos">New Sale</Link>
            </Button>
            <Button variant="outline">Download Report</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground text-emerald-600 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground text-emerald-600 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +180.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Today</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12,234</div>
            <p className="text-xs text-muted-foreground text-rose-600 flex items-center mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -4% from yesterday
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7 Items</div>
            <p className="text-xs text-muted-foreground text-orange-600 flex items-center mt-1">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 md:col-span-2 lg:col-span-4 overflow-hidden">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue performance for the current year.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] w-full min-w-0">
                <Line 
                    data={revenueData} 
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
                                ticks: { callback: (value) => `$${value}` } 
                            },
                            x: { grid: { display: false } }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                                padding: 12,
                                titleFont: { size: 13 },
                                bodyFont: { size: 12 },
                                displayColors: false,
                                callbacks: {
                                    label: (context) => `Revenue: $${context.parsed.y}`
                                }
                            }
                        }
                    }} 
                />
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-4 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
                {[
                    { title: "New Sale #TRX-9821", desc: "Sold to John Doe", time: "2 min ago", amount: "+$120.00" },
                    { title: "Stock Alert", desc: "Paracetamol below limit", time: "15 min ago", color: "text-red-500" },
                    { title: "New Patient", desc: "Sarah Smith registered", time: "1 hour ago", amount: "+1 Patient" },
                    { title: "Purchase Order #PO-99", desc: "Sent to PharmaCorp", time: "3 hours ago", amount: "$4,500.00" },
                    { title: "Insurance Claim", desc: "Approved for Claim #CL-88", time: "5 hours ago", amount: "+$350.00" },
                ].map((item, i) => (
                    <div key={i} className="flex items-center">
                        <div className="space-y-1 overflow-hidden">
                            <p className="text-sm font-medium leading-none truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                        </div>
                        <div className={`ml-auto font-medium text-sm whitespace-nowrap pl-2 ${item.color || ""}`}>
                            {item.amount || item.time}
                        </div>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
