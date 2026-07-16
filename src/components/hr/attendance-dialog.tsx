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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useCreateAttendance, useEmployees, useUpdateAttendance } from "@/hooks/hr-queries"
import { useStoreContext } from "@/store/use-store-context"
import { Attendance } from "@/types/hr"
import { Calendar, Clock, Loader2, User, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"

interface AttendanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    attendance?: Attendance | null
    onSuccess?: () => void
    branches?: { id: string; name: string }[]
}

export function AttendanceDialog({ 
    open, 
    onOpenChange, 
    attendance, 
    onSuccess, 
    branches = [] 
}: AttendanceDialogProps) {
    const [loading, setLoading] = useState(false)
    const createMutation = useCreateAttendance()
    const updateMutation = useUpdateAttendance()
    const { activeStoreId } = useStoreContext()
    
    const isEdit = !!attendance

    const [formData, setFormData] = useState({
        employeeId: "",
        employeeNumber: "",
        employeeName: "",
        date: format(new Date(), "yyyy-MM-dd"),
        clockIn: "09:00",
        clockOut: "17:00",
        absent: "False",
    })

    const { data: employeesRes } = useEmployees({ branchId: activeStoreId || undefined, limit: 1000 })

    useEffect(() => {
        if (open) {
            if (attendance) {
                setFormData({
                    employeeId: attendance.employeeId || "",
                    employeeNumber: attendance.employeeNumber || "",
                    employeeName: attendance.employeeName || "",
                    date: attendance.date || format(new Date(), "yyyy-MM-dd"),
                    clockIn: attendance.clockIn || "",
                    clockOut: attendance.clockOut || "",
                    absent: attendance.absent || "False",
                })
            } else {
                setFormData({
                    employeeId: "",
                    employeeNumber: "",
                    employeeName: "",
                    date: format(new Date(), "yyyy-MM-dd"),
                    clockIn: "09:00",
                    clockOut: "17:00",
                    absent: "False",
                })
            }
        }
    }, [open, attendance, activeStoreId])

    const handleEmployeeChange = (emp: any) => {
        setFormData(prev => ({
            ...prev,
            employeeId: emp.id,
            employeeNumber: emp.employeeNumber || "",
            employeeName: emp.name
        }))
    }

    const handleSave = async () => {
        if (!formData.employeeName || !formData.date) {
            toast.error("Employee name and Date are required")
            return
        }

        const payload = {
            ...formData,
            branchId: activeStoreId || ""
        }

        setLoading(true)
        try {
            if (isEdit) {
                await updateMutation.mutateAsync({
                    id: attendance?.id?.toString() || "",
                    data: payload
                })
                toast.success("Attendance record updated successfully")
            } else {
                await createMutation.mutateAsync(payload)
                toast.success("Attendance record created successfully")
            }
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            toast.error(isEdit ? "Failed to update attendance" : "Failed to create attendance")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{isEdit ? "Edit Attendance" : "Add New Attendance"}</DialogTitle>
                    <DialogDescription>
                        Enter attendance details manually or for corrections.
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="max-h-[80vh] px-6">
                    <div className="grid gap-6 py-4">
                        {/* Section: Employee Selection */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold border-b pb-2 flex items-center gap-2">
                                <User className="h-4 w-4" /> Employee Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Employee *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "justify-between font-normal",
                                                    !formData.employeeId && "text-muted-foreground"
                                                )}
                                            >
                                                {formData.employeeId
                                                    ? formData.employeeName
                                                    : "Search employee..."}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] sm:w-[350px] p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search employee..." />
                                                <CommandList>
                                                    <CommandEmpty>No employee found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {employeesRes?.data?.map((emp) => {
                                                            return (
                                                                <CommandItem
                                                                    value={emp.name}
                                                                    key={emp.id}
                                                                    onSelect={() => handleEmployeeChange(emp)}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4 text-primary",
                                                                            emp.id === formData.employeeId
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {emp.name} {emp.employeeNumber ? `(${emp.employeeNumber})` : ""}
                                                                </CommandItem>
                                                            )
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        </div>

                        {/* Section: Date & Time */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold border-b pb-2 flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Attendance Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Date *</Label>
                                    <Input 
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status (Absent)</Label>
                                    <Select 
                                        value={formData.absent} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, absent: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="False">Present (False)</SelectItem>
                                            <SelectItem value="True">Absent (True)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Clock In Time</Label>
                                    <Input 
                                        type="time"
                                        value={formData.clockIn}
                                        onChange={(e) => setFormData(prev => ({ ...prev, clockIn: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Clock Out Time</Label>
                                    <Input 
                                        type="time"
                                        value={formData.clockOut}
                                        onChange={(e) => setFormData(prev => ({ ...prev, clockOut: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Update Attendance" : "Save Attendance"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
