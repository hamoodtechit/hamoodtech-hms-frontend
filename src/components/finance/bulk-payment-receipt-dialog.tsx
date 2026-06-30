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
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { useAuthStore } from "@/store/use-auth-store"
import { Printer } from "lucide-react"

interface BulkPaymentReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: any
  patientName: string
  patientUhid?: string
}

export function BulkPaymentReceiptDialog({ open, onOpenChange, data, patientName, patientUhid }: BulkPaymentReceiptDialogProps) {
  const { stores, activeStoreId } = useStoreContext()
  const { general } = useSettingsStore()
  const { formatCurrency } = useCurrency()
  const { user } = useAuthStore()
  const activeBranch = stores.find(s => s.id === activeStoreId) || stores[0]

  if (!data) return null

  const paymentData = data.data || data
  const paidSales = paymentData.paidSales || []
  
  const firstPatient = paidSales[0]?.patient
  const derivedPatientUhid = patientUhid && patientUhid !== "N/A" ? patientUhid : (firstPatient?.uhid || firstPatient?.patientNumber || "N/A")
  const derivedPatientName = patientName && patientName !== "N/A" ? patientName : (firstPatient?.name || "N/A")

  const totalPaid = paidSales.reduce((sum: number, sale: any) => sum + Number(sale.paidAmount || 0), 0)
  const date = new Date().toISOString()
  const branchLogo = activeBranch?.logoUrl || "/Logo.png"
  const hospitalName = general?.hospitalName || activeBranch?.name || "Hospital Name"
  const address = general?.address || activeBranch?.address || "Hospital Address"
  const phone = general?.phone || activeBranch?.phone || "Phone"
  const email = general?.email || activeBranch?.email || ""

  const ReceiptContent = ({ isPrinting = false }: { isPrinting?: boolean }) => {
    return (
    <div className={`p-2 ${isPrinting ? 'space-y-1' : 'space-y-3'} pb-6 print:pb-0 relative`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', gap: '0' }} className="w-full">
             <div className="flex justify-center w-full" style={{ marginBottom: '2px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={branchLogo} alt="Logo" style={{ height: '65px', width: 'auto', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
              </div>
            <h2 style={{ margin: '0', padding: '0', fontSize: isPrinting ? '18px' : '22px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1', width: '100%' }}>{hospitalName}</h2>
            <div className={`uppercase ${isPrinting ? 'text-[9px] my-0.5' : 'text-xs my-1'} font-black tracking-[0.2em] text-black/60`}>Bulk Payment Receipt</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', margin: '0', padding: '0', gap: '0' }}>
                <p style={{ margin: '0', padding: '0', fontWeight: 'bold', fontSize: isPrinting ? '8px' : '11px', lineHeight: '1.2' }}>{address}</p>
                <p style={{ margin: '0', padding: '0', fontWeight: 'bold', fontSize: isPrinting ? '8px' : '11px', lineHeight: '1.2' }}>Phone: {phone}</p>
                {email && (
                    <p style={{ margin: '0', padding: '0', fontWeight: 'bold', fontSize: isPrinting ? '8px' : '11px', lineHeight: '1.2' }}>Email: {email}</p>
                )}
            </div>
        </div>

        <Separator className="border-black/20" />

        {/* Info Grid */}
        <div className={`flex flex-col ${isPrinting ? 'text-[8px] gap-0.5 py-1' : 'text-xs gap-1 py-2'} font-semibold border-y border-black/20 leading-tight`}>
           <div className="flex justify-between">
                <span>UHID: {derivedPatientUhid}</span>
           </div>
           <div className="flex justify-between">
                <span>Patient: {derivedPatientName}</span>
                <span>Date: {new Date(date).toLocaleDateString('en-GB')}</span>
           </div>
           <div className="flex justify-between">
                <span>Time: {new Date(date).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}</span>
           </div>
        </div>

        <Separator className={isPrinting ? "border-black/40" : "border-black/20"} />

        {/* Items Table */}
        <div className={isPrinting ? 'space-y-0.5' : 'space-y-1'}>
            <div className={`grid grid-cols-12 ${isPrinting ? 'text-[7.5px] mt-0.5' : 'text-[10px] mt-1'} font-bold border-b border-black/40 pb-0.5 uppercase tracking-tighter`}>
                <div className="col-span-8">INVOICE & ITEMS</div>
                <div className="col-span-4 text-right">AMT PAID</div>
            </div>
            {paidSales.map((sale: any, idx: number) => {
                  return (
                    <div key={idx} className={`grid grid-cols-12 ${isPrinting ? 'text-[8.5px] py-0.5 leading-none' : 'text-xs py-1 leading-tight'} items-start`}>
                        <div className="col-span-8 pr-1">
                            <span className={`block font-black text-black ${isPrinting ? 'text-[10.5px]' : 'text-sm'}`}>{sale.invoiceNumber}</span>
                            {sale.saleItems && sale.saleItems.length > 0 && (
                                <span className={`block ${isPrinting ? 'text-[6.5px]' : 'text-[9px]'} font-black text-black uppercase leading-tight`}>
                                    {sale.saleItems.map((item: any) => item.itemName).join(', ')}
                                </span>
                            )}
                        </div>
                        <div className="col-span-4 text-right font-black text-black">
                            {Number(sale.paidAmount).toFixed(2)}
                        </div>
                    </div>
                )
            })}
        </div>

        <Separator className="border-dashed border-black/20" />

        {/* Totals Section */}
        <div className={`${isPrinting ? 'space-y-0.5 text-[8.5px] pt-0.5' : 'space-y-1 text-xs pt-1'} font-bold`}>
             <div className="flex">
                 <span className={isPrinting ? "w-24" : "w-32"}>Total Paid</span>
                 <span className="w-4">:</span>
                 <span className="flex-1 text-right">{totalPaid.toFixed(2)} ৳</span>
             </div>
             
             {paymentData.newPatientBalance !== undefined && (
                  <div className="flex">
                      <span className={isPrinting ? "w-24" : "w-32"}>New Balance</span>
                      <span className="w-4">:</span>
                      <span className="flex-1 text-right">{Number(paymentData.newPatientBalance).toFixed(2)} ৳</span>
                  </div>
             )}
        </div>
        
        <Separator className="border-black/20" />
        
        {/* Payment Note Section */}
        {paymentData.note && (
            <div className={`mt-1 p-1 bg-gray-50 border border-black border-dotted flex gap-1.5 items-start ${isPrinting ? 'mx-1' : ''}`}>
                <span className="shrink-0 uppercase text-[8px] font-black text-black mt-0.5">Note:</span>
                <span className={`italic font-black text-black uppercase leading-tight ${isPrinting ? 'text-[9px]' : 'text-[11px]'}`}>
                    {paymentData.note}
                </span>
            </div>
        )}

        {/* Footer */}
        <div className={`text-center ${isPrinting ? 'text-[7.5px] space-y-0.5 pt-2 mt-2' : 'text-[10px] space-y-2 pt-4 mt-4'} text-black border-t-2 border-dashed border-black/20 uppercase`}>
            <div className={`flex justify-between items-center mb-2 text-left ${isPrinting ? 'text-[8px]' : 'text-xs'}`}>
                <span className="font-black">Billing By: {paymentData.createdBy || user?.fullName || user?.username || "Staff"}</span>
            </div>
            <p className="font-black tracking-wider">THANK YOU FOR VISITING!</p>
            <p className={`${isPrinting ? 'text-[7px] pt-1' : 'text-[10px] pt-2'} font-black text-black normal-case`}>*Powered by HamoodTech.</p>
        </div>
    </div>
  )}

  const handlePrint = () => {
    const rows = paidSales.map((sale: any) => {
        const itemsList = sale.saleItems && sale.saleItems.length > 0 
            ? sale.saleItems.map((item: any) => item.itemName).join(', ')
            : '';
        return `
            <tr style="font-size: 9.5px; border-bottom: 1px dashed #e0e0e0;">
            <td style="text-align: left; font-weight: 900; padding: 3px 0; vertical-align: top; line-height: 1.1; width: 70%;">
                <span style="font-size: 11.5px; display: block;">${sale.invoiceNumber}</span>
                ${itemsList ? `<span style="font-size: 7.5px; font-weight: 900; color: black; text-transform: uppercase;">${itemsList}</span>` : ''}
            </td>
            <td style="text-align: right; vertical-align: top; padding-top: 3px; font-weight: 900; color: black; font-size: 9.5px; width: 30%;">${Number(sale.paidAmount).toFixed(2)}</td>
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
                    <div class="pharmacy-tag">BULK PAYMENT</div>
                        <div class="contact-info">${address}</div>
                        <div class="contact-info">Phone: ${phone}</div>
                        ${email ? `<div class="contact-info">Email: ${email}</div>` : ''}
                </div>

                <div class="info-grid">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                        <span>UHID: ${derivedPatientUhid}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                        <span>Patient: ${derivedPatientName}</span>
                        <span>Date: ${new Date(date).toLocaleDateString('en-GB')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Time: ${new Date(date).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 70%;">INVOICE & ITEMS</th>
                            <th style="width: 30%; text-align: right;">AMT PAID</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div style="border-top: 1px dashed black; margin-top: 5px;"></div>

                <table class="totals-table">
                    <tr style="font-size: 15px; color: black;">
                        <td class="label-col">Total Paid</td>
                        <td class="colon-col">:</td>
                        <td class="value-col">${totalPaid.toFixed(2)} ৳</td>
                    </tr>
                    ${paymentData.newPatientBalance !== undefined ? `
                    <tr>
                        <td class="label-col">New Balance</td>
                        <td class="colon-col">:</td>
                        <td class="value-col">${Number(paymentData.newPatientBalance).toFixed(2)} ৳</td>
                    </tr>` : ''}
                </table>

                ${paymentData.note ? `
                <div style="margin-top: 10px; padding: 5px; border: 1px dotted black; background: #fafafa; width: 100%; box-sizing: border-box; font-size: 11px;">
                    <span style="text-transform: uppercase; font-size: 9px; font-weight: 900; color: black;">Note:</span>
                    <span style="font-style: italic; font-weight: 900; color: black; text-transform: uppercase;">${paymentData.note}</span>
                </div>` : ''}

                <div class="footer">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 10px;">
                        <span style="font-weight: 900; text-align: left; text-transform: uppercase;">Billing By: ${paymentData.createdBy || user?.fullName || user?.username || 'Staff'}</span>
                    </div>
                    <p style="font-weight: 900; margin-bottom: 5px;">THANK YOU FOR VISITING!</p>
                    <p style="margin-top: 10px; font-weight: 900; color: black; text-transform: none;">*Powered by HamoodTech.</p>
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
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[72mm] w-full p-0 overflow-hidden sm:rounded-none bg-white text-black border-none shadow-none print:max-w-none print:w-[80mm] print:mx-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="p-0 max-h-[85vh] overflow-y-auto print:max-h-none print:p-0 flex flex-col bg-white" id="receipt-content">
            <ReceiptContent />
        </div>

        <div className="p-4 bg-zinc-50 flex flex-col gap-2 border-t">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
            onClick={handlePrint}
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
