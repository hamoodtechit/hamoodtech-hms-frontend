"use client"

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
import { useFinanceAccount } from "@/hooks/finance-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import {
    ArrowDownLeft,
    ArrowLeft,
    ArrowUpRight,
    Calendar,
    CreditCard,
    DollarSign,
    History,
    Info,
    Loader2,
    Wallet
} from "lucide-react"
import { useParams } from "next/navigation"

export default function AccountDetailsPage() {
    const params = useParams()
    const id = params.id as string
    const { formatCurrency } = useCurrency()
    
    const { data: response, isLoading, error } = useFinanceAccount(id)
    const account = response?.data

    if (isLoading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !account) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">Account not found</h2>
                <p className="text-muted-foreground mt-2">The account you are looking for does not exist or has been removed.</p>
                <Link href="/finance">
                    <Button variant="outline" className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Finance
                    </Button>
                </Link>
            </div>
        )
    }

    const transactions = account.transactions || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/finance">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Account Details</h1>
                        <p className="text-muted-foreground">Transaction history and details for {account.name}.</p>
                    </div>
                </div>
                {account.isActive ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
                ) : (
                    <Badge variant="destructive">Inactive</Badge>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {formatCurrency(Number(account.currentBalance))}
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">
                            Current available funds in this account.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Opening Balance</CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(Number(account.openingBalance))}
                        </div>
                        <p className="text-xs text-muted-foreground pt-1">
                            Balance when the account was created.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Account Info</CardTitle>
                        <Info className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-semibold flex items-center gap-2">
                            {account.type === 'cash' ? <Wallet className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                            <span className="capitalize">{account.type} Account</span>
                        </div>
                        <p className="text-xs text-muted-foreground pt-1 truncate" title={account.description}>
                            {account.description || "No description provided."}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>
                        Detailed list of all transactions associated with this account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date & ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Flow</TableHead>
                                <TableHead className="text-right">Previous</TableHead>
                                <TableHead className="text-right">Current</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Method & Note</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground font-medium italic">
                                        No transactions recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((txn) => (
                                    <TableRow key={txn.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-xs">{txn.txnId}</span>
                                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(txn.createdAt).toLocaleDateString()} {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize text-[10px] h-5">
                                                {txn.txnType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className={cn(
                                                "flex items-center gap-1 font-semibold text-xs",
                                                txn.flowType === 'in' ? "text-emerald-600" : "text-destructive"
                                            )}>
                                                {txn.flowType === 'in' ? (
                                                    <><ArrowDownLeft className="h-3 w-3" /> IN</>
                                                ) : (
                                                    <><ArrowUpRight className="h-3 w-3" /> OUT</>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs whitespace-nowrap">
                                            {formatCurrency(Number(txn.accountBalanceBefore))}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-xs whitespace-nowrap">
                                            {formatCurrency(Number(txn.accountBalanceNow))}
                                        </TableCell>
                                        <TableCell className={cn(
                                            "text-right font-bold whitespace-nowrap",
                                            txn.flowType === 'in' ? "text-emerald-600" : "text-destructive"
                                        )}>
                                            {txn.flowType === 'in' ? '+' : '-'}{formatCurrency(Number(txn.amount))}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col max-w-[200px]">
                                                <span className="text-[10px] font-medium uppercase text-muted-foreground">{txn.paymentMethod}</span>
                                                <span className="text-xs truncate" title={txn.note}>{txn.note || "-"}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
