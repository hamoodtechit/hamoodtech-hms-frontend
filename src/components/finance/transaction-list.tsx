"use client"

import { TransactionDetailsDialog } from "@/components/finance/transaction-details-dialog"
import { TransactionTable } from "@/components/finance/transaction-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useFinanceAccounts, useFinanceTransactions } from "@/hooks/finance-queries"
import { useCurrency } from "@/hooks/use-currency"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
    ChevronLeft,
    ChevronRight,
    Filter,
    RefreshCcw,
    Search
} from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { useState } from "react"
import { DateRange } from "react-day-picker"

interface TransactionListProps {
    title?: string
    variant?: "default" | "compact"
}

import { useStoreContext } from "@/store/use-store-context"

export function TransactionList({ title = "Recent Transactions", variant = "default" }: TransactionListProps) {
    const { formatCurrency } = useCurrency()
    const { activeStoreId } = useStoreContext()
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [search, setSearch] = useState("")
    const [accountId, setAccountId] = useState<string>("all")
    const [flowType, setFlowType] = useState<string>("all")
    const [txnType, setTxnType] = useState<string>("all")
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    
    // Details Dialog State
    const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)

    const params: any = {
        page,
        limit,
        search: search || undefined,
        accountId: accountId === "all" ? undefined : accountId,
        branchId: activeStoreId || undefined,
        flowType: flowType === "all" ? undefined : flowType,
        txnType: txnType === "all" ? undefined : txnType,
        startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    }

    const { hasPermission } = usePermissions()
    const canReadAccounts = hasPermission('account:read')
    const canReadTransactions = hasPermission('transaction:read')

    const { data: accountsRes } = useFinanceAccounts({ limit: 100 }, { enabled: canReadAccounts })
    const { data: transRes, isLoading, isFetching, refetch } = useFinanceTransactions(params, { enabled: canReadTransactions })

    const transactions = transRes?.data || []
    const pagination = transRes?.pagination
    const accounts = accountsRes?.data || []

    const handleViewDetails = (id: string) => {
        setSelectedTxnId(id)
        setDetailsOpen(true)
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <RefreshCcw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                            {title}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search transactions..."
                                    className="pl-8"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
                                <RefreshCcw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                            </Button>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mr-2">
                            <Filter className="h-3.5 w-3.5" />
                            Filters:
                        </div>
                        
                        <Select value={accountId} onValueChange={setAccountId}>
                            <SelectTrigger className="h-8 w-[180px] text-xs">
                                <SelectValue placeholder="All Accounts" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Accounts</SelectItem>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={flowType} onValueChange={setFlowType}>
                            <SelectTrigger className="h-8 w-[120px] text-xs">
                                <SelectValue placeholder="Flow Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Flows</SelectItem>
                                <SelectItem value="in">Cash In</SelectItem>
                                <SelectItem value="out">Cash Out</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={txnType} onValueChange={setTxnType}>
                            <SelectTrigger className="h-8 w-[150px] text-xs">
                                <SelectValue placeholder="Transaction Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="opening">Opening Balance</SelectItem>
                                <SelectItem value="sale">Sale</SelectItem>
                                <SelectItem value="purchase">Purchase</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="transfer">Transfer</SelectItem>
                                <SelectItem value="adjustment">Adjustment</SelectItem>
                                <SelectItem value="withdraw">Withdraw</SelectItem>
                                <SelectItem value="deposit">Deposit</SelectItem>
                                <SelectItem value="sale-return">Sale Return</SelectItem>
                            </SelectContent>
                        </Select>

                        <DatePickerWithRange 
                            date={dateRange} 
                            setDate={setDateRange} 
                        />

                        <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
                            <SelectTrigger className="h-8 w-[100px] text-xs">
                                <SelectValue placeholder="Limit" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 / page</SelectItem>
                                <SelectItem value="20">20 / page</SelectItem>
                                <SelectItem value="50">50 / page</SelectItem>
                                <SelectItem value="100">100 / page</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs text-muted-foreground hover:text-primary"
                            onClick={() => {
                                setPage(1)
                                setSearch("")
                                setAccountId("all")
                                setFlowType("all")
                                setTxnType("all")
                                setDateRange(undefined)
                            }}
                        >
                            Reset
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <TransactionTable 
                        transactions={transactions}
                        isLoading={isLoading}
                        onViewDetails={handleViewDetails}
                        showBalances={true}
                    />

                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                            <p className="text-xs text-muted-foreground">
                                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, pagination.totalItems)}</span> of <span className="font-medium">{pagination.totalItems}</span> transactions
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={!pagination.hasPreviousPage}
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!pagination.hasNextPage}
                                >
                                    Next
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <TransactionDetailsDialog 
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                transactionId={selectedTxnId}
            />
        </div>
    )
}
