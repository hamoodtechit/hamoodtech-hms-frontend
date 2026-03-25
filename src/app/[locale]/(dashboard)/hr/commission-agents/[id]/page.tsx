"use client"

import { useCommissionAgent } from "@/hooks/hr-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { ArrowLeft, BarChart3, Calendar, DollarSign, Loader2, Mail, MapPin, Phone, TrendingUp, User, Wallet } from "lucide-react"
import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function CommissionAgentDetailPage() {
    const params = useParams()
    const id = params.id as string
    const { formatCurrency } = useCurrency()
    const [mounted, setMounted] = useState(false)

    const { data: agentRes, isLoading } = useCommissionAgent(id)
    const agent = agentRes?.data

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || isLoading) {
        return (
            <div className="flex h-[450px] items-center justify-center text-primary">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <PermissionGuard permission="user:read">
            {!agent ? (
                <div className="flex flex-col items-center justify-center h-[450px] space-y-4">
                    <h1 className="text-2xl font-bold">Agent Not Found</h1>
                    <p className="text-muted-foreground">The agent you are looking for does not exist or has been deleted.</p>
                    <Link href="/hr/commission-agents">
                       <Button variant="outline">
                           <ArrowLeft className="mr-2 h-4 w-4" /> Back to Agents
                       </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/hr/commission-agents">
                                <Button variant="outline" size="icon" className="h-9 w-9">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
                                <p className="text-muted-foreground">{agent.nameBangla}</p>
                            </div>
                        </div>
                        <Badge variant="secondary" className="px-3 py-1 text-sm font-semibold bg-emerald-50 text-emerald-700">
                            <Wallet className="w-4 h-4 mr-1" />
                            {agent.commissionPercentage}% Commission
                        </Badge>
                    </div>

                    <div className="grid gap-6 md:grid-cols-12">
                        {/* Profile Card */}
                        <Card className="md:col-span-4 h-fit">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Agent Profile
                                </CardTitle>
                                <CardDescription>Contact and basic information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Phone</p>
                                        <p className="text-sm text-muted-foreground">{agent.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Email</p>
                                        <p className="text-sm text-muted-foreground">{agent.email || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">Address</p>
                                        <p className="text-sm text-muted-foreground">{agent.address || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="pt-4 border-t">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Branch</p>
                                    <p className="text-sm">{agent.branch?.name || agent.branchId}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Performance Stats */}
                        <div className="md:col-span-8 space-y-6">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Card className="bg-primary/5 border-primary/10">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                                        <TrendingUp className="h-4 w-4 text-primary" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{agent.yearlyStats?.totalSalesCount || 0}</div>
                                        <p className="text-xs text-muted-foreground">Orders Referred</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-emerald-500/5 border-emerald-500/10">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium">Sales Volume</CardTitle>
                                        <DollarSign className="h-4 w-4 text-emerald-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatCurrency(agent.yearlyStats?.totalSalesAmount || 0)}</div>
                                        <p className="text-xs text-muted-foreground font-medium text-emerald-600">Total Business</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-amber-500/5 border-amber-500/10">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-sm font-medium">Earned Commission</CardTitle>
                                        <Wallet className="h-4 w-4 text-amber-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-amber-600">{formatCurrency(agent.yearlyStats?.totalCommissionEarned || 0)}</div>
                                        <p className="text-xs text-muted-foreground font-medium text-amber-600">Lifetime Earnings</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5 text-primary" />
                                        Annual Performance Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center p-8 space-y-2 border-2 border-dashed rounded-xl border-zinc-100 dark:border-white/5">
                                        <Calendar className="h-10 w-10 text-muted-foreground/30 mb-2" />
                                        <h3 className="text-lg font-bold">Year {agent.yearlyStats?.year || new Date().getFullYear()} Statistics</h3>
                                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 w-full max-w-md pt-4">
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground uppercase font-bold">Commission Rate</p>
                                                <p className="text-lg font-semibold">{agent.yearlyStats?.commissionPercentage || agent.commissionPercentage}%</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-xs text-muted-foreground uppercase font-bold">Sales Count</p>
                                                <p className="text-lg font-semibold">{agent.yearlyStats?.totalSalesCount || 0}</p>
                                            </div>
                                            <div className="space-y-1 border-t pt-2">
                                                <p className="text-xs text-muted-foreground uppercase font-bold">Total Sales</p>
                                                <p className="text-lg font-semibold">{formatCurrency(agent.yearlyStats?.totalSalesAmount || 0)}</p>
                                            </div>
                                            <div className="space-y-1 border-t pt-2">
                                                <p className="text-xs text-emerald-600 uppercase font-bold">Total Commission</p>
                                                <p className="text-lg font-bold text-emerald-600">{formatCurrency(agent.yearlyStats?.totalCommissionEarned || 0)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </PermissionGuard>
    )
}
