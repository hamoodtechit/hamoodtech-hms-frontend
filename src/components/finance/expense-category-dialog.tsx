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
import { useCreateExpenseCategory, useUpdateExpenseCategory, useExpenseCategories } from "@/hooks/expense-queries"
import { ExpenseCategory } from "@/types/expense"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ExpenseCategoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    category?: ExpenseCategory | null
    onSuccess?: () => void
}

export function ExpenseCategoryDialog({ open, onOpenChange, category, onSuccess }: ExpenseCategoryDialogProps) {
    const [loading, setLoading] = useState(false)
    const createMutation = useCreateExpenseCategory()
    const updateMutation = useUpdateExpenseCategory()
    const { data: categoriesRes, isLoading: categoriesLoading } = useExpenseCategories({ limit: 100 })
    const parentCategories = categoriesRes?.categories?.filter(c => c.id !== category?.id) || []

    const isEdit = !!category

    // Form State
    const [name, setName] = useState("")
    const [nameBangla, setNameBangla] = useState("")
    const [description, setDescription] = useState("")
    const [parentId, setParentId] = useState<string>("")

    useEffect(() => {
        if (open) {
            if (category) {
                setName(category.name)
                setNameBangla(category.nameBangla || "")
                setDescription(category.description || "")
                setParentId(category.parentId || "")
            } else {
                setName("")
                setNameBangla("")
                setDescription("")
                setParentId("")
            }
        }
    }, [open, category])

    const handleSave = async () => {
        if (!name) {
            toast.error("Category name is required")
            return
        }

        setLoading(true)
        try {
            const payload: any = { name, nameBangla, description };
            if (parentId && parentId !== " ") payload.parentId = parentId;

            if (isEdit && category) {
                await updateMutation.mutateAsync({
                    id: category.id,
                    data: payload
                })
                toast.success("Category updated successfully")
            } else {
                await createMutation.mutateAsync(payload)
                toast.success("Category created successfully")
            }
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            toast.error(isEdit ? "Failed to update category" : "Failed to create category")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Category" : "Add New Category"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update the expense category details." : "Create a new category for your expenses."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Category Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Buy Medicine, Office Rent"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="parentId">Parent Category (Optional)</Label>
                        <Select value={parentId} onValueChange={setParentId}>
                            <SelectTrigger id="parentId" disabled={categoriesLoading}>
                                <SelectValue placeholder="Select a parent category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value=" ">None (Main Category)</SelectItem>
                                {parentCategories.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="nameBangla">Bangla Name (Optional)</Label>
                        <Input
                            id="nameBangla"
                            value={nameBangla}
                            onChange={(e) => setNameBangla(e.target.value)}
                            placeholder="e.g. ওষুধ ক্রয়"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Briefly describe what this category is for..."
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
                        {isEdit ? "Update Category" : "Save Category"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
