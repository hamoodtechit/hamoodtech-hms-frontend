"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCashRegister } from "@/hooks/pharmacy-queries"
import { useSale } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { format } from "date-fns"
import { 
    Calendar, 
    CreditCard, 
    DollarSign, 
    Download, 
    History, 
    Info, 
    Loader2, 
    Package, 
    Printer, 
    Store, 
    TrendingUp, 
    User,
    Wallet
} from "lucide-react"
import { useState } from "react"
import { SaleDetailsDialog } from "../sale-details-dialog"

interface RegisterDetailsDialogProps {
    id: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function RegisterDetailsDialog({ id, open, onOpenChange }: RegisterDetailsDialogProps) {
    const { data: response, isLoading } = useCashRegister(id || "")
    const { formatCurrency } = useCurrency()
    const [selectedSale, setSelectedSale] = useState<any | null>(null)
    const [saleDialogOpen, setSaleDialogOpen] = useState(false)

    const { data: fullSaleRes } = useSale(selectedSale?.id || "")
    const fullSale = fullSaleRes?.data || selectedSale

    const session = response?.data
    if (!session && !isLoading) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl p-0 overflow-hidden bg-background border-none shadow-2xl">
                <DialogHeader className="p-6 bg-card border-b sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Wallet className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight">
                                    Register Session Details
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="font-mono text-[10px] py-0">
                                        ID: {session?.id}
                                    </Badge>
                                    <Badge 
                                        className="capitalize"
                                        variant={session?.status === 'open' ? 'success' : 'warning'}
                                    >
                                        {session?.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="rounded-xl">
                                <Printer className="h-4 w-4 mr-2" />
                                Print Audit
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-xl">
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[80vh]">
                    <div className="p-6 space-y-8">
                        {isLoading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
                                <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-widest uppercase">Loading audit data...</p>
                            </div>
                        ) : (
                            <>
                                {/* Stats Overview */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <CardItem 
                                        icon={<Wallet className="h-5 w-5 text-blue-500" />}
                                        label="Opening Balance"
                                        value={formatCurrency(Number(session?.openingBalance || 0))}
                                        subValue={format(new Date(session?.openedAt || Date.now()), "MMM dd, HH:mm")}
                                    />
                                    <CardItem 
                                        icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
                                        label="Total Sales"
                                        value={formatCurrency(Number(session?.salesAmount || 0))}
                                        subValue={`${session?.salesCount || 0} Transactions`}
                                        className="bg-emerald-50/50 border-emerald-100"
                                    />
                                    <CardItem 
                                        icon={<Package className="h-5 w-5 text-rose-500" />}
                                        label="Expenses/Purchases"
                                        value={formatCurrency(Number(session?.expensesAmount || 0))}
                                        subValue={`${session?.expensesCount || 0} Records`}
                                        className="bg-rose-50/50 border-rose-100"
                                    />
                                    <CardItem 
                                        icon={<DollarSign className="h-5 w-5 text-primary" />}
                                        label={session?.status === 'open' ? "Expected Balance" : "Closing Balance"}
                                        value={formatCurrency(Number(session?.status === 'open' ? (Number(session?.openingBalance) + Number(session?.salesAmount || 0) - Number(session?.expensesAmount || 0)) : session?.closingBalance || 0))}
                                        subValue={session?.closedAt ? `Closed: ${format(new Date(session?.closedAt), "MMM dd, HH:mm")}` : "Session Active"}
                                        className="bg-primary/5 border-primary/10"
                                    />
                                </div>

                                {/* Information Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-6">
                                        <Tabs defaultValue="sales" className="w-full">
                                            <TabsList className="bg-card border p-1 rounded-2xl h-12 shadow-sm">
                                                <TabsTrigger value="sales" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                                                    Sales History
                                                </TabsTrigger>
                                                <TabsTrigger value="info" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                                                    Session Notes
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="sales" className="mt-4 bg-card rounded-3xl border shadow-sm overflow-hidden">
                                                <Table>
                                                    <TableHeader className="bg-muted/50">
                                                        <TableRow>
                                                            <TableHead>Invoice</TableHead>
                                                            <TableHead>Patient</TableHead>
                                                            <TableHead>Time</TableHead>
                                                            <TableHead className="text-right">Amount</TableHead>
                                                            <TableHead className="text-center">Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {session?.sales?.length ? session.sales.map((sale) => (
                                                            <TableRow 
                                                                key={sale.id} 
                                                                className="cursor-pointer hover:bg-muted/50 transition-colors group"
                                                                onClick={() => {
                                                                    setSelectedSale(sale)
                                                                    setSaleDialogOpen(true)
                                                                }}
                                                            >
                                                                <TableCell className="font-bold font-mono text-xs">{sale.invoiceNumber}</TableCell>
                                                                <TableCell className="text-xs font-semibold">{sale.patientId.split('-')[0]}...</TableCell>
                                                                <TableCell className="text-[10px] font-bold text-muted-foreground uppercase">
                                                                    {format(new Date(sale.createdAt), "HH:mm")}
                                                                </TableCell>
                                                                <TableCell className="text-right font-black text-primary">
                                                                    {formatCurrency(Number(sale.netPrice || sale.totalPrice))}
                                                                </TableCell>
                                                                <TableCell className="text-center">
                                                                    <Badge variant={sale.status === 'completed' ? 'success' : 'warning'} className="text-[9px] px-1.5 py-0">
                                                                        {sale.status}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        )) : (
                                                            <TableRow>
                                                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                                                                    No sales recorded in this session.
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TabsContent>

                                            <TabsContent value="info" className="mt-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 bg-card rounded-2xl border shadow-sm">
                                                        <h4 className="text-xs font-black uppercase text-muted-foreground mb-2 flex items-center gap-2">
                                                            <Info className="h-3 w-3" />
                                                            Opening Note
                                                        </h4>
                                                        <p className="text-sm font-medium italic">
                                                            {session?.openingNote || "No opening notes provided."}
                                                        </p>
                                                    </div>
                                                    <div className="p-4 bg-card rounded-2xl border shadow-sm">
                                                        <h4 className="text-xs font-black uppercase text-muted-foreground mb-2 flex items-center gap-2">
                                                            <Info className="h-3 w-3" />
                                                            Closing Note
                                                        </h4>
                                                        <p className="text-sm font-medium italic">
                                                            {session?.closingNote || "No closing notes provided."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Session Context */}
                                        <div className="p-6 bg-card rounded-3xl border shadow-sm space-y-4">
                                            <h3 className="font-bold flex items-center gap-2 text-slate-800">
                                                <Store className="h-5 w-5 text-primary" />
                                                Context Details
                                            </h3>
                                            <div className="space-y-3">
                                                <InfoItem 
                                                    icon={<User className="h-4 w-4" />}
                                                    label="Cashier"
                                                    value={session?.user?.name || "System User"}
                                                />
                                                <InfoItem 
                                                    icon={<Store className="h-4 w-4" />}
                                                    label="Branch"
                                                    value={session?.branch?.name || "Main Branch"}
                                                />
                                                <InfoItem 
                                                    icon={<Calendar className="h-4 w-4" />}
                                                    label="Session Start"
                                                    value={format(new Date(session?.openedAt || Date.now()), "PPpp")}
                                                />
                                                {session?.closedAt && (
                                                    <InfoItem 
                                                        icon={<History className="h-4 w-4" />}
                                                        label="Session End"
                                                        value={format(new Date(session.closedAt), "PPpp")}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* Audit Verification */}
                                        <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl space-y-4">
                                            <h3 className="font-bold text-sm uppercase tracking-widest opacity-70">Audit Discrepancy</h3>
                                            <div className="space-y-1">
                                                <div className="text-3xl font-black">
                                                    {formatCurrency(Number(session?.difference || 0))}
                                                </div>
                                                <p className="text-[10px] font-medium opacity-50 uppercase">
                                                    Difference between actual vs expected
                                                </p>
                                            </div>
                                            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                                <span className="text-xs font-bold opacity-60">Verified Balance:</span>
                                                <span className="font-black">{formatCurrency(Number(session?.actualBalance || 0))}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>

            <SaleDetailsDialog 
                sale={fullSale}
                open={saleDialogOpen}
                onOpenChange={setSaleDialogOpen}
            />
        </Dialog>
    )
}

function CardItem({ icon, label, value, subValue, className }: any) {
    return (
        <div className={`p-4 rounded-3xl border bg-card shadow-sm hover:shadow-md transition-all ${className}`}>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-background border shadow-sm">
                    {icon}
                </div>
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{label}</span>
            </div>
            <div className="text-xl font-black">{value}</div>
            <div className="text-[10px] font-medium text-muted-foreground opacity-70 mt-1 uppercase">{subValue}</div>
        </div>
    )
}

function InfoItem({ icon, label, value }: any) {
    return (
        <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-tight">
                {icon}
                {label}
            </div>
            <div className="text-sm font-black text-foreground">{value}</div>
        </div>
    )
}
