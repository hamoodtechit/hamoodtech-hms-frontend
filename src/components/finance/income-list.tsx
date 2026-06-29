"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useIncomes, useDeleteIncome } from "@/hooks/income-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Income } from "@/types/income"
import { format } from "date-fns"
import { Eye, Loader2, Plus, Printer, Search, Trash2 } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { useState } from "react"
import { toast } from "sonner"
import { IncomeDialog } from "./income-dialog"
import { IncomeReceiptDialog } from "./income-receipt-dialog"
import { useStoreContext } from "@/store/use-store-context"

export function IncomeList() {
    const { formatCurrency } = useCurrency()
    const { activeStoreId } = useStoreContext()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [receiptOpen, setReceiptOpen] = useState(false)
    const [selectedIncome, setSelectedIncome] = useState<Income | null>(null)
    const [search, setSearch] = useState("")

    const { hasPermission } = usePermissions()
    const canRead = hasPermission('income:read')

    const { data: response, isLoading, refetch } = useIncomes({ 
        search, 
        branchId: activeStoreId || undefined,
        limit: 100 
    })
    
    const deleteMutation = useDeleteIncome()
    
    const incomes = response?.incomes || []

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete/void this income? This will reverse the account balance.")) {
            try {
                await deleteMutation.mutateAsync(id)
                toast.success("Income deleted successfully")
            } catch (error: any) {
                toast.error(error?.response?.data?.message || "Failed to delete income")
            }
        }
    }

    if (!canRead) return null;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Income Tracking</h2>
                    <p className="text-sm text-muted-foreground">List of all recorded operational incomes.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search incomes..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => {
                        setSelectedIncome(null)
                        setDialogOpen(true)
                    }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Record Income
                    </Button>
                </div>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Income #</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Note</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : incomes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No incomes found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            incomes.map((income) => (
                                <TableRow key={income.id}>
                                    <TableCell className="text-xs">
                                        {format(new Date(income.date), "dd MMM yyyy, HH:mm")}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs font-semibold">
                                        {income.incomeNumber}
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-medium">{income.category?.name || "—"}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{income.account?.name || "—"}</span>
                                            <span className="text-[10px] uppercase text-muted-foreground">{income.account?.type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                                        {income.note || "—"}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-500">
                                        {formatCurrency(Number(income.amount))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                title="Print Receipt"
                                                onClick={() => {
                                                    setSelectedIncome(income)
                                                    setReceiptOpen(true)
                                                }}
                                            >
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                title="View Details"
                                                onClick={() => {
                                                    setSelectedIncome(income)
                                                    setDialogOpen(true)
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                title="Delete"
                                                disabled={deleteMutation.isPending}
                                                onClick={() => handleDelete(income.id)}
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

            <IncomeDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                income={selectedIncome}
                onSuccess={refetch}
            />

            <IncomeReceiptDialog 
                open={receiptOpen}
                onOpenChange={setReceiptOpen}
                income={selectedIncome}
            />
        </div>
    )
}
