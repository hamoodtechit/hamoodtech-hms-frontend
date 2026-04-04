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
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { LeaveType, LeaveTypePayload } from "@/types/hr"
import { useCreateLeaveType, useUpdateLeaveType } from "@/hooks/hr-queries"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

const leaveTypeSchema = z.object({
    name: z.string().min(2, "Name is required"),
    nameBangla: z.string().optional(),
    description: z.string().optional(),
    maxDaysPerYear: z.number().min(0, "Must be 0 or greater"),
    isPaid: z.boolean(),
    branchId: z.string().min(1, "Branch is required"),
})

interface LeaveTypeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    leaveType?: LeaveType | null
    branches: { id: string; name: string }[]
}

export function LeaveTypeDialog({
    open,
    onOpenChange,
    leaveType,
    branches,
}: LeaveTypeDialogProps) {
    const createMutation = useCreateLeaveType()
    const updateMutation = useUpdateLeaveType()

    const form = useForm<z.infer<typeof leaveTypeSchema>>({
        resolver: zodResolver(leaveTypeSchema),
        defaultValues: {
            name: "",
            nameBangla: "",
            description: "",
            maxDaysPerYear: 0,
            isPaid: true,
            branchId: "",
        },
    })

    useEffect(() => {
        if (leaveType) {
            form.reset({
                name: leaveType.name,
                nameBangla: leaveType.nameBangla || "",
                description: leaveType.description || "",
                maxDaysPerYear: leaveType.maxDaysPerYear,
                isPaid: leaveType.isPaid,
                branchId: leaveType.branchId,
            })
        } else {
            form.reset({
                name: "",
                nameBangla: "",
                description: "",
                maxDaysPerYear: 0,
                isPaid: true,
                branchId: "",
            })
        }
    }, [leaveType, form, open])

    const onSubmit = async (data: z.infer<typeof leaveTypeSchema>) => {
        try {
            if (leaveType) {
                await updateMutation.mutateAsync({ id: leaveType.id, data: data as LeaveTypePayload })
                toast.success("Leave type updated successfully")
            } else {
                await createMutation.mutateAsync(data as LeaveTypePayload)
                toast.success("Leave type created successfully")
            }
            onOpenChange(false)
        } catch (_) {
            toast.error("An error occurred. Please try again.")
        }
    }

    const isLoading = createMutation.isPending || updateMutation.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-125">
                <DialogHeader>
                    <DialogTitle>{leaveType ? "Edit Leave Type" : "Add Leave Type"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Leave Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Sick Leave" {...field} />
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
                                        <FormLabel>Name (Bangla) <span className="text-muted-foreground text-xs font-normal">(Optional)</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="উদা: অসুস্থতা জনিত ছুটি" {...field} />
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
                                name="maxDaysPerYear"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Days Per Year</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                min="0" 
                                                {...field} 
                                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isPaid"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-8">
                                        <div className="space-y-0.5 mt-[-24px]">
                                            <FormLabel>Paid Leave</FormLabel>
                                            <FormDescription className="text-[10px]">
                                                Is this leave type paid?
                                            </FormDescription>
                                        </div>
                                        <FormControl className="mt-[-24px]">
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description <span className="text-muted-foreground text-xs font-normal">(Optional)</span></FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Special notes or rules regarding this leave type..." 
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
                                {leaveType ? "Update Leave Type" : "Create Leave Type"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
