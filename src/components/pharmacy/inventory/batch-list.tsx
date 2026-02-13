"use client"

import { Badge } from "@/components/ui/badge"
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

interface BatchListProps {
    itemId: string
}

export function BatchList({ itemId }: BatchListProps) {
    const { batches } = useInventoryStore()
    const itemBatches = batches.filter(b => b.itemId === itemId).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Batch #</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Cost Price</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {itemBatches.map((batch) => {
                            const daysUntilExpiry = Math.ceil((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                            const isExpired = daysUntilExpiry < 0
                            const isExpiringSoon = daysUntilExpiry <= 90

                            return (
                                <TableRow key={batch.id}>
                                    <TableCell className="font-mono">{batch.batchNumber}</TableCell>
                                    <TableCell>
                                        {format(new Date(batch.expiryDate), "PPP")}
                                        <div className="text-xs text-muted-foreground">
                                            {isExpired ? "Expired" : `${daysUntilExpiry} days left`}
                                        </div>
                                    </TableCell>
                                    <TableCell>{batch.quantity}</TableCell>
                                    <TableCell>${batch.costPrice.toFixed(2)}</TableCell>
                                    <TableCell>
                                         {isExpired ? (
                                            <Badge variant="destructive">Expired</Badge>
                                        ) : isExpiringSoon ? (
                                            <Badge variant="secondary" className="text-orange-500">Expiring Soon</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-emerald-600">Good</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {itemBatches.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                    No batches found for this item.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="bg-secondary/10 p-4 rounded-lg text-sm text-muted-foreground">
                <p><strong>Note:</strong> Items are sold using FIFO (First-In, First-Out) logic based on the Expiry Date.</p>
            </div>
        </div>
    )
}
