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
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Holiday, HolidayPayload } from "@/types/hr"
import { useCreateHoliday, useUpdateHoliday } from "@/hooks/hr-queries"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

const holidaySchema = z.object({
    name: z.string().min(2, "Name is required"),
    nameBangla: z.string().optional(),
    description: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    branchId: z.string().min(1, "Branch is required"),
})

interface HolidayDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    holiday?: Holiday | null
    branches: { id: string; name: string }[]
    initialStartDate?: string
    initialEndDate?: string
}

export function HolidayDialog({
    open,
    onOpenChange,
    holiday,
    branches,
    initialStartDate,
    initialEndDate,
}: HolidayDialogProps) {
    const createMutation = useCreateHoliday()
    const updateMutation = useUpdateHoliday()

    const form = useForm<HolidayPayload>({
        resolver: zodResolver(holidaySchema),
        defaultValues: {
            name: "",
            nameBangla: "",
            description: "",
            startDate: "",
            endDate: "",
            branchId: "",
        },
    })

    useEffect(() => {
        if (holiday) {
            form.reset({
                name: holiday.name,
                nameBangla: holiday.nameBangla || "",
                description: holiday.description || "",
                startDate: holiday.startDate.split("T")[0],
                endDate: holiday.endDate.split("T")[0],
                branchId: holiday.branchId,
            })
        } else {
            form.reset({
                name: "",
                nameBangla: "",
                description: "",
                startDate: initialStartDate || "",
                endDate: initialEndDate || "",
                branchId: "",
            })
        }
    }, [holiday, form, open, initialStartDate, initialEndDate])

    const onSubmit = async (data: HolidayPayload) => {
        // Convert to ISO string with time for backend compatibility
        const payload: HolidayPayload = {
            ...data,
            startDate: data.startDate ? new Date(data.startDate).toISOString() : "",
            endDate: data.endDate ? new Date(data.endDate).toISOString() : "",
        }

        try {
            if (holiday) {
                await updateMutation.mutateAsync({ id: holiday.id, data: payload })
                toast.success("Holiday updated successfully")
            } else {
                await createMutation.mutateAsync(payload)
                toast.success("Holiday created successfully")
            }
            onOpenChange(false)
        } catch {
            toast.error("An error occurred. Please try again.")
        }
    }

    const isLoading = createMutation.isPending || updateMutation.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{holiday ? "Edit Holiday" : "Add Holiday"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Holiday Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Eid-ul-Fitr" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nameBangla"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name (Bangla)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="উদা: ঈদুল ফিতর" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="branchId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Branch</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Branch" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {branches.map((branch) => (
                                                <SelectItem key={branch.id} value={branch.id}>
                                                    {branch.name}
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
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Special notes or details about the holiday..." 
                                            className="resize-none"
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

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
                                {holiday ? "Update Holiday" : "Create Holiday"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
