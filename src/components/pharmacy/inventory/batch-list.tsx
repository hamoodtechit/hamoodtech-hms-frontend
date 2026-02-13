"use client"

import { StockAdjustmentDialog } from "@/app/[locale]/(dashboard)/pharmacy/inventory/medicines/components/stock-adjustment-dialog"
import { StockTransferDialog } from "@/app/[locale]/(dashboard)/pharmacy/inventory/medicines/components/stock-transfer-dialog"
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
import { Stock } from "@/types/pharmacy"
import { format } from "date-fns"
import { ArrowUpRight, Loader2, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface BatchListProps {
    itemId: string
}

export function BatchList({ itemId }: BatchListProps) {
    const [stocks, setStocks] = useState<Stock[]>([])
    const [loading, setLoading] = useState(true)
    
    // Dialog States
    const [adjustmentOpen, setAdjustmentOpen] = useState(false)
    const [transferOpen, setTransferOpen] = useState(false)
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null)

    const loadBatches = async () => {
        try {
            setLoading(true)
            const response = await pharmacyService.getStocks({ medicineId: itemId })
            setStocks(response.data)
        } catch (error) {
            toast.error("Failed to load batch data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadBatches()
    }, [itemId])

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Batch #</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : stocks.map((batch) => {
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
                                    <TableCell className="font-bold">{batch.quantity} {batch.unit}</TableCell>
                                    <TableCell>{batch.branch?.name || 'Local Store'}</TableCell>
                                    <TableCell>
                                         {isExpired ? (
                                            <Badge variant="destructive">Expired</Badge>
                                        ) : isExpiringSoon ? (
                                            <Badge variant="secondary" className="text-orange-500">Expiring Soon</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-emerald-600">Good</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                                                onClick={() => {
                                                    setSelectedStock(batch)
                                                    setAdjustmentOpen(true)
                                                }}
                                                title="Adjust Stock"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-orange-600 hover:text-orange-600 hover:bg-orange-50"
                                                onClick={() => {
                                                    setSelectedStock(batch)
                                                    setTransferOpen(true)
                                                }}
                                                title="Transfer Stock"
                                            >
                                                <ArrowUpRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {!loading && stocks.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                                    No active batches found for this item.
                                </TableCell>
                            </TableRow>
                        ) as any}
                    </TableBody>
                </Table>
            </div>
            <div className="bg-secondary/10 p-4 rounded-lg text-sm text-muted-foreground">
                <p><strong>Note:</strong> Items are managed per batch and branch. Adjusting a batch only affects that specific record.</p>
            </div>

            <StockAdjustmentDialog 
               open={adjustmentOpen}
               onOpenChange={setAdjustmentOpen}
               onSuccess={loadBatches}
               stock={selectedStock}
            />

            <StockTransferDialog 
               open={transferOpen}
               onOpenChange={setTransferOpen}
               onSuccess={loadBatches}
               stock={selectedStock}
            />
        </div>
    )
}
