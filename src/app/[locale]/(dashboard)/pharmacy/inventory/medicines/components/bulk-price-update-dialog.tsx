"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useBulkPriceUpdate } from "@/hooks/pharmacy-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Medicine, Stock } from "@/types/pharmacy"
import { Loader2, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface BulkPriceUpdateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    medicine: Medicine | null
}

export function BulkPriceUpdateDialog({ open, onOpenChange, medicine }: BulkPriceUpdateDialogProps) {
    const { formatCurrency } = useCurrency()
    const updateMutation = useBulkPriceUpdate()
    const [editableStocks, setEditableStocks] = useState<any[]>([])

    useEffect(() => {
        if (open && medicine?.stocks) {
            // Filter stocks > 0
            const batchesWithStock = medicine.stocks
                .filter(s => Number(s.quantity) > 0)
                .map(s => ({
                    id: s.id,
                    medicineId: medicine.id,
                    sku: s.sku || "",
                    batchNumber: s.batchNumber,
                    quantity: s.quantity,
                    unitPrice: Number(s.unitPrice) || 0,
                    mrp: Number(s.mrp) || 0,
                    unit: s.unit
                }))
            setEditableStocks(batchesWithStock)
        }
    }, [open, medicine])

    const handlePriceChange = (id: string, field: 'unitPrice' | 'mrp', value: string) => {
        const numValue = parseFloat(value) || 0
        setEditableStocks(prev => prev.map(s => 
            s.id === id ? { ...s, [field]: numValue } : s
        ))
    }

    const handleSave = async () => {
        if (editableStocks.length === 0) {
            toast.error("No batches with stock available to update")
            return
        }

        const payload = editableStocks.map(s => ({
            medicineId: s.medicineId,
            sku: s.sku,
            unitPrice: s.unitPrice,
            mrp: s.mrp
        }))

        try {
            await updateMutation.mutateAsync(payload)
            onOpenChange(false)
        } catch (error) {
            // Error managed by hook toast
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Update Prices: {medicine?.name}</DialogTitle>
                    <DialogDescription>
                        Update the unit price and MRP for all batches with stock greater than zero.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {editableStocks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">
                            No batches with active stock found for this medicine.
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[120px]">Batch #</TableHead>
                                        <TableHead className="text-center">Stock</TableHead>
                                        <TableHead>Unit Price (Tk)</TableHead>
                                        <TableHead>MRP (Tk)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {editableStocks.map((stock) => (
                                        <TableRow key={stock.id}>
                                            <TableCell className="font-mono text-xs font-semibold">
                                                {stock.batchNumber}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="text-xs font-bold text-primary">
                                                    {stock.quantity}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground ml-1 uppercase">
                                                    {stock.unit}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number"
                                                    className="h-8 text-xs bg-emerald-50/50 border-emerald-200 focus-visible:ring-emerald-500"
                                                    value={stock.unitPrice}
                                                    onChange={(e) => handlePriceChange(stock.id, 'unitPrice', e.target.value)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number"
                                                    className="h-8 text-xs bg-orange-50/50 border-orange-200 focus-visible:ring-orange-500"
                                                    value={stock.mrp}
                                                    onChange={(e) => handlePriceChange(stock.id, 'mrp', e.target.value)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSave} 
                        disabled={updateMutation.isPending || editableStocks.length === 0}
                        className="bg-primary hover:bg-primary/90"
                    >
                        {updateMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
