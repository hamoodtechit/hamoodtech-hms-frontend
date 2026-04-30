"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { usePharmacyGraph, usePharmacyStats, usePharmacySummary, usePurchases } from "@/hooks/pharmacy-queries"
import { useSales } from "@/hooks/sales-queries"
import { useAppointments } from "@/hooks/appointment-queries"
import { useAdmissions, usePatients } from "@/hooks/patient-queries"
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
    startDate: today,
    endDate: today,
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
  const { data: opdPatientsRes, isLoading: loadingOpd } = usePatients({
    visitType: 'opd',
    limit: 1
  })

  const appointments = appointmentsRes?.data || []
  const admissions = admissionsRes?.data || []
  const beds = bedsRes?.data || []
  const opdCount = opdPatientsRes?.meta?.totalItems || 0

  // Derived stats
  const todayAppointmentsCount = appointments.length
  const waitingOpdCount = appointments.filter((a: any) => a.status === 'pending').length
  const newAppointmentsToday = appointments.filter((a: any) => 
    format(new Date(a.createdAt || new Date()), 'yyyy-MM-dd') === today
  ).length
  
  const totalBeds = beds.length
  const occupiedBeds = beds.filter((b: any) => b.isOccupied || b.status === 'occupied').length
  const bedOccupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

  const stats = statsRes?.data
  const summary = summaryRes?.data
  const allTimeStats = allTimeStatsRes?.data
  const graphData = graphRes?.data || []
  const loading = loadingStats || loadingGraph || loadingSummary || loadingOpd

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
            <h2 className="text-2xl sm:text-3xl font-black tracking-tighter">Dashboard</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <DatePickerWithRange date={date} setDate={setDate} />
                <PermissionGuard permission="sale:create" mode="silent">
                    <Button asChild>
                        <Link href="/pharmacy/pos">New Sale</Link>
                    </Button>
                </PermissionGuard>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Today's Appointments */}
            <PermissionGuard permission="appointment:read" mode="silent">
                <Link href="/appointments" className="group">
                    <Card className="hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer border-2 border-transparent hover:border-emerald-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {loadingAppointments ? (
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-[100px]" />
                                <Skeleton className="h-3 w-[120px]" />
                            </div>
                        ) : (
                        <>
                        <div className="text-xl sm:text-2xl font-bold">{todayAppointmentsCount}</div>
                           
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    <span className="text-emerald-500 mr-1">+{newAppointmentsToday} today</span>
                                    scheduled for {format(new Date(), 'MMM dd')}
                                </p>
                            
                        </>
                        )}
                    </CardContent>
                    </Card>
                </Link>
            </PermissionGuard>

            {/* Patients in OPD */}
            <PermissionGuard permission="appointment:read" mode="silent">
                <Link href="/appointments" className="group">
                    <Card className="hover:shadow-lg hover:shadow-teal-500/10 transition-all cursor-pointer border-2 border-transparent hover:border-teal-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Patients in OPD</CardTitle>
                        <Users className="h-4 w-4 text-teal-500" />
                    </CardHeader>
                    <CardContent>
                        {loadingOpd ? (
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-[100px]" />
                                <Skeleton className="h-3 w-[120px]" />
                            </div>
                        ) : (
                        <>
                            <div className="text-xl sm:text-2xl font-bold">{opdCount}</div>
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                                {waitingOpdCount} waiting to be seen
                            </p>
                        </>
                        )}
                    </CardContent>
                    </Card>
                </Link>
            </PermissionGuard>

            {/* Available Beds */}
            <PermissionGuard permission="facility:read" mode="silent">
                <Link href="/facility" className="group">
                    <Card className="hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer border-2 border-transparent hover:border-indigo-500/30">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Beds</CardTitle>
                        <Bed className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        {loadingBeds ? (
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-[100px]" />
                                <Skeleton className="h-3 w-[120px]" />
                            </div>
                        ) : (
                        <>
                            <div className="text-xl sm:text-2xl font-bold">{totalBeds - occupiedBeds} / {totalBeds}</div>
                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                                <span className={cn(
                                    "font-medium mr-1",
                                    bedOccupancyPercentage > 80 ? "text-rose-500" : "text-emerald-500"
                                )}>
                                    {bedOccupancyPercentage}% Occupied
                                </span>
                                across all wards
                            </p>
                        </>
                        )}
                    </CardContent>
                    </Card>
                </Link>
            </PermissionGuard>

            {/* Active Stock */}
            <PermissionGuard permission="stock:read" mode="silent">
                <Link href="/pharmacy/inventory" className="group">
                    <Card className="hover:shadow-lg hover:shadow-orange-500/10 transition-all cursor-pointer border-2 border-transparent hover:border-orange-500/30">
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="text-xl sm:text-2xl font-bold">{allTimeStats?.totalMedicines || 0} Items</div>

                            </div>
                            <div className="flex gap-4 sm:gap-6">
                                <div className="text-right border-l pl-4">
                                    <div className="text-base sm:text-lg font-black text-orange-600 leading-none">{stats?.lowStockCount || 0}</div>
                                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Low Stock</p>
                                </div>
                                <div className="text-right border-l pl-4">
                                    <div className="text-base sm:text-lg font-black text-red-600 leading-none">{stats?.expiringIn30Days || 0}</div>
                                    <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-wider">Expiring</p>
                                </div>
                            </div>
                        </div>
                        )}
                    </CardContent>
                    </Card>
                </Link>
            </PermissionGuard>
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
                <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Admissions</CardTitle>
                            <CardDescription>Latest patient clinical events.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="text-primary font-medium text-xs">
                            <Link href="/patients" className="flex items-center gap-1">
                                View All <ChevronRight className="w-4 h-4" />
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loadingAdmissions ? (
                        <div className="space-y-8">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center">
                                    <div className="space-y-1 flex-1">
                                        <Skeleton className="h-4 w-1/2" />
                                        <Skeleton className="h-3 w-1/3" />
                                    </div>
                                    <Skeleton className="h-4 w-[60px] ml-auto" />
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
        return <div className="text-sm text-muted-foreground text-center py-4">No recent admissions detected.</div>
    }

    return (
        <div className="space-y-8">
            {admissions.map((admission) => (
                <div key={admission.id} className="flex items-center">
                    <div className="space-y-1 overflow-hidden">
                        <p className="text-sm font-medium leading-none truncate">{admission.patient?.name}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            {admission.department?.name || 'Emergency'} • {formatDistanceToNow(new Date(admission.admissionDate || admission.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    <div className="ml-auto font-medium text-xs whitespace-nowrap pl-2">
                        <Badge variant="outline" className={cn(
                            "capitalize text-[10px]",
                            admission.status === 'admitted' ? "border-emerald-500 text-emerald-600 bg-emerald-50" :
                            admission.status === 'transferred' ? "border-teal-500 text-teal-600 bg-teal-50" :
                            "border-slate-500 text-slate-600 bg-slate-50"
                        )}>
                            {admission.status}
                        </Badge>
                    </div>
                </div>
            ))}
        </div>
    )
}
