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
import { Roster, RosterPayload } from "@/types/hr"
import { useCreateRoster, useShifts, useUpdateRoster } from "@/hooks/hr-queries"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

const rosterSchema = z.object({
    shiftId: z.string().min(1, "Shift is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
})

type RosterFormValues = z.infer<typeof rosterSchema>

interface RosterDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    roster?: Roster | null
    branchId: string
    onSuccess?: () => void
}

export function RosterDialog({
    open,
    onOpenChange,
    roster,
    branchId,
    onSuccess,
}: RosterDialogProps) {
    const createMutation = useCreateRoster()
    const updateMutation = useUpdateRoster()
    
    // Helper to robustly extract an array
    const getArrayData = (res: any) => {
        if (Array.isArray(res?.data?.data)) return res.data.data
        if (Array.isArray(res?.data)) return res.data
        return []
    }
    
    const { data: shiftsRes } = useShifts({ branchId, limit: 100 })
    const shifts = getArrayData(shiftsRes)

    const form = useForm<RosterFormValues>({
        resolver: zodResolver(rosterSchema),
        defaultValues: {
            shiftId: "",
            startDate: "",
            endDate: "",
        },
    })

    useEffect(() => {
        if (open) {
            if (roster) {
                form.reset({
                    shiftId: roster.shiftId,
                    startDate: roster.startDate.split("T")[0],
                    endDate: roster.endDate.split("T")[0],
                })
            } else {
                form.reset({
                    shiftId: "",
                    startDate: "",
                    endDate: "",
                })
            }
        }
    }, [roster, form, open])

    const onSubmit = async (values: RosterFormValues) => {
        // Convert to ISO string with full time for backend
        const payload: RosterPayload = {
            ...values,
            branchId,
            startDate: new Date(`${values.startDate}T00:00:00.000Z`).toISOString(),
            endDate: new Date(`${values.endDate}T23:59:59.999Z`).toISOString(),
        }

        try {
            if (roster) {
                await updateMutation.mutateAsync({ id: roster.id, data: payload })
                toast.success("Roster updated successfully")
            } else {
                await createMutation.mutateAsync(payload)
                toast.success("Roster created successfully")
            }
            onSuccess?.()
            onOpenChange(false)
        } catch {
            toast.error("An error occurred. Please try again.")
        }
    }

    const isLoading = createMutation.isPending || updateMutation.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{roster ? "Edit Roster Period" : "Add Roster Period"}</DialogTitle>
                    <DialogDescription>
                        Define the date range for a specific shift template.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="shiftId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Shift Template *</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value}
                                        disabled={shifts.length === 0}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={shifts.length === 0 ? "No shifts found" : "Select Shift"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {shifts.map((shift: any) => (
                                                <SelectItem key={shift.id} value={shift.id}>
                                                    {shift.name} ({new Date(shift.startTime).getUTCHours()}:00 - {new Date(shift.endTime).getUTCHours()}:00)
                                                </SelectItem>
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
                                {roster ? "Update Roster" : "Create Roster"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
