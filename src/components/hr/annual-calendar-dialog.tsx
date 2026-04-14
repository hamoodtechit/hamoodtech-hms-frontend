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
import { AnnualCalendar, AnnualCalendarPayload } from "@/types/hr"
import { useCreateAnnualCalendar, useUpdateAnnualCalendar } from "@/hooks/hr-queries"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

const calendarSchema = z.object({
    type: z.enum(["holiday", "vacation", "event"]),
    name: z.string().min(2, "Name is required"),
    nameBangla: z.string().optional(),
    description: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    branchId: z.string().min(1, "Branch is required"),
})

interface AnnualCalendarDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    calendar?: AnnualCalendar | null
    branches: { id: string; name: string }[]
    initialStartDate?: string
    initialEndDate?: string
}

export function AnnualCalendarDialog({
    open,
    onOpenChange,
    calendar,
    branches,
    initialStartDate,
    initialEndDate,
}: AnnualCalendarDialogProps) {
    const createMutation = useCreateAnnualCalendar()
    const updateMutation = useUpdateAnnualCalendar()

    const form = useForm<AnnualCalendarPayload>({
        resolver: zodResolver(calendarSchema),
        defaultValues: {
            type: "holiday",
            name: "",
            nameBangla: "",
            description: "",
            startDate: "",
            endDate: "",
            branchId: "",
        },
    })

    useEffect(() => {
        if (calendar) {
            form.reset({
                type: calendar.type,
                name: calendar.name,
                nameBangla: calendar.nameBangla || "",
                description: calendar.description || "",
                startDate: calendar.startDate.split("T")[0],
                endDate: calendar.endDate.split("T")[0],
                branchId: calendar.branchId,
            })
        } else {
            form.reset({
                type: "holiday",
                name: "",
                nameBangla: "",
                description: "",
                startDate: initialStartDate || "",
                endDate: initialEndDate || "",
                branchId: "",
            })
        }
    }, [calendar, form, open, initialStartDate, initialEndDate])

    const onSubmit = async (data: AnnualCalendarPayload) => {
        // Convert to ISO string with time for backend compatibility
        const payload: AnnualCalendarPayload = {
            ...data,
            startDate: data.startDate ? new Date(data.startDate).toISOString() : "",
            endDate: data.endDate ? new Date(data.endDate).toISOString() : "",
        }

        try {
            if (calendar) {
                await updateMutation.mutateAsync({ id: calendar.id, data: payload })
                toast.success("Entry updated successfully")
            } else {
                await createMutation.mutateAsync(payload)
                toast.success("Entry created successfully")
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
                    <DialogTitle>{calendar ? "Edit Entry" : "Add Entry"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Entry Type</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="holiday">Holiday</SelectItem>
                                            <SelectItem value="vacation">Vacation</SelectItem>
                                            <SelectItem value="event">Event</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
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
                                            placeholder="Special notes or details..." 
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
                                {calendar ? "Update Entry" : "Create Entry"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
