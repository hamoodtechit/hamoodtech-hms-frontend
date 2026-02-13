"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { InventoryItem, useInventoryStore } from "@/store/use-inventory-store"
import { MoreHorizontal, Search } from "lucide-react"
import { useState } from "react"
import { BatchList } from "./batch-list"

export function StockTable() {
  const { items, getItemStock } = useInventoryStore()
  const [search, setSearch] = useState("")
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search inventory..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden md:table-cell">Supplier</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
                const stock = getItemStock(item.id)
                const isLow = stock <= item.minStockData
                const isOut = stock === 0

                return (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-muted-foreground hidden md:table-cell">{item.supplier}</TableCell>
                        <TableCell>
                            <span className="font-bold">{stock}</span> 
                            <span className="text-xs text-muted-foreground ml-1">/ {item.minStockData} min</span>
                        </TableCell>
                        <TableCell>
                            {isOut ? (
                                <Badge variant="destructive">Out of Stock</Badge>
                            ) : isLow ? (
                                <Badge variant="secondary" className="text-orange-500 bg-orange-50 hover:bg-orange-100">Low Stock</Badge>
                            ) : (
                                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200">In Stock</Badge>
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
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem onClick={() => setSelectedItem(item)}>
                                        View Batches
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Update Details</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive">Archive Item</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>Batch Details: {selectedItem?.name}</DialogTitle>
            </DialogHeader>
            {selectedItem && <BatchList itemId={selectedItem.id} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
