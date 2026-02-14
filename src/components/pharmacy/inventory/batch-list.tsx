"use client"

import { StockAdjustmentDialog } from "@/app/[locale]/(dashboard)/pharmacy/inventory/medicines/components/stock-adjustment-dialog"
import { StockTransferDialog } from "@/app/[locale]/(dashboard)/pharmacy/inventory/medicines/components/stock-transfer-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { ArrowRightLeft, Loader2, MoreHorizontal, Settings2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface BatchListProps {
    itemId: string
    initialStocks?: Stock[]
}

export function BatchList({ itemId, initialStocks }: BatchListProps) {
    const [stocks, setStocks] = useState<Stock[]>(initialStocks || [])
    const [loading, setLoading] = useState(!initialStocks)
    
    // Dialog States
    const [adjustmentOpen, setAdjustmentOpen] = useState(false)
    const [transferOpen, setTransferOpen] = useState(false)
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null)

    const loadBatches = async () => {
        try {
            setLoading(true)
            // We fetch the full medicine details to get the updated stocks
            // because the /pharmacy/stocks endpoint might be unreliable or require different params
            const response = await pharmacyService.getMedicine(itemId)
            setStocks(response.data.stocks || [])
        } catch (error) {
            toast.error("Failed to load batch data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (initialStocks) {
            setStocks(initialStocks)
            setLoading(false)
        } else {
            loadBatches()
        }
    }, [itemId, initialStocks])

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
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem 
                                                    onClick={() => {
                                                        setSelectedStock(batch)
                                                        setAdjustmentOpen(true)
                                                    }}
                                                >
                                                    <Settings2 className="mr-2 h-4 w-4" /> Adjust Stock
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedStock(batch)
                                                        setTransferOpen(true)
                                                    }}
                                                >
                                                    <ArrowRightLeft className="mr-2 h-4 w-4" /> Transfer Stock
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
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
