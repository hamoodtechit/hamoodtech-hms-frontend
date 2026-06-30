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
import { useStoreContext } from "@/store/use-store-context"
import { useAuthStore } from "@/store/use-auth-store"
import { Printer, CheckCircle2, X } from "lucide-react"

// Simple number to words converter for BDT/Taka
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
  const totalPaid = paidSales.reduce((sum: number, sale: any) => sum + Number(sale.paidAmount || 0), 0)
  const date = new Date().toISOString()
  const amountInWords = numberToWords(totalPaid) + " TAKA ONLY"

  const ReceiptContent = ({ copyTitle }: { copyTitle: string }) => (
    <div className="relative p-2 md:p-4 pt-[5mm] md:pt-[10mm] flex-1 flex flex-col z-10 w-full mb-0 pb-8 print:mb-0 print:pb-0 text-black">
        <div className="relative border border-black p-4 text-[12px] font-medium font-sans w-full flex-1 flex flex-col bg-white text-black">

        {/* PAID/DUE Stamps */}
        <div className="absolute top-[20%] right-[10%] pointer-events-none z-0 opacity-[0.15]">
            <div className="text-[80px] font-black uppercase text-green-600 -rotate-[25deg] border-[8px] border-green-600 px-8 py-2 rounded-[20px] tracking-[10px]">
                PAID
            </div>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', gap: '0' }} className="text-center mb-1 relative z-10">
             <div className="flex justify-center" style={{ marginBottom: '2px' }}>
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={activeBranch?.logoUrl || "/Logo.png"} alt="Logo" style={{ height: '60px', width: 'auto', display: 'block', margin: '0 auto' }} />
             </div>
            <h1 style={{ margin: '0', padding: '0', fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1', width: '100%' }}>{general?.hospitalName || activeBranch?.name || "HOSPITAL"}</h1>
            <p style={{ margin: '0', padding: '0', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2' }}>{general?.address || activeBranch?.address || "Hospital Address"}</p>
            <p style={{ margin: '0', padding: '0', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2' }}>Ph: {general?.phone || activeBranch?.phone || "Hospital Phone"}</p>
            {(general?.email || activeBranch?.email) && (
                <p style={{ margin: '0', padding: '0', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2' }}>Email: {general?.email || activeBranch?.email}</p>
            )}
            
            <div className="flex justify-center gap-6 text-[11px] font-bold uppercase mt-1">
                {activeBranch?.licenseNumber && <span>License No: {activeBranch?.licenseNumber}</span>}
                {activeBranch?.taxRegistration && <span>TX Registration No: {activeBranch?.taxRegistration}</span>}
            </div>

            <div className="mt-2 inline-block border border-black rounded-full px-6 py-1 font-bold tracking-wider relative bg-gray-100/50">
                {copyTitle}
            </div>
        </div>

        {/* Info Table Box */}
        <div className="border border-black mb-2 relative z-10 mt-2 text-[13px]">
            <div className="grid grid-cols-2 border-b border-black">
                <div className="p-1 px-3 border-r border-black font-bold flex items-center">
                    UHID : {patientUhid || 'N/A'}
                </div>
                <div className="p-1 px-3 flex items-center font-bold">
                    <span>Patient : {patientName || 'N/A'}</span>
                </div>
            </div>
            <div className="grid grid-cols-1 border-b border-black">
                <div className="p-1 px-3 font-bold flex flex-wrap items-center">
                    <span className="w-12">Date</span> <span className="mr-2">:</span> {new Date(date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                </div>
            </div>
            <div className="grid grid-cols-1 border-b border-black">
                <div className="p-1 px-3 font-bold flex items-center">
                    <span className="shrink-0 w-32">Payment Mode :</span>
                    <span className="uppercase text-[12px]">{paymentData.paymentMethod || "CASH"}</span>
                </div>
            </div>
            {paymentData.note && (
            <div className="p-1 px-3 font-bold flex items-center border-b border-black">
                <span className="shrink-0 w-32 uppercase">Remarks :</span>
                <span className="italic">{paymentData.note}</span>
            </div>
            )}
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }} className="relative z-10 mb-2 text-[13px]">
            <thead>
                <tr style={{ borderBottom: '2px solid black' }} className="font-black">
                    <th style={{ textAlign: 'left', padding: '6px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoice Number</th>
                    <th style={{ textAlign: 'left', padding: '6px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Details</th>
                    <th style={{ textAlign: 'right', padding: '6px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount Paid</th>
                </tr>
            </thead>
            <tbody>
                {paidSales.map((sale: any, idx: number) => {
                    return (
                        <tr key={idx} style={{ borderBottom: '1px dashed #ccc' }}>
                            <td style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '700', verticalAlign: 'top' }}>{sale.invoiceNumber}</td>
                            <td style={{ padding: '6px 4px', fontSize: '10px', fontWeight: '600', color: '#444' }}>
                                {sale.saleItems && sale.saleItems.length > 0 
                                    ? sale.saleItems.map((item: any) => item.itemName).join(', ')
                                    : 'Bulk Settlement'}
                            </td>
                            <td style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '900', textAlign: 'right', verticalAlign: 'top' }}>{Number(sale.paidAmount).toFixed(2)}</td>
                        </tr>
                    )
                })}
            </tbody>
        </table>

        {/* Financial Settlement */}
        <div className="flex justify-between items-start mt-2 mb-4 relative z-10 text-[13px]">
            <div className="pt-2 pl-4">
            </div>
            <div className="w-[300px]">
                <div className="flex justify-between py-1 px-2 font-black text-[14px]" style={{ color: 'black', border: '1px solid black', backgroundColor: '#f3f4f6' }}>
                    <span>Total Paid:</span>
                    <span>{totalPaid.toFixed(2)} ৳</span>
                </div>
                {paymentData.newPatientBalance !== undefined && (
                <div className="flex justify-between py-1 px-2 font-black mt-1" style={{ color: '#444', borderBottom: '1px solid #ccc' }}>
                    <span>New Account Balance:</span>
                    <span>{Number(paymentData.newPatientBalance).toFixed(2)} ৳</span>
                </div>
                )}
            </div>
        </div>

        {/* In Words */}
        <div className="mt-2 px-8 relative z-10">
            <div className="border border-black p-2 bg-gray-50/50 font-black text-[12px]">
                <span className="uppercase opacity-50">In Words: </span>
                <span className="uppercase">{amountInWords}</span>
            </div>
        </div>

        {/* Signature */}
        <div className="mt-12 flex justify-between px-8 relative z-10">
            <div className="text-center space-y-1">
                <div className="border-t border-black w-48 mx-auto"></div>
                <span className="text-[12px] font-black uppercase">Prepared By</span>
                <p className="text-[10px] font-bold text-black italic">{paymentData.createdBy || user?.fullName || 'Staff'}</p>
            </div>
            <div className="text-center space-y-1">
                <div className="border-t border-black w-48 mx-auto"></div>
                <span className="text-[12px] font-black uppercase">Authorized By</span>
            </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-black/10 text-[8px] text-black/50 font-bold flex justify-between uppercase tracking-widest relative z-10">
            <span>*Powered by HamoodTech</span>
            <span>Printed: {new Date().toLocaleString('en-GB')}</span>
        </div>
        </div>
    </div>
  )

  const handlePrint = () => {
    const printContent = document.getElementById('bulk-receipt-content')?.innerHTML;
    if (!printContent) return

    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '100%'
    iframe.style.bottom = '100%'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = 'none'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentWindow?.document
    if (!iframeDoc) return

    iframeDoc.open()
    iframeDoc.write(`
        <html>
            <head>
                <title>Bulk Payment Receipt - \${patientName}</title>
                <style>
                    @page { size: A4; margin: 0; }
                    body { 
                        font-family: Arial, sans-serif; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        background: #f5f5f5;
                                    * { box-sizing: border-box !important; }
                    .print-container {
                        width: 185mm;
                        background: white;
                        padding: 0;
                        margin: 0 auto;
                        display: block;
                    }
                    /* Reset/normalize some Tailwind styles for absolute consistency */
                    .border { border: 1px solid black !important; }
                    .border-dashed { border-style: solid !important; border-width: 1px !important; }
                    .border-dotted { border-style: solid !important; }
                    .border-black { border-color: black !important; }
                    .page-break { 
                        page-break-after: always !important; 
                        break-after: page !important;
                        height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        display: block !important;
                    }
                    
                    .border-t-0 { border-top-width: 0 !important; }
                    .border-b-0 { border-bottom-width: 0 !important; }
                    .border-r-0 { border-right-width: 0 !important; }
                    .border-l-0 { border-left-width: 0 !important; }
                    
                    .border-b { border-bottom-width: 1px !important; }
                    .border-r { border-right-width: 1px !important; }
                    .border-t { border-top-width: 1px !important; }
                    .border-y { border-top-width: 1px !important; border-bottom-width: 1px !important; }
                    
                    .grid { display: grid !important; }
                    .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
                    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
                    .flex { display: flex !important; }
                    .flex-wrap { flex-wrap: wrap !important; }
                    .flex-col { flex-direction: column !important; }
                    .justify-center { justify-content: center !important; }
                    .justify-between { justify-content: space-between !important; }
                    .items-center { align-items: center !important; }
                    .items-start { align-items: flex-start !important; }
                    .items-end { align-items: flex-end !important; }
                    .gap-1 { gap: 0.25rem !important; }
                    .gap-2 { gap: 0.5rem !important; }
                    .gap-3 { gap: 0.75rem !important; }
                    .gap-4 { gap: 1rem !important; }
                    .gap-6 { gap: 1.5rem !important; }
                    .gap-8 { gap: 2rem !important; }
                    .p-1 { padding: 0.25rem !important; }
                    .p-2 { padding: 0.5rem !important; }
                    .p-4 { padding: 1rem !important; }
                    .p-8 { padding: 2rem !important; }
                    .px-3 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
                    .px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
                    .px-8 { padding-left: 2rem !important; padding-right: 2rem !important; }
                    .py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
                    .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
                    .pt-2 { padding-top: 0.5rem !important; }
                    .mb-0 { margin-bottom: 0 !important; }
                    .mb-1 { margin-bottom: 0.25rem !important; }
                    .mb-2 { margin-bottom: 0.5rem !important; }
                    .mt-1 { margin-top: 0.25rem !important; }
                    .mt-2 { margin-top: 0.5rem !important; }
                    .mt-4 { margin-top: 1rem !important; }
                    .mt-12 { margin-top: 3rem !important; }
                    .mx-1 { margin-left: 0.25rem !important; margin-right: 0.25rem !important; }
                    .mx-2 { margin-left: 0.5rem !important; margin-right: 0.5rem !important; }
                    .mx-8 { margin-left: 2rem !important; margin-right: 2rem !important; }
                    .mr-2 { margin-right: 0.5rem !important; }
                    .mr-8 { margin-right: 2rem !important; }
                    .w-12 { width: 3rem !important; }
                    .w-24 { width: 6rem !important; }
                    .w-32 { width: 8rem !important; }
                    .w-48 { width: 12rem !important; }
                    .w-full { width: 100% !important; }
                    .flex-1 { flex: 1 1 0% !important; }
                    .shrink-0 { flex-shrink: 0 !important; }
                    .text-center { text-align: center !important; }
                    .text-right { text-align: right !important; }
                    .text-green-600 { color: #16a34a !important; }
                    .text-red-600 { color: #dc2626 !important; }
                    .text-\\[8px\\] { font-size: 8px !important; }
                    .text-\\[10px\\] { font-size: 10px !important; }
                    .text-\\[11px\\] { font-size: 11px !important; }
                    .text-\\[12px\\] { font-size: 12px !important; }
                    .text-\\[13px\\] { font-size: 13px !important; }
                    .text-\\[14px\\] { font-size: 14px !important; }
                    .text-\\[22px\\] { font-size: 22px !important; }
                    .text-\\[80px\\] { font-size: 80px !important; }
                    .text-sm { font-size: 0.875rem !important; }
                    .font-bold { font-weight: 700 !important; }
                    .font-black { font-weight: 900 !important; }
                    .font-medium { font-weight: 500 !important; }
                    .uppercase { text-transform: uppercase !important; }
                    .italic { font-style: italic !important; }
                    .tracking-widest { letter-spacing: 0.1em !important; }
                    .tracking-\\[10px\\] { letter-spacing: 10px !important; }
                    .rounded-full { border-radius: 9999px !important; }
                    .rounded-\\[20px\\] { border-radius: 20px !important; }
                    .border-2 { border-width: 2px !important; }
                    .border-8 { border-width: 8px !important; }
                    .opacity-\\[0\\.15\\] { opacity: 0.15 !important; }
                    .opacity-50 { opacity: 0.5 !important; }
                    .opacity-70 { opacity: 0.7 !important; }
                    .z-0 { z-index: 0 !important; }
                    .z-10 { z-index: 10 !important; }
                    .top-\\[20\\%\\] { top: 20% !important; }
                    .right-\\[10\\%\\] { right: 10% !important; }
                    .relative { position: relative !important; }
                    .absolute { position: absolute !important; }
                    .-rotate-\\[25deg\\] { transform: rotate(-25deg) !important; }
                    .bg-gray-50 { background-color: #f9fafb !important; }
                    .bg-white { background-color: #ffffff !important; }
                    
                    .whitespace-nowrap { white-space: nowrap !important; }
                    .border-t-2 { border-top: 2px solid black !important; }
                    .space-y-1 > * + * { margin-top: 0.25rem !important; }
                    body { margin: 0 !important; padding: 0 !important; }
                    @page { margin: 0; }
                </style>
            </head>
            <body>
                <div class="print-container">
                    \${printContent}
                </div>
            </body>
        </html>
    `)
    iframeDoc.close()

    setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
            document.body.removeChild(iframe)
        }, 1000)
    }, 800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white border-none shadow-2xl light max-h-[95vh]">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50/80 backdrop-blur text-slate-900">
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-slate-900">
                <Printer className="w-5 h-5 text-blue-600" />
                Bulk Payment Receipt
            </DialogTitle>
            <div className="flex items-center gap-2">
                <Button onClick={handlePrint} size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Receipt
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:bg-black/5" onClick={() => onOpenChange(false)}>
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
        
        <div className="p-0 max-h-[85vh] overflow-y-auto print:max-h-none print:p-0 bg-white text-black" id="bulk-receipt-content" style={{ width: "100%", maxWidth: "210mm", margin: "0 auto" }}>
            <ReceiptContent copyTitle="BULK PAYMENT — OFFICE COPY" />
            <div className="page-break" />
            <ReceiptContent copyTitle="BULK PAYMENT — CUSTOMER COPY" />
        </div>
      </DialogContent>
    </Dialog>
  )
}
