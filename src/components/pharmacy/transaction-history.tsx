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
import { Transaction, usePosStore } from "@/store/use-pos-store"
import { History, Printer, RotateCcw, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"


export function TransactionHistory() {
  const [search, setSearch] = useState("")
  const { transactions, refundTransaction } = usePosStore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  const filtered = transactions.filter(t => 
    t.id.toLowerCase().includes(search.toLowerCase()) || 
    t.customerName.toLowerCase().includes(search.toLowerCase())
  )

  const handleReprint = (t: Transaction) => {
    const receiptWindow = window.open('', '_blank', 'width=400,height=600');
    if (receiptWindow) {
        receiptWindow.document.write(`
            <html>
                <head>
                    <title>Receipt ${t.id}</title>
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
                        <p>123 Health St, Wellness City</p>
                        <p>Tel: (555) 123-4567</p>
                        <p>Date: ${t.date}</p>
                        <p>Order: ${t.id}</p>
                    </div>
                    <div>
                        ${t.items.map(item => `
                            <div class="item">
                                <span>${item.name} x${item.quantity}</span>
                                <span>$${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="total">
                        <span>TOTAL</span>
                        <span>$${t.total.toFixed(2)}</span>
                    </div>
                    <div class="footer">
                        <p>Thank you for your purchase!</p>
                        <p>Keep this receipt for returns.</p>
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

  const handleRefund = (id: string) => {
    refundTransaction(id)
    toast.success(`Transaction ${id} refunded successfully`)
  }

  return (
    <Sheet>
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
                    placeholder="Search by ID or Customer..." 
                    className="pl-9" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell className="font-medium">
                                    {t.id}
                                    <div className="text-xs text-muted-foreground">{t.date.split(' ')[1]}</div>
                                </TableCell>
                                <TableCell>
                                    {t.customerName}
                                    <div className="mt-1">
                                        <Badge variant={t.status === 'Completed' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                            {t.status}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell>${t.total.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8" 
                                            title="Reprint Receipt"
                                            onClick={() => handleReprint(t)}
                                        >
                                            <Printer className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-destructive hover:text-destructive" 
                                            title="Refund"
                                            onClick={() => handleRefund(t.id)}
                                            disabled={t.status === 'Refunded'}
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
