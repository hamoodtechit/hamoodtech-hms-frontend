"use client"

import { useState } from "react"
import { User, BarChart3, ChevronsUpDown, Check, Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useEmployees } from "@/hooks/hr-queries"
import { useStoreContext } from "@/store/use-store-context"
import { LeaveSummary } from "@/components/hr/leave-summary"

export function LeaveSummaryView() {
  const { activeStoreId } = useStoreContext()
  const branchId = activeStoreId === "all" ? undefined : activeStoreId

  const [open, setOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("")

  const { data: employeeData, isLoading } = useEmployees({
    branchId: branchId ? String(branchId) : undefined,
    limit: 200,
  })
  const employees = employeeData?.data || []

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary/90 to-primary/60 bg-clip-text text-transparent">
          Leave Summary
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Search and select an employee to view their complete leave balance and history.
        </p>
      </div>

      {/* Searchable Employee Selector */}
      <div className="space-y-1.5 max-w-sm">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          Select Employee
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={isLoading}
              className="w-full justify-between bg-background font-normal"
            >
              {selectedEmployee ? (
                <span className="flex items-center gap-2 truncate">
                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    {selectedEmployee.name}
                    {selectedEmployee.designation?.name
                      ? ` — ${selectedEmployee.designation.name}`
                      : ""}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground flex items-center gap-2">
                  <Search className="h-3.5 w-3.5" />
                  {isLoading ? "Loading employees…" : "Search employee…"}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
            <Command>
              <CommandInput placeholder="Type to search employee…" className="h-9" />
              <CommandList>
                <CommandEmpty>No employee found.</CommandEmpty>
                <CommandGroup>
                  {employees.map((emp) => (
                    <CommandItem
                      key={emp.id}
                      value={`${emp.name} ${emp.designation?.name ?? ""}`}
                      onSelect={() => {
                        setSelectedEmployeeId(emp.id)
                        setOpen(false)
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedEmployeeId === emp.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{emp.name}</span>
                        {emp.designation?.name && (
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
                            {emp.designation.name}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Summary Report */}
      {selectedEmployeeId ? (
        <LeaveSummary employeeId={selectedEmployeeId} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border border-dashed rounded-xl bg-muted/20">
          <BarChart3 className="h-16 w-16 mb-4 opacity-20" />
          <p className="font-semibold text-base">No employee selected</p>
          <p className="text-sm mt-1">
            Search and pick an employee above to view their leave summary.
          </p>
        </div>
      )}
    </div>
  )
}
