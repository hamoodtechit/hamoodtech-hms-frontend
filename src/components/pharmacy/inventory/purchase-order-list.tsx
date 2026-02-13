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
import { useInventoryStore } from "@/store/use-inventory-store"
import { format } from "date-fns"

export function PurchaseOrderList() {
    const { purchaseOrders, updatePurchaseOrderStatus } = useInventoryStore()

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>PO Number</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Total Cost</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {purchaseOrders.map((po) => (
                            <TableRow key={po.id}>
                                <TableCell className="font-medium">{po.id}</TableCell>
                                <TableCell>{format(new Date(po.date), "PPP")}</TableCell>
                                <TableCell>{po.supplier}</TableCell>
                                <TableCell>${po.totalCost.toFixed(2)}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        po.status === 'Received' ? 'default' : 
                                        po.status === 'Ordered' ? 'secondary' : 'outline'
                                    }>
                                        {po.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {po.status === 'Pending' && (
                                        <Button size="sm" onClick={() => updatePurchaseOrderStatus(po.id, 'Ordered')}>
                                            Mark Ordered
                                        </Button>
                                    )}
                                    {po.status === 'Ordered' && (
                                        <Button size="sm" variant="secondary" onClick={() => updatePurchaseOrderStatus(po.id, 'Received')}>
                                            Receive Stock
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {purchaseOrders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
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
