"use client"

import { AnalyticsDashboard } from "@/components/pharmacy/analytics/analytics-dashboard"
import { TransactionReportTable } from "./components/transaction-report-table"

export default function ReportsPage() {
  return (
    <div className="space-y-6 pt-2">
         <div>
            <h2 className="text-3xl font-bold tracking-tight">Pharmacy Reports & Analytics</h2>
            <p className="text-muted-foreground">Detailed transaction logs and sales performance insights.</p>
        </div>
        <AnalyticsDashboard />
        <TransactionReportTable />
    </div>
  )
}
