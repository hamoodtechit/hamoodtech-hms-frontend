"use client"

import { useEffect } from "react"

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
import { useAuthStore } from "@/store/use-auth-store"
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
  
  const saleId = transaction?.id || (transaction as any)?.sale?.id || (transaction as any)?.data?.sale?.id
  const { data: saleRes, isLoading } = useSale(saleId || "")
  
  const fetchedData = (saleRes?.data as any)?.data?.sale || (saleRes?.data as any)?.sale || (saleRes?.data as any)?.data || saleRes?.data
  const data = fetchedData || transaction

  if (!transaction && !isLoading) return null
  if (!data && !isLoading) return null

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
  
  const ReceiptContent = ({ copyTitle, isPrinting = false }: { copyTitle?: string, isPrinting?: boolean }) => {
    const { user } = useAuthStore()
    const branch = (data as any)?.branch || activeBranch
    const branchLogo = branch?.logoUrl || activeBranch?.logoUrl || "/Logo.png"
    return (
    <div className={`p-2 ${isPrinting ? 'space-y-1' : 'space-y-3'} border-b border-black border-dashed pb-6 print:border-b-0 print:pb-0 relative`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', gap: '0' }} className="w-full">
             <div className="flex justify-center w-full" style={{ marginBottom: '2px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={branchLogo} alt="Logo" style={{ height: '65px', width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
              </div>
             {copyTitle && <div className="uppercase text-[9px] font-bold border border-black inline-block px-2 py-0.5 rounded-sm mb-1 leading-none">{copyTitle}</div>}
            <h2 style={{ margin: '0', padding: '0', fontSize: isPrinting ? '18px' : '22px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1', width: '100%' }}>{general?.hospitalName || branch?.name || "Hospital Name"}</h2>
            <div className={`uppercase ${isPrinting ? 'text-[9px] my-0.5' : 'text-xs my-1'} font-black tracking-[0.2em] text-black/60`}>Pharmacy</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', margin: '0', padding: '0', gap: '0' }}>
                <p style={{ margin: '0', padding: '0', fontWeight: 'bold', fontSize: isPrinting ? '8px' : '11px', lineHeight: '1.2' }}>{general?.address || branch?.address || "Hospital Address"}</p>
                <p style={{ margin: '0', padding: '0', fontWeight: 'bold', fontSize: isPrinting ? '8px' : '11px', lineHeight: '1.2' }}>Phone: {general?.phone || branch?.phone || "Phone"}</p>
            </div>
        </div>

        <Separator className="border-black/20" />

        {/* Info Grid */}
        <div className={`flex flex-col ${isPrinting ? 'text-[8px] gap-0.5 py-1' : 'text-xs gap-1 py-2'} font-semibold border-y border-black/20 leading-tight`}>
           <div className="flex justify-between">
                <span>Inv: {invoiceNumber}</span>
                <span>Type: OPD Patient</span>
           </div>
           <div className="flex justify-between">
                <span>Date: {new Date(date).toLocaleDateString('en-GB')}</span>
                <span>Time: {new Date(date).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}</span>
           </div>
        </div>

        <Separator className={isPrinting ? "border-black/40" : "border-black/20"} />

        {/* Items Table */}
        <div className={isPrinting ? 'space-y-0.5' : 'space-y-1'}>
            <div className={`grid grid-cols-12 ${isPrinting ? 'text-[7.5px] mt-0.5' : 'text-[10px] mt-1'} font-bold border-b border-black/40 pb-0.5 uppercase tracking-tighter`}>
                <div className="col-span-6">ITEM</div>
                <div className="col-span-2 text-center">QTY</div>
                <div className="col-span-2 text-right">RATE</div>
                <div className="col-span-2 text-right">AMT</div>
            </div>
            {normalizedItems.map((item: any, idx: number) => {
                 const itemTotal = item.price * item.quantity
                 const itemDisc = item.discountAmount || (item.discountPercentage ? (itemTotal * item.discountPercentage) / 100 : 0)
                 const netItemTotal = itemTotal - itemDisc
                 
                  return (
                    <div key={idx} className={`grid grid-cols-12 ${isPrinting ? 'text-[8.5px] py-0.5 leading-none' : 'text-xs py-1 leading-tight'} items-start`}>
                        <div className="col-span-6 pr-1">
                            <span className="block font-black text-black">
                                {item.name}
                                {item.dosageForm && <span className={`${isPrinting ? 'text-[7px]' : 'text-[9px]'} font-semibold ml-1 uppercase opacity-70`}>({item.dosageForm})</span>}
                            </span>
                        </div>
                        <div className="col-span-2 text-center font-semibold">{item.quantity}</div>
                        <div className="col-span-2 text-right font-semibold">{item.price.toFixed(2)}</div>
                        <div className="col-span-2 text-right font-black text-black">
                            {netItemTotal.toFixed(2)}
                        </div>
                    </div>
                )
            })}
        </div>

        <Separator className="border-dashed border-black/20" />

        {/* Totals Section */}
        <div className={`${isPrinting ? 'space-y-0.5 text-[8.5px] pt-0.5' : 'space-y-1 text-xs pt-1'} font-bold`}>
            <div className="flex">
                <span className={isPrinting ? "w-24" : "w-32"}>Gross Total</span>
                <span className="w-4">:</span>
                <span className="flex-1 text-right">{grossTotal.toFixed(2)} ৳</span>
            </div>
            {(totalItemDiscount > 0 || discountAmount > 0) && (
                <div className="flex">
                     <span className={isPrinting ? "w-24" : "w-32"}>Total Discount</span>
                     <span className="w-4">:</span>
                     <span className="flex-1 text-right">-{ (totalItemDiscount + discountAmount).toFixed(2) } ৳</span>
                </div>
            )}
            
            <Separator className={isPrinting ? "border-black/40 my-0.5" : "border-black/20 my-1"} />
            
             <div className={`flex ${isPrinting ? 'text-[9.5px]' : 'text-sm'} font-black text-black`}>
                 <span className={isPrinting ? "w-24" : "w-32"}>NET PAYABLE</span>
                 <span className="w-4">:</span>
                 <span className="flex-1 text-right">{(netTotal).toFixed(2)} ৳</span>
             </div>
             
             <div className="flex">
                 <span className={isPrinting ? "w-24" : "w-32"}>Paid Amount</span>
                 <span className="w-4">:</span>
                 <span className="flex-1 text-right">{(paidAmount).toFixed(2)} ৳</span>
             </div>
             
             {dueAmount > 0 ? (
                  <div className="flex">
                      <span className={isPrinting ? "w-24" : "w-32"}>Due Amount</span>
                      <span className="w-4">:</span>
                      <span className="flex-1 text-right">{(dueAmount).toFixed(2)} ৳</span>
                  </div>
             ) : (
                  <div className="flex">
                      <span className={isPrinting ? "w-24" : "w-32"}>Change Return</span>
                      <span className="w-4">:</span>
                      <span className="flex-1 text-right">{Math.max(0, paidAmount - netTotal).toFixed(2)} ৳</span>
                  </div>
             )}
        </div>
        
        <Separator className="border-black/20" />
        
        {/* Footer */}
        <div className={`text-center ${isPrinting ? 'text-[7.5px] space-y-0.5 pt-2 mt-2' : 'text-[10px] space-y-2 pt-4 mt-4'} text-black border-t-2 border-dashed border-black/20 uppercase`}>
            <p className="font-bold tracking-wider">THANK YOU FOR VISITING!</p>
            <p className="font-semibold leading-tight px-4 text-center">Medicines once sold cannot be<br />returned without the receipt.</p>
            <p className={`${isPrinting ? 'text-[6.5px] pt-1' : 'text-[10px] pt-2'} font-semibold lowercase opacity-50`}>Powered by Hamood Tech.</p>
        </div>
    </div>
  )}
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[72mm] w-full p-0 overflow-hidden sm:rounded-none bg-white text-black border-none shadow-none print:max-w-none print:w-[80mm] print:mx-auto">
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
                    <ReceiptContent />
                </>
            )}
        </div>

        <div className="p-4 bg-zinc-50 flex flex-col gap-2 border-t">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
            disabled={isLoading}
            onClick={() => {
              const branch = (data as any)?.branch || activeBranch;
              const branchLogo = branch?.logoUrl || activeBranch?.logoUrl || "/Logo.png";
              const hospitalName = general?.hospitalName || branch?.name || "Hospital Name";
              const address = general?.address || branch?.address || "Hospital Address";
              const phone = general?.phone || branch?.phone || "Phone";

              const rows = normalizedItems.map((item: any) => {
                const itemTotal = item.price * item.quantity;
                const itemDisc = item.discountAmount || (item.discountPercentage ? (itemTotal * item.discountPercentage) / 100 : 0);
                const netItemTotal = itemTotal - itemDisc;
                return `
                  <tr style="font-size: 12px; border-bottom: 1px solid #f0f0f0;">
                    <td style="text-align: left; font-weight: 900; padding: 4px 0; vertical-align: top;">
                      ${item.name} ${item.dosageForm ? `<span style="font-size: 10px; font-weight: normal; opacity: 0.8;">(${item.dosageForm})</span>` : ''}
                    </td>
                    <td style="text-align: center; vertical-align: top; padding-top: 4px;">${item.quantity}</td>
                    <td style="text-align: right; vertical-align: top; padding-top: 4px;">${item.price.toFixed(2)}</td>
                    <td style="text-align: right; vertical-align: top; padding-top: 4px; font-weight: 900;">${netItemTotal.toFixed(2)}</td>
                  </tr>
                `;
              }).join('');

              const printableHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        @page { size: 80mm auto; margin: 0; }
                        body { 
                            font-family: 'Courier New', Courier, monospace; 
                            width: 80mm; 
                            margin: 0; 
                            padding: 5mm; 
                            box-sizing: border-box;
                            color: black;
                            background: white;
                            line-height: 1.2;
                        }
                        .container { width: 100%; display: flex; flex-direction: column; align-items: center; }
                        .header { text-align: center; margin-bottom: 10px; width: 100%; }
                        .hospital-name { font-size: 18px; font-weight: 900; margin: 0; text-transform: uppercase; }
                        .pharmacy-tag { font-size: 11px; font-weight: 900; letter-spacing: 2px; color: #444; margin: 2px 0; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 2px 0; }
                        .contact-info { font-size: 10px; font-weight: bold; margin: 2px 0; }
                        .info-grid { width: 100%; border-top: 1px solid black; border-bottom: 1px solid black; padding: 5px 0; margin-top: 5px; font-size: 11px; font-weight: bold; }
                        .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
                        .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        .items-table th { font-size: 10px; border-bottom: 2px solid black; padding-bottom: 2px; text-align: left; }
                        .totals-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-weight: 900; font-size: 13px; }
                        .totals-table td { padding: 2px 0; }
                        .footer { text-align: center; margin-top: 15px; border-top: 1px dashed black; padding-top: 10px; font-size: 10px; text-transform: uppercase; }
                        .separator { border-top: 1px dashed #ccc; margin: 5px 0; }
                        .label-col { width: 50%; }
                        .colon-col { width: 15px; text-align: center; }
                        .value-col { text-align: right; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <img src="${branchLogo}" style="height: 60px; margin-bottom: 5px;">
                            <h1 class="hospital-name">${hospitalName}</h1>
                            <div class="pharmacy-tag">PHARMACY</div>
                            <div class="contact-info">${address}</div>
                            <div class="contact-info">Phone: ${phone}</div>
                        </div>

                        <div class="info-grid">
                            <div class="info-row">
                                <span>Inv: ${invoiceNumber}</span>
                                <span>Type: OPD Patient</span>
                            </div>
                            <div class="info-row">
                                <span>Date: ${new Date(date).toLocaleDateString('en-GB')}</span>
                                <span>Time: ${new Date(date).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>

                        <table class="items-table">
                            <thead>
                                <tr>
                                    <th style="width: 50%;">ITEM</th>
                                    <th style="width: 10%; text-align: center;">QTY</th>
                                    <th style="width: 20%; text-align: right;">RATE</th>
                                    <th style="width: 20%; text-align: right;">AMT</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows}
                            </tbody>
                        </table>

                        <div style="border-top: 1px dashed black; margin-top: 5px;"></div>

                        <table class="totals-table">
                            <tr>
                                <td class="label-col">Gross Total</td>
                                <td class="colon-col">:</td>
                                <td class="value-col">${grossTotal.toFixed(2)} ৳</td>
                            </tr>
                            ${(totalItemDiscount + discountAmount) > 0 ? `
                            <tr>
                                <td class="label-col">Total Discount</td>
                                <td class="colon-col">:</td>
                                <td class="value-col">-${(totalItemDiscount + discountAmount).toFixed(2)} ৳</td>
                            </tr>` : ''}
                            <tr><td colspan="3" style="border-top: 1px dashed black; padding: 2px 0;"></td></tr>
                            <tr style="font-size: 15px; color: black;">
                                <td class="label-col">NET PAYABLE</td>
                                <td class="colon-col">:</td>
                                <td class="value-col">${netTotal.toFixed(2)} ৳</td>
                            </tr>
                            <tr>
                                <td class="label-col">Paid Amount</td>
                                <td class="colon-col">:</td>
                                <td class="value-col">${paidAmount.toFixed(2)} ৳</td>
                            </tr>
                            ${dueAmount > 0 ? `
                            <tr>
                                <td class="label-col">Due Amount</td>
                                <td class="colon-col">:</td>
                                <td class="value-col">${dueAmount.toFixed(2)} ৳</td>
                            </tr>` : `
                            <tr>
                                <td class="label-col">Change Return</td>
                                <td class="colon-col">:</td>
                                <td class="value-col">${Math.max(0, paidAmount - netTotal).toFixed(2)} ৳</td>
                            </tr>`}
                        </table>

                        <div class="footer">
                            <p style="font-weight: 900; margin-bottom: 5px;">THANK YOU FOR VISITING!</p>
                            <p style="font-weight: bold; line-height: 1.4;">Medicines once sold cannot be<br>returned without the receipt.</p>
                            <p style="margin-top: 10px; opacity: 0.6; text-transform: lowercase;">Powered by Hamood Tech.</p>
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
                  iframeDoc.write(printableHtml);
                  iframeDoc.close();
                  
                  setTimeout(() => {
                      iframe.contentWindow?.focus();
                      iframe.contentWindow?.print();
                      setTimeout(() => {
                          document.body.removeChild(iframe);
                      }, 1000);
                  }, 500);
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
