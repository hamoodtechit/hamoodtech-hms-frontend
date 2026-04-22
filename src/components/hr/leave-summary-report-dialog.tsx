"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BarChart3, User } from "lucide-react"
import { useEmployees } from "@/hooks/hr-queries"
import { useStoreContext } from "@/store/use-store-context"
import { LeaveSummary } from "./leave-summary"

interface LeaveSummaryReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeaveSummaryReportDialog({ open, onOpenChange }: LeaveSummaryReportDialogProps) {
  const { activeStoreId } = useStoreContext()
  const branchId = activeStoreId === "all" ? undefined : activeStoreId

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | "">("")

  const { data: employeeData, isLoading: loadingEmployees } = useEmployees({
    branchId: branchId ? String(branchId) : undefined,
    limit: 200,
  })
  const employees = employeeData?.data || []

  const handleOpenChange = (val: boolean) => {
    if (!val) setSelectedEmployeeId("")
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <BarChart3 className="h-5 w-5 text-primary" />
            Leave Summary Report
          </DialogTitle>
          <DialogDescription>
            Select an employee to view their complete leave balance and history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Employee Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Select Employee
            </Label>
            <Select
              value={selectedEmployeeId}
              onValueChange={setSelectedEmployeeId}
              disabled={loadingEmployees}
            >
              <SelectTrigger className="w-full bg-background">
                <SelectValue placeholder={loadingEmployees ? "Loading employees…" : "Choose an employee…"} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{emp.name}</span>
                      {emp.designation?.name && (
                        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          {emp.designation.name}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary report — rendered when employee is selected */}
          {selectedEmployeeId ? (
            <LeaveSummary employeeId={selectedEmployeeId} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-xl bg-muted/20">
              <BarChart3 className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium text-sm">No employee selected</p>
              <p className="text-xs mt-1">Pick an employee above to view their leave summary.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
