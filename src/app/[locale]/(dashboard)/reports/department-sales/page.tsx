"use client"

import { DepartmentSalesDashboard } from "@/components/finance/reports/department-sales-dashboard"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function DepartmentSalesReportPage() {
  return (
    <PermissionGuard permission="report:read">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <DepartmentSalesDashboard />
      </div>
    </PermissionGuard>
  )
}
