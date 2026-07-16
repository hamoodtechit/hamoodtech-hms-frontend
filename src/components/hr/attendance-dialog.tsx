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

    // Form State based on the provided schema
    const [formData, setFormData] = useState({
        uid: "",
        deviceSn: "MANUAL",
        punchTime: new Date().toISOString().slice(0, 16), // YYYY-MM-DDThh:mm format for datetime-local
        verifyType: 1,
        status: 0
    })

    const { data: employeesRes } = useEmployees({ branchId: activeStoreId || undefined, limit: 1000 })

    useEffect(() => {
        if (open) {
            if (attendance) {
                const dateObj = new Date(attendance.punchTime)
                // Adjust for local timezone offset for datetime-local input
                const offset = dateObj.getTimezoneOffset()
                const localDate = new Date(dateObj.getTime() - (offset*60*1000))
                
                setFormData({
                    uid: attendance.uid?.toString() || "",
                    deviceSn: attendance.deviceSn || "MANUAL",
                    punchTime: localDate.toISOString().slice(0, 16),
                    verifyType: attendance.verifyType || 1,
                    status: attendance.status ?? 0
                })
            } else {
                const dateObj = new Date()
                const offset = dateObj.getTimezoneOffset()
                const localDate = new Date(dateObj.getTime() - (offset*60*1000))
                
                setFormData({
                    uid: "",
                    deviceSn: "MANUAL",
                    punchTime: localDate.toISOString().slice(0, 16),
                    verifyType: 1,
                    status: 0
                })
            }
        }
    }, [open, attendance, activeStoreId])

    const handleEmployeeChange = (uid: string) => {
        setFormData(prev => ({
            ...prev,
            uid
        }))
    }

    const handleSave = async () => {
        if (!formData.uid || !formData.punchTime) {
            toast.error("Employee and Punch Time are required")
            return
        }

        const payload = {
            uid: Number(formData.uid), // API expects integer
            deviceSn: formData.deviceSn,
            punchTime: new Date(formData.punchTime).toISOString(),
            verifyType: Number(formData.verifyType),
            status: Number(formData.status)
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
                                                    !formData.uid && "text-muted-foreground"
                                                )}
                                            >
                                                {formData.uid
                                                    ? employeesRes?.data?.find(
                                                        (emp) => (emp.employeeNumber || emp.id) === formData.uid
                                                    )?.name
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
                                                            const uid = emp.employeeNumber || emp.id
                                                            return (
                                                                <CommandItem
                                                                    value={emp.name}
                                                                    key={emp.id}
                                                                    onSelect={() => handleEmployeeChange(uid)}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4 text-primary",
                                                                            uid === formData.uid
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {emp.name}
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
                                <Calendar className="h-4 w-4" /> Punch Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Punch Time *</Label>
                                    <Input 
                                        type="datetime-local"
                                        value={formData.punchTime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, punchTime: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <Select 
                                        value={formData.status.toString()} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, status: Number(val) }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">Check In (0)</SelectItem>
                                            <SelectItem value="1">Check Out (1)</SelectItem>
                                            <SelectItem value="2">Break Out (2)</SelectItem>
                                            <SelectItem value="3">Break In (3)</SelectItem>
                                            <SelectItem value="4">Overtime In (4)</SelectItem>
                                            <SelectItem value="5">Overtime Out (5)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Verify Type</Label>
                                    <Select 
                                        value={formData.verifyType.toString()} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, verifyType: Number(val) }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Verify Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Fingerprint (1)</SelectItem>
                                            <SelectItem value="3">Password (3)</SelectItem>
                                            <SelectItem value="4">Card (4)</SelectItem>
                                            <SelectItem value="15">Face (15)</SelectItem>
                                            <SelectItem value="0">Other (0)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Device SN</Label>
                                    <Input 
                                        value={formData.deviceSn}
                                        onChange={(e) => setFormData(prev => ({ ...prev, deviceSn: e.target.value }))}
                                        placeholder="e.g. MANUAL"
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
