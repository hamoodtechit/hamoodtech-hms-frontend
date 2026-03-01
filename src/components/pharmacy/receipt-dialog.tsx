"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

  // Normalize data between POS Transaction and API Sale
  const items = (transaction as any).saleItems || transaction.items || []
  const normalizedItems = items.map((item: any) => ({
    name: item.itemName || item.name || "Unknown Item",
    quantity: Number(item.quantity || 0),
    price: Number(item.price || 0),
    dosageForm: item.dosageForm,
    batchNumber: item.batchNumber,
    discountAmount: Number(item.discountAmount || 0),
    discountPercentage: Number(item.discountPercentage || 0)
  }))

  const grossTotal = normalizedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
  const totalItemDiscount = normalizedItems.reduce((sum: number, item: any) => {
      const itemSubtotal = item.price * item.quantity
      return sum + (item.discountAmount || (item.discountPercentage ? (itemSubtotal * item.discountPercentage) / 100 : 0))
  }, 0)

  const netTotal = Number((transaction as any).netPrice || transaction.total || 0)
  const paidAmount = Number(transaction.paidAmount || 0)
  const dueAmount = Number(transaction.dueAmount || 0)
  const taxAmount = Number((transaction as any).taxAmount || transaction.tax || 0)
  const discountAmount = Number((transaction as any).discountAmount || transaction.discount || 0)
  const taxPercentage = Number(transaction.taxPercentage || 0)
  const invoiceNumber = transaction.invoiceNumber || (transaction as any).number || "N/A"
  const date = transaction.date || (transaction as any).createdAt || new Date().toISOString()
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[72mm] w-full p-0 overflow-hidden sm:rounded-none bg-white text-black border-none shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>
        {/* Global style for printing to remove headers/footers */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { 
              margin: 0 !important;
              size: auto;
            }
            html, body { 
              margin: 0 !important; 
              padding: 0 !important; 
              background: white !important;
            }
            /* Hide absolute everything except the receipt */
            body > *:not([data-slot="dialog-portal"]),
            [data-slot="dialog-overlay"],
            [data-slot="dialog-close"],
            .print\\:hidden { 
              display: none !important; 
            }
            [data-slot="dialog-portal"] {
              position: static !important;
            }
            [data-slot="dialog-content"] {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              transform: none !important;
              width: 100% !important;
              max-width: none !important;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
              display: block !important;
              visibility: visible !important;
            }
            #receipt-content {
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-height: none !important;
              overflow: visible !important;
              display: block !important;
              visibility: visible !important;
            }
          }
        `}} />
        <div className="p-2 space-y-3 max-h-[60vh] overflow-y-auto print:max-h-none print:p-0" id="receipt-content">
            <div className="text-center space-y-0.5">
                 {activeBranch?.logoUrl && (
                    <div className="flex justify-center mb-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={activeBranch.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
                    </div>
                )}
                <h2 className="text-sm font-bold uppercase tracking-tight leading-tight">{general?.hospitalName || "Hospital Name"}</h2>
                {activeBranch?.name && <p className="text-[12px] font-bold">{activeBranch.name}</p>}
                <div className="text-[10px] leading-tight text-black space-y-0.5 font-semibold">
                    <p>{general?.address || "Hospital Address"}</p>
                    <p>Ph: {general?.phone || "Phone"}</p>
                </div>
            </div>

            <Separator className="border-black/20" />

            {/* Patient Details */}
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold border-y border-black/20 py-1 leading-tight">
                <div className="space-y-0.5">
                    <p className="text-black uppercase text-[8px] font-semibold">Patient Details:</p>
                    <p className="font-bold">{transaction.customerName || (transaction as any).patient?.name || "Walk-in"}</p>
                </div>
                <div className="text-right space-y-0.5">
                    <p className="font-bold">Invoice #: {invoiceNumber}</p>
                    <p className="font-bold">Date: {new Date(date).toLocaleString([], { hour12: true, dateStyle: 'short', timeStyle: 'short' })}</p>
                    <p className="font-bold uppercase">Mode: {transaction.paymentMethod}</p>
                </div>
            </div>

            <Separator className="border-dashed border-black/20" />

            {/* Items Table */}
            <div className="space-y-1">
                <div className="grid grid-cols-12 text-[10px] font-bold border-b border-black/40 pb-0.5">
                    <div className="col-span-6">ITEM</div>
                    <div className="col-span-1 text-center">QTY</div>
                    <div className="col-span-2 text-right">RATE</div>
                    <div className="col-span-3 text-right">AMT</div>
                </div>
                {normalizedItems.map((item: any, idx: number) => {
                     const itemTotal = item.price * item.quantity
                     const itemDisc = item.discountAmount || (item.discountPercentage ? (itemTotal * item.discountPercentage) / 100 : 0)
                     const netItemTotal = itemTotal - itemDisc
                     
                      return (
                        <div key={idx} className="grid grid-cols-12 text-[10px] items-start leading-tight py-0.5 font-semibold">
                            <div className="col-span-6 pr-1">
                                <span className="block font-bold">
                                    {item.name}
                                    {item.dosageForm && <span className="text-[8px] font-normal ml-1">({item.dosageForm})</span>}
                                    {item.batchNumber && <span className="block text-[8px] font-normal text-muted-foreground italic">B: {item.batchNumber}</span>}
                                </span>
                            </div>
                            <div className="col-span-1 text-center">{item.quantity}</div>
                            <div className="col-span-2 text-right">{item.price.toFixed(2)}</div>
                            <div className="col-span-3 text-right font-bold">
                                {netItemTotal.toFixed(2)}
                            </div>
                        </div>
                    )
                })}
            </div>

            <Separator className="border-dashed border-black/20" />

            {/* Totals */}
            <div className="space-y-1 text-[11px] font-bold">
                <div className="flex justify-between">
                    <span className="text-black">Gross Total</span>
                    <span>{formatCurrency(grossTotal)}</span>
                </div>
                {(totalItemDiscount > 0 || discountAmount > 0) && (
                    <div className="flex justify-between text-black">
                         <span>Total Discount</span>
                         <span>-{formatCurrency(totalItemDiscount + discountAmount)}</span>
                    </div>
                )}
                {taxAmount > 0 && (
                    <div className="flex justify-between text-black">
                        <span>VAT ({taxPercentage}%)</span>
                        <span>+{formatCurrency(taxAmount)}</span>
                    </div>
                )}
                 
                 <Separator className="border-black/30 my-1" />
                 
                 <div className="flex justify-between text-sm font-bold border-y border-black/40 py-1">
                     <span>Net Payable</span>
                     <span>{formatCurrency(netTotal)}</span>
                 </div>
                 
                 <div className="flex justify-between pt-1 font-bold">
                     <span className="text-black">Paid Amount</span>
                     <span>{formatCurrency(paidAmount)}</span>
                 </div>
                 
                 {dueAmount > 0 ? (
                      <div className="flex justify-between text-black font-bold">
                         <span>Due Amount</span>
                         <span>{formatCurrency(dueAmount)}</span>
                      </div>
                 ) : (
                      <div className="flex justify-between text-black">
                         <span>Change Return</span>
                         <span>{formatCurrency(Math.max(0, paidAmount - netTotal))}</span>
                      </div>
                 )}
            </div>
            
            <Separator className="border-black/20" />
            
            {/* Footer */}
            <div className="text-center text-[10px] text-black space-y-1.5 pt-2 font-semibold">
                <p>Thank you for visiting {general?.hospitalName || "Hospital"}!</p>
                <p className="italic font-bold">Note: Medicines once sold cannot be returned without receipt.</p>
                <div className="pt-6 mt-4 border-t border-black/30 w-44 mx-auto font-bold uppercase tracking-wider text-[11px]">
                    Authorized Signatory
                </div>
            </div>
        </div>

        <div className="p-4 bg-zinc-50 print:hidden flex flex-col gap-2 border-t">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print Receipt
          </Button>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
             Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
