"use client"

import { useState, useEffect, use } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { Loader2, CheckCircle2, Receipt, Building2, BedDouble, ChevronLeft, Wallet } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useCurrency } from "@/hooks/use-currency"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePatientDueBills } from "@/hooks/sales-queries"
import { usePatient, useProcessBulkSalePayment } from "@/hooks/patient-queries"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { BulkDueCollectionDialog } from "@/components/finance/bulk-due-collection-dialog"
import { BulkPaymentReceiptDialog } from "@/components/finance/bulk-payment-receipt-dialog"

export default function HospitalDuePaymentPage({
    params,
}: {
    params: Promise<{ patientId: string }>
}) {
    const { patientId } = use(params);
    const router = useRouter()
    const { formatCurrency } = useCurrency()
    const queryClient = useQueryClient()
    
    const { data: patientRes } = usePatient(patientId)
    const patientName = patientRes?.data?.name || "Patient"

    const { data: accountsRes } = useFinanceAccounts({ limit: 100 })
    const accounts = accountsRes?.data || []
    
    // Default to first account for inline payment
    const defaultAccountId = accounts.length > 0 ? accounts[0].id : ""

    const [paymentAmounts, setPaymentAmounts] = useState<Record<string, number>>({})
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [bulkDueDialogOpen, setBulkDueDialogOpen] = useState(false)
    const [paymentResult, setPaymentResult] = useState<any>(null)

    const { data: dueBillsRes, isLoading: isLoadingSales, refetch } = usePatientDueBills(patientId)
    const sales = dueBillsRes?.data || []
    
    const totalCalculatedDue = sales.reduce((sum: number, sale: any) => sum + Number(sale.dueAmount || 0), 0)

    const validDueSales = sales.filter((s: any) => Number(s.dueAmount) > 0)
    const selectedSales = sales.filter((s: any) => selectedIds.has(s.id))
    const selectedTotalDue = selectedSales.reduce((sum: number, s: any) => sum + Number(s.dueAmount || 0), 0)

    // Initialize payment amounts with full due amount
    useEffect(() => {
        if (sales.length > 0) {
            const initialAmounts: Record<string, number> = {}
            sales.forEach((sale: any) => {
                if (paymentAmounts[sale.id] === undefined) {
                    initialAmounts[sale.id] = Number(sale.dueAmount)
                }
            })
            if (Object.keys(initialAmounts).length > 0) {
                setPaymentAmounts(prev => ({ ...prev, ...initialAmounts }))
            }
        }
    }, [sales])

    const handleAmountChange = (saleId: string, val: string) => {
        const num = val === "" ? 0 : Number(val)
        setPaymentAmounts(prev => ({
            ...prev,
            [saleId]: num
        }))
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const toggleAll = () => {
        if (selectedIds.size === validDueSales.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(validDueSales.map((s: any) => s.id)))
        }
    }

    const processBulkSalePayment = useProcessBulkSalePayment()

    const handlePayBill = (saleId: string) => {
        const amount = paymentAmounts[saleId] || 0
        if (amount <= 0) {
            toast.error("Amount must be greater than 0")
            return
        }

        if (!defaultAccountId) {
            toast.error("No finance account available to receive payment.")
            return
        }

        processBulkSalePayment.mutate({
            patientId,
            accountId: defaultAccountId,
            paymentMethod: "cash", // Default to cash
            payments: [
                {
                    saleId,
                    amount
                }
            ]
        }, {
            onSuccess: (res) => {
                if (res.success) {
                    toast.success("Payment successful!")
                    setPaymentResult(res)
                    // Deselect if it was selected
                    setSelectedIds(prev => {
                        const next = new Set(prev)
                        next.delete(saleId)
                        return next
                    })
                    refetch()
                }
            },
            onError: (error: any) => {
                toast.error(error?.response?.data?.message || "Failed to process payment")
            }
        })
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6 pb-0 md:pb-0 gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-lg hover:bg-muted shrink-0">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-tight">{patientName}</h1>
                        <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mt-0.5">
                            Due Payments
                        </p>
                    </div>
                </div>

                {selectedSales.length > 0 && (
                    <Button
                        onClick={() => setBulkDueDialogOpen(true)}
                        className="gap-2 h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Wallet className="h-4 w-4" />
                        Pay Dues {formatCurrency(selectedTotalDue)} ({selectedSales.length})
                    </Button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-card rounded-t-xl shadow-sm border border-b-0 flex flex-col overflow-hidden min-h-0">
                
                <ScrollArea className="flex-1">
                    {isLoadingSales ? (
                        <div className="p-12 flex flex-col items-center justify-center gap-3 animate-pulse">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Loading Records...</p>
                        </div>
                    ) : sales.length > 0 ? (
                        <Table>
                            <TableHeader className="bg-muted/30 sticky top-0 z-10 shadow-sm">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-12 pl-6">
                                        <Checkbox
                                            checked={validDueSales.length > 0 && selectedIds.size === validDueSales.length}
                                            onCheckedChange={toggleAll}
                                            disabled={validDueSales.length === 0}
                                        />
                                    </TableHead>
                                    <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest">Invoice Number</TableHead>
                                    <TableHead className="h-12 text-[10px] font-black uppercase tracking-widest">Date</TableHead>
                                    <TableHead className="text-right h-12 text-[10px] font-black uppercase tracking-widest">Net Price</TableHead>
                                    <TableHead className="text-right h-12 text-[10px] font-black uppercase tracking-widest">Due Amount</TableHead>
                                    <TableHead className="text-center h-12 text-[10px] font-black uppercase tracking-widest w-[200px]">Payment Amount</TableHead>
                                    <TableHead className="text-right pr-6 h-12 text-[10px] font-black uppercase tracking-widest w-[120px]">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.map((sale: any) => (
                                    <TableRow key={sale.id} className="hover:bg-muted/20">
                                        <TableCell className="pl-6">
                                            <Checkbox
                                                checked={selectedIds.has(sale.id)}
                                                onCheckedChange={() => toggleSelect(sale.id)}
                                                disabled={Number(sale.dueAmount) <= 0}
                                            />
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-foreground text-sm">{sale.invoiceNumber}</span>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 bg-primary/5 text-primary border-primary/20">
                                                        {sale.type}
                                                    </Badge>
                                                    {sale.type === 'admission' && sale.saleItems?.some((i: any) => i.isBedCharge) && (
                                                        <span className="text-[9px] font-bold text-blue-600 flex items-center gap-1">
                                                            <BedDouble className="h-3 w-3" /> Includes Bed Rent
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {new Date(sale.createdAt).toLocaleDateString()}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-sm font-medium tabular-nums text-muted-foreground">
                                                {formatCurrency(Number(sale.netPrice))}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-sm font-black text-rose-500 tabular-nums">
                                                {formatCurrency(Number(sale.dueAmount))}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <div className="relative w-32">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-muted-foreground/40">৳</span>
                                                    <Input 
                                                        type="number" 
                                                        value={paymentAmounts[sale.id] ?? ''}
                                                        onChange={(e) => handleAmountChange(sale.id, e.target.value)}
                                                        className="h-10 pl-8 text-sm font-bold rounded-lg border-2 text-center"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button 
                                                size="sm"
                                                onClick={() => handlePayBill(sale.id)}
                                                disabled={processBulkSalePayment.isPending || (paymentAmounts[sale.id] || 0) <= 0}
                                                className="w-full font-black uppercase tracking-widest text-[10px] rounded-lg"
                                            >
                                                {processBulkSalePayment.isPending && processBulkSalePayment.variables?.payments[0].saleId === sale.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    "Pay"
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-12 flex flex-col items-center justify-center gap-2 text-center h-[300px]">
                            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            </div>
                            <p className="text-sm font-black text-emerald-600 uppercase tracking-widest mt-3">All Cleared</p>
                            <p className="text-xs font-medium text-emerald-600/60 mt-1">No pending hospital dues found.</p>
                        </div>
                    )}
                </ScrollArea>
                
                {sales.length > 0 && (
                    <div className="p-6 border-t border-border/50 flex items-center justify-between bg-muted/20">
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Total Pending</span>
                        <span className="text-2xl font-black text-rose-600 tabular-nums">{formatCurrency(totalCalculatedDue)}</span>
                    </div>
                )}
            </div>

            <BulkDueCollectionDialog
                open={bulkDueDialogOpen}
                onOpenChange={setBulkDueDialogOpen}
                sales={selectedSales}
                patientName={patientName}
                onSuccess={() => {
                    setSelectedIds(new Set())
                    refetch()
                }}
            />

            <BulkPaymentReceiptDialog
                open={!!paymentResult}
                onOpenChange={(open) => {
                    if (!open) {
                        setPaymentResult(null)
                    }
                }}
                data={paymentResult}
                patientName={patientName}
                patientUhid={patientRes?.data?.uhid || patientRes?.data?.patientNumber || "N/A"}
            />
        </div>
    )
}
