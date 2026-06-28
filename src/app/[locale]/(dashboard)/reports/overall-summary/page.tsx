"use client"

import { OverallSummaryDashboard } from "@/components/finance/reports/overall-summary-dashboard"
import { useAuthStore } from "@/store/use-auth-store"
import { AlertCircle } from "lucide-react"

export default function OverallSummaryPage() {
  const { user } = useAuthStore()
  const rawRoleName = user?.role?.name?.toLowerCase() || ''
  const normalizedRoleName = rawRoleName.replace(/[\s\-_]+/g, '')
  const isSuperAdmin = normalizedRoleName === 'superadmin' || user?.permissions?.includes('*') || user?.role?.permissions?.some(p => p.key === '*')

  if (!isSuperAdmin) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-destructive/10 p-4 rounded-full mb-4 ring-2 ring-destructive/5">
              <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground max-w-md text-sm">
              You do not have the required permissions to view this content. 
              This report is restricted to Super Admin users only.
          </p>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <OverallSummaryDashboard />
    </div>
  )
}
