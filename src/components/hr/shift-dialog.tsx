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
import { Textarea } from "@/components/ui/textarea"
import { useCreateShift, useUpdateShift } from "@/hooks/hr-queries"
import { useStoreContext } from "@/store/use-store-context"
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
    const { activeStoreId, stores } = useStoreContext()
    
    const activeBranchName = stores.find(s => s.id === activeStoreId)?.name || "N/A"

    const isEdit = !!shift

    // Form State
    const [name, setName] = useState("")
    const [startTime, setStartTime] = useState("08:00")
    const [endTime, setEndTime] = useState("16:00")
    const [description, setDescription] = useState("")
    const [branchId, setBranchId] = useState("")

    useEffect(() => {
        if (open) {
            if (shift) {
                setName(shift.name)
                // Convert ISO or Date string to HH:mm for input type="time"
                const sDate = new Date(shift.startTime)
                const eDate = new Date(shift.endTime)
                setStartTime(`${sDate.getUTCHours().toString().padStart(2, '0')}:${sDate.getUTCMinutes().toString().padStart(2, '0')}`)
                setEndTime(`${eDate.getUTCHours().toString().padStart(2, '0')}:${eDate.getUTCMinutes().toString().padStart(2, '0')}`)
                setDescription(shift.description || "")
                setBranchId(shift.branchId)
            } else {
                setName("")
                setStartTime("08:00")
                setEndTime("16:00")
                setDescription("")
                setBranchId(activeStoreId || "")
            }
        }
    }, [open, shift, activeStoreId])

    const handleSave = async () => {
        if (!name || !branchId || !startTime || !endTime) {
            toast.error("Name, Branch, and Times are required")
            return
        }

        setLoading(true)
        try {
            // Create full ISO dates for the backend (using a dummy date for time storage)
            const today = new Date().toISOString().split('T')[0]
            const startISO = new Date(`${today}T${startTime}:00.000Z`).toISOString()
            const endISO = new Date(`${today}T${endTime}:00.000Z`).toISOString()

            if (isEdit && shift) {
                await updateMutation.mutateAsync({
                    id: shift.id,
                    data: {
                        name,
                        startTime: startISO,
                        endTime: endISO,
                        description,
                        branchId
                    }
                })
                toast.success("Shift updated successfully")
            } else {
                await createMutation.mutateAsync({
                    name,
                    startTime: startISO,
                    endTime: endISO,
                    description,
                    branchId
                })
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Shift" : "Add New Shift"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update shift timing and details." : "Define a work hour template for roles."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Active Branch</label>
                        <Input 
                            value={activeBranchName} 
                            disabled 
                            className="bg-muted"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="name">Shift Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Morning Shift, Night Shift"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="startTime">Start Time *</Label>
                            <Input
                                id="startTime"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="endTime">End Time *</Label>
                            <Input
                                id="endTime"
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short description of the shift..."
                            rows={3}
                        />
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
