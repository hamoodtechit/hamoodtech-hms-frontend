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
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="overflow-hidden border border-emerald-100 shadow-none bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/30">
          <CardContent className="p-3 flex flex-col items-center justify-center text-center">
            <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 leading-none mb-1">{summary.totalApprovedLeaves}</h3>
            <p className="text-[9px] font-bold text-emerald-600/80 dark:text-emerald-500 uppercase tracking-widest flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" /> Apprv
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-amber-100 shadow-none bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/30">
          <CardContent className="p-3 flex flex-col items-center justify-center text-center">
            <h3 className="text-2xl font-black text-amber-700 dark:text-amber-400 leading-none mb-1">{summary.totalPendingLeaves}</h3>
            <p className="text-[9px] font-bold text-amber-600/80 dark:text-amber-500 uppercase tracking-widest flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" /> Pend
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border border-rose-100 shadow-none bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/30">
          <CardContent className="p-3 flex flex-col items-center justify-center text-center">
            <h3 className="text-2xl font-black text-rose-700 dark:text-rose-400 leading-none mb-1">{summary.totalRejectedLeaves}</h3>
            <p className="text-[9px] font-bold text-rose-600/80 dark:text-rose-500 uppercase tracking-widest flex items-center gap-1">
              <XCircle className="h-2.5 w-2.5" /> Rejct
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Leave Balance Section */}
      <Card className="border border-border/50 shadow-none bg-background/50 overflow-hidden">
        <CardHeader className="bg-muted/30 p-3 border-b border-border/50 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-xs font-bold flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Balance
          </CardTitle>
          <Badge variant="outline" className="bg-background text-[9px] font-bold uppercase tracking-tighter shadow-sm px-1.5 py-0">
            FY 2024
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col divide-y divide-border/50 max-h-[300px] overflow-y-auto">
            {summary.leaveCounts.map((leave: any, index: number) => {
              const percentage = (leave.leaveCount / leave.totalLeave) * 100
              return (
                <div key={index} className="p-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-foreground/90">{leave.leaveName}</span>
                    <span className="text-[11px] font-black">
                      <span className="text-primary">{leave.leaveCount}</span>
                      <span className="text-muted-foreground/40 mx-0.5">/</span>
                      <span className="text-muted-foreground">{leave.totalLeave}</span>
                    </span>
                  </div>
                  
                  {/* Custom Progress Bar */}
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden shadow-inner flex">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${
                        percentage > 90 ? 'bg-rose-500' : 
                        percentage > 70 ? 'bg-amber-500' : 
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[9px] font-bold text-muted-foreground tracking-tight uppercase">
                      {percentage < 100 ? `${Math.floor(leave.availableLeave)} Days Left` : 'Limit Reached'}
                    </span>
                    <span className="text-[9px] font-black text-primary italic">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                </div>
              )
            })}
            
            {summary.leaveCounts.length === 0 && (
              <div className="p-6 text-center flex flex-col items-center justify-center opacity-50">
                <AlertCircle className="h-6 w-6 mb-2" />
                <p className="text-xs italic font-medium">No balance data</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
