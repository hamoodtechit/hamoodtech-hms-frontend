"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useCreateTestGroup, useDeleteTestGroup, useTestGroups, useUpdateTestGroup } from "@/hooks/diagnostic-queries"
import { DiagnosticTestGroupPayload } from "@/types/diagnostic"
import { Edit2, Loader2, Plus, Trash2, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface TestGroupManagerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function TestGroupManagerDialog({ open, onOpenChange }: TestGroupManagerDialogProps) {
    const { data: groupsRes, isLoading } = useTestGroups()
    const createMutation = useCreateTestGroup()
    const updateMutation = useUpdateTestGroup()
    const deleteMutation = useDeleteTestGroup()

    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<DiagnosticTestGroupPayload>({
        name: "",
        description: ""
    })

    const groups = groupsRes?.data || []

    const handleSave = async () => {
        if (!formData.name) return toast.error("Name is required")

        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: formData })
                toast.success("Group updated")
            } else {
                await createMutation.mutateAsync(formData)
                toast.success("Group created")
            }
            resetForm()
        } catch {
            toast.error("Action failed")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? Tests in this group will no longer be categorized.")) return
        try {
            await deleteMutation.mutateAsync(id)
            toast.success("Group deleted")
        } catch {
            toast.error("Failed to delete group")
        }
    }

    const resetForm = () => {
        setFormData({ name: "", description: "" })
        setEditingId(null)
        setIsAdding(false)
    }

    const startEdit = (group: any) => {
        setFormData({ name: group.name, description: group.description || "" })
        setEditingId(group.id)
        setIsAdding(true)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-3xl">
                <DialogHeader className="p-6 pb-2 bg-muted/20">
                    <DialogTitle className="text-2xl font-black tracking-tight text-primary flex items-center gap-2">
                        Manage Test Groups
                    </DialogTitle>
                    <DialogDescription className="font-medium text-muted-foreground">
                        Create categories like Biochemistry or Hematology for organized reports.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {isAdding ? (
                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-4 animate-in slide-in-from-top-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-black uppercase text-primary tracking-widest">
                                    {editingId ? "Edit Group" : "Create New Group"}
                                </h3>
                                <Button variant="ghost" size="icon" onClick={resetForm} className="h-6 w-6">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="grid gap-3">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Group Name *</Label>
                                    <Input 
                                        value={formData.name}
                                        onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g. Biochemistry"
                                        className="h-10 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description</Label>
                                    <Input 
                                        value={formData.description}
                                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Optional description..."
                                        className="h-10 rounded-xl"
                                    />
                                </div>
                                <Button 
                                    onClick={handleSave} 
                                    className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 font-black"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {editingId ? "Update Group Category" : "Save Group Category"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button 
                            onClick={() => setIsAdding(true)} 
                            className="w-full h-12 rounded-xl group hover:shadow-xl transition-all font-black gap-2"
                        >
                            <Plus className="h-4 w-4 group-hover:scale-125 transition-transform" />
                            Create New Category Group
                        </Button>
                    )}

                    <ScrollArea className="h-[300px] pr-4">
                        <Table>
                            <TableHeader className="bg-muted/50 rounded-lg">
                                <TableRow className="border-none hover:bg-transparent">
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-10 px-4">Group Name</TableHead>
                                    <TableHead className="font-black uppercase text-[10px] tracking-widest h-10 px-4">Description</TableHead>
                                    <TableHead className="text-right font-black uppercase text-[10px] tracking-widest h-10 px-4">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-10 opacity-50">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                                            <span className="text-sm font-bold">Loading groups...</span>
                                        </TableCell>
                                    </TableRow>
                                ) : groups.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-10 text-muted-foreground font-medium italic">
                                            No groups created yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    groups.map((group) => (
                                        <TableRow key={group.id} className="group/row hover:bg-muted/30 border-b-muted/20 transition-colors">
                                            <TableCell className="font-bold text-sm h-12 px-4">{group.name}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground h-12 px-4 max-w-[150px] truncate">
                                                {group.description || "—"}
                                            </TableCell>
                                            <TableCell className="text-right h-12 px-4">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 rounded-lg hover:bg-blue-600/10 text-blue-600"
                                                        onClick={() => startEdit(group)}
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive"
                                                        onClick={() => handleDelete(group.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    )
}
