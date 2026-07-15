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
import { Switch } from "@/components/ui/switch"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { useCreateShift, useUpdateShift } from "@/hooks/hr-queries"
import { Shift } from "@/types/hr"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ShiftDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shift?: Shift | null
    onSuccess?: () => void
}

export function ShiftDialog({ open, onOpenChange, shift, onSuccess }: ShiftDialogProps) {
    const [loading, setLoading] = useState(false)
    const createMutation = useCreateShift()
    const updateMutation = useUpdateShift()

    const isEdit = !!shift

    // Form State
    const [name, setName] = useState("")
    const [shiftStartTime, setShiftStartTime] = useState("09:00")
    const [shiftEndTime, setShiftEndTime] = useState("17:00")
    
    const [checkInStartTime, setCheckInStartTime] = useState("07:00")
    const [checkInEndTime, setCheckInEndTime] = useState("11:00")
    
    const [checkOutStartTime, setCheckOutStartTime] = useState("16:00")
    const [checkOutEndTime, setCheckOutEndTime] = useState("20:00")
    
    const [graceMinutes, setGraceMinutes] = useState(15)
    const [overtimeThresholdMinutes, setOvertimeThresholdMinutes] = useState(60)
    const [breakMinutes, setBreakMinutes] = useState(60)
    
    const [isActive, setIsActive] = useState(true)

    useEffect(() => {
        if (open) {
            if (shift) {
                setName(shift.name)
                setShiftStartTime(shift.shiftStartTime)
                setShiftEndTime(shift.shiftEndTime)
                setCheckInStartTime(shift.checkInStartTime)
                setCheckInEndTime(shift.checkInEndTime)
                setCheckOutStartTime(shift.checkOutStartTime)
                setCheckOutEndTime(shift.checkOutEndTime)
                setGraceMinutes(shift.graceMinutes)
                setOvertimeThresholdMinutes(shift.overtimeThresholdMinutes)
                setBreakMinutes(shift.breakMinutes)
                setIsActive(shift.isActive)
            } else {
                setName("")
                setShiftStartTime("09:00")
                setShiftEndTime("17:00")
                setCheckInStartTime("07:00")
                setCheckInEndTime("11:00")
                setCheckOutStartTime("16:00")
                setCheckOutEndTime("20:00")
                setGraceMinutes(15)
                setOvertimeThresholdMinutes(60)
                setBreakMinutes(60)
                setIsActive(true)
            }
        }
    }, [open, shift])

    const handleSave = async () => {
        if (!name || !shiftStartTime || !shiftEndTime) {
            toast.error("Name and primary shift times are required")
            return
        }

        setLoading(true)
        try {
            const payload = {
                name,
                shiftStartTime,
                shiftEndTime,
                checkInStartTime,
                checkInEndTime,
                checkOutStartTime,
                checkOutEndTime,
                graceMinutes,
                overtimeThresholdMinutes,
                breakMinutes,
                isActive
            }

            if (isEdit && shift) {
                await updateMutation.mutateAsync({
                    id: shift.id.toString(),
                    data: payload
                })
                toast.success("Shift updated successfully")
            } else {
                await createMutation.mutateAsync(payload)
                toast.success("Shift created successfully")
            }
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            toast.error(isEdit ? "Failed to update shift" : "Failed to create shift")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Shift" : "Add New Shift"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update shift timing and attendance details." : "Define a work hour template for the attendance server."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Shift Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Morning Shift, Night Shift"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-md border">
                        <div className="col-span-2">
                            <h4 className="font-semibold text-sm">Primary Shift Time</h4>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="shiftStartTime">Start Time *</Label>
                            <Input
                                id="shiftStartTime"
                                type="time"
                                value={shiftStartTime}
                                onChange={(e) => setShiftStartTime(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="shiftEndTime">End Time *</Label>
                            <Input
                                id="shiftEndTime"
                                type="time"
                                value={shiftEndTime}
                                onChange={(e) => setShiftEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-md border">
                        <div className="col-span-2">
                            <h4 className="font-semibold text-sm">Check-In Boundaries</h4>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="checkInStartTime">Allow Check-In From *</Label>
                            <Input
                                id="checkInStartTime"
                                type="time"
                                value={checkInStartTime}
                                onChange={(e) => setCheckInStartTime(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="checkInEndTime">Until *</Label>
                            <Input
                                id="checkInEndTime"
                                type="time"
                                value={checkInEndTime}
                                onChange={(e) => setCheckInEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-md border">
                        <div className="col-span-2">
                            <h4 className="font-semibold text-sm">Check-Out Boundaries</h4>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="checkOutStartTime">Allow Check-Out From *</Label>
                            <Input
                                id="checkOutStartTime"
                                type="time"
                                value={checkOutStartTime}
                                onChange={(e) => setCheckOutStartTime(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="checkOutEndTime">Until *</Label>
                            <Input
                                id="checkOutEndTime"
                                type="time"
                                value={checkOutEndTime}
                                onChange={(e) => setCheckOutEndTime(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="graceMinutes" className="truncate">Grace (mins)</Label>
                            <SmartNumberInput
                                id="graceMinutes"
                                value={graceMinutes}
                                onChange={(val) => setGraceMinutes(val || 0)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="breakMinutes" className="truncate">Break (mins)</Label>
                            <SmartNumberInput
                                id="breakMinutes"
                                value={breakMinutes}
                                onChange={(val) => setBreakMinutes(val || 0)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="overtimeThreshold" className="truncate">OT Threshold</Label>
                            <SmartNumberInput
                                id="overtimeThreshold"
                                value={overtimeThresholdMinutes}
                                onChange={(val) => setOvertimeThresholdMinutes(val || 0)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                        <Switch
                            id="isActive"
                            checked={isActive}
                            onCheckedChange={setIsActive}
                        />
                        <Label htmlFor="isActive">Shift is Active</Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Update Shift" : "Save Shift"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
