"use client"

import { CreateOrderDialog } from "@/components/pharmacy/inventory/create-order-dialog"
import { PurchaseOrderList } from "@/components/pharmacy/inventory/purchase-order-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePermissions } from "@/hooks/use-permissions"
import { ShoppingBag } from "lucide-react"

export default function PurchasesPage() {
  const { hasPermission } = usePermissions()

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
          <p className="text-muted-foreground">Manage inventory procurement and purchase orders.</p>
        </div>
        {hasPermission('purchase:create') && (
            <CreateOrderDialog />
        )}
      </div>

      <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-500" />
            <CardTitle>Purchase Orders</CardTitle>
          </div>
          <CardDescription>Track all purchase orders across the hospital.</CardDescription>
        </CardHeader>
        <CardContent>
          <PurchaseOrderList />
        </CardContent>
      </Card>
    </div>
  )
}
