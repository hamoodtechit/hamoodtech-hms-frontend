"use client"

import { PharmacySalesDashboard } from "@/components/finance/reports/pharmacy-sales-dashboard"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function PharmacySalesReportPage() {
  return (
    <PermissionGuard permission="report:read">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <PharmacySalesDashboard />
      </div>
    </PermissionGuard>
  )
}
