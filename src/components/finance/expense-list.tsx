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
import { useExpenses } from "@/hooks/expense-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Expense } from "@/types/expense"
import { format } from "date-fns"
import { Eye, Loader2, Plus, Search } from "lucide-react"
import { useState } from "react"
import { ExpenseDialog } from "./expense-dialog"

import { useStoreContext } from "@/store/use-store-context"

export function ExpenseList() {
    const { formatCurrency } = useCurrency()
    const { activeStoreId } = useStoreContext()
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
    const [search, setSearch] = useState("")

    const { data: response, isLoading, refetch } = useExpenses({ 
        search, 
        branchId: activeStoreId || undefined,
        limit: 100 
    })
    const expenses = response?.expenses || []

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Expense Transactions</h2>
                    <p className="text-sm text-muted-foreground">List of all recorded expenses across the hospital.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search expenses..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => {
                        setSelectedExpense(null)
                        setDialogOpen(true)
                    }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Record Expense
                    </Button>
                </div>
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Expense #</TableHead>
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
                        ) : expenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No expenses found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="text-xs">
                                        {format(new Date(expense.date), "dd MMM yyyy, HH:mm")}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs font-semibold">
                                        {expense.expenseNumber}
                                    </TableCell>
                                    <TableCell>
                                        <span className="font-medium">{expense.category?.name || "—"}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{expense.account?.name || "—"}</span>
                                            <span className="text-[10px] uppercase text-muted-foreground">{expense.account?.type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                                        {expense.note || "—"}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-destructive">
                                        {formatCurrency(Number(expense.amount))}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => {
                                                setSelectedExpense(expense)
                                                setDialogOpen(true)
                                            }}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <ExpenseDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                expense={selectedExpense}
                onSuccess={refetch}
            />
        </div>
    )
}
