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
import { Calendar, Clock, Loader2, User } from "lucide-react"
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
        slNo: "",
        employeeId: "",
        employeeNumber: "",
        employeeName: "",
        autoAssign: "",
        date: new Date().toISOString().split('T')[0],
        isoDate: new Date().toISOString(),
        shift: "",
        onDuty: "",
        offDuty: "",
        clockIn: "",
        clockOut: "",
        normal: "",
        realTime: "",
        late: "",
        early: "",
        absent: "",
        otTime: "",
        workTime: "",
        exception: "",
        mustClockIn: "",
        mustClockOut: "",
        department: "",
        nDays: "",
        weekEnd: "",
        holiday: "",
        attTime: "",
        nDaysOt: "",
        weekEndOt: "",
        holidayOt: "",
        branchId: activeStoreId || ""
    })

    const { data: employeesRes } = useEmployees({ branchId: activeStoreId || undefined, limit: 1000 })

    useEffect(() => {
        if (open) {
            if (attendance) {
                setFormData({
                    slNo: attendance.slNo || "",
                    employeeId: attendance.employeeId || "",
                    employeeNumber: attendance.employeeNumber || "",
                    employeeName: attendance.employeeName || "",
                    autoAssign: attendance.autoAssign || "",
                    date: attendance.date || "",
                    isoDate: typeof attendance.isoDate === 'string' ? attendance.isoDate : attendance.isoDate?.toISOString() || "",
                    shift: attendance.shift || "",
                    onDuty: attendance.onDuty || "",
                    offDuty: attendance.offDuty || "",
                    clockIn: attendance.clockIn || "",
                    clockOut: attendance.clockOut || "",
                    normal: attendance.normal || "",
                    realTime: attendance.realTime || "",
                    late: attendance.late || "",
                    early: attendance.early || "",
                    absent: attendance.absent || "",
                    otTime: attendance.otTime || "",
                    workTime: attendance.workTime || "",
                    exception: attendance.exception || "",
                    mustClockIn: attendance.mustClockIn || "",
                    mustClockOut: attendance.mustClockOut || "",
                    department: attendance.department || "",
                    nDays: attendance.nDays || "",
                    weekEnd: attendance.weekEnd || "",
                    holiday: attendance.holiday || "",
                    attTime: attendance.attTime || "",
                    nDaysOt: attendance.nDaysOt || "",
                    weekEndOt: attendance.weekEndOt || "",
                    holidayOt: attendance.holidayOt || "",
                    branchId: attendance.branchId
                })
            } else {
                setFormData(prev => ({
                    ...prev,
                    branchId: activeStoreId || "",
                    date: new Date().toISOString().split('T')[0],
                    isoDate: new Date().toISOString()
                }))
            }
        }
    }, [open, attendance, activeStoreId])

    const handleEmployeeChange = (empId: string) => {
        const emp = employeesRes?.data?.find(e => e.id === empId)
        if (emp) {
            setFormData(prev => ({
                ...prev,
                employeeId: empId,
                employeeNumber: emp.employeeNumber || "",
                employeeName: emp.name,
                department: emp.department?.name || ""
            }))
        }
    }

    const handleSave = async () => {
        if (!formData.employeeName || !formData.branchId) {
            toast.error("Employee and Branch are required")
            return
        }

        setLoading(true)
        try {
            if (isEdit) {
                await updateMutation.mutateAsync({
                    id: attendance?.id || "",
                    data: formData
                })
                toast.success("Attendance record updated successfully")
            } else {
                await createMutation.mutateAsync(formData)
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
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label>Employee *</Label>
                                    <Select 
                                        value={formData.employeeId} 
                                        onValueChange={handleEmployeeChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employeesRes?.data?.map(emp => (
                                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Employee Name</Label>
                                    <Input value={formData.employeeName} disabled className="bg-muted" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Employee ID</Label>
                                    <Input value={formData.employeeNumber} disabled className="bg-muted" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Department</Label>
                                    <Input value={formData.department} disabled className="bg-muted" />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Branch *</Label>
                                    <Select 
                                        value={formData.branchId} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, branchId: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Branch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map(b => (
                                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Shift</Label>
                                    <Input 
                                        value={formData.shift} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, shift: e.target.value }))}
                                        placeholder="Morning/Evening"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Date & Time */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold border-b pb-2 flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Date & Duty Timings
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Input 
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Clock In</Label>
                                    <Input 
                                        type="time"
                                        value={formData.clockIn}
                                        onChange={(e) => setFormData(prev => ({ ...prev, clockIn: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Clock Out</Label>
                                    <Input 
                                        type="time"
                                        value={formData.clockOut}
                                        onChange={(e) => setFormData(prev => ({ ...prev, clockOut: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Shift On Duty</Label>
                                    <Input 
                                        type="time"
                                        value={formData.onDuty}
                                        onChange={(e) => setFormData(prev => ({ ...prev, onDuty: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Shift Off Duty</Label>
                                    <Input 
                                        type="time"
                                        value={formData.offDuty}
                                        onChange={(e) => setFormData(prev => ({ ...prev, offDuty: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Metrics & Calculations */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold border-b pb-2 flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Working Hour Metrics
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="grid gap-2">
                                    <Label>Work Time</Label>
                                    <Input 
                                        value={formData.workTime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, workTime: e.target.value }))}
                                        placeholder="e.g. 08:00"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Late (Min)</Label>
                                    <Input 
                                        value={formData.late}
                                        onChange={(e) => setFormData(prev => ({ ...prev, late: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Early (Min)</Label>
                                    <Input 
                                        value={formData.early}
                                        onChange={(e) => setFormData(prev => ({ ...prev, early: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>OT Time</Label>
                                    <Input 
                                        value={formData.otTime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, otTime: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Real Time</Label>
                                    <Input 
                                        value={formData.realTime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, realTime: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Att Time</Label>
                                    <Input 
                                        value={formData.attTime}
                                        onChange={(e) => setFormData(prev => ({ ...prev, attTime: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Flags & Exceptions */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold border-b pb-2">Flags & Exceptions</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="grid gap-2">
                                    <Label>Absent</Label>
                                    <Select 
                                        value={formData.absent} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, absent: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="No" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="True">Yes</SelectItem>
                                            <SelectItem value="False">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Holiday</Label>
                                    <Select 
                                        value={formData.holiday} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, holiday: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="No" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="True">Yes</SelectItem>
                                            <SelectItem value="False">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Weekend</Label>
                                    <Select 
                                        value={formData.weekEnd} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, weekEnd: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="No" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="True">Yes</SelectItem>
                                            <SelectItem value="False">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Exception</Label>
                                    <Input 
                                        value={formData.exception}
                                        onChange={(e) => setFormData(prev => ({ ...prev, exception: e.target.value }))}
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
