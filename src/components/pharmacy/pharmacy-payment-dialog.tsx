"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
import { PharmacyPaymentPayload } from "@/types/patient"
import { patientService } from "@/services/patient-service"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useState, useEffect } from "react"
import { Loader2, CheckCircle2, Receipt, ArrowRight, Wallet } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useCurrency } from "@/hooks/use-currency"
import { ScrollArea } from "@/components/ui/scroll-area"
import { salesService } from "@/services/sales-service"

const paymentSchema = z.object({
    amount: z.number().min(0.01, "Amount must be at least 0.01"),
    accountId: z.string().min(1, "Account is required"),
    paymentMethod: z.string().min(1, "Payment method is required"),
    note: z.string().optional(),
})

interface PharmacyPaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    patientId: string
    patientName: string
    onSuccess?: () => void
}

export function PharmacyPaymentDialog({
    open,
    onOpenChange,
    patientId,
    patientName,
    onSuccess,
}: PharmacyPaymentDialogProps) {
    const { formatCurrency } = useCurrency()
    const queryClient = useQueryClient()
    const { data: accountsRes } = useFinanceAccounts({ limit: 100 })
    const accounts = accountsRes?.data || []

    const [successData, setSuccessData] = useState<any>(null)

    // Fetch sales to calculate real due
    const { data: salesRes, isLoading: isLoadingSales } = useQuery({
        queryKey: ["sales", { patientId, type: "pos" }],
        queryFn: () => salesService.getSales({ 
            patientId, 
            type: "pos",
            limit: 100 
        }),
        enabled: open && !!patientId
    })

    const sales = salesRes?.data?.sales || []
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

    const paymentMutation = useMutation({
        mutationFn: (data: PharmacyPaymentPayload) => patientService.payPharmacyDues(data),
        onSuccess: (res) => {
            if (res.success) {
                setSuccessData(res.data)
                queryClient.invalidateQueries({ queryKey: ["patients"] })
                queryClient.invalidateQueries({ queryKey: ["sales"] })
                onSuccess?.()
            } else {
                toast.error(res.message || "Failed to process payment")
            }
        },
        onError: () => {
            toast.error("An error occurred. Please try again.")
        }
    })

    const onSubmit = (data: z.infer<typeof paymentSchema>) => {
        const branchId = sales[0]?.branchId;
        if (!branchId) {
            toast.error("Branch ID missing from pending bills.");
            return;
        }

        paymentMutation.mutate({
            ...data,
            patientId,
            branchId,
        })
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
                    <div className="bg-emerald-500/10 p-8 flex flex-col items-center text-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-emerald-700">Payment Successful!</h2>
                            <p className="text-sm font-medium text-emerald-600/70 uppercase tracking-widest mt-1">Receipt Generated</p>
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
            <DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-[2rem] p-0 overflow-hidden">
                <DialogHeader className="p-8 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight">Collect Payment</DialogTitle>
                            <DialogDescription className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mt-1">
                                Processing dues for {patientName}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8">
                    {isLoadingSales ? (
                        <div className="mb-6 p-8 rounded-2xl bg-muted/20 border-2 border-dashed flex flex-col items-center justify-center gap-3 animate-pulse">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Calculating Current Dues...</p>
                        </div>
                    ) : totalCalculatedDue > 0 ? (
                        <div className="mb-6 p-4 rounded-2xl bg-muted/30 border border-dashed flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Current Dues</p>
                                <p className="text-xl font-black text-rose-600 tracking-tighter">
                                    {formatCurrency(totalCalculatedDue)}
                                </p>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
                                <Receipt className="h-5 w-5" />
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 border-dashed flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest leading-none mb-1">Status</p>
                                <p className="text-sm font-black text-emerald-600 tracking-tight flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    No Pending Dues
                                </p>
                            </div>
                        </div>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

                            <div className="grid grid-cols-2 gap-4">
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

                            <div className="pt-4 flex flex-col gap-3">
                                <Button 
                                    type="submit" 
                                    disabled={paymentMutation.isPending}
                                    className="h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                                >
                                    {paymentMutation.isPending ? (
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
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
