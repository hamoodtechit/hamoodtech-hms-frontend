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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ScheduleBulkPayload } from "@/types/hr"
import { useCreateBulkSchedules, useEmployees, useShifts } from "@/hooks/hr-queries"
import { useEffect } from "react"
import { Loader2, X } from "lucide-react"
import { differenceInDays } from "date-fns"
import { SearchableSelect } from "@/components/shared/searchable-select"

const assignmentSchema = z.object({
    employeeIds: z.array(z.string()).min(1, "At least one employee is required"),
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
    const { data: employeesRes } = useEmployees({ branchId: branchId || undefined, limit: 200 })
    const { data: shiftsRes } = useShifts({ limit: 100 })

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
            employeeIds: [],
            timetableId: "",
            startDate: initialDate || "",
            endDate: initialDate || "",
        },
    })

    const selectedEmployeeIds = form.watch("employeeIds") || []

    useEffect(() => {
        if (open) {
            form.reset({
                employeeIds: [],
                timetableId: "",
                startDate: initialDate || "",
                endDate: initialDate || "",
            })
        }
    }, [open, initialDate, form])

    const onSubmit = async (values: AssignmentFormValues) => {
        const selectedUids: number[] = []

        for (const empId of values.employeeIds) {
            const emp = employees.find((e: any) => e.id === empId)
            if (emp) {
                const uidStr = emp.employeeNumber || emp.id
                const uid = Number(uidStr)
                if (!isNaN(uid)) {
                    selectedUids.push(uid)
                }
            }
        }

        if (selectedUids.length === 0) {
            toast.error("No valid employees selected.")
            return
        }

        const start = new Date(values.startDate)
        const end = new Date(values.endDate)
        const diff = differenceInDays(end, start)

        if (diff < 0) {
            toast.error("End date cannot be before start date")
            return
        }

        const payload: ScheduleBulkPayload = {
            uids: selectedUids,
            timetableId: Number(values.timetableId),
            dateFrom: values.startDate,
            dateTo: values.endDate
        }

        try {
            await createMutation.mutateAsync(payload)
            toast.success(`Schedule assigned successfully for ${selectedUids.length} employees`)
            onSuccess?.()
            onOpenChange(false)
        } catch {
            toast.error("An error occurred. Please try again.")
        }
    }

    const isLoading = createMutation.isPending

    const removeEmployee = (idToRemove: string) => {
        const currentIds = form.getValues("employeeIds")
        form.setValue("employeeIds", currentIds.filter(id => id !== idToRemove), { shouldValidate: true })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Assign Shift Roster</DialogTitle>
                    <DialogDescription>
                        Schedule employees to a shift template at a specific location.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="employeeIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Employees *</FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <SearchableSelect
                                                value=""
                                                onChange={(val) => {
                                                    if (!val) return
                                                    const current = field.value || []
                                                    if (!current.includes(val)) {
                                                        field.onChange([...current, val])
                                                    }
                                                }}
                                                options={(employees || []).map((emp: any) => ({
                                                    id: emp.id,
                                                    name: emp.name
                                                }))}
                                                placeholder="Search and select employees"
                                                showAll={false}
                                            />
                                            {field.value && field.value.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-2">
                                                    {field.value.map(id => {
                                                        const emp = employees.find((e: any) => e.id === id)
                                                        return (
                                                            <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                                                {emp?.name || "Unknown"}
                                                                <X
                                                                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                                                                    onClick={() => removeEmployee(id)}
                                                                />
                                                            </Badge>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <div className="grid grid-cols-1 gap-4">
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
                            <Button type="submit" disabled={isLoading || selectedEmployeeIds.length === 0}>
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
