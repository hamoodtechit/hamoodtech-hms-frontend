"use client"

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
import { useCurrency } from "@/hooks/use-currency"
import { pharmacyService } from "@/services/pharmacy-service"
import { Purchase, PurchaseStatus } from "@/types/pharmacy"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { PurchaseDetailsDialog } from "./purchase-details-dialog"

export function PurchaseOrderList() {
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const { formatCurrency } = useCurrency()

    const fetchPurchases = async () => {
        try {
            setLoading(true)
            const response = await pharmacyService.getPurchases({ limit: 50 })
            setPurchases(response.data.purchases)
        } catch (error) {
            toast.error("Failed to fetch purchase orders")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPurchases()
    }, [])

    const handleStatusUpdate = async (id: string, status: PurchaseStatus) => {
        try {
            await pharmacyService.updatePurchaseStatus(id, status)
            toast.success(`Order marked as ${status}`)
            fetchPurchases()
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    const handleViewDetails = (purchase: Purchase) => {
        setSelectedPurchase(purchase)
        setDetailsOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>PO Number</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Status</TableHead>
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
                                <TableCell className="font-medium">
                                    {po.poNumber || `#${po.id.slice(-6).toUpperCase()}`}
                                </TableCell>
                                <TableCell>{format(new Date(po.createdAt), "PPP")}</TableCell>
                                <TableCell>{po.supplier?.name || 'Unknown Supplier'}</TableCell>
                                <TableCell>
                                    {formatCurrency(po.totalPrice || 0)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        po.status === 'completed' ? 'default' : 
                                        po.status === 'pending' ? 'secondary' : 'destructive'
                                    }>
                                        {po.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleViewDetails(po)}
                                        >
                                            View
                                        </Button>
                                        {po.status === 'pending' && (
                                            <>
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => handleStatusUpdate(po.id, 'completed')}
                                                    className="bg-emerald-600 hover:bg-emerald-700 h-8"
                                                >
                                                    Complete
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    onClick={() => handleStatusUpdate(po.id, 'rejected')}
                                                    className="h-8"
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
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                    No purchase orders found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            
            <PurchaseDetailsDialog 
                open={detailsOpen} 
                onOpenChange={setDetailsOpen} 
                purchase={selectedPurchase} 
            />
        </div>
    )
}
