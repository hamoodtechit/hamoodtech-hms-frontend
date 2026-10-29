import { ExpenseReportsDashboard } from "@/components/finance/reports/expense-reports-dashboard"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Expense Report",
  description: "View and download expense reports",
}

export default function ExpenseReportsPage() {
  return <PermissionGuard permission="expense:read"><div className="flex-1 space-y-4 p-4 pt-6 md:p-8"><ExpenseReportsDashboard /></div></PermissionGuard>
}
