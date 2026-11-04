import { AmbulanceReportDashboard } from "@/components/ambulance/ambulance-report-dashboard"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function AmbulanceReportPage() {
  return <PermissionGuard permission="report:read"><div className="flex-1 space-y-4 p-4 pt-6 md:p-8"><AmbulanceReportDashboard /></div></PermissionGuard>
}
