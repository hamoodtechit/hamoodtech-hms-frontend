"use client"

import { useSales } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Badge } from "@/components/ui/badge"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { Receipt, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PatientSalesHistoryProps {
    patientId: string
}

export function PatientSalesHistory({ patientId }: PatientSalesHistoryProps) {
    const { formatCurrency } = useCurrency()
    const { data: salesRes, isLoading } = useSales({ patientId, type: "pos", limit: 100 })
    const sales = salesRes?.data?.data || salesRes?.data?.sales || []

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
            </div>
        )
    }

    if (sales.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-center bg-muted/10 rounded-[3rem] border-2 border-dashed border-muted-foreground/10">
                <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground/40">
                    <ShoppingBag className="h-8 w-8" />
                </div>
                <div>
                    <p className="text-lg font-black text-muted-foreground uppercase tracking-tight">No Transactions</p>
                    <p className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">This patient has no pharmacy history.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Receipt className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-lg font-black tracking-tight">Purchase History</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">{sales.length} Total Invoices</p>
                </div>
            </div>

            <div className="rounded-[2.5rem] border bg-background overflow-hidden shadow-xl shadow-primary/5">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest pl-8 py-5">Invoice</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Status</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Payment</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-8">Total Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sales.map((sale) => (
                            <TableRow key={sale.id} className="group hover:bg-primary/5 transition-colors border-muted/20">
                                <TableCell className="pl-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-black text-sm tracking-tight">{sale.invoiceNumber}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">#{sale.id.slice(0,8)}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-bold text-muted-foreground">
                                        {format(new Date(sale.createdAt), "dd MMM, yyyy")}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <Badge 
                                        variant="outline" 
                                        className={`capitalize font-black text-[9px] tracking-widest px-2 py-0.5 rounded-lg ${
                                            sale.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                                            sale.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                                            'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                        }`}
                                    >
                                        {sale.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-1.5 w-1.5 rounded-full ${
                                            sale.paymentStatus === 'paid' ? 'bg-emerald-500' : 
                                            sale.paymentStatus === 'partial' ? 'bg-amber-500' : 'bg-rose-500'
                                        }`} />
                                        <span className="text-xs font-black uppercase tracking-tight">
                                            {sale.paymentStatus}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                    <p className="text-lg font-black tracking-tighter">{formatCurrency(sale.netPrice)}</p>
                                    {Number(sale.dueAmount) > 0 && (
                                        <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest -mt-1">
                                            {formatCurrency(sale.dueAmount)} Due
                                        </p>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
