"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useState, useEffect } from "react"
import { Loader2, CheckCircle2, Receipt, ArrowRight, Building2, BedDouble } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useCurrency } from "@/hooks/use-currency"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePatientDueBills } from "@/hooks/sales-queries"
import { Badge } from "@/components/ui/badge"

const paymentSchema = z.object({
    amount: z.number().min(0.01, "Amount must be at least 0.01"),
    accountId: z.string().min(1, "Account is required"),
    paymentMethod: z.string().min(1, "Payment method is required"),
    note: z.string().optional(),
})

interface HospitalPaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    patientId: string
    patientName: string
    onSuccess?: () => void
}

export function HospitalPaymentDialog({
    open,
    onOpenChange,
    patientId,
    patientName,
    onSuccess,
}: HospitalPaymentDialogProps) {
    const { formatCurrency } = useCurrency()
    const queryClient = useQueryClient()
    const { data: accountsRes } = useFinanceAccounts({ limit: 100 })
    const accounts = accountsRes?.data || []

    const [successData, setSuccessData] = useState<any>(null)

    // Fetch live IPD/Hospital due bills
    const { data: dueBillsRes, isLoading: isLoadingSales } = usePatientDueBills(patientId)
    const sales = dueBillsRes?.data || []
    
    // Calculate total dues across all pending hospital invoices
    const totalCalculatedDue = sales.reduce((sum, sale) => sum + Number(sale.dueAmount || 0), 0)

    const form = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            amount: 0,
            accountId: "",
            paymentMethod: "cash",
            note: "",
        },
    })

    // Pre-fill amount when dues are loaded
    useEffect(() => {
        if (totalCalculatedDue > 0 && form.getValues("amount") === 0) {
            form.setValue("amount", totalCalculatedDue)
        }
    }, [totalCalculatedDue, form])

    // TODO: Replace with the actual bulk IPD payment API once provided by backend
    const mockPaymentMutation = useMutation({
        mutationFn: async (data: z.infer<typeof paymentSchema>) => {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            return {
                success: true,
                data: {
                    paidAmount: data.amount,
                    newPatientBalance: Math.max(0, totalCalculatedDue - data.amount),
                    paidSales: sales.map(s => ({
                        id: s.id,
                        invoiceNumber: s.invoiceNumber,
                        totalPrice: s.netPrice,
                        paidInThisTransaction: Math.min(Number(s.dueAmount), data.amount)
                    }))
                }
            }
        },
        onSuccess: (res) => {
            if (res.success) {
                setSuccessData(res.data)
                queryClient.invalidateQueries({ queryKey: ["patients"] })
                queryClient.invalidateQueries({ queryKey: ["sales"] })
                onSuccess?.()
            }
        },
        onError: () => {
            toast.error("An error occurred. Please try again.")
        }
    })

    const onSubmit = (data: z.infer<typeof paymentSchema>) => {
        if (sales.length === 0) {
            toast.error("No pending bills to pay.");
            return;
        }

        // Execute mock mutation for now
        mockPaymentMutation.mutate(data)
    }

    const resetAndClose = () => {
        setSuccessData(null)
        form.reset()
        onOpenChange(false)
    }

    if (successData) {
        return (
            <Dialog open={open} onOpenChange={resetAndClose}>
                <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-[2rem] p-0 overflow-hidden">
                    <div className="bg-primary/10 p-8 flex flex-col items-center text-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-primary">Payment Successful!</h2>
                            <p className="text-sm font-medium text-primary/70 uppercase tracking-widest mt-1">Receipt Generated</p>
                        </div>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-dashed">
                             <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Total Received</p>
                                <p className="text-2xl font-black text-foreground tracking-tighter">{formatCurrency(successData.paidAmount)}</p>
                             </div>
                             <div className="text-right space-y-0.5">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">New Balance</p>
                                <p className="text-2xl font-black text-primary tracking-tighter">{formatCurrency(successData.newPatientBalance)}</p>
                             </div>
                        </div>

                        {successData.paidSales && successData.paidSales.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Settled Invoices</p>
                                <ScrollArea className="h-[150px] pr-4">
                                    <div className="space-y-2">
                                        {successData.paidSales.map((sale: any) => (
                                            <div key={sale.id} className="flex items-center justify-between p-3 bg-background rounded-xl border border-muted-foreground/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                                                        <Receipt className="h-4 w-4 text-primary/60" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold">{sale.invoiceNumber}</p>
                                                        <p className="text-[10px] text-muted-foreground">{formatCurrency(sale.totalPrice)} Total</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-black text-emerald-600">-{formatCurrency(sale.paidInThisTransaction)}</p>
                                                    <p className="text-[9px] font-bold text-muted-foreground/40 italic">Contribution</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        <Button onClick={resetAndClose} className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs">
                            Done
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] border-none shadow-2xl rounded-[2rem] p-0 overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader className="p-8 pb-4 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight">Hospital Dues</DialogTitle>
                            <DialogDescription className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mt-1">
                                Managing IPD / Hospital dues for {patientName}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-col md:flex-row h-full overflow-hidden">
                    {/* Left Panel: Invoice List */}
                    <div className="flex-1 bg-muted/10 border-r border-border/50 flex flex-col p-6 overflow-hidden">
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Pending Master Folios
                        </h3>
                        
                        <ScrollArea className="flex-1 -mx-2 px-2">
                            {isLoadingSales ? (
                                <div className="p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 animate-pulse">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Loading Records...</p>
                                </div>
                            ) : sales.length > 0 ? (
                                <div className="space-y-3 pb-4">
                                    {sales.map((sale: any) => (
                                        <div key={sale.id} className="p-4 bg-background rounded-2xl border shadow-sm group hover:border-primary/30 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-black">{sale.invoiceNumber}</span>
                                                        <Badge variant="outline" className="text-[9px] uppercase font-bold h-4 py-0 bg-primary/5 text-primary border-primary/20">
                                                            {sale.type}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-muted-foreground block">
                                                        {new Date(sale.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-1">
                                                    <span className="text-sm font-black text-rose-500 tabular-nums">
                                                        Due: {formatCurrency(Number(sale.dueAmount))}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                                                        Net: {formatCurrency(Number(sale.netPrice))}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {/* Show bed info if admission type */}
                                            {sale.type === 'admission' && sale.saleItems?.some((i: any) => i.isBedCharge) && (
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-500/5 px-2.5 py-1.5 rounded-lg w-fit">
                                                    <BedDouble className="h-3 w-3" />
                                                    Includes Active Bed Rent
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 border-dashed flex flex-col items-center justify-center gap-2 text-center h-[200px]">
                                    <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-2">All Cleared</p>
                                    <p className="text-[10px] font-medium text-emerald-600/60">No pending hospital dues found.</p>
                                </div>
                            )}
                        </ScrollArea>
                        
                        {sales.length > 0 && (
                            <div className="pt-4 mt-auto border-t border-border/50 flex items-center justify-between">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Pending</span>
                                <span className="text-lg font-black text-rose-600 tabular-nums">{formatCurrency(totalCalculatedDue)}</span>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Payment Form */}
                    <div className="w-full md:w-[350px] p-6 bg-background flex flex-col">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 flex-1 flex flex-col">
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Payment Amount</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground/40">৳</span>
                                                    <Input 
                                                        type="number" 
                                                        placeholder="0.00" 
                                                        className="h-14 pl-10 text-xl font-black rounded-2xl border-2 focus-visible:ring-primary/20 transition-all" 
                                                        value={field.value}
                                                        onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                                                        onBlur={field.onBlur}
                                                        name={field.name}
                                                        ref={field.ref}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="accountId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Receive Account</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 rounded-xl border-2">
                                                            <SelectValue placeholder="Select Account" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {accounts.map((acc) => (
                                                            <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="paymentMethod"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Method</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 rounded-xl border-2">
                                                            <SelectValue placeholder="Method" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="cash">Cash</SelectItem>
                                                        <SelectItem value="card">Card</SelectItem>
                                                        <SelectItem value="bKash">bKash</SelectItem>
                                                        <SelectItem value="Nagad">Nagad</SelectItem>
                                                        <SelectItem value="Bank Transfer">Bank</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="note"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Note (Optional)</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Remarks about this payment..." 
                                                    className="resize-none rounded-xl border-2 min-h-20"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="mt-auto pt-6 flex flex-col gap-3">
                                    <Button 
                                        type="submit" 
                                        disabled={mockPaymentMutation.isPending || sales.length === 0}
                                        className="h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        {mockPaymentMutation.isPending ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                Process Payment
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        onClick={() => onOpenChange(false)}
                                        className="h-12 rounded-xl font-bold text-muted-foreground"
                                    >
                                        Close
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
