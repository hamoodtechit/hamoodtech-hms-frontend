"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useCurrency } from "@/hooks/use-currency"
import { Transaction } from "@/store/use-pos-store"
import { CheckCircle2, Printer, Share2 } from "lucide-react"

import { useSettingsStore } from "@/store/use-settings-store"

interface ReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
}

export function ReceiptDialog({ open, onOpenChange, transaction }: ReceiptDialogProps) {
  const { general, pharmacy } = useSettingsStore()
  const { formatCurrency } = useCurrency()
  
  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader className="items-center text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl text-emerald-600">Payment Successful</DialogTitle>
        </DialogHeader>
        
        <div className="bg-secondary/10 p-4 rounded-lg space-y-3 text-sm">
             {general && (
                 <div className="text-center border-b pb-3 mb-2">
                     <h3 className="font-bold text-base">{general.hospitalName}</h3>
                     <p className="text-xs text-muted-foreground">{general.address}</p>
                     <p className="text-xs text-muted-foreground text-[10px] mt-1">{general.phone} &bull; {general.email}</p>
                 </div>
             )}

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
                         <span>{formatCurrency(item.price * item.quantity)}</span>
                     </div>
                 ))}
             </div>

             <Separator />

             <div className="space-y-2">
               {/* Subtotal */}
               <div className="flex justify-between text-sm">
                 <span className="text-muted-foreground">Subtotal</span>
                 <span>{formatCurrency(transaction.subtotal)}</span>
               </div>
               
               {/* Discount (if any) */}
               {transaction.discount > 0 && (
                 <div className="flex justify-between text-sm text-orange-600">
                   <span>Discount</span>
                   <span>-{formatCurrency(transaction.discount)}</span>
                 </div>
               )}
               
               {/* VAT/Tax */}
               {transaction.tax > 0 && (
                 <div className="flex justify-between text-sm">
                   <span className="text-muted-foreground">
                     VAT {pharmacy?.vatPercentage ? `(${pharmacy.vatPercentage}%)` : ''}
                   </span>
                   <span>{formatCurrency(transaction.tax)}</span>
                 </div>
               )}
               
               <Separator className="my-2" />
               
               {/* Total */}
               <div className="flex justify-between font-bold text-base">
                 <span>Total</span>
                 <span>{formatCurrency(transaction.total)}</span>
               </div>
             </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2 print:hidden">
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
