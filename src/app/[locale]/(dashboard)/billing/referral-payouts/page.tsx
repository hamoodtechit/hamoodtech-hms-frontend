"use client"

import { useReferrals } from "@/hooks/hr-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { 
    Users, 
    Search, 
    Wallet, 
    ArrowRight, 
    Filter, 
    Loader2, 
    TrendingUp, 
    Banknote,
    Activity,
    CreditCard
} from "lucide-react"
import { useState, useMemo } from "react"
import { Link } from "@/i18n/navigation"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { FilterPopover } from "@/components/shared/filter-popover"
import { ReferralFilters, ReferralFilterValues } from "@/components/hr/hr-filters"
import { ReferralQuickSettleDialog } from "@/components/hr/referral-settle-dialog"

export default function ReferralPayoutsPage() {
    const { formatCurrency } = useCurrency()
    const [search, setSearch] = useState("")
    const [filters, setFilters] = useState<ReferralFilterValues>({})
    const [settleReferral, setSettleReferral] = useState<{ id: string, name: string } | null>(null)
    
    const { data: referralsRes, isLoading, refetch } = useReferrals({ 
        search,
        limit: 100 
    })
    
    const referrals = useMemo(() => {
        let items = referralsRes?.data || []
        
        // Client-side filtering as the API might not support all these filters yet in the list endpoint
        if (filters.type) {
            items = items.filter(r => filters.type === "internal" ? r.employeeId : !r.employeeId)
        }
        if (filters.status) {
            items = items.filter(r => filters.status === "active" ? r.isActive : !r.isActive)
        }
        if (filters.minCommission) {
            items = items.filter(r => (r.yearlyStats?.totalCommissionEarned || 0) >= Number(filters.minCommission))
        }
        if (filters.maxCommission) {
            items = items.filter(r => (r.yearlyStats?.totalCommissionEarned || 0) <= Number(filters.maxCommission))
        }
        
        return items
    }, [referralsRes, filters])

    const activeFilterCount = Object.values(filters).filter(v => v !== "" && v !== undefined).length

    return (
        <PermissionGuard permission="referral:read">
            <div className="space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-foreground">Referral Payouts</h1>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground/70 uppercase tracking-widest pl-1">
                            Financial reconciliation with partners
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-tight text-muted-foreground/60 leading-none mb-1">Total Network Earn</p>
                                <p className="text-sm font-black text-primary leading-none">
                                    {formatCurrency(referrals.reduce((acc, r) => acc + (r.yearlyStats?.totalCommissionEarned || 0), 0))}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* Filters Card */}
                    <Card className="border-none shadow-xl shadow-black/5 dark:shadow-black/20 rounded-[2rem] overflow-hidden bg-card/60 backdrop-blur-md border border-white/10 dark:border-white/5">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <div className="relative flex-1 group w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <Input 
                                        placeholder="Search by agent name, phone or email..." 
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-12 h-14 rounded-2xl border-muted/20 bg-background/30 hover:border-primary/30 focus:border-primary transition-all font-medium text-sm text-foreground"
                                    />
                                </div>
                                <FilterPopover 
                                    activeFilterCount={activeFilterCount}
                                    onReset={() => setFilters({})}
                                    title="Refine Partner Network"
                                >
                                    <ReferralFilters values={filters} onChange={setFilters} />
                                </FilterPopover>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Table Card */}
                    <Card className="border-none shadow-2xl shadow-black/5 dark:shadow-black/40 rounded-[2.5rem] overflow-hidden bg-card border border-white/10 dark:border-white/5">
                        <CardHeader className="p-8 pb-0">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-black tracking-tight text-foreground">Referral Network</CardTitle>
                                    <CardDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">
                                        Managing {referrals.length} active partners
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 font-black text-[10px] py-1 px-3 rounded-lg border border-emerald-500/20">
                                        {referrals.length} PARTNERS
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 mt-6">
                            <Table>
                                <TableHeader className="bg-muted/30">
                                    <TableRow className="hover:bg-transparent border-muted/50">
                                        <TableHead className="w-[300px] pl-8 text-[10px] font-black uppercase tracking-widest h-14">Partner Info</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-center h-14">Structure</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-center h-14 text-primary">Cumulative Earn</TableHead>
                                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-center h-14">Status</TableHead>
                                        <TableHead className="text-right pr-8 h-14">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-96 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Loader2 className="w-12 h-12 animate-spin text-primary/30" />
                                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 italic">Syncing Partners...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : referrals.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-96 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center">
                                                        <Activity className="w-10 h-10 text-muted-foreground/30" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xl font-black text-muted-foreground uppercase tracking-tight">No Partners Found</p>
                                                        <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">Adjust your search or filters</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        referrals.map((referral) => (
                                            <TableRow key={referral.id} className="group hover:bg-primary/[0.03] transition-all border-muted/50">
                                                <TableCell className="pl-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground font-black group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                            {referral.name.charAt(0)}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <p className="font-black text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">{referral.name}</p>
                                                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase group-hover:text-muted-foreground/80 transition-colors">
                                                                {referral.phone}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {referral.employeeId ? (
                                                        <Badge variant="outline" className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold text-[10px] uppercase tracking-tighter rounded-lg">
                                                            Internal Staff
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="px-3 py-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 font-bold text-[10px] uppercase tracking-tighter rounded-lg">
                                                            External
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <p className="font-black text-base text-primary/80 tracking-tighter">
                                                        {formatCurrency(referral.yearlyStats?.totalCommissionEarned || 0)}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">Cumulative</p>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {referral.isActive ? (
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all font-black text-[9px] uppercase px-3 py-1 rounded-full border border-emerald-500/10 shadow-sm shadow-emerald-500/5">
                                                            Active Partner
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-rose-500/10 text-rose-600 hover:bg-rose-600 hover:text-white transition-all font-black text-[9px] uppercase px-3 py-1 rounded-full border border-rose-500/10 shadow-sm shadow-rose-500/5">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right pr-8">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <PermissionGuard permission="referral:update">
                                                            <Button 
                                                                onClick={() => setSettleReferral({ id: referral.id, name: referral.name })}
                                                                className="h-10 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-all font-black text-[10px] uppercase tracking-widest border border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                                                            >
                                                                <CreditCard className="w-3.5 h-3.5 mr-2" />
                                                                Settle
                                                            </Button>
                                                        </PermissionGuard>
                                                        <Link href={`/hr/referrals/${referral.id}`}>
                                                            <Button 
                                                                variant="outline"
                                                                className="h-10 w-10 p-0 rounded-xl bg-background border-muted/50 hover:bg-muted/50 transition-all group/btn"
                                                            >
                                                                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                                            </Button>
                                                        </Link>
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
            </div>

            {settleReferral && (
                <ReferralQuickSettleDialog 
                    open={!!settleReferral}
                    onOpenChange={(open) => !open && setSettleReferral(null)}
                    referralId={settleReferral.id}
                    referralName={settleReferral.name}
                    onSuccess={() => {
                        refetch()
                    }}
                />
            )}
        </PermissionGuard>
    )
}
