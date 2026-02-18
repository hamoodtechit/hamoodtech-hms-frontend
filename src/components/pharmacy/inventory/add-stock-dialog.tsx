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
  DialogTrigger,
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
import { cn } from "@/lib/utils"
import { useInventoryStore } from "@/store/use-inventory-store"
import { format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function AddStockDialog() {
  const { items, addBatch, addItem } = useInventoryStore()
  const [open, setOpen] = useState(false)
  
  // Form State
  const [itemId, setItemId] = useState("")
  const [batchNumber, setBatchNumber] = useState("")
  const [quantity, setQuantity] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [expiryDate, setExpiryDate] = useState<Date>()

  const handleAddStock = () => {
    if (!itemId || !batchNumber || !quantity || !costPrice || !expiryDate) {
        toast.error("Please fill in all fields")
        return
    }

    const newItem = items.find(i => i.id === itemId)

    addBatch({
        id: `b-${Date.now()}`,
        itemId,
        batchNumber,
        quantity: parseInt(quantity),
        costPrice: parseFloat(costPrice),
        expiryDate: expiryDate.toISOString().split('T')[0]
    })

    toast.success(`Stock added for ${newItem?.name}`)
    setOpen(false)
    resetForm()
  }

  const resetForm = () => {
      setItemId("")
      setBatchNumber("")
      setQuantity("")
      setCostPrice("")
      setExpiryDate(undefined)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Stock</DialogTitle>
          <DialogDescription>
            Receive a new batch of items into inventory.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Item</Label>
            <Select onValueChange={setItemId} value={itemId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select item..." />
                </SelectTrigger>
                <SelectContent>
                    {items.map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label>Batch Number</Label>
                <Input value={batchNumber} onChange={e => setBatchNumber(e.target.value)} placeholder="e.g. BN-2024" />
             </div>
             <div className="grid gap-2">
                <Label>Quantity</Label>
                <SmartNumberInput 
                    value={quantity ? Number(quantity) : undefined} 
                    onChange={(val: number | undefined) => setQuantity(val?.toString() || "")} 
                    placeholder="0" 
                />
             </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label>Cost Price (Per Unit)</Label>
                <SmartNumberInput 
                    value={costPrice ? Number(costPrice) : undefined} 
                    onChange={(val: number | undefined) => setCostPrice(val?.toString() || "")} 
                    placeholder="0.00" 
                />
             </div>
             <div className="grid gap-2">
                <Label>Expiry Date</Label>
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
                    <PopoverContent className="w-auto p-0">
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
        </div>
        <DialogFooter>
          <Button onClick={handleAddStock}>Save Stock</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
