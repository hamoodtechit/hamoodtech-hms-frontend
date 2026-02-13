"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useInventoryStore } from "@/store/use-inventory-store"
import { AlertTriangle, DollarSign, Package, TrendingDown } from "lucide-react"
import { useEffect, useState } from "react"

export function InventoryStats() {
    const { items, batches, getLowStockItems, getExpiringBatches } = useInventoryStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-secondary/20 rounded-xl" />)}
    </div>

    const totalStock = batches.reduce((acc, b) => acc + b.quantity, 0)
    const totalValue = batches.reduce((acc, b) => acc + (b.quantity * b.costPrice), 0)
    const lowStockCount = getLowStockItems().length
    const expiringCount = getExpiringBatches(90).length // 90 days lookahead

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-md border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalStock}</div>
                    <p className="text-xs text-muted-foreground">
                        {items.length} unique items
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-md border-l-4 border-l-emerald-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                        Cost price valuation
                    </p>
                </CardContent>
            </Card>
            
            <Card className="shadow-md border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                    <TrendingDown className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{lowStockCount}</div>
                    <p className="text-xs text-muted-foreground">
                        Items below min level
                    </p>
                </CardContent>
            </Card>

            <Card className="shadow-md border-l-4 border-l-destructive">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{expiringCount}</div>
                    <p className="text-xs text-muted-foreground">
                        Batches expiring in 90 days
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
