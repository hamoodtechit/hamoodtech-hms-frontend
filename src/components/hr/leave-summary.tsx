"use client"

import { useEmployeeLeaveSummary } from "@/hooks/hr-queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, Clock, XCircle, Calendar, AlertCircle } from "lucide-react"

interface LeaveSummaryProps {
  employeeId?: string
}

export function LeaveSummary({ employeeId }: LeaveSummaryProps) {
  const { data: summaryResponse, isLoading, isError } = useEmployeeLeaveSummary(employeeId)
  
  if (!employeeId) return null

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (isError || !summaryResponse?.success) {
    return (
      <Card className="border-rose-200 bg-rose-50/30 mb-6">
        <CardContent className="pt-6 flex items-center justify-center space-x-2 text-rose-600">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">Failed to load leave summary. Please try again.</p>
        </CardContent>
      </Card>
    )
  }

  const summary = summaryResponse.data

  return (
    <div className="space-y-6 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="overflow-hidden border-none shadow-sm bg-linear-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background ring-1 ring-emerald-100 dark:ring-emerald-900/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Approved</p>
              <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{summary.totalApprovedLeaves}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-sm bg-linear-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background ring-1 ring-amber-100 dark:ring-amber-900/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Pending</p>
              <h3 className="text-2xl font-black text-amber-700 dark:text-amber-300">{summary.totalPendingLeaves}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-sm bg-linear-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-background ring-1 ring-rose-100 dark:ring-rose-900/30">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Rejected</p>
              <h3 className="text-2xl font-black text-rose-700 dark:text-rose-300">{summary.totalRejectedLeaves}</h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
              <XCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance Section */}
      <Card className="border-none shadow-sm ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Annual Leave Balance
            </CardTitle>
            <Badge variant="outline" className="bg-background font-bold text-[10px] uppercase tracking-tighter shadow-xs">
              Fiscal Year 2024
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
            {summary.leaveCounts.map((leave: any, index: number) => {
              const percentage = (leave.leaveCount / leave.totalLeave) * 100
              return (
                <div key={index} className="p-4 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-foreground/80">{leave.leaveName}</span>
                    <span className="text-xs font-black">
                      <span className="text-primary">{leave.leaveCount}</span>
                      <span className="text-muted-foreground/60 mx-1">/</span>
                      <span className="text-muted-foreground">{leave.totalLeave}</span>
                      <span className="ml-1.5 text-[10px] text-muted-foreground font-medium uppercase">Used</span>
                    </span>
                  </div>
                  
                  {/* Custom Progress Bar */}
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden shadow-inner flex">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out flex items-center justify-end px-1 ${
                        percentage > 90 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 
                        percentage > 70 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 
                        'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-bold text-muted-foreground tracking-tight uppercase">
                      {percentage < 100 ? `${Math.floor(leave.availableLeave)} Days Remaining` : 'Limit Reached'}
                    </span>
                    <span className="text-[10px] font-black text-primary italic">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                </div>
              )
            })}
            
            {summary.leaveCounts.length === 0 && (
              <div className="col-span-2 p-8 text-center text-muted-foreground italic text-sm">
                No leave balance data available for this employee.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
