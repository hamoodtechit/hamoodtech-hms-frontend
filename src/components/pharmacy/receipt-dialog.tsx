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
        {/* No global print styles needed as we use an isolated iframe */}
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

        <div className="p-4 bg-zinc-50 flex flex-col gap-2 border-t">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
              const logoHtml = activeBranch?.logoUrl 
                  ? `<div class="text-center" style="margin-bottom: 5px;">
                         <img src="${activeBranch.logoUrl}" alt="Logo" style="max-height: 40px; width: auto; object-fit: contain; margin: 0 auto;" />
                     </div>`
                  : '';
                  
              const printContent = `
                  <!DOCTYPE html>
                  <html>
                      <head>
                          <meta charset="UTF-8">
                          <title>Receipt ${invoiceNumber}</title>
                          <style>
                              @page { margin: 0; }
                              body { 
                                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; 
                                  width: 100%; 
                                  max-width: 100%;
                                  margin: 0; 
                                  padding: 5mm; 
                                  color: black; 
                                  background: white;
                                  font-size: 11px; 
                                  line-height: 1.3;
                                  box-sizing: border-box;
                              }
                              .text-center { text-align: center; }
                              .text-right { text-align: right; }
                              .bold { font-weight: bold; }
                              .uppercase { text-transform: uppercase; }
                              .separator { border-top: 1px solid #e5e7eb; margin: 8px 0; }
                              .separator-dashed { border-top: 1px dashed #e5e7eb; margin: 8px 0; }
                              .header h2 { font-size: 16px; margin: 0; }
                              .header p { font-size: 10px; margin: 2px 0; color: #4b5563; }
                              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; }
                              .items-table { width: 100%; border-collapse: collapse; }
                              .items-header { border-bottom: 1px solid #e5e7eb; font-weight: bold; font-size: 9px; }
                              .items-header td { padding-bottom: 4px; }
                              .item-row td { padding: 4px 0; vertical-align: top; }
                              .totals-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                              .paid-row { font-weight: bold; margin-top: 4px; }
                              .footer { margin-top: 15px; text-align: center; font-size: 9px; color: #6b7280; }
                          </style>
                      </head>
                      <body>
                          ${logoHtml}
                          <div class="header text-center">
                              <h2 class="bold uppercase">${general?.hospitalName || "Hospital"}</h2>
                              <p class="bold">${activeBranch?.name || 'Main Branch'}</p>
                              <p>${general?.address || "Hospital Address"}</p>
                          </div>

                          <div class="separator"></div>

                          <div class="info-grid">
                              <div>
                                  <span style="color:#6b7280">Patient:</span><br/>
                                  <span class="bold uppercase">${transaction.customerName || (transaction as any).patient?.name || 'Walk-in'}</span>
                              </div>
                              <div class="text-right">
                                  <span style="color:#6b7280">Invoice #:</span> <span class="bold">${invoiceNumber}</span><br/>
                                  <span style="color:#6b7280">Date:</span> <span class="bold">${new Date(date).toLocaleDateString()}</span>
                              </div>
                          </div>

                          <div class="separator-dashed"></div>

                          <table class="items-table">
                              <thead>
                                  <tr class="items-header uppercase">
                                      <td style="width:50%">Item</td>
                                      <td class="text-center" style="width:15%">Qty</td>
                                      <td class="text-right" style="width:15%">Rate</td>
                                      <td class="text-right" style="width:20%">Amt</td>
                                  </tr>
                              </thead>
                              <tbody>
                                  ${normalizedItems.map((item: any) => {
                                      const itemTotal = item.price * item.quantity;
                                      const itemDisc = item.discountAmount || (item.discountPercentage ? (itemTotal * item.discountPercentage) / 100 : 0);
                                      const netItemTotal = itemTotal - itemDisc;
                                      
                                      let dosageHtml = '';
                                      if (item.dosageForm) {
                                          dosageHtml = `<span style="font-size:8px; color:#6b7280"> (${item.dosageForm})</span>`;
                                      }
                                      
                                      let batchHtml = '';
                                      if (item.batchNumber) {
                                          batchHtml = `<br/><span style="font-size:7px; color:#9ca3af">B: ${item.batchNumber}</span>`;
                                      }
                                      
                                      return `
                                          <tr class="item-row">
                                              <td>
                                                  <span class="bold">${item.name}</span>
                                                  ${dosageHtml}
                                                  ${batchHtml}
                                              </td>
                                              <td class="text-center">${item.quantity}</td>
                                              <td class="text-right">${Number(item.price).toFixed(2)}</td>
                                              <td class="text-right bold">${formatCurrency(netItemTotal)}</td>
                                          </tr>
                                      `;
                                  }).join('')}
                              </tbody>
                          </table>

                          <div class="separator"></div>

                          <div class="totals-section">
                              <div class="totals-row">
                                  <span>Gross Total</span>
                                  <span>${formatCurrency(grossTotal)}</span>
                              </div>
                              ${(totalItemDiscount > 0 || discountAmount > 0) ? `
                                  <div class="totals-row" style="color:#4b5563">
                                      <span>Total Discount</span>
                                      <span>-${formatCurrency(totalItemDiscount + discountAmount)}</span>
                                  </div>
                              ` : ''}
                              ${taxAmount > 0 ? `
                                  <div class="totals-row" style="color:#4b5563">
                                      <span>VAT (${taxPercentage}%)</span>
                                      <span>+${formatCurrency(taxAmount)}</span>
                                  </div>
                              ` : ''}
                              
                              <div class="separator" style="margin:4px 0"></div>
                              
                              <div class="totals-row bold" style="font-size:12px">
                                  <span>Net Payable</span>
                                  <span>${formatCurrency(netTotal)}</span>
                              </div>
                              
                              <div class="totals-row paid-row">
                                  <span>Paid Amount</span>
                                  <span>${formatCurrency(paidAmount)}</span>
                              </div>

                              ${dueAmount > 0 ? `
                                  <div class="totals-row bold" style="color:#dc2626">
                                      <span>Due Amount</span>
                                      <span>${formatCurrency(dueAmount)}</span>
                                  </div>
                              ` : `
                                  <div class="totals-row" style="color:#4b5563">
                                      <span>Change Return</span>
                                      <span>${formatCurrency(Math.max(0, paidAmount - netTotal))}</span>
                                  </div>
                              `}
                          </div>

                          <div class="footer">
                              <p>Thank you for visiting ${general?.hospitalName || "Hospital"}!</p>
                              <p>Note: Medicines once sold cannot be returned without receipt.</p>
                              <div style="margin-top:20px; border-top:1px solid #e5e7eb; padding-top:5px; width:100px; margin-left:auto; margin-right:auto;">
                                  Authorized Signatory
                              </div>
                          </div>
                      </body>
                  </html>
              `;

              const iframe = document.createElement('iframe');
              iframe.style.cssText = 'position:fixed; width:100vw; height:100vh; left:-100vw; top:-100vh; border:none;';
              document.body.appendChild(iframe);

              const iframeDoc = iframe.contentWindow?.document;
              if (iframeDoc) {
                  iframeDoc.open();
                  iframeDoc.write(printContent);
                  iframeDoc.close();
                  
                  setTimeout(() => {
                      iframe.contentWindow?.focus();
                      iframe.contentWindow?.print();
                      setTimeout(() => {
                          document.body.removeChild(iframe);
                      }, 1000);
                  }, 800); // Wait 800ms for images to load
              } else {
                  // Fallback for strict browsers
                  const win = window.open('', '_blank', 'width=450,height=600');
                  if (win) {
                      win.document.write(printContent);
                      win.document.close();
                      setTimeout(() => {
                          win.print();
                          win.close();
                      }, 800);
                  }
              }
          }}>
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
