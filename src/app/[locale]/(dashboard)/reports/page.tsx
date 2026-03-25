"use client"

import { TransactionList } from "@/components/finance/transaction-list"
import { AnalyticsDashboard } from "@/components/pharmacy/analytics/analytics-dashboard"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function ReportsPage() {
  return (
    <PermissionGuard permission="sale:read">
      <div className="space-y-6 pt-2">
           <div>
              <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
              <p className="text-muted-foreground">Comprehensive insights and detailed transaction logs across all departments.</p>
          </div>
          <AnalyticsDashboard />
          <TransactionList title="Transaction History" />
      </div>
    </PermissionGuard>
  )
}
