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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useCreateDesignation, useDepartments, useUpdateDesignation } from "@/hooks/hr-queries"
import { useStoreContext } from "@/store/use-store-context"
import { Designation } from "@/types/hr"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface DesignationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    designation?: Designation | null
    onSuccess?: () => void
}

export function DesignationDialog({ open, onOpenChange, designation, onSuccess }: DesignationDialogProps) {
    const [loading, setLoading] = useState(false)
    const createMutation = useCreateDesignation()
    const updateMutation = useUpdateDesignation()
    const { activeStoreId, stores } = useStoreContext()
    
    const activeBranchName = stores.find(s => s.id === activeStoreId)?.name || "N/A"

    const isEdit = !!designation

    // Form State
    const [name, setName] = useState("")
    const [nameBangla, setNameBangla] = useState("")
    const [description, setDescription] = useState("")
    const [branchId, setBranchId] = useState("")
    const [departmentId, setDepartmentId] = useState("")

    const { data: departmentsRes } = useDepartments({ 
        branchId: branchId || activeStoreId || undefined, 
        limit: 100 
    })
    const departments = departmentsRes?.data || []

    useEffect(() => {
        if (open) {
            if (designation) {
                setName(designation.name)
                setNameBangla(designation.nameBangla || "")
                setDescription(designation.description || "")
                setBranchId(designation.branchId)
                setDepartmentId(designation.departmentId)
            } else {
                setName("")
                setNameBangla("")
                setDescription("")
                setBranchId(activeStoreId || "")
                setDepartmentId("")
            }
        }
    }, [open, designation, activeStoreId])

    const handleSave = async () => {
        if (!name || !branchId || !departmentId) {
            toast.error("Name, Branch, and Department are required")
            return
        }

        setLoading(true)
        try {
            if (isEdit && designation) {
                await updateMutation.mutateAsync({
                    id: designation.id,
                    data: {
                        name,
                        nameBangla,
                        description,
                        branchId,
                        departmentId
                    }
                })
                toast.success("Designation updated successfully")
            } else {
                await createMutation.mutateAsync({
                    name,
                    nameBangla,
                    description,
                    branchId,
                    departmentId
                })
                toast.success("Designation created successfully")
            }
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            toast.error(isEdit ? "Failed to update designation" : "Failed to create designation")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Designation" : "Add New Designation"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update designation details." : "Create a new designation within a department."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Active Branch</Label>
                        <Input 
                            value={activeBranchName} 
                            disabled 
                            className="bg-muted"
                        />
                        <p className="text-[10px] text-muted-foreground italic">
                            Branch is driven by global selection.
                        </p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="department">Department *</Label>
                        <Select value={departmentId} onValueChange={setDepartmentId} disabled={!branchId}>
                            <SelectTrigger id="department">
                                <SelectValue placeholder={branchId ? "Select Department" : "Select Branch First"} />
                            </SelectTrigger>
                            <SelectContent>
                                {departments.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="name">Designation Name (English) *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Senior Nurse, Ward Boy"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="nameBangla">Designation Name (Bangla)</Label>
                        <Input
                            id="nameBangla"
                            value={nameBangla}
                            onChange={(e) => setNameBangla(e.target.value)}
                            placeholder="পদবীর নাম"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief details about the designation..."
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
                        {isEdit ? "Update Designation" : "Save Designation"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
