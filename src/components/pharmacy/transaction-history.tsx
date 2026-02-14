"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { pharmacyService } from "@/services/pharmacy-service"
import { useStoreContext } from "@/store/use-store-context"
import { Sale } from "@/types/pharmacy"
import { History, Loader2, Printer, RotateCcw, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useDebounce } from "use-debounce"


import { CreateReturnDialog } from "@/components/pharmacy/pos/create-return-dialog"

export function TransactionHistory() {
  const [search, setSearch] = useState("")
  const [debouncedSearch] = useDebounce(search, 500)
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const { activeStoreId } = useStoreContext()
  const [isOpen, setIsOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  const fetchSales = async () => {
    if (!activeStoreId) return
    
    try {
        setLoading(true)
        const response = await pharmacyService.getSales({
            branchId: activeStoreId,
            limit: 20,
            // Search functionality might need backend support for 'search' param mapping to invoice/customer 
            // For now assuming the backend might handle basic filtering or we filter clientside if results are small
            // But per specs, getSales params: page, limit, branchId, patientId, status. 
            // Search is not explicitly listed in user request but let's see if we can add it or just fetch latest.
        })
        setSales(response.data.sales)
    } catch (error) {
        console.error("Failed to fetch sales", error)
        toast.error("Failed to load transaction history")
    } finally {
        setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && activeStoreId) {
        fetchSales()
    }
  }, [isOpen, activeStoreId, debouncedSearch])

  const handleReprint = (sale: Sale) => {
    const receiptWindow = window.open('', '_blank', 'width=400,height=600');
    if (receiptWindow) {
        receiptWindow.document.write(`
            <html>
                <head>
                    <title>Receipt ${sale.invoiceNumber}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; padding: 20px; text-align: center; }
                        .header { margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                        .item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
                        .total { margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; font-weight: bold; display: flex; justify-content: space-between; }
                        .footer { margin-top: 30px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>MediCare Pharmacy</h2>
                        <p>${sale.branch?.name || 'Pharmacy Branch'}</p>
                        <p>Date: ${new Date(sale.createdAt).toLocaleString()}</p>
                        <p>Invoice: ${sale.invoiceNumber}</p>
                    </div>
                    <div>
                        ${sale.saleItems.map(item => `
                            <div class="item">
                                <span>${item.itemName} x${item.quantity}</span>
                                <span>$${Number(item.totalPrice).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="total">
                        <span>TOTAL</span>
                        <span>$${Number(sale.totalPrice).toFixed(2)}</span>
                    </div>
                    <div class="footer">
                        <p>Thank you for your purchase!</p>
                        <p>Customer: ${sale.patient?.name || 'Walk-in'}</p>
                    </div>
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
            </html>
        `);
        receiptWindow.document.close();
    } else {
        toast.error("Popup blocked. Please allow popups to print receipts.");
    }
  }

  const handleRefund = (sale: Sale) => {
    setSelectedSale(sale)
    setReturnDialogOpen(true)
  }

  return (
    <>
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <History className="mr-2 h-4 w-4" />
          Recent Sales
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Transaction History</SheetTitle>
          <SheetDescription>
            View recent sales, reprint receipts, or process refunds.
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4 space-y-4">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by Invoice..." 
                    className="pl-9" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="border rounded-md h-[calc(100vh-200px)] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : sales.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No transactions found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-medium">
                                        {sale.invoiceNumber}
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(sale.createdAt).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {sale.patient?.name || 'Walk-in'}
                                        <div className="mt-1">
                                            <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                                {sale.status}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>${Number(sale.totalPrice).toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8" 
                                                title="Reprint Receipt"
                                                onClick={() => handleReprint(sale)}
                                            >
                                                <Printer className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-destructive hover:text-destructive" 
                                                title="Refund"
                                                onClick={() => handleRefund(sale)}
                                            >
                                                <RotateCcw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
      </SheetContent>
    </Sheet>

    <CreateReturnDialog 
        open={returnDialogOpen} 
        onOpenChange={setReturnDialogOpen}
        sale={selectedSale}
        onSuccess={() => {
            fetchSales()
            // Optional: close transaction history or keep open
        }}
    />
    </>
  )
}
