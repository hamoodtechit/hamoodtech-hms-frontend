"use client"

import { AnalyticsDashboard } from "@/components/pharmacy/analytics/analytics-dashboard"

export default function ReportsPage() {
  return (
    <div className="space-y-6 pt-2">
         <div>
            <h2 className="text-3xl font-bold tracking-tight">Pharmacy Analytics</h2>
            <p className="text-muted-foreground">Insights into sales performance and inventory health.</p>
        </div>
        <AnalyticsDashboard />
    </div>
  )
}
