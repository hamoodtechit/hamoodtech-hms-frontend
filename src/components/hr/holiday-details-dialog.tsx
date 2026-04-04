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
import { useHoliday } from "@/hooks/hr-queries"

interface HolidayDetailsDialogProps {
  id: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  branches: { id: string; name: string }[]
}

export function HolidayDetailsDialog({ id, open, onOpenChange, branches }: HolidayDetailsDialogProps) {
  const { data: response, isLoading } = useHoliday(id || undefined)
  const holiday = response?.data

  const branchName = holiday 
    ? branches.find(b => b.id === holiday.branchId)?.name || 'All Branches'
    : 'Loading...'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Calendar className="h-5 w-5 text-primary" />
            Holiday Details
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-4">Loading holiday details...</p>
          </div>
        ) : !holiday ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-sm text-muted-foreground">Holiday not found.</p>
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{holiday.name}</h3>
                  {holiday.nameBangla && (
                    <p className="text-sm text-muted-foreground">{holiday.nameBangla}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarRange className="h-4 w-4 text-primary/70" />
                  <div className="flex-1">
                    <p className="font-medium">Date Range</p>
                    <p className="text-muted-foreground">
                      {format(new Date(holiday.startDate), "MMMM d, yyyy")} - {format(new Date(holiday.endDate), "MMMM d, yyyy")}
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
                      {format(new Date(holiday.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              </div>

              {holiday.description && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-md">
                    {holiday.description}
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
