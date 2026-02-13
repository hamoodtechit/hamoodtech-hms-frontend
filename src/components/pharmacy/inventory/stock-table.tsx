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
import { pharmacyService } from "@/services/pharmacy-service"
import { Medicine, PharmacyMeta } from "@/types/pharmacy"
import { Loader2, MoreHorizontal, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { BatchList } from "./batch-list"

export function StockTable() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PharmacyMeta | null>(null)
  const [selectedItem, setSelectedItem] = useState<Medicine | null>(null)

  const loadStock = async () => {
    try {
      setLoading(true)
      const response = await pharmacyService.getMedicines({
        page,
        limit: 10,
        search
      })
      setMedicines(response.data)
      setMeta(response.meta)
    } catch (error) {
      toast.error("Failed to load inventory data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
        loadStock()
    }, 500)
    return () => clearTimeout(timer)
  }, [page, search])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search inventory..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                }}
            />
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="hidden md:table-cell">Brand/Generic</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <span>Fetching inventory...</span>
                        </div>
                    </TableCell>
                </TableRow>
            ) : medicines.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No inventory found.
                    </TableCell>
                </TableRow>
            ) : (
                medicines.map((item) => {
                    const stock = Number(item.stock) || 0
                    const isLow = stock <= Number(item.reorderLevel)
                    const isOut = stock === 0

                    return (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{item.name}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">{item.barcode}</span>
                                </div>
                            </TableCell>
                            <TableCell>{item.category?.name || 'N/A'}</TableCell>
                            <TableCell className="text-muted-foreground hidden md:table-cell">
                                <div className="flex flex-col text-xs">
                                    <span>{item.brand?.name || 'N/A'}</span>
                                    <span className="text-muted-foreground/70 italic">{item.genericName || 'N/A'}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="font-bold">{stock}</span> 
                                <span className="text-xs text-muted-foreground ml-1">/ {item.reorderLevel} min</span>
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
                                            View Batches / Adjust
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive" disabled>Archive Item</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    )
                })
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between py-2">
            <p className="text-xs text-muted-foreground">
                Showing {(meta.page - 1) * meta.pageSize + 1} to {Math.min(meta.page * meta.pageSize, meta.totalItems)} of {meta.totalItems} items
            </p>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!meta.hasPreviousPage}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                    disabled={!meta.hasNextPage}
                >
                    Next
                </Button>
            </div>
        </div>
      )}

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
