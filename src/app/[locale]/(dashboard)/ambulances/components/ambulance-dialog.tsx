"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCreateAmbulance, useUpdateAmbulance } from "@/hooks/ambulance-queries"
import { useBranches } from "@/hooks/pharmacy-queries"
import { Ambulance, AmbulancePayload } from "@/types/ambulance"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"

const ambulanceSchema = z.object({
    branchId: z.string().min(1, "Branch is required"),
    vehicleType: z.enum(["owned", "contractual"]),
    vehicleNumber: z.string().min(1, "Vehicle number is required"),
    vehicleModel: z.string().min(1, "Vehicle model is required"),
    driverName: z.string().min(1, "Driver name is required"),
    driverPhone: z.string().min(1, "Driver phone is required"),
    driverLicense: z.string().min(1, "Driver license is required"),
    status: z.string().min(1, "Status is required"),
    note: z.string().optional(),
})

interface AmbulanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    ambulanceToEdit?: Ambulance | null
}

export function AmbulanceDialog({ open, onOpenChange, ambulanceToEdit }: AmbulanceDialogProps) {
    const { data: branchesRes } = useBranches({ limit: 100 })
    const branches = branchesRes?.data || []

    const createMutation = useCreateAmbulance()
    const updateMutation = useUpdateAmbulance()

    const form = useForm<z.infer<typeof ambulanceSchema>>({
        resolver: zodResolver(ambulanceSchema),
        defaultValues: {
            branchId: "",
            vehicleType: "owned",
            vehicleNumber: "",
            vehicleModel: "",
            driverName: "",
            driverPhone: "",
            driverLicense: "",
            status: "available",
            note: "",
        },
    })

    useEffect(() => {
        if (ambulanceToEdit) {
            form.reset({
                branchId: ambulanceToEdit.branchId,
                vehicleType: ambulanceToEdit.vehicleType,
                vehicleNumber: ambulanceToEdit.vehicleNumber,
                vehicleModel: ambulanceToEdit.vehicleModel,
                driverName: ambulanceToEdit.driverName,
                driverPhone: ambulanceToEdit.driverPhone,
                driverLicense: ambulanceToEdit.driverLicense,
                status: ambulanceToEdit.status,
                note: ambulanceToEdit.note || "",
            })
        } else {
            form.reset({
                branchId: "",
                vehicleType: "owned",
                vehicleNumber: "",
                vehicleModel: "",
                driverName: "",
                driverPhone: "",
                driverLicense: "",
                status: "available",
                note: "",
            })
        }
    }, [ambulanceToEdit, form, open])

    const onSubmit = async (values: z.infer<typeof ambulanceSchema>) => {
        if (ambulanceToEdit) {
            await updateMutation.mutateAsync({ id: ambulanceToEdit.id, data: values as AmbulancePayload })
        } else {
            await createMutation.mutateAsync(values as AmbulancePayload)
        }
        onOpenChange(false)
    }

    const isLoading = createMutation.isPending || updateMutation.isPending

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{ambulanceToEdit ? "Edit Ambulance" : "Add New Ambulance"}</DialogTitle>
                    <DialogDescription>
                        {ambulanceToEdit 
                            ? "Update the details of the selected ambulance." 
                            : "Register a new ambulance to the system directory."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="branchId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Branch</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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

                            <FormField
                                control={form.control}
                                name="vehicleType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vehicle Type</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="owned">Owned</SelectItem>
                                                <SelectItem value="contractual">Contractual</SelectItem>
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
                                name="vehicleNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vehicle Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="DHK-METRO-123" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="vehicleModel"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vehicle Model</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Toyota Hiace 2022" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="driverName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Driver Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="driverPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Driver Phone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="017XXXXXXXX" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="driverLicense"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Driver License</FormLabel>
                                        <FormControl>
                                            <Input placeholder="BRTA-12345" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="available">Available</SelectItem>
                                                <SelectItem value="on duty">On Duty</SelectItem>
                                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Note (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Equipped with ICU, etc." 
                                            className="resize-none" 
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {ambulanceToEdit ? "Save Changes" : "Register Ambulance"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
