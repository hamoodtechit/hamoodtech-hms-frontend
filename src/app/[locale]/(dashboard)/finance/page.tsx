"use client"

import { WithdrawDialog } from "@/components/finance/withdraw-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useCurrency } from "@/hooks/use-currency"
import { financeService } from "@/services/finance-service"
import { FinanceAccount } from "@/types/finance"
import { useQuery } from "@tanstack/react-query"
import { ArrowUpRight, Ban, CheckCircle, CreditCard, DollarSign, Loader2, Wallet } from "lucide-react"
import { useState } from "react"

export default function FinancePage() {
    const { formatCurrency } = useCurrency()
    const [withdrawAccount, setWithdrawAccount] = useState<FinanceAccount | null>(null)

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['finance-accounts'],
        queryFn: () => financeService.getAccounts({ limit: 100 })
    })

    const accounts = data?.data || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Finance Management</h1>
                    <p className="text-muted-foreground">Manage accounts, balances, and transactions.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                formatCurrency(
                                    accounts.reduce((sum, acc) => sum + Number(acc.currentBalance), 0)
                                )
                            )}
                        </div>
                    </CardContent>
                </Card>
                {/* Add more stats cards as needed */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Accounts</CardTitle>
                    <CardDescription>
                        List of all financial accounts and their current status.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Account Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No accounts found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((account) => (
                                    <TableRow key={account.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-primary/10 rounded-full">
                                                    {account.type === 'cash' ? <Wallet className="h-4 w-4 text-primary" /> : <CreditCard className="h-4 w-4 text-primary" />}
                                                </div>
                                                <div>
                                                    <div>{account.name}</div>
                                                    <div className="text-xs text-muted-foreground">{account.description}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize">{account.type}</TableCell>
                                        <TableCell>
                                            {account.isActive ? (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    <CheckCircle className="w-3 h-3 mr-1" /> Active
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                                    <Ban className="w-3 h-3 mr-1" /> Inactive
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                            {formatCurrency(Number(account.currentBalance))}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setWithdrawAccount(account)}
                                            >
                                                <ArrowUpRight className="mr-2 h-4 w-4" />
                                                Withdraw
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <WithdrawDialog 
                open={!!withdrawAccount} 
                onOpenChange={(open) => !open && setWithdrawAccount(null)}
                account={withdrawAccount}
                onSuccess={() => {
                    refetch()
                    setWithdrawAccount(null)
                }}
            />
        </div>
    )
}
