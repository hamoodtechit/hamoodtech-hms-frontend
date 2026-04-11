"use client"

import { useReferral } from "@/hooks/hr-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { 
    ArrowLeft, 
    BarChart3, 
    Calendar, 
    DollarSign, 
    Loader2, 
    Mail, 
    MapPin, 
    Phone, 
    TrendingUp, 
    User, 
    Wallet, 
    ShieldCheck, 
    Activity,
    Users,
    ChevronRight,
    Search,
    Percent
} from "lucide-react"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCommissions } from "@/hooks/hr-queries"
import { CommissionPayoutDialog } from "@/components/hr/commission-payout-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Filter, MoreVertical, CheckCircle2, XCircle, Clock4 } from "lucide-react"
import { format } from "date-fns"

export default function ReferralDetailPage() {
    const params = useParams()
    const id = params.id as string
    const { formatCurrency } = useCurrency()
    const [mounted, setMounted] = useState(false)

    const { data: referralRes, isLoading } = useReferral(id)
    const referral = referralRes?.data

    // Commissions State
    const [statusFilter, setStatusFilter] = useState<string>("false") // "all", "true", "false" (unpaid by default)
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [payoutOpen, setPayoutOpen] = useState(false)

    const { data: commissionsRes, isLoading: commissionsLoading } = useCommissions({
        referralId: id,
        isPaid: statusFilter === "all" ? undefined : statusFilter,
        limit: 100
    })

    const commissions = commissionsRes?.data || []

    useEffect(() => {
        setMounted(true)
    }, [])

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleAll = () => {
        const unpaidCommissions = commissions.filter(c => !c.isPaid).map(c => c.id)
        if (selectedIds.length === unpaidCommissions.length && unpaidCommissions.length > 0) {
            setSelectedIds([])
        } else {
            setSelectedIds(unpaidCommissions)
        }
    }

    const selectedCommissions = commissions.filter(c => selectedIds.includes(c.id))

    if (!mounted || isLoading) {
        return (
            <div className="flex h-[450px] items-center justify-center text-primary">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <PermissionGuard permission="user:read">
            {!referral ? (
                <div className="flex flex-col items-center justify-center h-[450px] space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">Referral Not Found</h1>
                        <p className="text-muted-foreground">The referral source you are looking for does not exist or has been deleted.</p>
                    </div>
                    <Link href="/hr/referrals">
                       <Button variant="outline">
                           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Directory
                       </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/hr/referrals">
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{referral.name}</h1>
                                    {referral.employeeId ? (
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            Internal Referral
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                            External Partner
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                    <span className="font-medium">{referral.nameBangla}</span>
                                    {referral.employee && (
                                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full border italic">
                                            Linked to Employee: {referral.employee.name}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Earnings</p>
                                <p className="text-xl font-black text-primary">{formatCurrency(referral.yearlyStats?.totalCommissionEarned || 0)}</p>
                            </div>
                            <Separator orientation="vertical" className="h-10 mx-2 hidden sm:block" />
                            <Badge className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <Wallet className="w-4 h-4 mr-2" />
                                Active Referral
                            </Badge>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-12">
                        {/* Profile & Commission Card */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="shadow-sm border-muted/40">
                                <CardHeader className="bg-muted/10">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <ShieldCheck className="h-5 w-5 text-primary" />
                                        Verified Profile
                                    </CardTitle>
                                    <CardDescription>Contact and organizational details.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5 pt-6">
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/20">
                                            <div className="p-2 rounded-full bg-white shadow-sm">
                                                <Phone className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Direct Line</p>
                                                <p className="text-sm font-semibold">{referral.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/20">
                                            <div className="p-2 rounded-full bg-white shadow-sm">
                                                <Mail className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Email Correspondence</p>
                                                <p className="text-sm font-semibold underline decoration-primary/20">{referral.email || "No Email Provided"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/20">
                                            <div className="p-2 rounded-full bg-white shadow-sm">
                                                <MapPin className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-muted-foreground">Official Address</p>
                                                <p className="text-sm font-semibold text-pretty">{referral.address || "No Address Provided"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black">Designated Branch</p>
                                            <p className="text-sm font-medium">{referral.branch?.name || referral.branchId}</p>
                                        </div>
                                        <Badge variant="secondary" className="rounded-md">Branch ID: {referral.branchId.slice(0, 8)}</Badge>
                                    </div>
                                </CardContent>
                                {referral.employee && (
                                    <CardFooter className="bg-blue-50/30 border-t border-blue-100 p-4">
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] uppercase font-bold text-blue-600">Linked Employee Entity</p>
                                                <p className="text-sm font-bold hover:underline cursor-pointer flex items-center">
                                                    {referral.employee.name}
                                                    <ChevronRight className="w-3 h-3 ml-1" />
                                                </p>
                                            </div>
                                        </div>
                                    </CardFooter>
                                )}
                            </Card>

                            {/* Commission Rates Card */}
                            <Card className="shadow-sm border-muted/40 overflow-hidden">
                                <CardHeader className="bg-primary/5">
                                    <CardTitle className="text-lg flex items-center gap-2 text-primary">
                                        <Activity className="h-5 w-5" />
                                        Service Commissions
                                    </CardTitle>
                                    <CardDescription>Custom rates locked for this source.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <ScrollArea className="max-h-[300px]">
                                        <div className="divide-y">
                                            {Array.isArray(referral.commissionStructure) && referral.commissionStructure.length > 0 ? (
                                                referral.commissionStructure.map((rule: any, idx: number) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                                        <div className="space-y-0.5">
                                                            <p className="text-xs font-bold text-foreground line-clamp-1">{rule.serviceName}</p>
                                                            <p className="text-[10px] text-muted-foreground italic">Target: Diagnostic / Service</p>
                                                        </div>
                                                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs">
                                                            {rule.commissionPercentage}%
                                                        </Badge>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center space-y-2">
                                                    <div className="w-10 h-10 rounded-full bg-muted mx-auto flex items-center justify-center">
                                                        <Percent className="w-5 h-5 text-muted-foreground/50" />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground italic">No service-specific rules.</p>
                                                    <p className="text-[10px] font-medium text-primary">Standard Branch Rate Applies</p>
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Performance & Charts & Commissions */}
                        <div className="lg:col-span-8 space-y-6">
                            <Tabs defaultValue="performance" className="w-full">
                                <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-fit mb-6">
                                    <TabsTrigger value="performance" className="rounded-xl px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full">
                                        <Activity className="w-4 h-4 mr-2" />
                                        Performance
                                    </TabsTrigger>
                                    <TabsTrigger value="commissions" className="rounded-xl px-6 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all h-full">
                                        <DollarSign className="w-4 h-4 mr-2" />
                                        Commission Log
                                        {commissions.filter(c => !c.isPaid).length > 0 && (
                                            <Badge className="ml-2 bg-amber-500 text-[10px] h-4 px-1 min-w-[1rem] flex items-center justify-center">
                                                {commissions.filter(c => !c.isPaid).length}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="performance" className="space-y-6 m-0">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <Card className="bg-primary/5 border-primary/10 shadow-sm">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Referred Orders</CardTitle>
                                                <TrendingUp className="h-4 w-4 text-primary" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-black">{referral.yearlyStats?.totalSalesCount || 0}</div>
                                                <p className="text-[10px] mt-1 text-muted-foreground font-medium flex items-center gap-1">
                                                    <Badge variant="outline" className="h-4 p-0 px-1 text-[8px] bg-white">ALL TIME</Badge>
                                                    Successful Referrals
                                                </p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-emerald-500/5 border-emerald-500/10 shadow-sm">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue Generated</CardTitle>
                                                <DollarSign className="h-4 w-4 text-emerald-600" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-black text-emerald-700">{formatCurrency(referral.yearlyStats?.totalSalesAmount || 0)}</div>
                                                <p className="text-[10px] mt-1 text-emerald-600/70 font-bold uppercase">Total Patient Billing</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-amber-500/5 border-amber-500/10 shadow-sm">
                                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Net Payouts</CardTitle>
                                                <Wallet className="h-4 w-4 text-amber-600" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-black text-amber-600">{formatCurrency(referral.yearlyStats?.totalCommissionEarned || 0)}</div>
                                                <p className="text-[10px] mt-1 text-amber-600/70 font-bold uppercase">Commission Settled</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card className="shadow-sm border-muted/40 overflow-hidden">
                                        <CardHeader className="border-b bg-muted/5">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <BarChart3 className="h-5 w-5 text-primary" />
                                                Incentive Performance Analysis
                                            </CardTitle>
                                            <CardDescription>Metrics for the current fiscal year.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-8">
                                            <div className="flex flex-col items-center justify-center p-12 space-y-4 border-2 border-dashed rounded-[2.5rem] border-muted bg-muted/5">
                                                <div className="w-16 h-16 rounded-3xl bg-white shadow-xl flex items-center justify-center transform rotate-6 hover:rotate-0 transition-transform cursor-default border border-primary/10">
                                                    <Calendar className="h-8 w-8 text-primary/40" />
                                                </div>
                                                <div className="text-center">
                                                    <h3 className="text-xl font-black">{referral.yearlyStats?.year || new Date().getFullYear()} Annual Summary</h3>
                                                    <p className="text-xs text-muted-foreground px-4 max-w-sm mt-1">Consolidated data reflecting referral success and financial outcomes for this source.</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-16 gap-y-6 w-full max-w-lg pt-6">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Weighted Rate</p>
                                                        <p className="text-2xl font-black text-foreground">
                                                            {Array.isArray(referral.commissionStructure) && referral.commissionStructure.length > 0 
                                                                ? `${referral.commissionStructure.length} Services`
                                                                : "Standard"}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Cases Closed</p>
                                                        <p className="text-2xl font-black text-foreground">{referral.yearlyStats?.totalSalesCount || 0}</p>
                                                    </div>
                                                    <div className="space-y-1 border-t pt-3 border-muted">
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total Sales</p>
                                                        <p className="text-2xl font-black text-foreground">{formatCurrency(referral.yearlyStats?.totalSalesAmount || 0)}</p>
                                                    </div>
                                                    <div className="space-y-1 border-t pt-3 border-muted">
                                                        <p className="text-[10px] text-emerald-600 uppercase font-black tracking-widest">Total Commission</p>
                                                        <p className="text-2xl font-black text-emerald-600">{formatCurrency(referral.yearlyStats?.totalCommissionEarned || 0)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="bg-muted/10 px-6 py-4 flex justify-between items-center border-t">
                                            <p className="text-[10px] text-muted-foreground italic font-medium">Data synchronized with billing module • Refreshed hourly</p>
                                            <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-tight rounded-lg">Export Statement</Button>
                                        </CardFooter>
                                    </Card>
                                </TabsContent>

                                <TabsContent value="commissions" className="space-y-4 m-0">
                                    <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/30 p-4 rounded-2xl border border-muted">
                                        <div className="flex items-center gap-3">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="rounded-xl font-bold gap-2">
                                                        <Filter className="w-4 h-4" />
                                                        Status: {statusFilter === "all" ? "All Items" : statusFilter === "true" ? "Paid" : "Outstanding"}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start" className="rounded-xl shadow-xl">
                                                    <DropdownMenuItem onClick={() => setStatusFilter("all")} className="font-bold">All Commissions</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setStatusFilter("false")} className="font-bold flex items-center justify-between">
                                                        Outstanding <Clock4 className="w-3 h-3 text-amber-500" />
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setStatusFilter("true")} className="font-bold flex items-center justify-between">
                                                        Paid <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>

                                            {selectedIds.length > 0 && (
                                                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 font-bold px-3 py-1 rounded-lg">
                                                    {selectedIds.length} Selected
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {selectedIds.length > 0 && (
                                                <Button 
                                                    onClick={() => setPayoutOpen(true)}
                                                    className="bg-primary text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
                                                >
                                                    <Wallet className="w-4 h-4 mr-2" />
                                                    Process Payout ({formatCurrency(selectedCommissions.reduce((s, c) => s + c.commissionAmount, 0))})
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <Card className="rounded-[2rem] border-muted overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/30">
                                                <TableRow className="hover:bg-transparent border-muted">
                                                    <TableHead className="w-12">
                                                        <Checkbox 
                                                            checked={selectedIds.length === commissions.filter(c => !c.isPaid).length && commissions.filter(c => !c.isPaid).length > 0}
                                                            onCheckedChange={toggleAll}
                                                            className="rounded-md border-muted-foreground/30"
                                                        />
                                                    </TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Service/Client</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Amount</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Status</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Date</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {commissionsLoading ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="h-64 text-center">
                                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary/30" />
                                                        </TableCell>
                                                    </TableRow>
                                                ) : commissions.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="h-64 text-center">
                                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                                <div className="p-4 rounded-full bg-muted/30">
                                                                    <Activity className="w-8 h-8 text-muted-foreground/30" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="font-bold text-muted-foreground">No Commission Records</p>
                                                                    <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">Check again later for new referrals</p>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    commissions.map((comm) => (
                                                        <TableRow key={comm.id} className="hover:bg-muted/20 border-muted transition-colors group">
                                                            <TableCell>
                                                                <Checkbox 
                                                                    checked={selectedIds.includes(comm.id)}
                                                                    disabled={comm.isPaid}
                                                                    onCheckedChange={() => toggleSelection(comm.id)}
                                                                    className="rounded-md border-muted-foreground/30 disabled:opacity-30"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="space-y-1">
                                                                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{comm.serviceName}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant="outline" className="text-[9px] font-black h-4 px-1.5 border-muted-foreground/20 text-muted-foreground uppercase">{comm.patientName}</Badge>
                                                                        <span className="text-[10px] text-muted-foreground/50">#{comm.invoiceNumber}</span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <p className="text-sm font-black text-foreground">{formatCurrency(comm.commissionAmount)}</p>
                                                                <p className="text-[9px] text-muted-foreground font-medium">{comm.commissionPercentage}% Rate</p>
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                {comm.isPaid ? (
                                                                    <Badge className="bg-emerald-50 text-emerald-600 border-none shadow-none font-bold text-[10px] px-2 h-6 pointer-events-none">
                                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                                        PAID
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge className="bg-amber-50 text-amber-600 border-none shadow-none font-bold text-[10px] px-2 h-6 pointer-events-none">
                                                                        <Clock4 className="w-3 h-3 mr-1" />
                                                                        UNPAID
                                                                    </Badge>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <p className="text-xs font-bold text-foreground">{format(new Date(comm.createdAt), 'dd MMM yyyy')}</p>
                                                                <p className="text-[10px] text-muted-foreground">{format(new Date(comm.createdAt), 'hh:mm a')}</p>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    <CommissionPayoutDialog 
                        open={payoutOpen}
                        onOpenChange={setPayoutOpen}
                        referralId={id}
                        selectedCommissions={selectedCommissions}
                        onSuccess={() => setSelectedIds([])}
                    />
                </div>
            )}
        </PermissionGuard>
    )
}
