"use client"

import { AccountDialog } from "@/components/finance/account-dialog"
import { TransactionDetailsDialog } from "@/components/finance/transaction-details-dialog"
import { TransactionTable } from "@/components/finance/transaction-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useFinanceAccount } from "@/hooks/finance-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Link } from "@/i18n/navigation"
import {
    ArrowLeft,
    CreditCard,
    DollarSign,
    History,
    Info,
    Loader2,
    Settings2,
    Wallet
} from "lucide-react"
import { useParams } from "next/navigation"
import { useState } from "react"

export default function AccountDetailsPage() {
    const params = useParams()
    const id = params.id as string
    const [editOpen, setEditOpen] = useState(false)
    const { formatCurrency } = useCurrency()
    
    // Details Dialog State
    const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)

    const { data: response, isLoading, error, refetch } = useFinanceAccount(id)
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

    const handleViewDetails = (id: string) => {
        setSelectedTxnId(id)
        setDetailsOpen(true)
    }

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
                <div className="flex items-center gap-2">
                    {account.isActive ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
                    ) : (
                        <Badge variant="destructive">Inactive</Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                        <Settings2 className="mr-2 h-4 w-4" />
                        Edit Account
                    </Button>
                </div>
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
                    <TransactionTable 
                        transactions={transactions}
                        showAccount={false}
                        showBalances={true}
                        onViewDetails={handleViewDetails}
                    />
                </CardContent>
            </Card>

            <AccountDialog 
                open={editOpen}
                onOpenChange={setEditOpen}
                account={account}
                onSuccess={refetch}
            />

            <TransactionDetailsDialog 
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                transactionId={selectedTxnId}
            />
        </div>
    )
}
