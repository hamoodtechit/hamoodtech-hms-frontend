"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useCurrency } from "@/hooks/use-currency"
import { Transaction, usePosStore } from "@/store/use-pos-store"
import { useSettingsStore } from "@/store/use-settings-store"
import { Printer } from "lucide-react"

interface ReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
}

export function ReceiptDialog({ open, onOpenChange, transaction }: ReceiptDialogProps) {
  const { general } = useSettingsStore()
  const { activeBranch } = usePosStore()
  const { formatCurrency } = useCurrency()
  
  if (!transaction) return null

  // Calculate totals for verification
  const grossTotal = transaction.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalItemDiscount = transaction.items.reduce((sum, item) => {
      const itemSubtotal = item.price * item.quantity
      return sum + (item.discountAmount || (item.discountPercentage ? (itemSubtotal * item.discountPercentage) / 100 : 0))
  }, 0)
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[80mm] w-full p-0 overflow-hidden sm:rounded-none bg-white text-black">
        <div className="p-4 space-y-4 max-h-[90vh] overflow-y-auto print:max-h-none" id="receipt-content">
            {/* Header */}
            <div className="text-center space-y-1">
                 {activeBranch?.logoUrl && (
                    <div className="flex justify-center mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={activeBranch.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                    </div>
                )}
                <h2 className="text-xl font-bold uppercase tracking-tight">{general?.hospitalName || "Hospital Name"}</h2>
                {activeBranch?.name && <p className="text-sm font-semibold">{activeBranch.name}</p>}
                <div className="text-[10px] leading-tight text-zinc-600 space-y-0.5">
                    <p>{general?.address || "Hospital Address"}</p>
                    <p>Ph: {general?.phone || "Phone"}, Email: {general?.email || "Email"}</p>
                </div>
            </div>

            <Separator className="border-black/20" />

            {/* Invoice Info */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                   <span className="text-zinc-500 block">Patient Details:</span>
                   <span className="font-bold block uppercase truncate">{transaction.customerName}</span>
                   {/* Add more patient info if available in transaction object */}
                </div>
                <div className="text-right">
                    <span className="text-zinc-500 block">Invoice #: <span className="text-black font-semibold">{transaction.id}</span></span>
                    <span className="text-zinc-500 block">Date: <span className="text-black font-semibold">{transaction.date}</span></span>
                    <span className="text-zinc-500 block">Mode: <span className="text-black font-semibold uppercase">{transaction.paymentMethod}</span></span>
                </div>
            </div>

            <Separator className="border-dashed border-black/20" />

            {/* Items Table */}
            <div className="space-y-1">
                <div className="grid grid-cols-12 text-[9px] font-bold border-b border-black/10 pb-1 mb-1">
                    <div className="col-span-5">ITEM</div>
                    <div className="col-span-2 text-center">QTY</div>
                    <div className="col-span-2 text-right">RATE</div>
                    <div className="col-span-3 text-right">AMT</div>
                </div>
                {transaction.items.map((item, idx) => {
                     const itemTotal = item.price * item.quantity
                     const itemDisc = item.discountAmount || (item.discountPercentage ? (itemTotal * item.discountPercentage) / 100 : 0)
                     const netItemTotal = itemTotal - itemDisc
                     
                     return (
                        <div key={idx} className="grid grid-cols-12 text-[10px] items-start leading-tight py-0.5">
                            <div className="col-span-5 pr-1">
                                <span className="block font-medium">{item.name}</span>
                                {item.batchNumber && <span className="block text-[8px] text-zinc-500">B: {item.batchNumber}</span>}
                            </div>
                            <div className="col-span-2 text-center">{item.quantity}</div>
                            <div className="col-span-2 text-right">{formatCurrency(item.price).replace(/[^0-9.]/g, '')}</div>
                            <div className="col-span-3 text-right font-medium">
                                {formatCurrency(netItemTotal)}
                            </div>
                        </div>
                    )
                })}
            </div>

            <Separator className="border-dashed border-black/20" />

            {/* Totals */}
            <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                    <span className="text-zinc-600">Gross Total</span>
                    <span>{formatCurrency(grossTotal)}</span>
                </div>
                {(totalItemDiscount > 0 || transaction.discount > 0) && (
                    <div className="flex justify-between text-zinc-600">
                         <span>Total Discount</span>
                         <span>-{formatCurrency(totalItemDiscount + transaction.discount)}</span>
                    </div>
                )}
                 {transaction.tax > 0 && (
                     <div className="flex justify-between text-zinc-600">
                         <span>VAT ({transaction.taxPercentage}%)</span>
                         <span>+{formatCurrency(transaction.tax)}</span>
                     </div>
                 )}
                 
                 <Separator className="border-black/10 my-1" />
                 
                 <div className="flex justify-between text-sm font-bold">
                     <span>Net Payable</span>
                     <span>{formatCurrency(transaction.total)}</span>
                 </div>
                 
                 <div className="flex justify-between pt-1">
                     <span className="text-zinc-600">Paid Amount</span>
                     <span className="font-bold">{formatCurrency(transaction.paidAmount || 0)}</span>
                 </div>
                 
                 {(transaction.dueAmount || 0) > 0 ? (
                      <div className="flex justify-between text-red-600 font-bold">
                         <span>Due Amount</span>
                         <span>{formatCurrency(transaction.dueAmount || 0)}</span>
                      </div>
                 ) : (
                     <div className="flex justify-between text-zinc-600">
                         <span>Change Return</span>
                         <span>{formatCurrency((transaction.paidAmount || 0) - transaction.total)}</span>
                     </div>
                 )}
            </div>
            
            <Separator className="border-black/20" />
            
            {/* Footer */}
            <div className="text-center text-[9px] text-zinc-500 space-y-2 pt-2">
                <p>Thank you for visiting {general?.hospitalName || "Hospital"}!</p>
                <p className="italic">Note: Medicines once sold cannot be returned without receipt.</p>
                <div className="pt-4 mt-4 border-t border-black/10 w-32 mx-auto">
                    Authorized Signatory
                </div>
            </div>
        </div>

        <DialogFooter className="p-4 bg-zinc-50 print:hidden flex-col gap-2">
          <Button className="w-full" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print Receipt
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
             Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
