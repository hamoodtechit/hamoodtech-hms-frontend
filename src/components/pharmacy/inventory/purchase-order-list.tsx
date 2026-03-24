"use client"

import { FilterPopover } from "@/components/shared/filter-popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { usePurchases, useUpdatePurchaseStatus } from "@/hooks/pharmacy-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { Purchase, PurchaseStatus } from "@/types/pharmacy"
import { format } from "date-fns"
import { Loader2, Search } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { PurchaseDetailsDialog } from "./purchase-details-dialog"
import { PurchaseFilters, PurchaseFilterValues } from "./purchase-filters"

import { useStoreContext } from "@/store/use-store-context"

export function PurchaseOrderList() {
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [detailsAddPayment, setDetailsAddPayment] = useState(false)
    const [page, setPage] = useState(1)
    const { formatCurrency } = useCurrency()
    const { activeStoreId } = useStoreContext()

    const searchParams = useSearchParams()
    const urlType = searchParams.get('type')

    // Filter state
    const [filters, setFilters] = useState<PurchaseFilterValues>({
        search: "",
        branchId: activeStoreId || undefined,
        supplierId: undefined,
        status: "all",
        paymentStatus: "all",
        type: (urlType as any) || "all",
        startDate: undefined,
        endDate: undefined
    })

    // Sync with URL type if it changes
    useEffect(() => {
        if (urlType) {
            setFilters(prev => ({ ...prev, type: urlType as any }))
        }
    }, [urlType])

    // Sync with global store if not manually changed? 
    // Usually, if the user changes the global store, they expect the page to update.
    useEffect(() => {
        if (activeStoreId) {
            setFilters(prev => ({ ...prev, branchId: activeStoreId }))
        }
    }, [activeStoreId])

    const [debouncedSearch] = useDebounce(filters.search, 500)

    const activeFilterCount = useMemo(() => {
        let count = 0
        if (filters.search) count++
        if (filters.branchId) count++
        if (filters.supplierId) count++
        if (filters.status && filters.status !== 'all') count++
        if (filters.paymentStatus && filters.paymentStatus !== 'all') count++
        if (filters.type && filters.type !== 'all') count++
        if (filters.startDate) count++
        if (filters.endDate) count++
        return count
    }, [filters])

    const { data: purchasesRes, isLoading: loading } = usePurchases({ 
        page,
        limit: 10,
        search: debouncedSearch,
        branchId: filters.branchId,
        supplierId: filters.supplierId,
        status: filters.status === 'all' ? undefined : filters.status as PurchaseStatus,
        paymentStatus: filters.paymentStatus === 'all' ? undefined : filters.paymentStatus as any,
        type: filters.type === 'all' ? undefined : filters.type as any,
        startDate: filters.startDate,
        endDate: filters.endDate
    })
    const purchases = purchasesRes?.data?.purchases || []
    const pagination = purchasesRes?.data?.pagination

    const statusMutation = useUpdatePurchaseStatus()

    const handleStatusUpdate = async (id: string, status: PurchaseStatus) => {
        try {
            await statusMutation.mutateAsync({ id, status })
            toast.success(`Order marked as ${status}`)
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const handleViewDetails = (purchase: Purchase, addPayment = false) => {
        setSelectedPurchase(purchase)
        setDetailsAddPayment(addPayment)
        setDetailsOpen(true)
    }

    const handleReset = () => {
        setFilters({
            search: "",
            branchId: activeStoreId || undefined,
            supplierId: undefined,
            status: "all",
            paymentStatus: "all",
            type: (urlType as any) || "all",
            startDate: undefined,
            endDate: undefined
        })
        setPage(1)
    }

    // Reset page when filters change
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, filters.branchId, filters.supplierId, filters.status, filters.paymentStatus, filters.type, filters.startDate, filters.endDate])

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 max-w-sm relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                        type="text"
                        placeholder="Quick search PO#..." 
                        className="w-full pl-9 pr-4 h-9 rounded-md border border-input bg-transparent text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                </div>
                <FilterPopover 
                    activeFilterCount={activeFilterCount} 
                    onReset={handleReset}
                    title="Purchase Filters"
                >
                    <PurchaseFilters 
                        values={filters} 
                        onChange={setFilters} 
                        onReset={handleReset} 
                    />
                </FilterPopover>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>PO Number</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <div className="flex items-center justify-center text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Loading orders...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : purchases.map((po) => (
                            <TableRow key={po.id}>
                                <TableCell className="font-medium text-xs">
                                    {po.poNumber || `#${po.id.slice(-6).toUpperCase()}`}
                                </TableCell>
                                <TableCell className="text-xs">{format(new Date(po.createdAt), "PPP")}</TableCell>
                                <TableCell className="font-medium text-[10px] uppercase">
                                    {(po as any).type || 'N/A'}
                                </TableCell>
                                <TableCell className="text-xs">{po.supplier?.name || 'Unknown Supplier'}</TableCell>
                                <TableCell className="text-xs">
                                    {formatCurrency(po.totalPrice || 0)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        po.status === 'completed' ? 'default' : 
                                        po.status === 'pending' ? 'secondary' : 'destructive'
                                    } className="text-[10px] uppercase font-bold py-0.5">
                                        {po.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] uppercase font-bold py-0.5",
                                        (po as any).paymentStatus === 'paid' ? "text-emerald-600 border-emerald-200 bg-emerald-50" :
                                        (po as any).paymentStatus === 'partial' ? "text-amber-600 border-amber-200 bg-amber-50" :
                                        "text-destructive border-red-200 bg-red-50"
                                    )}>
                                        {(po as any).paymentStatus || 'unknown'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-xs"
                                            onClick={() => handleViewDetails(po)}
                                        >
                                            View
                                        </Button>
                                        {Number(po.dueAmount || 0) > 0 && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs border-primary text-primary hover:bg-primary/5 font-bold"
                                                onClick={() => handleViewDetails(po, true)}
                                            >
                                                Settle Payment
                                            </Button>
                                        )}
                                        {po.status === 'pending' && (
                                            <>
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => handleStatusUpdate(po.id, 'completed')}
                                                    className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                                                >
                                                    Complete
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    onClick={() => handleStatusUpdate(po.id, 'rejected')}
                                                    className="h-8 text-xs"
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && purchases.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground italic">
                                    No purchase orders found matching your criteria.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between py-2 px-1">
                    <p className="text-[11px] text-muted-foreground">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
                    </p>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={pagination.page <= 1}
                        >
                            Previous
                        </Button>
                        <div className="text-[11px] font-medium px-4">
                            Page {pagination.page} of {pagination.totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
            
            <PurchaseDetailsDialog 
                open={detailsOpen} 
                onOpenChange={(open) => {
                    setDetailsOpen(open)
                    if (!open) setDetailsAddPayment(false)
                }} 
                purchase={selectedPurchase} 
                initialAddPayment={detailsAddPayment}
            />
        </div>
    )
}
