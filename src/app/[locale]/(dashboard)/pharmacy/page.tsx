"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePharmacyStats, usePurchases, useSales } from "@/hooks/pharmacy-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Link } from "@/i18n/navigation"
import { useStoreContext } from "@/store/use-store-context"
import {
    Activity,
    AlertTriangle,
    DollarSign,
    Loader2,
    Pill,
    Settings,
    ShoppingCart
} from "lucide-react"
import { useEffect, useState } from "react"

import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { cn } from "@/lib/utils"
import { endOfDay, startOfMonth } from "date-fns"
import { DateRange } from "react-day-picker"

export default function PharmacyPage() {
  const { activeStoreId } = useStoreContext()
  const { formatCurrency } = useCurrency()
  const [date, setDate] = useState<DateRange | undefined>()

  useEffect(() => {
    setDate({
        from: startOfMonth(new Date()),
        to: endOfDay(new Date()),
    })
  }, [])

  // Format dates for API
  const startDate = date?.from ? date.from.toISOString() : undefined
  const endDate = date?.to ? date.to.toISOString() : undefined

  const { data: statsResponse, isLoading: loading } = usePharmacyStats({ 
    branchId: activeStoreId || undefined,
    startDate,
    endDate
  })
  
  const stats = statsResponse?.data

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent truncate">
            Pharmacy Overview
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            Real-time inventory tracking and point of sale management.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-4 md:mt-0">
            <DatePickerWithRange date={date} setDate={setDate} />
            


            <Link href="/pharmacy/pos" className="w-full sm:w-auto">
            <Button size="lg" className="w-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Launch POS System
            </Button>
            </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
        {/* Cash in Hand */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-card to-secondary/10 border-l-4 border-l-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash in Hand</CardTitle>
            <DollarSign className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
               <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalCashInHand || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Current drawer balance
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Sales */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
               <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalSales || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.salesCount || 0} transitions
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Purchases */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
               <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalPurchases || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.purchasesCount || 0} purchase orders
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Expiring in 30 Days */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
               <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.expiringIn30Days || 0}</div>
                <p className="text-xs text-muted-foreground">
                   Expiring within 30 days
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-5 h-full">
             <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                    Latest sales and purchases from pharmacy
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RecentTransactionsList />
            </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-2 h-full border-l-4 border-l-primary/20">
            <CardHeader>
                <CardTitle>Quick Access</CardTitle>
                <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 grid-cols-1 xs:grid-cols-2 lg:grid-cols-1">
                <Link href="/pharmacy/inventory" className="flex w-full">
                    <Button variant="outline" className="w-full justify-start h-auto py-3 transition-all hover:bg-primary/5 hover:border-primary/30 group">
                        <Pill className="mr-3 h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col items-start truncate overflow-hidden">
                            <span className="font-semibold">Inventory</span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Manage medicines & stock</span>
                        </div>
                    </Button>
                </Link>
                <Link href="/pharmacy/reports" className="flex w-full">
                    <Button variant="outline" className="w-full justify-start h-auto py-3 transition-all hover:bg-primary/5 hover:border-primary/30 group">
                        <Activity className="mr-3 h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col items-start truncate overflow-hidden">
                             <span className="font-semibold">Reports</span>
                             <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Sales & detailed analytics</span>
                        </div>
                    </Button>
                </Link>
                <Link href="/pharmacy/setup" className="flex w-full">
                    <Button variant="outline" className="w-full justify-start h-auto py-3 transition-all hover:bg-primary/5 hover:border-primary/30 group">
                        <Settings className="mr-3 h-5 w-5 text-slate-500 group-hover:rotate-45 transition-transform" />
                        <div className="flex flex-col items-start truncate overflow-hidden">
                             <span className="font-semibold">Setup</span>
                             <span className="text-[10px] sm:text-xs text-muted-foreground truncate">Categories, units & settings</span>
                        </div>
                    </Button>
                </Link>
                <Link href="/pharmacy/pos" className="flex w-full xs:col-span-2 lg:col-span-1">
                    <Button className="w-full justify-start h-auto py-3 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] group">
                        <ShoppingCart className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                         <div className="flex flex-col items-start text-left">
                             <span className="font-semibold">POS System</span>
                             <span className="text-[10px] sm:text-xs opacity-90">Open Point of Sale</span>
                        </div>
                    </Button>
                </Link>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RecentTransactionsList() {
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()

    const { data: salesRes, isLoading: loadingSales } = useSales({ 
        limit: 5,
        branchId: activeStoreId || undefined 
    })
    const { data: purchasesRes, isLoading: loadingPurchases } = usePurchases({
        limit: 5,
        branchId: activeStoreId || undefined
    })

    const loading = loadingSales || loadingPurchases

    const formattedSales = (salesRes?.data?.sales || []).map(s => ({
        id: s.id,
        type: 'sale' as const,
        number: s.invoiceNumber,
        party: s.patient?.name || 'Walk-in',
        amount: Number(s.netPrice || s.totalPrice || 0),
        date: s.createdAt
    }))

    const formattedPurchases = (purchasesRes?.data?.purchases || []).map(p => ({
        id: p.id,
        type: 'purchase' as const,
        number: p.poNumber || 'PO-N/A',
        party: p.supplier?.name || 'Unknown Supplier',
        amount: Number(p.netPrice || p.totalPrice || 0),
        date: p.createdAt
    }))

    const transactions = [...formattedSales, ...formattedPurchases]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    }

    if (transactions.length === 0) {
        return <div className="text-sm text-muted-foreground text-center py-4">No recent transactions found.</div>
    }

    return (
        <div className="space-y-4">
            {transactions.map((tx) => (
                <div key={`${tx.type}-${tx.id}`} className="flex items-center">
                    <div className="space-y-1 overflow-hidden">
                        <p className="text-sm font-medium leading-none truncate flex items-center gap-2">
                            {tx.number}
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider",
                                tx.type === 'sale' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                            )}>
                                {tx.type}
                            </span>
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {new Date(tx.date).toLocaleTimeString()} - {tx.party}
                        </p>
                    </div>
                    <div className={cn(
                        "ml-auto font-medium whitespace-nowrap pl-2",
                        tx.type === 'sale' ? "text-emerald-600" : "text-orange-600"
                    )}>
                        {tx.type === 'sale' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                </div>
            ))}
        </div>
    )
}
    

