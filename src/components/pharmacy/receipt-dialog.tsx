"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useSale } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { Transaction, usePosStore } from "@/store/use-pos-store"
import { useSettingsStore } from "@/store/use-settings-store"
import { Loader2, Printer } from "lucide-react"

interface ReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
}

export function ReceiptDialog({ open, onOpenChange, transaction }: ReceiptDialogProps) {
  const { general } = useSettingsStore()
  const { activeBranch } = usePosStore()
  const { formatCurrency } = useCurrency()
  
  // Get sale ID - transaction might be the sale itself or have a nested sale object
  const saleId = transaction?.id || (transaction as any)?.sale?.id || (transaction as any)?.data?.sale?.id
  
  // Use useSale hook to get full details (branch, patient, doctor etc.)
  const { data: saleRes, isLoading } = useSale(saleId || "")
  
  if (!transaction && !isLoading) return null
  
  // Combine initial/prop data with fetched rich data
  const data = saleRes?.data || transaction
  if (!data && !isLoading) return null

  // Normalize data between POS Transaction and API Sale
  const items = (data as any)?.saleItems || (data as any)?.items || []
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

  const netTotal = Number((data as any)?.netPrice || (data as any)?.total || 0)
  const paidAmount = Number((data as any)?.paidAmount || 0)
  const dueAmount = Number((data as any)?.dueAmount || 0)
  const taxAmount = Number((data as any)?.taxAmount || (data as any)?.tax || 0)
  const discountAmount = Number((data as any)?.discountAmount || (data as any)?.discount || 0)
  const taxPercentage = Number((data as any)?.taxPercentage || 0)
  const invoiceNumber = (data as any)?.invoiceNumber || (data as any)?.number || "N/A"
  const date = (data as any)?.date || (data as any)?.createdAt || new Date().toISOString()
  
  const ReceiptContent = ({ copyTitle }: { copyTitle: string }) => {
    const branch = (data as any)?.branch || activeBranch
    return (
    <div className="p-2 space-y-3 border-b border-black border-dashed pb-6 print:border-b-0 print:pb-0">
        <div className="text-center space-y-0.5">
             {branch?.logoUrl && (
                <div className="flex justify-center mb-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={branch.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
                </div>
            )}
            <div className="uppercase text-[9px] font-bold border border-black inline-block px-2 py-0.5 rounded-sm mb-1">{copyTitle}</div>
            <h2 className="text-sm font-bold uppercase tracking-tight leading-tight">{branch?.name || general?.hospitalName || "Hospital Name"}</h2>
            <div className="text-[10px] leading-tight text-black space-y-0.5 font-semibold">
                <p>{branch?.address || general?.address || "Hospital Address"}</p>
                <p>Ph: {branch?.phone || general?.phone || "Phone"}</p>
            </div>
        </div>

        <Separator className="border-black/20" />

        {/* Patient Details */}
        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold border-y border-black/20 py-1 leading-tight">
            <div className="space-y-0.5">
                <p className="text-black uppercase text-[8px] font-semibold">Patient Details:</p>
                <p className="font-bold">{(data as any)?.customerName || (data as any)?.patient?.name || "Walk-in"}</p>
            </div>
            <div className="text-right space-y-0.5">
                <p className="font-bold">Invoice #: {invoiceNumber}</p>
                <p className="font-bold">Date: {new Date(date).toLocaleString([], { hour12: true, dateStyle: 'short', timeStyle: 'short' })}</p>
                <p className="font-bold uppercase">Mode: {(data as any)?.paymentMethod}</p>
            </div>
        </div>

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
             
             <div className="flex justify-between text-sm font-bold border-y border-black/40 py-1 my-1">
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
            <p>Thank you for visiting {branch?.name || general?.hospitalName || "Hospital"}!</p>
            <p className="italic font-bold text-[9px]">Note: Medicines once sold cannot be returned without receipt.</p>
            <div className="pt-4 mt-2 border-t border-black/30 w-32 mx-auto font-bold uppercase tracking-wider text-[9px]">
                Authorized Signatory
            </div>
        </div>
    </div>
  )}
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[72mm] w-full p-0 overflow-hidden sm:rounded-none bg-white text-black border-none shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="p-0 max-h-[85vh] overflow-y-auto print:max-h-none print:p-0 flex flex-col bg-white" id="receipt-content">
            {isLoading ? (
                <div className="h-40 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <ReceiptContent copyTitle="OFFICE COPY" />
                    <div style={{ height: "40px" }} className="print:block shrink-0"></div>
                    <ReceiptContent copyTitle="CUSTOMER COPY" />
                </>
            )}
        </div>

        <div className="p-4 bg-zinc-50 flex flex-col gap-2 border-t">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
            disabled={isLoading}
            onClick={() => {
              const printContent = document.getElementById('receipt-content')?.innerHTML;
              if (!printContent) return;

              const iframe = document.createElement('iframe');
              iframe.style.cssText = 'position:fixed; width:100vw; height:100vh; left:-100vw; top:-100vh; border:none;';
              document.body.appendChild(iframe);

              const iframeDoc = iframe.contentWindow?.document;
              if (iframeDoc) {
                  iframeDoc.open();
                  iframeDoc.write(`
                      <!DOCTYPE html>
                      <html>
                          <head>
                              <meta charset="UTF-8">
                              <title>Print Receipt</title>
                              <style>
                                  @page { 
                                      size: 80mm auto; 
                                      margin: 0; 
                                  }
                                  body { 
                                      font-family: Arial, sans-serif; 
                                      -webkit-print-color-adjust: exact; 
                                      print-color-adjust: exact;
                                      margin: 0;
                                      padding: 0;
                                      display: flex;
                                      flex-direction: column;
                                      align-items: center;
                                      width: 72mm;
                                      background: white;
                                  }
                                  #receipt-print {
                                      width: 100%;
                                      max-width: 72mm;
                                      padding: 2mm;
                                      box-sizing: border-box;
                                  }
                                  /* Reset styles for thermal printing */
                                  .border { border: 1px solid black !important; }
                                  .border-dashed { border-style: dashed !important; border-width: 1px !important; }
                                  .border-black { border-color: black !important; }
                                  .text-center { text-align: center !important; }
                                  .text-right { text-align: right !important; }
                                  .font-bold { font-weight: 700 !important; }
                                  .flex { display: flex !important; }
                                  .justify-between { justify-content: space-between !important; }
                                  .uppercase { text-transform: uppercase !important; }
                                  .grid { display: grid !important; }
                                  .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                                  .grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)) !important; }
                                  .col-span-6 { grid-column: span 6 / span 6 !important; }
                                  .col-span-1 { grid-column: span 1 / span 1 !important; }
                                  .col-span-2 { grid-column: span 2 / span 2 !important; }
                                  .col-span-3 { grid-column: span 3 / span 3 !important; }
                                  .space-y-0\\.5 > * + * { margin-top: 0.125rem !important; }
                                  .space-y-1 > * + * { margin-top: 0.25rem !important; }
                                  .space-y-3 > * + * { margin-top: 0.75rem !important; }
                                  .mb-1 { margin-bottom: 0.25rem !important; }
                                  .pb-6 { padding-bottom: 1.5rem !important; }
                                  .w-full { width: 100% !important; }
                              </style>
                          </head>
                          <body>
                              <div id="receipt-print">
                                  ${printContent}
                              </div>
                          </body>
                      </html>
                  `);
                  iframeDoc.close();
                  
                  setTimeout(() => {
                      iframe.contentWindow?.focus();
                      iframe.contentWindow?.print();
                      setTimeout(() => {
                          document.body.removeChild(iframe);
                      }, 1000);
                  }, 800);
              }
            }}
          >
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
