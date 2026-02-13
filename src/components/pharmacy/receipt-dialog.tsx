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
import { Separator } from "@/components/ui/separator"
import { Transaction } from "@/store/use-pos-store"
import { CheckCircle2, Printer, Share2 } from "lucide-react"

interface ReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
}

export function ReceiptDialog({ open, onOpenChange, transaction }: ReceiptDialogProps) {
  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="items-center text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl text-emerald-600">Payment Successful</DialogTitle>
            <DialogDescription>
                Transaction #{transaction.id} completed.
            </DialogDescription>
        </DialogHeader>
        
        <div className="bg-secondary/10 p-4 rounded-lg space-y-3 text-sm">
             <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{transaction.date}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span>{transaction.customerName}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span>{transaction.paymentMethod}</span>
             </div>
             
             <Separator />
             
             <div className="space-y-1">
                 {transaction.items.map((item) => (
                     <div key={item.id} className="flex justify-between text-xs">
                         <span>{item.quantity}x {item.name}</span>
                         <span>${(item.price * item.quantity).toFixed(2)}</span>
                     </div>
                 ))}
             </div>

             <Separator />

             <div className="flex justify-between font-medium">
                <span>Total Paid</span>
                <span>${transaction.total.toFixed(2)}</span>
             </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button className="w-full" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print Receipt
          </Button>
          <Button variant="outline" className="w-full">
            <Share2 className="mr-2 h-4 w-4" /> Send via SMS/Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
