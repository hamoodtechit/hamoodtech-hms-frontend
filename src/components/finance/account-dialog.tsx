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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useCreateFinanceAccount, useUpdateFinanceAccount } from "@/hooks/finance-queries"
import { FinanceAccount } from "@/types/finance"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface AccountDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    account?: FinanceAccount | null
    onSuccess?: () => void
}

export function AccountDialog({ open, onOpenChange, account, onSuccess }: AccountDialogProps) {
    const [loading, setLoading] = useState(false)
    const createMutation = useCreateFinanceAccount()
    const updateMutation = useUpdateFinanceAccount()

    const isEdit = !!account

    // Form State
    const [name, setName] = useState("")
    const [type, setType] = useState<'cash' | 'bank' | 'mobile_banking' | 'other'>('cash')
    const [description, setDescription] = useState("")
    const [openingBalance, setOpeningBalance] = useState(0)
    const [isActive, setIsActive] = useState(true)

    useEffect(() => {
        if (open) {
            if (account) {
                setName(account.name)
                setType(account.type as any)
                setDescription(account.description || "")
                setOpeningBalance(Number(account.openingBalance))
                setIsActive(account.isActive)
            } else {
                setName("")
                setType('cash')
                setDescription("")
                setOpeningBalance(0)
                setIsActive(true)
            }
        }
    }, [open, account])

    const handleSave = async () => {
        if (!name) {
            toast.error("Account name is required")
            return
        }

        setLoading(true)
        try {
            if (isEdit && account) {
                await updateMutation.mutateAsync({
                    id: account.id,
                    data: {
                        name,
                        type,
                        description,
                        isActive
                    }
                })
                toast.success("Account updated successfully")
            } else {
                await createMutation.mutateAsync({
                    name,
                    type,
                    description,
                    openingBalance,
                    isActive
                })
                toast.success("Account created successfully")
            }
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            toast.error(isEdit ? "Failed to update account" : "Failed to create account")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Account" : "Add New Account"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update your financial account details." : "Create a new financial account to manage your funds."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Account Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Main Cash, Bank of America"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="type">Account Type</Label>
                        <Select value={type} onValueChange={(v: any) => setType(v)}>
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="bank">Bank</SelectItem>
                                <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {!isEdit && (
                        <div className="grid gap-2">
                            <Label htmlFor="openingBalance">Opening Balance</Label>
                            <SmartNumberInput
                                id="openingBalance"
                                value={openingBalance}
                                onChange={(val) => setOpeningBalance(val || 0)}
                                placeholder="0.00"
                            />
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief details about the account..."
                            rows={2}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="isActive">Active Status</Label>
                        <Switch
                            id="isActive"
                            checked={isActive}
                            onCheckedChange={setIsActive}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Update Account" : "Save Account"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
