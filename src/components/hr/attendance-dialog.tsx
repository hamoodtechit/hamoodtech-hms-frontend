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
        uid: "",
        deviceSn: "MANUAL_ENTRY",
        punchTime: new Date().toISOString().slice(0, 16), // YYYY-MM-DDThh:mm format for datetime-local
        verifyType: 1
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
                    deviceSn: attendance.deviceSn || "MANUAL_ENTRY",
                    punchTime: localDate.toISOString().slice(0, 16),
                    verifyType: attendance.verifyType || 1
                })
            } else {
                const dateObj = new Date()
                const offset = dateObj.getTimezoneOffset()
                const localDate = new Date(dateObj.getTime() - (offset*60*1000))
                
                setFormData({
                    uid: "",
                    deviceSn: "MANUAL_ENTRY",
                    punchTime: localDate.toISOString().slice(0, 16),
                    verifyType: 1
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
            uid: formData.uid,
            deviceSn: formData.deviceSn,
            punchTime: new Date(formData.punchTime).toISOString(),
            verifyType: Number(formData.verifyType)
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
                                    <Select 
                                        value={formData.uid} 
                                        onValueChange={handleEmployeeChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {employeesRes?.data?.map(emp => {
                                                const uid = emp.employeeNumber?.replace(/\D/g, '') || emp.id
                                                return <SelectItem key={emp.id} value={uid}>{emp.name}</SelectItem>
                                            })}
                                        </SelectContent>
                                    </Select>
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
                                    <Label>Verify Type</Label>
                                    <Select 
                                        value={formData.verifyType.toString()} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, verifyType: Number(val) }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Verify Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Fingerprint</SelectItem>
                                            <SelectItem value="3">Password</SelectItem>
                                            <SelectItem value="4">Card</SelectItem>
                                            <SelectItem value="15">Face</SelectItem>
                                            <SelectItem value="0">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Device SN</Label>
                                    <Input 
                                        value={formData.deviceSn}
                                        onChange={(e) => setFormData(prev => ({ ...prev, deviceSn: e.target.value }))}
                                        placeholder="e.g. MANUAL_ENTRY"
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
