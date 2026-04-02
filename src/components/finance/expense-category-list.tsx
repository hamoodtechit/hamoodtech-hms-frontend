"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useDeleteExpenseCategory, useExpenseCategories } from "@/hooks/expense-queries"
import { ExpenseCategory } from "@/types/expense"
import { Edit, Loader2, Plus, Trash2 } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { useState } from "react"
import { toast } from "sonner"
import { ExpenseCategoryDialog } from "./expense-category-dialog"

export function ExpenseCategoryList() {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null)

    const { hasPermission } = usePermissions()
    const canRead = hasPermission('expense-category:read')

    const { data: response, isLoading, refetch } = useExpenseCategories(undefined, { enabled: canRead })
    const deleteMutation = useDeleteExpenseCategory()

    const categories = response?.categories || []

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this category?")) {
            try {
                await deleteMutation.mutateAsync(id)
                toast.success("Category deleted successfully")
            } catch (error) {
                toast.error("Failed to delete category")
            }
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Expense Categories</h2>
                    <p className="text-sm text-muted-foreground">Manage categories for your business expenses.</p>
                </div>
                <Button onClick={() => {
                    setSelectedCategory(null)
                    setDialogOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Category
                </Button>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category Name</TableHead>
                            <TableHead>Bangla Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No categories found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell>{category.nameBangla || "—"}</TableCell>
                                    <TableCell className="max-w-[300px] truncate">
                                        {category.description || "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedCategory(category)
                                                    setDialogOpen(true)
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                disabled={deleteMutation.isPending}
                                                onClick={() => handleDelete(category.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <ExpenseCategoryDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                category={selectedCategory}
                onSuccess={refetch}
            />
        </div>
    )
}
