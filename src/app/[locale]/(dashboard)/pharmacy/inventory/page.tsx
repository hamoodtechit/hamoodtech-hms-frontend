"use client"

import { CreateOrderDialog } from "@/components/pharmacy/inventory/create-order-dialog"
import { InventoryStats } from "@/components/pharmacy/inventory/inventory-stats"
import { PurchaseOrderList } from "@/components/pharmacy/inventory/purchase-order-list"
import { StockTable } from "@/components/pharmacy/inventory/stock-table"
import { SupplierTable } from "@/components/pharmacy/inventory/supplier-table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link } from "@/i18n/navigation"
import { Pill } from "lucide-react"

export default function InventoryPage() {
  return (
    <div className="space-y-6 pt-2">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
                <p className="text-muted-foreground">Track stock lists, manage batches, and handle purchase orders.</p>
            </div>
            <div className="flex items-center space-x-2">
                <Link href="/pharmacy/inventory/medicines">
                    <Button variant="outline">
                        <Pill className="mr-2 h-4 w-4" /> Medicine List
                    </Button>
                </Link>
            </div>
        </div>
        
        <InventoryStats />
        
        <Separator />

        <Tabs defaultValue="stock" className="space-y-4">
            <TabsList>
                <TabsTrigger value="stock">Current Stock</TabsTrigger>
                <TabsTrigger value="po">Purchase Orders</TabsTrigger>
                <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            </TabsList>
            <TabsContent value="stock" className="space-y-4">
                <StockTable />
            </TabsContent>
            <TabsContent value="po" className="space-y-4">
                <div className="flex justify-end">
                    <CreateOrderDialog />
                </div>
                <PurchaseOrderList />
            </TabsContent>
            <TabsContent value="suppliers">
                <SupplierTable />
            </TabsContent>
        </Tabs>
    </div>
  )
}
