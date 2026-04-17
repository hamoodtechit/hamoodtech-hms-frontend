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
import { AssignedRosterPayload } from "@/types/hr"
import { useCreateAssignedRoster, useEmployees, useRosters } from "@/hooks/hr-queries"
import { useBuildings, useFloors, useSections } from "@/hooks/facility-queries"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

const assignmentSchema = z.object({
    employeeId: z.string().min(1, "Employee is required"),
    rosterId: z.string().min(1, "Roster is required"),
    buildingId: z.string().min(1, "Building is required"),
    floorId: z.string().min(1, "Floor is required"),
    sectionId: z.string().optional(),
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
    const createMutation = useCreateAssignedRoster()
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>("")
    const [selectedFloorId, setSelectedFloorId] = useState<string>("")

    // Data Fetching
    const { data: employeesRes } = useEmployees({ branchId, limit: 200 })
    const { data: rostersRes } = useRosters({ branchId, limit: 100 })
    const { data: buildingsRes } = useBuildings({ branchId, limit: 100 })
    const { data: floorsRes } = useFloors({ buildingId: selectedBuildingId, limit: 100 })
    const { data: sectionsRes } = useSections({ floorId: selectedFloorId, limit: 100 })

    // Helper to robustly extract an array from various API response structures
    const getArrayData = (res: any) => {
        if (Array.isArray(res?.data?.data)) return res.data.data
        if (Array.isArray(res?.data)) return res.data
        return []
    }
    
    const employees = getArrayData(employeesRes)
    const rosters = getArrayData(rostersRes)
    const buildings = getArrayData(buildingsRes)
    const floors = getArrayData(floorsRes)
    const sections = getArrayData(sectionsRes)

    const form = useForm<AssignmentFormValues>({
        resolver: zodResolver(assignmentSchema),
        defaultValues: {
            employeeId: "",
            rosterId: "",
            buildingId: "",
            floorId: "",
            sectionId: "",
            startDate: initialDate || "",
            endDate: initialDate || "",
        },
    })

    useEffect(() => {
        if (open) {
            form.reset({
                employeeId: "",
                rosterId: "",
                buildingId: "",
                floorId: "",
                sectionId: "",
                startDate: initialDate || "",
                endDate: initialDate || "",
            })
            setSelectedBuildingId("")
            setSelectedFloorId("")
        }
    }, [open, initialDate, form])

    const onSubmit = async (values: AssignmentFormValues) => {
        // Find names for building/floor/section to satisfy legacy/guide requirements
        const buildingName = buildings.find((b: any) => b.id === values.buildingId)?.name
        const floorName = floors.find((f: any) => f.id === values.floorId)?.name
        const sectionName = sections.find((s: any) => s.id === values.sectionId)?.name

        const payload: AssignedRosterPayload = {
            ...values,
            branchId, // Ensure branchId is saved
            buildingName,
            floorName,
            sectionName,
            startDate: new Date(`${values.startDate}T00:00:00.000Z`).toISOString(),
            endDate: new Date(`${values.endDate}T23:59:59.999Z`).toISOString(),
            assignedBy: "System Admin" 
        }

        try {
            await createMutation.mutateAsync(payload)
            toast.success("Employee assigned successfully")
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
                                name="rosterId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Roster Period *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Period" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(rosters || []).map((r: any) => (
                                                    <SelectItem key={r.id} value={r.id}>
                                                        {r.shift?.name} ({r.startDate ? new Date(r.startDate).toLocaleDateString('en-GB') : 'N/A'})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <FormField
                                control={form.control}
                                name="buildingId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Building *</FormLabel>
                                        <Select 
                                            onValueChange={(val) => {
                                                field.onChange(val)
                                                setSelectedBuildingId(val)
                                                form.setValue("floorId", "")
                                                form.setValue("sectionId", "")
                                            }} 
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Building" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(buildings || []).map((b: any) => (
                                                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="floorId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Floor *</FormLabel>
                                        <Select 
                                            onValueChange={(val) => {
                                                field.onChange(val)
                                                setSelectedFloorId(val)
                                                form.setValue("sectionId", "")
                                            }} 
                                            value={field.value}
                                            disabled={!selectedBuildingId}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Floor" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(floors || []).map((f: any) => (
                                                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="sectionId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Section</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedFloorId}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Section" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {(sections || []).map((s: any) => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
