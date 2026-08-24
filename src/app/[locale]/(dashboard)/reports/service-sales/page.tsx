"use client"

import { ServiceSalesDashboard } from "@/components/finance/reports/service-sales-dashboard"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function ServiceSalesReportPage() {
  return (
    <PermissionGuard permission="report:read">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <ServiceSalesDashboard />
      </div>
    </PermissionGuard>
  )
}
