"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Calendar, MapPin, Loader2, CalendarRange, Clock } from "lucide-react"
import { useAnnualCalendar } from "@/hooks/hr-queries"
import { cn } from "@/lib/utils"

interface AnnualCalendarDetailsDialogProps {
  id: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  branches: { id: string; name: string }[]
}

export function AnnualCalendarDetailsDialog({ id, open, onOpenChange, branches }: AnnualCalendarDetailsDialogProps) {
  const { data: response, isLoading } = useAnnualCalendar(id || undefined)
  const calendar = response?.data

  const branchName = calendar 
    ? branches.find(b => b.id === calendar.branchId)?.name || 'All Branches'
    : 'Loading...'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Calendar className="h-5 w-5 text-primary" />
            Entry Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-4">Loading details...</p>
          </div>
        ) : !calendar ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-muted-foreground">Entry not found.</p>
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{calendar.name}</h3>
                    <Badge variant="outline" className={cn(
                        "capitalize",
                        calendar.type === 'holiday' ? "text-rose-600 border-rose-200 bg-rose-50" :
                        calendar.type === 'vacation' ? "text-blue-600 border-blue-200 bg-blue-50" :
                        "text-emerald-600 border-emerald-200 bg-emerald-50"
                    )}>
                        {calendar.type}
                    </Badge>
                  </div>
                  {calendar.nameBangla && (
                    <p className="text-sm text-muted-foreground">{calendar.nameBangla}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarRange className="h-4 w-4 text-primary/70" />
                  <div className="flex-1">
                    <p className="font-medium">Date Range</p>
                    <p className="text-muted-foreground">
                      {format(new Date(calendar.startDate), "MMMM d, yyyy")} - {format(new Date(calendar.endDate), "MMMM d, yyyy")}
                    </p>
                    <p className="text-xs font-semibold text-primary mt-1">
                        Duration: {calendar.dayCount} {calendar.dayCount === 1 ? 'Day' : 'Days'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary/70" />
                  <div className="flex-1">
                    <p className="font-medium">Branch</p>
                    <p className="text-muted-foreground">
                      {branchName}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Clock className="h-4 w-4 text-primary/70 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Created At</p>
                    <p className="text-muted-foreground">
                      {format(new Date(calendar.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </div>

              {calendar.description && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-md">
                    {calendar.description}
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
