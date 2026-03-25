"use client"

import { SupplierTable } from "@/components/pharmacy/inventory/supplier-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck } from "lucide-react"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function SuppliersPage() {
  return (
    <PermissionGuard permission="supplier:read">
        <div className="space-y-6 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
              <p className="text-muted-foreground">Manage vendor relations and supply chain partners.</p>
            </div>
          </div>

          <Card className="border-none shadow-xl bg-card/50 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-500" />
                <CardTitle>Supplier List</CardTitle>
              </div>
              <CardDescription>Directory of all registered suppliers across all branches.</CardDescription>
            </CardHeader>
            <CardContent>
              <SupplierTable />
            </CardContent>
          </Card>
        </div>
    </PermissionGuard>
  )
}
