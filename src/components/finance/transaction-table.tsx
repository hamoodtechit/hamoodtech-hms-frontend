"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useCurrency } from "@/hooks/use-currency"
import { cn } from "@/lib/utils"
import { FinanceTransaction } from "@/types/finance"
import {
    ArrowDownLeft,
    ArrowUpRight,
    Calendar,
    Loader2
} from "lucide-react"

interface TransactionTableProps {
    transactions: FinanceTransaction[]
    isLoading?: boolean
    onViewDetails?: (id: string) => void
    showAccount?: boolean
    showBalances?: boolean
}

export function TransactionTable({ 
    transactions, 
    isLoading, 
    onViewDetails, 
    showAccount = true,
    showBalances = false
}: TransactionTableProps) {
    const { formatCurrency } = useCurrency()

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead>Date & ID</TableHead>
                        {showAccount && <TableHead>Account</TableHead>}
                        <TableHead>Type</TableHead>
                        <TableHead>Flow</TableHead>
                        {showBalances && <TableHead className="text-right">Before</TableHead>}
                        {showBalances && <TableHead className="text-right">After</TableHead>}
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Method & Note</TableHead>
                        {onViewDetails && <TableHead className="w-[100px]"></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={showAccount ? (showBalances ? 9 : 7) : (showBalances ? 8 : 6)} className="h-24 text-center">
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    <span className="text-muted-foreground font-medium">Loading transactions...</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : transactions.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={showAccount ? (showBalances ? 9 : 7) : (showBalances ? 8 : 6)} className="h-24 text-center text-muted-foreground font-medium italic">
                                No transactions found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        transactions.map((txn) => (
                            <TableRow 
                                key={txn.id} 
                                className={cn(onViewDetails && "cursor-pointer hover:bg-muted/50")} 
                                onClick={() => onViewDetails?.(txn.id)}
                            >
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-xs">{txn.txnId}</span>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(txn.createdAt).toLocaleDateString()} {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </TableCell>
                                {showAccount && (
                                    <TableCell>
                                        <span className="text-xs font-medium">{txn.account?.name || "N/A"}</span>
                                    </TableCell>
                                )}
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
                                {showBalances && (
                                    <TableCell className="text-right whitespace-nowrap px-1">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Before</span>
                                            <span className="text-[11px] font-medium text-muted-foreground">{formatCurrency(Number(txn.accountBalanceBefore))}</span>
                                        </div>
                                    </TableCell>
                                )}
                                {showBalances && (
                                    <TableCell className="text-right whitespace-nowrap px-1">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] text-emerald-500 uppercase font-bold tracking-tighter">After</span>
                                            <span className="text-[11px] font-bold text-primary">{formatCurrency(Number(txn.accountBalanceNow))}</span>
                                        </div>
                                    </TableCell>
                                )}
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
                                {onViewDetails && (
                                    <TableCell>
                                        <Button variant="ghost" size="sm" onClick={(e) => {
                                            e.stopPropagation()
                                            onViewDetails(txn.id)
                                        }}>
                                            Details
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
