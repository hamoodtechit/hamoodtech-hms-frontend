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
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateIncome, useIncomeCategories } from "@/hooks/income-queries"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useStoreContext } from "@/store/use-store-context"
import { FinanceAccount } from "@/types/finance"
import { Income, IncomeCategory } from "@/types/income"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface IncomeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    income?: Income | null
    onSuccess?: () => void
}

export function IncomeDialog({ open, onOpenChange, income, onSuccess }: IncomeDialogProps) {
    const [loading, setLoading] = useState(false)
    const { activeStoreId } = useStoreContext()
    
    const { data: categoriesRes } = useIncomeCategories({ limit: 100 })
    const { data: accountsRes } = useFinanceAccounts({ limit: 100 })
    const createMutation = useCreateIncome()

    const isEdit = !!income

    // Form State
    const [categoryId, setCategoryId] = useState("")
    const [accountId, setAccountId] = useState("")
    const [amount, setAmount] = useState(0)
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
    const [note, setNote] = useState("")

    const categories: IncomeCategory[] = categoriesRes?.data?.categories || categoriesRes?.categories || (Array.isArray(categoriesRes?.data) ? categoriesRes.data : [])
    const accounts: FinanceAccount[] = accountsRes?.data?.accounts || accountsRes?.accounts || accountsRes?.data || (Array.isArray(accountsRes) ? accountsRes : [])

    useEffect(() => {
        if (open) {
            if (income) {
                setCategoryId(income.categoryId)
                setAccountId(income.accountId)
                setAmount(Number(income.amount))
                setDate(format(new Date(income.date), "yyyy-MM-dd'T'HH:mm"))
                setNote(income.note || "")
            } else {
                setCategoryId("")
                setAccountId("")
                setAmount(0)
                setDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
                setNote("")
            }
        }
    }, [open, income])

    const handleSave = async () => {
        if (!categoryId) return toast.error("Please select a category")
        if (!accountId) return toast.error("Please select an account")
        if (amount <= 0) return toast.error("Amount must be greater than 0")
        if (!activeStoreId) return toast.error("No active branch selected")

        setLoading(true)
        try {
            if (isEdit) {
                toast.error("Edit not implemented for incomes yet")
            } else {
                await createMutation.mutateAsync({
                    categoryId,
                    accountId,
                    branchId: activeStoreId || "",
                    amount,
                    date: new Date(date).toISOString(),
                    note
                })
                toast.success("Income recorded successfully")
            }
            onSuccess?.()
            onOpenChange(false)
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to record income")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Income Details" : "Record New Income"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "View details of this recorded income." : "Enter details for a new hospital income."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select value={categoryId} onValueChange={setCategoryId} disabled={isEdit}>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="account">Receiving Account *</Label>
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
                    <div className="grid gap-2">
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
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        {isEdit ? "Close" : "Cancel"}
                    </Button>
                    {!isEdit && (
                        <Button onClick={handleSave} disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Record Income
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
