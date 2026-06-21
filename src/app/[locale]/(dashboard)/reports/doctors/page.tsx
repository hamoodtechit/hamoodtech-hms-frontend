"use client"

import { PermissionGuard } from "@/components/shared/permission-guard"
import { DoctorSummaryDashboard } from "@/components/finance/reports/doctor-summary-dashboard"

export default function DoctorReportsPage() {
  return (
    <PermissionGuard permission={["report:read", "finance:read"]}>
        <div className="container mx-auto py-6">
            <DoctorSummaryDashboard />
        </div>
    </PermissionGuard>
  )
}
