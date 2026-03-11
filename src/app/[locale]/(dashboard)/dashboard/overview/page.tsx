"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMedicines, usePharmacySummary, usePharmacyStats, useStocks, usePurchases } from "@/hooks/pharmacy-queries"
import { useSales } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useDebounce } from "@/hooks/use-debounce"
import { useStoreContext } from "@/store/use-store-context"
import { format } from "date-fns"
import {
    AlertTriangle,
    ArrowLeft,
    BoxIcon,
    CreditCard,
    DollarSign,
    Layers,
    PackageX,
    RotateCcw,
    Search,
    ShoppingCart,
    TrendingDown,
} from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useMemo, useState } from "react"

interface StockBatch {
    id: string
    quantity: number
    unit?: string
    batchNumber?: string
    expiryDate?: string
    mrp?: number
    purchasePrice?: number
    medicine?: { id: string; name: string; genericName?: string; minimumStock?: number }
    branchId?: string
}

function StatCard({ icon: Icon, label, value, sub, color, href }: {
    icon: any, label: string, value: string, sub: string, color: string, href?: string
}) {
    return (
        <Card className="border-none shadow-lg shadow-primary/5">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-muted/50`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/** Group stock batches by medicine — sum quantities, flag low stock */
function groupStockByMedicine(stocks: StockBatch[]) {
    const map = new Map<string, {
        medicineId: string
        name: string
        genericName?: string
        minimumStock: number
        totalQty: number
        batches: { id: string; qty: number; batch?: string; expiry?: string; mrp?: number }[]
    }>()

    for (const s of stocks) {
        const medId = s.medicine?.id ?? s.id
        const name = s.medicine?.name ?? "Unknown"
        const minStock = s.medicine?.minimumStock ?? 10
        const qty = Number(s.quantity ?? 0)

        if (map.has(medId)) {
            const entry = map.get(medId)!
            entry.totalQty += qty
            entry.batches.push({ id: s.id, qty, batch: s.batchNumber, expiry: s.expiryDate, mrp: s.mrp })
        } else {
            map.set(medId, {
                medicineId: medId,
                name,
                genericName: s.medicine?.genericName,
                minimumStock: minStock,
                totalQty: qty,
                batches: [{ id: s.id, qty, batch: s.batchNumber, expiry: s.expiryDate, mrp: s.mrp }],
            })
        }
    }

    return Array.from(map.values()).sort((a, b) => a.totalQty - b.totalQty)
}

export default function DashboardOverviewPage() {
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const [search, setSearch] = useState("")
    const [debouncedSearch] = useDebounce(search, 400)
    const [tab, setTab] = useState("all")

    const branchId = activeStoreId || undefined

    const { data: summaryRes, isLoading: loadingSummary } = usePharmacySummary({ branchId })
    const { data: statsRes, isLoading: loadingStats } = usePharmacyStats({ branchId })
    const { data: salesRes, isLoading: loadingSales } = useSales({ branchId, limit: 100 })
    const { data: returnsRes, isLoading: loadingReturns } = useSales({ branchId, limit: 100, type: 'return' as any })
    const { data: purchasesRes, isLoading: loadingPurchases } = usePurchases({ branchId, limit: 100 })
    const { data: stocksRes, isLoading: loadingStocks } = useStocks({ branchId, limit: 1000 })

    const summary = summaryRes?.data
    const stats = statsRes?.data
    const rawStocks: StockBatch[] = (stocksRes as any)?.data ?? []
    const grouped = useMemo(() => groupStockByMedicine(rawStocks), [rawStocks])

    const lowStockItems = grouped.filter(g => g.totalQty <= g.minimumStock)
    const outOfStockItems = grouped.filter(g => g.totalQty === 0)

    const displayedStocks = useMemo(() => {
        const q = debouncedSearch.toLowerCase()
        const source = tab === 'low' ? lowStockItems : tab === 'out' ? outOfStockItems : grouped
        return q ? source.filter(g => g.name.toLowerCase().includes(q) || g.genericName?.toLowerCase().includes(q)) : source
    }, [grouped, lowStockItems, outOfStockItems, tab, debouncedSearch])

    const loading = loadingSummary || loadingStats

    return (
        <div className="flex flex-col gap-6 p-6 min-h-screen bg-muted/10">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/dashboard" className="h-9 w-9 rounded-xl flex items-center justify-center bg-muted/50 hover:bg-muted transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-primary flex items-center gap-2">
                        <Layers className="w-6 h-6" /> Business Overview
                    </h1>
                    <p className="text-xs text-muted-foreground font-medium">Sales · Returns · Purchases · Active Stock</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="border-none shadow-lg">
                            <CardContent className="p-5">
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-8 w-32 mb-1" />
                                <Skeleton className="h-3 w-20" />
                            </CardContent>
                        </Card>
                    ))
                ) : (<>
                    <StatCard
                        icon={DollarSign}
                        label="Sales Revenue"
                        value={formatCurrency(summary?.sales?.totalAmount ?? 0)}
                        sub={`Net: ${formatCurrency(summary?.sales?.netSales ?? 0)} · ${summary?.sales?.count ?? 0} Tx`}
                        color="text-emerald-600"
                    />
                    <StatCard
                        icon={RotateCcw}
                        label="Total Returns"
                        value={formatCurrency(summary?.returns?.saleReturnAmount ?? 0)}
                        sub={`${summary?.returns?.saleReturnCount ?? 0} items returned`}
                        color="text-rose-600"
                    />
                    <StatCard
                        icon={CreditCard}
                        label="Total Purchases"
                        value={formatCurrency(summary?.purchases?.totalAmount ?? 0)}
                        sub={`${summary?.purchases?.count ?? 0} purchase orders`}
                        color="text-indigo-600"
                    />
                    <StatCard
                        icon={BoxIcon}
                        label="Active Stock"
                        value={`${grouped.length} Items`}
                        sub={`${lowStockItems.length} low · ${stats?.expiringIn30Days ?? 0} expiring`}
                        color={lowStockItems.length > 0 ? "text-orange-600" : "text-primary"}
                    />
                </>)}
            </div>

            {/* Stock Table */}
            <Card className="border-none shadow-xl shadow-primary/5">
                <CardHeader className="p-5 border-b">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <CardTitle className="text-base font-black flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-primary" /> Stock Overview
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search medicine..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 h-9 text-sm rounded-xl bg-muted/50 border-none"
                            />
                        </div>
                    </div>

                    <Tabs value={tab} onValueChange={setTab} className="mt-3">
                        <TabsList className="rounded-xl h-9 bg-muted/50">
                            <TabsTrigger value="all" className="rounded-lg text-xs font-bold">
                                All <Badge variant="secondary" className="ml-1.5 text-[9px] h-4 px-1">{grouped.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="low" className="rounded-lg text-xs font-bold text-orange-600">
                                Low Stock <Badge variant="secondary" className="ml-1.5 text-[9px] h-4 px-1 bg-orange-100 text-orange-700">{lowStockItems.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="out" className="rounded-lg text-xs font-bold text-rose-600">
                                Out of Stock <Badge variant="secondary" className="ml-1.5 text-[9px] h-4 px-1 bg-rose-100 text-rose-700">{outOfStockItems.length}</Badge>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>

                <CardContent className="p-0">
                    {loadingStocks ? (
                        <div className="space-y-3 p-6">
                            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
                        </div>
                    ) : displayedStocks.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                            <PackageX className="h-10 w-10 opacity-30" />
                            <p className="text-sm font-medium">No stock items found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                    <TableHead className="pl-6 text-[11px] font-black uppercase tracking-wider">Medicine</TableHead>
                                    <TableHead className="text-[11px] font-black uppercase tracking-wider">Total Qty</TableHead>
                                    <TableHead className="text-[11px] font-black uppercase tracking-wider">Batches</TableHead>
                                    <TableHead className="text-[11px] font-black uppercase tracking-wider">Min Stock</TableHead>
                                    <TableHead className="text-[11px] font-black uppercase tracking-wider">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayedStocks.map(item => {
                                    const isOut = item.totalQty === 0
                                    const isLow = !isOut && item.totalQty <= item.minimumStock
                                    return (
                                        <TableRow key={item.medicineId} className={`group hover:bg-muted/20 ${isLow || isOut ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''}`}>
                                            <TableCell className="pl-6">
                                                <div>
                                                    <p className="font-bold text-sm">{item.name}</p>
                                                    {item.genericName && <p className="text-[10px] text-muted-foreground">{item.genericName}</p>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`text-base font-black ${isOut ? 'text-rose-600' : isLow ? 'text-orange-600' : 'text-foreground'}`}>
                                                    {item.totalQty}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {item.batches.map(b => (
                                                        <span
                                                            key={b.id}
                                                            className="inline-flex items-center gap-1 text-[9px] font-bold bg-muted rounded-md px-1.5 py-0.5"
                                                            title={b.expiry ? `Expires: ${format(new Date(b.expiry), 'dd MMM yyyy')}` : ''}
                                                        >
                                                            {b.batch ? `${b.batch}: ` : ''}{b.qty} pcs
                                                            {b.expiry && new Date(b.expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                                                                <AlertTriangle className="h-2.5 w-2.5 text-rose-500" />
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">{item.minimumStock}</span>
                                            </TableCell>
                                            <TableCell>
                                                {isOut ? (
                                                    <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 border rounded-lg text-[9px] font-black uppercase">
                                                        Out of Stock
                                                    </Badge>
                                                ) : isLow ? (
                                                    <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 border rounded-lg text-[9px] font-black uppercase flex items-center gap-1 w-fit">
                                                        <TrendingDown className="h-2.5 w-2.5" /> Low Stock
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 border rounded-lg text-[9px] font-black uppercase">
                                                        In Stock
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Recent Sales + Recent Purchases */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales */}
                <Card className="border-none shadow-lg">
                    <CardHeader className="p-5 border-b">
                        <CardTitle className="text-sm font-black flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-600" /> Recent Sales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingSales ? (
                            <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead><tr className="border-b bg-muted/20"><th className="text-left px-5 py-2 text-[10px] font-black uppercase tracking-wider">Invoice</th><th className="text-left px-5 py-2 text-[10px] font-black uppercase tracking-wider">Patient</th><th className="text-right px-5 py-2 text-[10px] font-black uppercase tracking-wider">Amount</th></tr></thead>
                                <tbody>
                                    {(salesRes?.data?.sales ?? []).slice(0, 8).map((s: any) => (
                                        <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20">
                                            <td className="px-5 py-2 font-bold text-xs text-primary">{s.invoiceNumber}</td>
                                            <td className="px-5 py-2 text-xs text-muted-foreground">{s.patient?.name || 'Walk-in'}</td>
                                            <td className="px-5 py-2 text-right font-black text-emerald-600 text-xs">{formatCurrency(s.netPrice || s.totalPrice || 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>

                {/* Purchases */}
                <Card className="border-none shadow-lg">
                    <CardHeader className="p-5 border-b">
                        <CardTitle className="text-sm font-black flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-indigo-600" /> Recent Purchases
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loadingPurchases ? (
                            <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead><tr className="border-b bg-muted/20"><th className="text-left px-5 py-2 text-[10px] font-black uppercase tracking-wider">PO#</th><th className="text-left px-5 py-2 text-[10px] font-black uppercase tracking-wider">Supplier</th><th className="text-right px-5 py-2 text-[10px] font-black uppercase tracking-wider">Amount</th></tr></thead>
                                <tbody>
                                    {(purchasesRes?.data?.purchases ?? []).slice(0, 8).map((p: any) => (
                                        <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                                            <td className="px-5 py-2 font-bold text-xs text-primary">{p.poNumber || '—'}</td>
                                            <td className="px-5 py-2 text-xs text-muted-foreground">{p.supplier?.name || '—'}</td>
                                            <td className="px-5 py-2 text-right font-black text-indigo-600 text-xs">{formatCurrency(p.netPrice || p.totalPrice || 0)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
