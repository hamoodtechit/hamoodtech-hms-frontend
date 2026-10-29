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
import { MediaPicker } from "@/components/media/media-picker"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateExpense, useExpenseCategories } from "@/hooks/expense-queries"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useStoreContext } from "@/store/use-store-context"
import { Expense } from "@/types/expense"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface ExpenseDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    expense?: Expense | null
    onSuccess?: () => void
}

export function ExpenseDialog({ open, onOpenChange, expense, onSuccess }: ExpenseDialogProps) {
    const [loading, setLoading] = useState(false)
    const { activeStoreId } = useStoreContext()
    
    const { data: categoriesRes } = useExpenseCategories({ limit: 100 })
    const { data: accountsRes } = useFinanceAccounts({ limit: 100 })
    const createMutation = useCreateExpense()

    const isEdit = !!expense

    // Form State
    const [categoryId, setCategoryId] = useState("")
    const [subCategoryId, setSubCategoryId] = useState<string>("")
    const [accountId, setAccountId] = useState("")
    const [amount, setAmount] = useState(0)
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
    const [note, setNote] = useState("")
    const [imageUrl, setImageUrl] = useState("")

    const categories = categoriesRes?.categories || []
    const mainCategories = categories.filter(c => !c.parentId)
    const availableSubCategories = categories.filter(c => c.parentId === categoryId)

    const accounts = accountsRes?.data || []

    useEffect(() => {
        if (open) {
            if (expense) {
                setCategoryId(expense.categoryId)
                setSubCategoryId(expense.subCategoryId || "")
                setAccountId(expense.accountId)
                setAmount(Number(expense.amount))
                setDate(format(new Date(expense.date), "yyyy-MM-dd'T'HH:mm"))
                setNote(expense.note || "")
                setImageUrl(expense.imageUrl || "")
            } else {
                setCategoryId("")
                setSubCategoryId("")
                setAccountId("")
                setAmount(0)
                setDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
                setNote("")
                setImageUrl("")
            }
        }
    }, [open, expense])

    // Reset sub-category when main category changes
    useEffect(() => {
        if (!isEdit) {
            setSubCategoryId("")
        }
    }, [categoryId, isEdit])

    const handleSave = async () => {
        if (!categoryId) return toast.error("Please select a category")
        if (!accountId) return toast.error("Please select an account")
        if (amount <= 0) return toast.error("Amount must be greater than 0")
        if (!activeStoreId) return toast.error("No active branch selected")

        setLoading(true)
        try {
            if (isEdit) {
                // Patch not requested by user yet for expenses specifically, only categories.
                // But normally we'd implementation updateExpense.
                toast.error("Edit not implemented for expenses yet")
            } else {
                await createMutation.mutateAsync({
                    categoryId,
                    subCategoryId: subCategoryId || null,
                    accountId,
                    branchId: activeStoreId || "",
                    amount,
                    date: new Date(date).toISOString(),
                    note,
                    imageUrl: imageUrl || undefined,
                })
                toast.success("Expense recorded successfully")
            }
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            toast.error("Failed to record expense")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
                <DialogHeader className="shrink-0 border-b bg-muted/30 px-5 py-5 sm:px-6">
                    <DialogTitle>{isEdit ? "Expense Details" : "Record New Expense"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "View details of this recorded expense." : "Enter details for a new hospital expense."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid flex-1 gap-5 overflow-y-auto px-5 py-5 sm:grid-cols-2 sm:px-6">
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={categoryId} onValueChange={setCategoryId} disabled={isEdit}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {mainCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    {availableSubCategories.length > 0 && (
                        <div className="grid gap-2">
                            <Label htmlFor="subCategory">Sub-category (Optional)</Label>
                            <Select value={subCategoryId} onValueChange={setSubCategoryId} disabled={isEdit}>
                                <SelectTrigger id="subCategory">
                                    <SelectValue placeholder="Select sub-category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value=" ">None</SelectItem>
                                    {availableSubCategories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="account">Payment Account *</Label>
                        <Select value={accountId} onValueChange={setAccountId} disabled={isEdit}>
                            <SelectTrigger id="account">
                                <SelectValue placeholder="Select account" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((acc) => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.type})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Amount *</Label>
                        <SmartNumberInput
                            id="amount"
                            value={amount}
                            onChange={(val) => setAmount(val || 0)}
                            placeholder="0.00"
                            disabled={isEdit}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="date">Date & Time *</Label>
                        <Input
                            id="date"
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            disabled={isEdit}
                        />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                        <Label htmlFor="note">Note (Optional)</Label>
                        <Textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add any additional details..."
                            rows={2}
                            disabled={isEdit}
                        />
                    </div>
                    <div className="grid gap-2 sm:col-span-2">
                        <div className="flex items-center justify-between gap-3">
                            <Label>Attachment <span className="font-normal text-muted-foreground">(Optional)</span></Label>
                            {!imageUrl && <span className="text-xs text-muted-foreground">Upload or choose from Media Library</span>}
                        </div>
                        <div className="rounded-lg border bg-muted/20 p-3">
                            <MediaPicker
                                value={imageUrl}
                                onChange={setImageUrl}
                                disabled={isEdit}
                                compact
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter className="shrink-0 border-t bg-background px-5 py-4 sm:px-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        {isEdit ? "Close" : "Cancel"}
                    </Button>
                    {!isEdit && (
                        <Button onClick={handleSave} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Record Expense
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
