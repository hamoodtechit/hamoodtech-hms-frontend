"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { ScheduleBulkPayload } from "@/types/hr"
import { useCreateBulkSchedules, useEmployees, useShifts } from "@/hooks/hr-queries"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { addDays, differenceInDays, format } from "date-fns"

const assignmentSchema = z.object({
    employeeId: z.string().min(1, "Employee is required"),
    timetableId: z.string().min(1, "Shift is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
})

interface AssignmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    branchId: string
    initialDate?: string
    onSuccess?: () => void
}

type AssignmentFormValues = z.infer<typeof assignmentSchema>

export function AssignmentDialog({
    open,
    onOpenChange,
    branchId,
    initialDate,
    onSuccess,
}: AssignmentDialogProps) {
    const createMutation = useCreateBulkSchedules()

    // Data Fetching
    const { data: employeesRes } = useEmployees({ branchId, limit: 200 })
    const { data: shiftsRes } = useShifts({ limit: 100 })

    // Helper to robustly extract an array from various API response structures
    const getArrayData = (res: any) => {
        if (Array.isArray(res?.data?.data)) return res.data.data
        if (Array.isArray(res?.data)) return res.data
        return []
    }
    
    const employees = getArrayData(employeesRes)
    const shifts = getArrayData(shiftsRes)

    const form = useForm<AssignmentFormValues>({
        resolver: zodResolver(assignmentSchema),
        defaultValues: {
            employeeId: "",
            timetableId: "",
            startDate: initialDate || "",
            endDate: initialDate || "",
        },
    })

    useEffect(() => {
        if (open) {
            form.reset({
                employeeId: "",
                timetableId: "",
                startDate: initialDate || "",
                endDate: initialDate || "",
            })
        }
    }, [open, initialDate, form])

    const onSubmit = async (values: AssignmentFormValues) => {
        const emp = employees.find((e: any) => e.id === values.employeeId)
        if (!emp) {
            toast.error("Employee not found")
            return
        }
        
        // Parse the uid from employeeNumber
        const uidStr = emp.employeeNumber?.replace(/\D/g, '') || emp.id
        const uid = Number(uidStr)

        if (isNaN(uid)) {
            toast.error("Invalid Employee ID for attendance system")
            return
        }

        const start = new Date(values.startDate)
        const end = new Date(values.endDate)
        const diff = differenceInDays(end, start)
        const schedules = []

        if (diff < 0) {
            toast.error("End date cannot be before start date")
            return
        }

        for (let i = 0; i <= diff; i++) {
            const d = addDays(start, i)
            schedules.push({
                uid,
                timetableId: Number(values.timetableId),
                scheduleDate: format(d, 'yyyy-MM-dd')
            })
        }

        const payload: ScheduleBulkPayload = { schedules }

        try {
            await createMutation.mutateAsync(payload)
            toast.success(`Employee assigned successfully for ${schedules.length} days`)
            onSuccess?.()
            onOpenChange(false)
        } catch {
            toast.error("An error occurred. Please try again.")
        }
    }

    const isLoading = createMutation.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Assign Shift Roster</DialogTitle>
                    <DialogDescription>
                        Schedule an employee to a shift template at a specific location.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="employeeId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Employee *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Employee" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(employees || []).map((emp: any) => (
                                                    <SelectItem key={emp.id} value={emp.id}>
                                                        {emp.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="timetableId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Shift *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Shift" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(shifts || []).map((s: any) => (
                                                    <SelectItem key={s.id} value={s.id.toString()}>
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>


                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date *</FormLabel>
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
                                        <FormLabel>End Date *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Assign Employee
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
