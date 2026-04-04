"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { FileText, MapPin, Loader2, CalendarRange, Clock, User, Fingerprint } from "lucide-react"
import { useLeave } from "@/hooks/hr-queries"

interface LeaveDetailsDialogProps {
  id: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  branches: { id: string; name: string }[]
}

export function LeaveDetailsDialog({ id, open, onOpenChange, branches }: LeaveDetailsDialogProps) {
  const { data: response, isLoading } = useLeave(id || undefined)
  const leave = response?.data

  const branchName = leave 
    ? branches.find(b => b.id === leave.branchId)?.name || 'All Branches'
    : 'Loading...'

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border-rose-200">Rejected</Badge>;
      default:
        return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200">Pending</Badge>;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <FileText className="h-5 w-5 text-primary" />
            Leave Request Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-4">Loading leave details...</p>
          </div>
        ) : !leave ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-muted-foreground">Leave request not found.</p>
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold">{leave.employee?.name || 'Unknown Employee'}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Fingerprint className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{leave.leaveType?.name || 'Leave'}</p>
                  </div>
                </div>
                {getStatusBadge(leave.status)}
              </div>

              <div className="grid gap-4 bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarRange className="h-4 w-4 text-primary/70" />
                  <div className="flex-1">
                    <p className="font-medium">Leave Duration</p>
                    <p className="text-muted-foreground">
                      {format(new Date(leave.startDate), "MMM d, yyyy")} to {format(new Date(leave.endDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-primary/70" />
                  <div className="flex-1">
                    <p className="font-medium">Designation</p>
                    <p className="text-muted-foreground">
                      {leave.employee?.designation?.name || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary/70" />
                  <div className="flex-1">
                    <p className="font-medium">Branch Location</p>
                    <p className="text-muted-foreground">
                      {branchName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Clock className="h-4 w-4 text-primary/70 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Requested On</p>
                    <p className="text-muted-foreground">
                      {format(new Date(leave.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Reason</h4>
                <p className="text-sm text-foreground leading-relaxed bg-muted/20 p-3 rounded-md border">
                  {leave.reason}
                </p>
              </div>

              {leave.note && (
                <div className="space-y-2 mt-4">
                  <h4 className="font-medium text-sm text-amber-700 dark:text-amber-500">Manager Note</h4>
                  <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed bg-amber-500/10 p-3 rounded-md border border-amber-500/20">
                    {leave.note}
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
