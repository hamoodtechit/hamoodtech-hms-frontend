import { FinanceReportsDashboard } from "@/components/finance/reports/finance-reports-dashboard"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Finance Reports",
  description: "View finance income and expense reports",
}

export default function FinanceReportsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <FinanceReportsDashboard />
    </div>
  )
}
