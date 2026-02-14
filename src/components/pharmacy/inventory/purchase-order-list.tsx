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
import { pharmacyService } from "@/services/pharmacy-service"
import { Purchase, PurchaseStatus } from "@/types/pharmacy"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function PurchaseOrderList() {
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [loading, setLoading] = useState(true)

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

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>PO Number</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <div className="flex items-center justify-center text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Loading orders...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : purchases.map((po) => (
                            <TableRow key={po.id}>
                                <TableCell className="font-medium">#{po.id.slice(-6).toUpperCase()}</TableCell>
                                <TableCell>{format(new Date(po.createdAt), "PPP")}</TableCell>
                                <TableCell>{po.supplier?.name || 'Unknown Supplier'}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        po.status === 'complete' ? 'default' : 
                                        po.status === 'pending' ? 'secondary' : 'destructive'
                                    }>
                                        {po.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {po.status === 'pending' && (
                                            <>
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => handleStatusUpdate(po.id, 'complete')}
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
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    No purchase orders found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
