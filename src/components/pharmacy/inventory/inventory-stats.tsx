import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pharmacyService } from "@/services/pharmacy-service"
import { Medicine } from "@/types/pharmacy"
import { AlertTriangle, DollarSign, Package, TrendingDown } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function InventoryStats() {
    const [medicines, setMedicines] = useState<Medicine[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadStats = async () => {
            try {
                setLoading(true)
                // Fetching a large batch to calculate accurate totals for now
                // Ideally this would be a dedicated stats endpoint
                const response = await pharmacyService.getMedicines({ limit: 1000 })
                setMedicines(response.data)
            } catch (error) {
                toast.error("Failed to load inventory stats")
            } finally {
                setLoading(false)
            }
        }
        loadStats()
    }, [])

    if (loading) return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map(i => (
            <Card key={i} className="h-32 animate-pulse bg-secondary/10" />
        ))}
    </div>

    const totalStock = medicines.reduce((acc, m) => acc + (Number(m.stock) || 0), 0)
    const totalValue = medicines.reduce((acc, m) => acc + ((Number(m.stock) || 0) * (Number(m.unitPrice) || 0)), 0)
    const lowStockCount = medicines.filter(m => (Number(m.stock) || 0) <= (Number(m.reorderLevel) || 0)).length
    const expiringCount = 0 // Expiring batches data handled separately in deeper modules

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-sm border-l-4 border-l-primary/70 bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalStock.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <span className="font-medium text-emerald-600 mr-1">{medicines.length}</span> items in catalog
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-emerald-500/70 bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Estimated cost valuation
                    </p>
                </CardContent>
            </Card>
            
            <Card className="shadow-sm border-l-4 border-l-orange-500/70 bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                    <TrendingDown className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Requires reordering
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-l-4 border-l-destructive/70 bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{expiringCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Check batch details
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
