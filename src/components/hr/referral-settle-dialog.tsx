"use client"

import { useCommissions } from "@/hooks/hr-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Receipt, AlertCircle, ChevronRight, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"
import { Commission } from "@/types/hr"
import { CommissionPayoutDialog } from "./commission-payout-dialog"
import { format } from "date-fns"

interface ReferralQuickSettleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    referralId: string
    referralName: string
    onSuccess?: () => void
}

export function ReferralQuickSettleDialog({
    open,
    onOpenChange,
    referralId,
    referralName,
    onSuccess
}: ReferralQuickSettleDialogProps) {
    const { formatCurrency } = useCurrency()
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isPayoutOpen, setIsPayoutOpen] = useState(false)

    const { data: commissionsRes, isLoading, refetch, error } = useCommissions({
        referralId,
        isPaid: false,
        limit: 100
    })

    useEffect(() => {
        if (commissionsRes) {
            console.log('--- [DEBUG] Commissions API Response (Loaded) ---', commissionsRes);
        }
        if (error) {
            console.error('--- [DEBUG] Commissions API Error ---', error);
        }
    }, [commissionsRes, error]);

    const commissions = commissionsRes?.data || []

    useEffect(() => {
        if (open) {
            setSelectedIds([])
            refetch()
        }
    }, [open, refetch])

    const toggleCommission = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const selectAll = () => {
        if (selectedIds.length === commissions.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(commissions.map(c => c.id))
        }
    }

    const selectedCommissions = commissions.filter(c => selectedIds.includes(c.id))
    const totalSelectedAmount = selectedCommissions.reduce((sum, c) => sum + (Number(c.commissionAmount) || 0), 0)

    return (
        <>
            <Dialog open={open && !isPayoutOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px] border-none shadow-2xl rounded-[2.5rem] p-0 overflow-hidden">
                    <DialogHeader className="p-8 bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                                <Receipt className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight">Settle Commissions</DialogTitle>
                                <DialogDescription className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest mt-1">
                                    Reconciling with {referralName}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6">
                        {isLoading ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="w-10 h-10 animate-spin text-primary/30" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Inventorying unpaid items...</p>
                            </div>
                        ) : commissions.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center gap-4 text-center">
                                <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-500/50" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-black text-muted-foreground uppercase tracking-tight">All Settled</p>
                                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest max-w-[200px]">
                                        This partner has no outstanding commission items.
                                    </p>
                                </div>
                                <Button variant="outline" onClick={() => onOpenChange(false)} className="mt-4 rounded-xl font-bold h-10">
                                    Dismiss
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <Checkbox 
                                            id="select-all" 
                                            checked={selectedIds.length === commissions.length}
                                            onCheckedChange={selectAll}
                                            className="rounded-md border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground h-5 w-5"
                                        />
                                        <label htmlFor="select-all" className="text-[10px] font-black uppercase tracking-widest cursor-pointer select-none">
                                            Select All ({commissions.length} Items)
                                        </label>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-widest leading-none mb-1">Total Outstanding</p>
                                        <p className="text-lg font-black text-primary leading-none tracking-tighter">
                                            {formatCurrency(commissions.reduce((acc, c) => acc + (Number(c.commissionAmount) || 0), 0))}
                                        </p>
                                    </div>
                                </div>

                                <ScrollArea className="h-[300px] rounded-[1.5rem] border bg-muted/10 p-2">
                                    <div className="space-y-2">
                                        {commissions.map((c) => (
                                            <div 
                                                key={c.id}
                                                onClick={() => toggleCommission(c.id)}
                                                className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group ${
                                                    selectedIds.includes(c.id) 
                                                    ? "bg-primary/5 border-primary/20 shadow-sm" 
                                                    : "bg-background hover:bg-muted/30 border-transparent hover:border-muted-foreground/10"
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <Checkbox 
                                                        checked={selectedIds.includes(c.id)}
                                                        className="rounded-md border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground h-5 w-5"
                                                    />
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-black text-foreground tracking-tight line-clamp-1">{c.serviceName}</p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                                                {format(new Date(c.createdAt), "dd MMM yyyy")}
                                                            </span>
                                                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                                            <span className="text-[9px] font-black text-primary/60 uppercase">
                                                                {c.commissionPercentage}% Rate
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-foreground tracking-tighter">
                                                        {formatCurrency(c.commissionAmount)}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-muted-foreground/40 italic">Service Earn</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>

                                <div className="flex flex-col gap-4">
                                    <div className="flex items-center justify-between bg-primary/10 p-5 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
                                        <div>
                                            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none mb-1">Ready for Payout</p>
                                            <p className="text-sm font-bold text-primary">{selectedIds.length} items targeted</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none mb-1">Payable Total</p>
                                            <p className="text-2xl font-black text-primary tracking-tighter">{formatCurrency(totalSelectedAmount)}</p>
                                        </div>
                                    </div>

                                    <Button 
                                        onClick={() => setIsPayoutOpen(true)}
                                        disabled={selectedIds.length === 0}
                                        className="h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.15em] text-xs shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        Proceed to Payment
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl font-bold text-muted-foreground h-10">
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {isPayoutOpen && (
                <CommissionPayoutDialog 
                    open={isPayoutOpen}
                    onOpenChange={(val) => {
                        setIsPayoutOpen(val)
                        if (!val) onOpenChange(false) // Close both if cancelled/done
                    }}
                    referralId={referralId}
                    selectedCommissions={selectedCommissions}
                    onSuccess={() => {
                        onSuccess?.()
                        onOpenChange(false)
                    }}
                />
            )}
        </>
    )
}
