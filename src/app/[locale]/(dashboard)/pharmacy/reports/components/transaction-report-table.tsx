"use client"

import { PurchaseDetailsDialog } from "@/components/pharmacy/inventory/purchase-details-dialog"
import { SaleDetailsDialog } from "@/components/pharmacy/sale-details-dialog"
import { Badge } from "@/components/ui/badge"
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useFinanceAccounts, useFinanceTransactions } from "@/hooks/finance-queries"
import { usePurchase, useSale } from "@/hooks/pharmacy-queries"
import { useCurrency } from "@/hooks/use-currency"
import { format } from "date-fns"
import { ChevronLeft, ChevronRight, Eye, FilterX, Search } from "lucide-react"
import { useState } from "react"
import { DateRange } from "react-day-picker"

export function TransactionReportTable() {
    const { formatCurrency } = useCurrency()
    const [search, setSearch] = useState("")
    const [accountId, setAccountId] = useState("all")
    const [txnType, setTxnType] = useState("all")
    const [flowType, setFlowType] = useState("all")
    const [date, setDate] = useState<DateRange | undefined>()
    const [page, setPage] = useState(1)
    const limit = 10
    
    // Details states
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
    const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null)
    const [saleDetailsOpen, setSaleDetailsOpen] = useState(false)
    const [purchaseDetailsOpen, setPurchaseDetailsOpen] = useState(false)

    // Fetch details
    const { data: saleData } = useSale(selectedSaleId || "")
    const { data: purchaseData } = usePurchase(selectedPurchaseId || "")

    const params: any = {
        page,
        limit,
        search: search || undefined,
        accountId: accountId !== "all" ? accountId : undefined,
        txnType: txnType !== "all" ? txnType : undefined,
        flowType: flowType !== "all" ? flowType : undefined,
        startDate: date?.from?.toISOString(),
        endDate: date?.to?.toISOString(),
    }

    const { data: transactionsRes, isLoading } = useFinanceTransactions(params)
    const { data: accountsRes } = useFinanceAccounts()
    
    const transactions = transactionsRes?.data || []
    const accounts = accountsRes?.data || []
    const pagination = transactionsRes?.pagination

    const resetFilters = () => {
        setSearch("")
        setAccountId("all")
        setTxnType("all")
        setFlowType("all")
        setDate(undefined)
        setPage(1)
    }

    const handleViewDetails = (tx: any) => {
        if (tx.saleId) {
            setSelectedSaleId(tx.saleId)
            setSaleDetailsOpen(true)
        } else if (tx.purchaseId) {
            setSelectedPurchaseId(tx.purchaseId)
            setPurchaseDetailsOpen(true)
        }
    }

    const getTxnTypeBadge = (type: string) => {
        switch (type) {
            case 'sale': return <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50">Sale</Badge>
            case 'purchase': return <Badge variant="outline" className="text-rose-500 border-rose-200 bg-rose-50">Purchase</Badge>
            case 'sale_return': return <Badge variant="outline" className="text-purple-500 border-purple-200 bg-purple-50">Sale Return</Badge>
            case 'adjustment': return <Badge variant="outline" className="text-amber-500 border-amber-200 bg-amber-50">Adjustment</Badge>
            case 'withdraw': return <Badge variant="outline" className="text-gray-500 border-gray-200 bg-gray-50">Withdraw</Badge>
            default: return <Badge variant="outline">{type}</Badge>
        }
    }

    return (
        <Card className="col-span-4 overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
                <CardTitle className="text-xl font-bold">Transaction History</CardTitle>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8">
                        <FilterX className="h-4 w-4 mr-2" />
                        Clear Filters
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search transactions..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                        />
                    </div>
                    
                    <Select value={txnType} onValueChange={(val) => {
                        setTxnType(val)
                        setPage(1)
                    }}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="sale">Sales</SelectItem>
                            <SelectItem value="purchase">Purchases</SelectItem>
                            <SelectItem value="sale_return">Sale Returns</SelectItem>
                            <SelectItem value="adjustment">Adjustments</SelectItem>
                            <SelectItem value="expense">Expenses</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={accountId} onValueChange={(val) => {
                        setAccountId(val)
                        setPage(1)
                    }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Account" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Accounts</SelectItem>
                            {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={flowType} onValueChange={(val) => {
                        setFlowType(val)
                        setPage(1)
                    }}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Flow" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Flows</SelectItem>
                            <SelectItem value="in">Cash In</SelectItem>
                            <SelectItem value="out">Cash Out</SelectItem>
                        </SelectContent>
                    </Select>

                    <DatePickerWithRange 
                        date={date} 
                        setDate={(newDate) => {
                            setDate(newDate)
                            setPage(1)
                        }} 
                    />
                </div>

                <div className="rounded-md border overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-[120px]">Date</TableHead>
                                <TableHead>Ref ID</TableHead>
                                <TableHead>Account</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Note</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        Loading transactions...
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center font-medium text-muted-foreground">
                                        No transactions found matching the criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx: any) => (
                                    <TableRow key={tx.id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium">
                                            {format(new Date(tx.createdAt), "dd MMM, yy")}
                                            <div className="text-[10px] text-muted-foreground">
                                                {format(new Date(tx.createdAt), "hh:mm a")}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-primary font-semibold">
                                            {tx.txnId}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm">{tx.account?.name}</div>
                                            <div className="text-[10px] uppercase text-muted-foreground">{tx.account?.type}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {getTxnTypeBadge(tx.txnType)}
                                                <span className={`text-[10px] font-bold uppercase ${tx.flowType === 'in' ? 'text-green-600' : 'text-rose-600'}`}>
                                                    {tx.flowType === 'in' ? '↑ In' : '↓ Out'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-sm">
                                            {tx.note}
                                        </TableCell>
                                        <TableCell className={`text-right font-bold ${tx.flowType === 'in' ? 'text-green-600' : 'text-rose-600'}`}>
                                            {tx.flowType === 'in' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                                onClick={() => handleViewDetails(tx)}
                                                disabled={!tx.saleId && !tx.purchaseId}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4 px-2">
                        <div className="text-sm text-muted-foreground order-2 sm:order-1">
                            Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, pagination.totalItems)}</span> of <span className="font-medium">{pagination.totalItems}</span>
                        </div>
                        <div className="flex items-center space-x-2 order-1 sm:order-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={!pagination.hasPreviousPage}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-medium">
                                Page {page} of {pagination.totalPages}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={!pagination.hasNextPage}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Details Dialogs */}
            <SaleDetailsDialog
                open={saleDetailsOpen}
                onOpenChange={setSaleDetailsOpen}
                sale={saleData?.data || null}
            />
            <PurchaseDetailsDialog
                open={purchaseDetailsOpen}
                onOpenChange={setPurchaseDetailsOpen}
                purchase={purchaseData?.data || null}
            />
        </Card>
    )
}
