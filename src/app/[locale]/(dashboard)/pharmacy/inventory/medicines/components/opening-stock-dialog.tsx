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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { Textarea } from "@/components/ui/textarea"
import { useAddOpeningStock, usePharmacyEntities } from "@/hooks/pharmacy-queries"
import { cn } from "@/lib/utils"
import { Medicine } from "@/types/pharmacy"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Plus } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { MasterDataDialog } from "../../../setup/components/master-data-dialog"

interface OpeningStockDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    medicine: Medicine | null
    branchId: string
}

export function OpeningStockDialog({ open, onOpenChange, medicine, branchId }: OpeningStockDialogProps) {
    const [loading, setLoading] = useState(false)
    const addOpeningStockMutation = useAddOpeningStock()

    // Quick Add State
    const [quickAddOpen, setQuickAddOpen] = useState(false)
    const [quickAddType, setQuickAddType] = useState<any>('units')
    const [quickAddTitle, setQuickAddTitle] = useState("")

    const openQuickAdd = (type: any, title: string) => {
        setQuickAddType(type)
        setQuickAddTitle(title)
        setQuickAddOpen(true)
    }

    // Form State
    const [batchNumber, setBatchNumber] = useState("")
    const [expiryDate, setExpiryDate] = useState<Date>()
    const [quantity, setQuantity] = useState<number>(0)
    const [unitPrice, setUnitPrice] = useState<number>(0)
    const [mrp, setMrp] = useState<number>(0)
    const [unit, setUnit] = useState("")
    const [rackNumber, setRackNumber] = useState("")
    const [note, setNote] = useState("")

    const { data: unitsRes } = usePharmacyEntities('units')
    const units = unitsRes?.data || []

    useEffect(() => {
        if (medicine && open) {
            setUnit(medicine.unit || "")
            setUnitPrice(Number(medicine.purchasePrice) || 0)
            setMrp(Number(medicine.mrp) || 0)
            setRackNumber(medicine.rackNumber || "")
        }
    }, [medicine, open])

    const handleSave = async () => {
        if (!medicine || !branchId) return

        if (!batchNumber || !expiryDate || quantity <= 0 || unitPrice <= 0 || mrp <= 0) {
            toast.error("Please fill in all required fields: Batch, Expiry, Quantity, Buy Price, and MRP (must be > 0)")
            return
        }

        setLoading(true)
        try {
            await addOpeningStockMutation.mutateAsync({
                medicineId: medicine.id,
                branchId: branchId,
                batchNumber,
                expiryDate: expiryDate.toISOString(),
                quantity,
                unitPrice,
                mrp,
                unit: unit || 'Pcs',
                rackNumber,
                note
            })
            toast.success("Opening stock added successfully")
            onOpenChange(false)
            resetForm()
        } catch (error) {
            toast.error("Failed to add opening stock")
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setBatchNumber("")
        setExpiryDate(undefined)
        setQuantity(0)
        setUnitPrice(0)
        setMrp(0)
        setUnit("")
        setRackNumber("")
        setNote("")
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!loading) {
                onOpenChange(val)
                if (!val) resetForm()
            }
        }}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Opening Stock</DialogTitle>
                    <DialogDescription>
                        Manually enter initial stock for <span className="font-bold text-primary">{medicine?.name}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="batch">Batch Number *</Label>
                            <Input
                                id="batch"
                                placeholder="e.g. B123"
                                value={batchNumber}
                                onChange={(e) => setBatchNumber(e.target.value)}
                            />
                        </div>
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
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity *</Label>
                            <SmartNumberInput
                                id="quantity"
                                value={quantity}
                                onChange={(val) => setQuantity(val || 0)}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="unit">Unit</Label>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 px-1 text-xs text-primary"
                                    onClick={() => openQuickAdd('units', 'Unit')}
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add New
                                </Button>
                            </div>
                            <Select value={unit} onValueChange={setUnit}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map((u: any) => (
                                        <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="unitPrice">Buy Price *</Label>
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
                        <Label htmlFor="rack">Rack Number</Label>
                        <Input
                            id="rack"
                            placeholder="e.g. A-1"
                            value={rackNumber}
                            onChange={(e) => setRackNumber(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note">Note</Label>
                        <Textarea
                            id="note"
                            placeholder="Optional notes..."
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
                        Save Opening Stock
                    </Button>
                </DialogFooter>
            </DialogContent>

            <MasterDataDialog
                open={quickAddOpen}
                onOpenChange={setQuickAddOpen}
                type={quickAddType}
                title={quickAddTitle}
            />
        </Dialog>
    )
}
