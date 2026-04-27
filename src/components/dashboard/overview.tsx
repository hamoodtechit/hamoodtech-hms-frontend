"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { usePharmacyGraph, usePharmacyStats, usePharmacySummary, usePurchases } from "@/hooks/pharmacy-queries"
import { useSales } from "@/hooks/sales-queries"
import { useAppointments } from "@/hooks/appointment-queries"
import { useAdmissions } from "@/hooks/patient-queries"
import { useBeds } from "@/hooks/facility-queries"
import { useCurrency } from "@/hooks/use-currency"
import { usePermissions } from "@/hooks/use-permissions"
import { Link } from "@/i18n/navigation"
import { useStoreContext } from "@/store/use-store-context"
import { cn } from "@/lib/utils"
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

import { endOfDay, format, formatDistanceToNow, startOfMonth } from "date-fns"
import { 
    AlertTriangle, 
    CreditCard, 
    DollarSign, 
    Users, 
    Calendar, 
    Bed, 
    Activity, 
    Clock,
    Stethoscope,
    ChevronRight,
    ArrowUpRight
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Line } from "react-chartjs-2"
import { DateRange } from "react-day-picker"
import { PermissionGuard } from "@/components/shared/permission-guard"

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

import { DatePickerWithRange } from "@/components/ui/date-range-picker"

export function Overview() {
  const { activeStoreId } = useStoreContext()
  const { formatCurrency } = useCurrency()
  const { hasPermission } = usePermissions()
  const [date, setDate] = useState<DateRange | undefined>()

  useEffect(() => {
    setDate({
        from: startOfMonth(new Date()),
        to: endOfDay(new Date()),
    })
  }, [])

  const startDate = date?.from ? format(date.from, 'yyyy-MM-dd') : undefined
  const endDate = date?.to ? format(date.to, 'yyyy-MM-dd') : undefined

  // Permissions check
  const canReadSales = hasPermission('sale:read')
  const canReadPurchases = hasPermission('purchase:read')
  const canReadStock = hasPermission('stock:read')
  const canReadReturns = hasPermission('sale-return:read')

  const { data: statsRes, isLoading: loadingStats } = usePharmacyStats(
    { branchId: activeStoreId || undefined, startDate, endDate },
    { enabled: canReadStock }
  )

  const { data: summaryRes, isLoading: loadingSummary } = usePharmacySummary(
    { branchId: activeStoreId || undefined, startDate, endDate },
    { enabled: canReadSales || canReadPurchases || canReadReturns }
  )

  // Memoize all-time params to prevent infinite loop
  const allTimeParams = useMemo(() => ({
    branchId: undefined,
    startDate: '2000-01-01',
    endDate: format(new Date(), 'yyyy-MM-dd')
  }), [])

  // Fetch all-time stats for inventory counts
  const { data: allTimeStatsRes } = usePharmacyStats(allTimeParams, { enabled: canReadStock })
  
  const { data: graphRes, isLoading: loadingGraph } = usePharmacyGraph(
    { branchId: activeStoreId || undefined, startDate, endDate, days: !startDate ? 7 : undefined },
    { enabled: canReadSales || canReadPurchases }
  )

  // Recent Activity Data
  const { data: salesRes, isLoading: loadingSales } = useSales(
    { limit: 5, branchId: activeStoreId || undefined },
    { enabled: canReadSales }
  )
  const { data: purchasesRes, isLoading: loadingPurchases } = usePurchases(
    { limit: 5, branchId: activeStoreId || undefined },
    { enabled: canReadPurchases }
  )

  // Clinical Data
  const today = format(new Date(), 'yyyy-MM-dd')
  const { data: appointmentsRes, isLoading: loadingAppointments } = useAppointments({ 
    branchId: activeStoreId || undefined,
    date: today,
    limit: 1000 
  })
  const { data: admissionsRes, isLoading: loadingAdmissions } = useAdmissions({ 
    branchId: activeStoreId || undefined,
    limit: 5 
  })
  const { data: bedsRes, isLoading: loadingBeds } = useBeds({ 
    branchId: activeStoreId || undefined,
    limit: 1000 
  })

  const appointments = appointmentsRes?.data || []
  const admissions = admissionsRes?.data || []
  const beds = bedsRes?.data || []

  // Derived stats
  const todayAppointmentsCount = appointments.length
  const waitingOpdCount = appointments.filter((a: any) => a.status === 'pending').length
  const totalBeds = beds.length
  const occupiedBeds = beds.filter((b: any) => b.isOccupied || b.status === 'occupied').length
  const bedOccupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  const stats = statsRes?.data
  const summary = summaryRes?.data
  const allTimeStats = allTimeStatsRes?.data
  const graphData = graphRes?.data || []
  const loading = loadingStats || loadingGraph || loadingSummary

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
    <PermissionGuard permission="dashboard:read">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <DatePickerWithRange date={date} setDate={setDate} />
                <PermissionGuard permission="sale:create" mode="silent">
                    <Button asChild>
                        <Link href="/pharmacy/pos">New Sale</Link>
                    </Button>
                </PermissionGuard>
            </div>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Today's Appointments */}
            <Link href="/appointments" className="group">
                <Card className="bg-[#111827] border-none text-white overflow-hidden relative group transition-all duration-500 hover:scale-[1.02] shadow-2xl">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="h-24 w-24 text-emerald-500" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-emerald-500" />
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> +5 today
                        </Badge>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Today's Appointments</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-black tracking-tighter">{todayAppointmentsCount}</h3>
                            <span className="text-slate-500 font-bold text-sm">Patients</span>
                        </div>
                    </CardContent>
                </Card>
            </Link>

            {/* Patients in OPD */}
            <Link href="/appointments" className="group">
                <Card className="bg-[#111827] border-none text-white overflow-hidden relative group transition-all duration-500 hover:scale-[1.02] shadow-2xl">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="h-24 w-24 text-teal-500" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                        <div className="h-10 w-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                            <Users className="h-5 w-5 text-teal-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Patients in OPD</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-black tracking-tighter">{todayAppointmentsCount * 3}</h3>
                            <span className="text-teal-500 font-black text-xs uppercase tracking-widest">Current</span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mt-2">{waitingOpdCount} waiting to be seen</p>
                    </CardContent>
                </Card>
            </Link>

            {/* Available Beds */}
            <Link href="/facility" className="group">
                <Card className="bg-[#111827] border-none text-white overflow-hidden relative group transition-all duration-500 hover:scale-[1.02] shadow-2xl">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Bed className="h-24 w-24 text-indigo-500" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <Bed className="h-5 w-5 text-indigo-500" />
                        </div>
                        <Badge className="bg-rose-500/10 text-rose-500 border-none font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                            {bedOccupancyPercentage}% Occupied
                        </Badge>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Available Beds</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-black tracking-tighter">{totalBeds - occupiedBeds}</h3>
                            <span className="text-slate-500 font-bold text-sm">/ {totalBeds}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mt-2">Across all wards</p>
                    </CardContent>
                </Card>
            </Link>

            {/* Pharmacy Alerts */}
            <Link href="/pharmacy/inventory" className="group">
                <Card className="bg-[#111827] border-none text-white overflow-hidden relative group transition-all duration-500 hover:scale-[1.02] shadow-2xl">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertTriangle className="h-24 w-24 text-orange-500" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-orange-500" />
                        </div>
                        <Badge className="bg-orange-500/10 text-orange-500 border-none font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full">
                            Action Needed
                        </Badge>
                    </CardHeader>
                    <CardContent className="relative z-10 pt-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Pharmacy Alerts</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-4xl font-black tracking-tighter">{(stats?.lowStockCount || 0) + (stats?.expiringIn30Days || 0)}</h3>
                            <span className="text-slate-500 font-bold text-sm">Items</span>
                        </div>
                        <Separator className="my-4 bg-slate-800" />
                        <div className="flex gap-4">
                            <div>
                                <p className="text-rose-500 font-black text-sm">{stats?.lowStockCount || 0}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Low Stock</p>
                            </div>
                            <div className="pl-4 border-l border-slate-800">
                                <p className="text-orange-500 font-black text-sm">{stats?.expiringIn30Days || 0}</p>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expiring</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </Link>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
            <PermissionGuard permission="sale:read" mode="silent">
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
            </PermissionGuard>
            
            <PermissionGuard permission="patient:read" mode="silent">
                <Card className="col-span-1 md:col-span-2 lg:col-span-3 bg-[#111827] border-none text-white shadow-2xl rounded-[2rem] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-black tracking-tight">Recent Admissions</CardTitle>
                        <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/10 font-black text-xs uppercase tracking-widest px-4">
                            <Link href="/patients" className="flex items-center gap-1">
                                View All <ChevronRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-8 pt-4">
                    {loadingAdmissions ? (
                        <div className="space-y-6">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-2xl bg-slate-800" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-1/2 bg-slate-800" />
                                        <Skeleton className="h-3 w-1/3 bg-slate-800" />
                                    </div>
                                    <Skeleton className="h-6 w-20 rounded-full bg-slate-800" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <AdmissionsList admissions={admissions} />
                    )}
                </CardContent>
                </Card>
            </PermissionGuard>
          </div>
        </div>
    </PermissionGuard>
  )
}
function AdmissionsList({ admissions }: { admissions: any[] }) {
    if (admissions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                    <Activity className="h-8 w-8 text-slate-600" />
                </div>
                <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No Recent Admissions</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {admissions.map((admission) => (
                <div key={admission.id} className="flex items-center gap-4 group cursor-pointer">
                    <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 font-black text-lg group-hover:bg-primary group-hover:text-white transition-all">
                        {admission.patient?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-black text-white truncate group-hover:text-primary transition-colors">
                            {admission.patient?.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">
                                {admission.department?.name || 'Emergency'}
                            </p>
                            <span className="text-slate-700">•</span>
                            <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(admission.admissionDate || admission.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                    <Badge className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-none shrink-0",
                        admission.status === 'admitted' ? "bg-primary/20 text-primary" :
                        admission.status === 'transferred' ? "bg-teal-500/20 text-teal-500" :
                        "bg-emerald-500/20 text-emerald-500"
                    )}>
                        {admission.status}
                    </Badge>
                </div>
            ))}
        </div>
    )
}
