import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrency } from "@/hooks/use-currency"
import { pharmacyService } from "@/services/pharmacy-service"
import { useStoreContext } from "@/store/use-store-context"
import { PharmacyStats } from "@/types/pharmacy"
import { AlertTriangle, DollarSign, Package, TrendingDown } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function InventoryStats() {
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const [stats, setStats] = useState<PharmacyStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadStats = async () => {
            try {
                setLoading(true)
                const response = await pharmacyService.getPharmacyStats({ 
                    branchId: activeStoreId || undefined 
                })
                if (response.success) {
                    setStats(response.data)
                }
            } catch (error) {
                toast.error("Failed to load inventory stats")
            } finally {
                setLoading(false)
            }
        }
        loadStats()
    }, [activeStoreId])

    if (loading) return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="shadow-sm border-l-4 border-l-muted bg-card/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[100px] mb-2" />
                        <Skeleton className="h-3 w-[120px]" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border-l-4 border-l-primary/70 bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.totalSales || 0)}</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <span className="font-medium text-emerald-600 mr-1">{stats?.salesCount || 0}</span> sales total
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-emerald-500/70 bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.totalPurchases || 0)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats?.purchasesCount || 0} purchase orders
                    </p>
                </CardContent>
            </Card>
            
            <Card className="shadow-sm border-l-4 border-l-orange-500/70 bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                    <TrendingDown className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats?.lowStockCount || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Requires reordering
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-destructive/70 bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{stats?.outOfStockCount || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Unavailable items
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
