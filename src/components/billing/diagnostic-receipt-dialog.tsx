"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useCurrency } from "@/hooks/use-currency"
import { useSettingsStore } from "@/store/use-settings-store"
import { Printer } from "lucide-react"

// Simple number to words converter for BDT/Taka (Indian numbering system format)
function numberToWords(num: number): string {
  if (num === 0) return "ZERO";
  const a = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " HUNDRED" + (n % 100 !== 0 ? " " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " THOUSAND" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " LAKH" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " CRORE" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  };

  return inWords(Math.floor(num));
}

interface DiagnosticReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: any | null // Generic sale object
  doctors?: any[] // To lookup doctor name if not populated
}

export function DiagnosticReceiptDialog({ open, onOpenChange, transaction, doctors = [] }: DiagnosticReceiptDialogProps) {
  const { general } = useSettingsStore()
  const { formatCurrency } = useCurrency()
  
  if (!transaction) return null

  const items = transaction.saleItems || []
  
  const netTotal = Number(transaction.netPrice || transaction.totalPrice || 0)
  const grossTotal = items.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0)
  const paidAmount = Number(transaction.paidAmount || 0)
  const dueAmount = Number(transaction.dueAmount || 0)
  const taxAmount = Number(transaction.taxAmount || 0)
  
  const patientName = transaction.patient?.name || transaction.customerName || "Walk-in Patient"
  const patientAge = transaction.patient?.age ? `${transaction.patient.age}Y` : "N/A"
  const patientSex = transaction.patient?.gender ? transaction.patient.gender.charAt(0).toUpperCase() + transaction.patient.gender.slice(1) : "N/A"
  const patientPhone = transaction.patient?.phone || "N/A"
  const patientId = transaction.patient?.id ? transaction.patient.id.slice(0,8).toUpperCase() : "N/A"
  
  const invoiceNumber = transaction.invoiceNumber || "N/A"
  const labNumber = transaction.id ? transaction.id.slice(-8).toUpperCase() : "N/A" // Pseudo lab number
  const date = transaction.createdAt || new Date().toISOString()
  
  // Find consultant
  let consultantName = "N/A"
  if (transaction.doctorId) {
      const doc = doctors.find(d => d.id === transaction.doctorId)
      if (doc) consultantName = doc.name
  } else if (transaction.doctor?.name) {
      consultantName = transaction.doctor.name
  }

  const deliveryDateRaw = items[0]?.deliveryDate || date;
  // Format as DD/MM/YYYY
  const formattedDeliveryDate = new Date(deliveryDateRaw).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const formattedDeliveryTime = "07:00 PM" // Mock default time as per receipt

  const amountInWords = numberToWords(netTotal) + " TAKA ONLY"
  
  const isFullPaid = dueAmount <= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] w-full p-0 overflow-hidden sm:rounded-none bg-white text-black border-none shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Diagnostic Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="p-8 max-h-[75vh] overflow-y-auto print:max-h-none print:p-0" id="receipt-content">
            <div className="relative border border-black p-4 text-[12px] font-medium font-sans">
                {/* Side Watermark / Vertical Text */}
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-gray-500 tracking-wider whitespace-nowrap hidden print:block">
                    Powered By: Hospital Management System
                </div>

                {/* Header */}
                <div className="text-center mb-4">
                    <h1 className="text-2xl font-bold uppercase tracking-wider">{general?.hospitalName || "PATWARY GENERAL HOSPITAL"}</h1>
                    <p className="text-[13px] mt-1">{general?.address || "Bonpara Bazar, Boraigram, Natore-6430"}</p>
                    <p className="text-[13px]">{general?.phone || "01711862547"}</p>
                    
                    <div className="mt-3 inline-block border border-black rounded-full px-6 py-1 font-bold tracking-wider relative bg-gray-100/50">
                        OFFICE COPY
                    </div>
                </div>

                {/* Info Table Box */}
                <div className="border border-black mb-4">
                    {/* Row 1 */}
                    <div className="grid grid-cols-2 border-b border-black">
                        <div className="p-1 px-2 border-r border-black font-bold">
                            UHID : {patientId}
                        </div>
                        <div className="p-1 px-2 flex justify-between">
                            <div className="font-bold">
                                <div>Bill No. : {invoiceNumber}</div>
                                <div>Lab. No. {labNumber}</div>
                            </div>
                        </div>
                    </div>
                    {/* Row 2 */}
                    <div className="grid grid-cols-2 border-b border-black">
                        <div className="p-1 px-2 border-r border-black font-bold">
                            Name <span className="mx-2">:</span> {patientName}
                        </div>
                        <div className="p-1 px-2 font-bold flex">
                            <span className="w-12">Date</span> <span className="mr-2">:</span> {new Date(date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                        </div>
                    </div>
                    {/* Row 3 */}
                    <div className="grid grid-cols-2 border-b border-black">
                        <div className="p-1 px-2 border-r border-black font-bold flex gap-4">
                            <span>Age <span className="mx-1">:</span> {patientAge}</span>
                            <span>Sex : {patientSex}</span>
                        </div>
                        <div className="p-1 px-2 font-bold">
                            Contact No. : {patientPhone}
                        </div>
                    </div>
                    {/* Row 4 */}
                    <div className="p-1 px-2 font-bold">
                        Consultant : {consultantName}
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left border-collapse mb-2 max-w-full">
                    <thead>
                        <tr className="border-y border-black font-bold">
                            <th className="py-1 px-1 w-12">SL No</th>
                            <th className="py-1 px-1">Test Name</th>
                            <th className="py-1 px-1 text-right w-24">Unit Price</th>
                            <th className="py-1 px-1 text-center w-12">Qty</th>
                            <th className="py-1 px-1 text-right w-24">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item: any, index: number) => {
                             const itemTotal = Number(item.price) * Number(item.quantity)
                             return (
                                <tr key={index} className="border-b border-gray-300/50">
                                    <td className="py-1 px-1">{index + 1}</td>
                                    <td className="py-1 px-1">{item.itemName}</td>
                                    <td className="py-1 px-1 text-right">{Number(item.price).toFixed(2)}</td>
                                    <td className="py-1 px-1 text-center">{item.quantity}</td>
                                    <td className="py-1 px-1 text-right">{itemTotal.toFixed(2)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {/* Totals Section */}
                <div className="flex justify-between items-start mt-4 mb-6">
                    <div className="pt-2 pl-4">
                        {isFullPaid && (
                            <div className="border-2 border-black rounded-[30px] px-8 py-2 text-2xl font-bold inline-block opacity-80 uppercase tracking-widest mt-4">
                                Full Paid
                            </div>
                        )}
                    </div>
                    <div className="w-[250px]">
                        <div className="flex justify-between py-0.5 font-bold">
                            <span>Sub Total Tk.</span>
                            <span>{grossTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-0.5 font-bold">
                            <span>+ Vat Tk.</span>
                            <span>{taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-0.5 font-bold">
                            <span>Net Payable Tk.</span>
                            <span>{netTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-0.5 font-bold">
                            <span>Advanced Tk.</span>
                            <span>{paidAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-0.5 font-bold">
                            <span>Due Tk.</span>
                            <span>{dueAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="flex gap-6 mt-4 font-bold text-[11px]">
                    <div>
                        In Word : {amountInWords}
                    </div>
                    <div>
                        TYPE : {transaction.paymentMethod?.toUpperCase() || "CASH"}
                    </div>
                </div>
                
                <div className="font-bold text-[11px] mt-1">
                    Delivery Date : {formattedDeliveryDate} {formattedDeliveryTime}
                </div>

                <div className="flex justify-between items-end mt-16 pt-4 font-bold text-sm">
                    <div>
                        যে সকল রুমে যাবেনঃ
                    </div>
                    <div className="text-center">
                        <div className="border-t border-black border-dotted w-48 mb-1"></div>
                        {transaction.staffId ? transaction.staffId : "User/Cashier"}
                    </div>
                </div>
            </div>
        </div>

        <div className="p-4 bg-zinc-50 flex flex-col gap-2 border-t">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
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
                                  @page { margin: 10mm; }
                                  body { 
                                      font-family: Arial, sans-serif; 
                                      -webkit-print-color-adjust: exact; 
                                      print-color-adjust: exact;
                                  }
                                  /* Reset/normalize some Tailwind styles */
                                  .border { border-width: 1px; border-style: solid; border-color: black; }
                                  .border-black { border-color: black !important; }
                                  .border-b { border-bottom-width: 1px; border-style: solid; border-color: black; }
                                  .border-r { border-right-width: 1px; border-style: solid; border-color: black; }
                                  .border-t { border-top-width: 1px; border-style: solid; border-color: black; }
                                  .border-gray-300\\/50 { border-color: rgba(209, 213, 219, 0.5); }
                                  .border-y { border-top-width: 1px; border-bottom-width: 1px; border-style: solid; border-color: black; }
                                  .grid { display: grid; }
                                  .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                                  .flex { display: flex; }
                                  .justify-between { justify-content: space-between; }
                                  .items-start { align-items: flex-start; }
                                  .items-end { align-items: flex-end; }
                                  .gap-4 { gap: 1rem; }
                                  .gap-6 { gap: 1.5rem; }
                                  .p-1 { padding: 0.25rem; }
                                  .p-4 { padding: 1rem; }
                                  .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
                                  .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
                                  .px-8 { padding-left: 2rem; padding-right: 2rem; }
                                  .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
                                  .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
                                  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
                                  .pt-2 { padding-top: 0.5rem; }
                                  .pt-4 { padding-top: 1rem; }
                                  .mb-1 { margin-bottom: 0.25rem; }
                                  .mb-2 { margin-bottom: 0.5rem; }
                                  .mb-4 { margin-bottom: 1rem; }
                                  .mb-6 { margin-bottom: 1.5rem; }
                                  .mt-1 { margin-top: 0.25rem; }
                                  .mt-3 { margin-top: 0.75rem; }
                                  .mt-4 { margin-top: 1rem; }
                                  .mt-16 { margin-top: 4rem; }
                                  .mx-1 { margin-left: 0.25rem; margin-right: 0.25rem; }
                                  .mx-2 { margin-left: 0.5rem; margin-right: 0.5rem; }
                                  .w-12 { width: 3rem; }
                                  .w-24 { width: 6rem; }
                                  .w-48 { width: 12rem; }
                                  .w-\\[250px\\] { width: 250px; }
                                  .w-full { width: 100%; }
                                  .text-center { text-align: center; }
                                  .text-right { text-align: right; }
                                  .text-\\[10px\\] { font-size: 10px; }
                                  .text-\\[11px\\] { font-size: 11px; }
                                  .text-\\[12px\\] { font-size: 12px; }
                                  .text-\\[13px\\] { font-size: 13px; }
                                  .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
                                  .text-2xl { font-size: 1.5rem; line-height: 2rem; }
                                  .font-bold { font-weight: 700; }
                                  .font-medium { font-weight: 500; }
                                  .uppercase { text-transform: uppercase; }
                                  .tracking-wider { letter-spacing: 0.05em; }
                                  .tracking-widest { letter-spacing: 0.1em; }
                                  .border-collapse { border-collapse: collapse; }
                                  .rounded-full { border-radius: 9999px; }
                                  .rounded-\\[30px\\] { border-radius: 30px; }
                                  .border-2 { border-width: 2px; }
                                  .border-dotted { border-style: dotted; }
                                  .inline-block { display: inline-block; }
                                  .opacity-80 { opacity: 0.8; }
                                  
                                  /* Fix specifically for watermark layout in print */
                                  .relative { position: relative; }
                                  .absolute { position: absolute; }
                                  .-left-6 { left: -1.5rem; }
                                  .top-1\\/2 { top: 50%; }
                                  .-translate-y-1\\/2 { transform: translateY(-50%) rotate(-90deg); } /* merged rotate */
                                  .whitespace-nowrap { white-space: nowrap; }
                                  .print\\:block { display: block; }
                              </style>
                          </head>
                          <body>
                              <div style="width: 210mm;">
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
