"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateOpeningStock } from "@/hooks/pharmacy-queries"
import { cn } from "@/lib/utils"
import { Stock } from "@/types/pharmacy"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface EditOpeningStockDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    stock: Stock | null
    onSuccess: () => void
}

export function EditOpeningStockDialog({ open, onOpenChange, stock, onSuccess }: EditOpeningStockDialogProps) {
    const [loading, setLoading] = useState(false)
    const updateMutation = useUpdateOpeningStock()

    // Form State
    const [expiryDate, setExpiryDate] = useState<Date>()
    const [quantity, setQuantity] = useState<number>(0)
    const [unitPrice, setUnitPrice] = useState<number>(0)
    const [mrp, setMrp] = useState<number>(0)
    const [note, setNote] = useState("")

    useEffect(() => {
        if (open && stock) {
            setExpiryDate(new Date(stock.expiryDate))
            setQuantity(Number(stock.quantity))
            setUnitPrice(Number(stock.unitPrice))
            setMrp(Number(stock.mrp))
            setNote("") // Note is usually transient or not stored in the same way
        }
    }, [stock, open])

    const handleSave = async () => {
        if (!stock) return

        if (!expiryDate || quantity <= 0 || unitPrice <= 0 || mrp <= 0) {
            toast.error("Please fill in all required fields: Expiry, Quantity, Unit Price, and MRP (must be > 0)")
            return
        }

        if (unitPrice > mrp) {
            toast.error("Unit Price cannot be greater than MRP")
            return
        }

        setLoading(true)
        try {
            await updateMutation.mutateAsync({
                id: stock.id,
                data: {
                    expiryDate: expiryDate.toISOString(),
                    quantity,
                    unitPrice,
                    mrp,
                    note: note || undefined
                }
            })
            toast.success("Opening stock updated successfully")
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast.error("Failed to update opening stock")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!loading) {
                onOpenChange(val)
            }
        }}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Edit Opening Stock</DialogTitle>
                    <DialogDescription>
                        Updating batch <span className="font-mono font-bold text-primary">{stock?.batchNumber}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Expiry Date *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !expiryDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {expiryDate ? format(expiryDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={expiryDate}
                                    onSelect={setExpiryDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity *</Label>
                        <SmartNumberInput
                            id="quantity"
                            value={quantity}
                            onChange={(val) => setQuantity(val || 0)}
                            placeholder="0"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="unitPrice">Unit Price (Sale) *</Label>
                            <SmartNumberInput
                                id="unitPrice"
                                value={unitPrice}
                                onChange={(val) => setUnitPrice(val || 0)}
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mrp">MRP (Unit) *</Label>
                            <SmartNumberInput
                                id="mrp"
                                value={mrp}
                                onChange={(val) => setMrp(val || 0)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note">Update Note / Reason</Label>
                        <Textarea
                            id="note"
                            placeholder="Why are you updating this record?"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Record
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
