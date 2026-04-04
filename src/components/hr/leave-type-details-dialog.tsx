"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { FileText, MapPin, Loader2, CalendarRange, Clock, CheckCircle2, XCircle } from "lucide-react"
import { useLeaveType } from "@/hooks/hr-queries"

interface LeaveTypeDetailsDialogProps {
  id: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  branches: { id: string; name: string }[]
}

export function LeaveTypeDetailsDialog({ id, open, onOpenChange, branches }: LeaveTypeDetailsDialogProps) {
  const { data: response, isLoading } = useLeaveType(id || undefined)
  const leaveType = response?.data

  const branchName = leaveType 
    ? branches.find(b => b.id === leaveType.branchId)?.name || 'All Branches'
    : 'Loading...'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileText className="h-5 w-5 text-primary" />
            Leave Type Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-4">Loading leave type details...</p>
          </div>
        ) : !leaveType ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-muted-foreground">Leave type not found.</p>
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{leaveType.name}</h3>
                  {leaveType.nameBangla && (
                    <p className="text-sm text-muted-foreground">{leaveType.nameBangla}</p>
                  )}
                </div>
                {leaveType.isPaid ? (
                    <Badge variant="default" className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200">Paid Leave</Badge>
                ) : (
                    <Badge variant="secondary" className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-rose-200">Unpaid Leave</Badge>
                )}
              </div>

              <div className="grid gap-4 bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarRange className="h-4 w-4 text-primary/70" />
                  <div className="flex-1">
                    <p className="font-medium">Allowance per Year</p>
                    <p className="text-muted-foreground">
                      {leaveType.maxDaysPerYear} Days max limit
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary/70" />
                  <div className="flex-1">
                    <p className="font-medium">Branch Policy</p>
                    <p className="text-muted-foreground">
                      {branchName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Clock className="h-4 w-4 text-primary/70 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Created On</p>
                    <p className="text-muted-foreground">
                      {format(new Date(leaveType.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </div>

              {leaveType.description && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Policy Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-md">
                    {leaveType.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
