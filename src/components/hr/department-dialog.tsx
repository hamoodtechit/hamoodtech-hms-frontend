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
import { useCreateDepartment, useUpdateDepartment } from "@/hooks/hr-queries"
import { useStoreContext } from "@/store/use-store-context"
import { Department } from "@/types/hr"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface DepartmentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    department?: Department | null
    onSuccess?: () => void
}

export function DepartmentDialog({ open, onOpenChange, department, onSuccess }: DepartmentDialogProps) {
    const [loading, setLoading] = useState(false)
    const createMutation = useCreateDepartment()
    const updateMutation = useUpdateDepartment()
    const { activeStoreId, stores } = useStoreContext()
    
    const activeBranchName = stores.find(s => s.id === activeStoreId)?.name || "N/A"

    const isEdit = !!department

    // Form State
    const [name, setName] = useState("")
    const [nameBangla, setNameBangla] = useState("")
    const [description, setDescription] = useState("")
    const [branchId, setBranchId] = useState("")

    useEffect(() => {
        if (open) {
            if (department) {
                setName(department.name)
                setNameBangla(department.nameBangla || "")
                setDescription(department.description || "")
                setBranchId(department.branchId)
            } else {
                setName("")
                setNameBangla("")
                setDescription("")
                setBranchId(activeStoreId || "")
            }
        }
    }, [open, department, activeStoreId])

    const handleSave = async () => {
        if (!name || !branchId) {
            toast.error("Name and Branch are required")
            return
        }

        setLoading(true)
        try {
            if (isEdit && department) {
                await updateMutation.mutateAsync({
                    id: department.id,
                    data: {
                        name,
                        nameBangla,
                        description,
                        branchId
                    }
                })
                toast.success("Department updated successfully")
            } else {
                await createMutation.mutateAsync({
                    name,
                    nameBangla,
                    description,
                    branchId
                })
                toast.success("Department created successfully")
            }
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            toast.error(isEdit ? "Failed to update department" : "Failed to create department")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Department" : "Add New Department"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update department details." : "Create a new department for your organization."}
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
                        <Label htmlFor="name">Department Name (English) *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Nursing, ICU"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="nameBangla">Department Name (Bangla)</Label>
                        <Input
                            id="nameBangla"
                            value={nameBangla}
                            onChange={(e) => setNameBangla(e.target.value)}
                            placeholder="বিভাগের নাম"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief details about the department..."
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
                        {isEdit ? "Update Department" : "Save Department"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
