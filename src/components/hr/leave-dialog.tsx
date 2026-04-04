"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCreateLeave, useLeaveTypes, useEmployees } from "@/hooks/hr-queries"
import { useBranches } from "@/hooks/pharmacy-queries"
import { toast } from "sonner"
import { useStoreContext } from "@/store/use-store-context"

const leaveSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  leaveTypeId: z.string().min(1, "Leave Type is required"),
  startDate: z.string().min(1, "Start Date is required"),
  endDate: z.string().min(1, "End Date is required"),
  reason: z.string().min(1, "Reason is required"),
  note: z.string().optional(),
})

type LeaveFormValues = z.infer<typeof leaveSchema>

interface LeaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeaveDialog({ open, onOpenChange }: LeaveDialogProps) {
  const { activeStoreId } = useStoreContext()
  const branchId = activeStoreId === 'all' ? undefined : activeStoreId

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      employeeId: "",
      leaveTypeId: "",
      startDate: "",
      endDate: "",
      reason: "",
      note: "",
    },
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])

  const createMutation = useCreateLeave()

  const { data: branchData } = useBranches({ page: 1, limit: 100 })
  const branches = branchData?.data || []

  const { data: leaveTypeData } = useLeaveTypes({ branchId: branchId ? String(branchId) : undefined })
  // @ts-ignore
  const leaveTypes = leaveTypeData?.data || []

  const { data: employeeData } = useEmployees({ branchId: branchId ? String(branchId) : undefined })
  const employees = employeeData?.data || []

  // Ensure branch matches store context or select default branch if 'all' is selected
  // We actually need to pass the branchId, let's just pick the first available branch if 'all'
  const fallbackBranch = branches.length > 0 ? branches[0].id : ""
  const selectedBranchId = branchId ? String(branchId) : fallbackBranch;

  const onSubmit = async (data: LeaveFormValues) => {
    try {
      const payload = {
        ...data,
        branchId: selectedBranchId,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : "",
        endDate: data.endDate ? new Date(data.endDate).toISOString() : "",
      }

      await createMutation.mutateAsync(payload)
      toast.success("Leave request created successfully")
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error("Failed to submit leave request")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Leave Request</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leaveTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Leave Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Leave Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {leaveTypes.map((type: any) => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Input placeholder="Reason for leave" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any other details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
