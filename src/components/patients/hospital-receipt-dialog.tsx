"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSale } from "@/hooks/sales-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useAuthStore } from "@/store/use-auth-store"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { Loader2, Printer, X } from "lucide-react"
import { useRef } from "react"

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

interface HospitalReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: any | null
  patient?: any
  bed?: any
}

export function HospitalReceiptDialog({ open, onOpenChange, transaction, patient: passedPatient, bed: passedBed }: HospitalReceiptDialogProps) {
  const { stores, activeStoreId } = useStoreContext()
  const { general } = useSettingsStore()
  const { formatCurrency } = useCurrency()
  const activeBranch = stores.find(s => s.id === activeStoreId) || stores[0]
  
  const saleId = transaction?.id || transaction?.sale?.id || transaction?.data?.sale?.id
  const { data: saleRes, isLoading } = useSale(saleId || "")
  
  const fetchedData = saleRes?.data || (saleRes as any)?.sale || (saleRes as any)?.data
  const data = fetchedData || transaction
  const { user } = useAuthStore()
  const printRef = useRef<HTMLDivElement>(null)

  if (!transaction && !isLoading) return null
  if (!data && !isLoading) return null

  const items = data?.saleItems || data?.items || []
  const normalizedItems = items.map((item: any) => ({
    name: item.itemName || item.name || "Unknown Item",
    quantity: Number(item.quantity || 0),
    price: Number(item.price || 0),
    discountAmount: Number(item.discountAmount || 0),
    discountPercentage: Number(item.discountPercentage || 0)
  }))

  const grossTotal = normalizedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
  const totalItemDiscount = normalizedItems.reduce((sum: number, item: any) => {
      const itemSubtotal = item.price * item.quantity
      return sum + (item.discountAmount || (item.discountPercentage ? (itemSubtotal * item.discountPercentage) / 100 : 0))
  }, 0)

  const netTotal = Number(data?.netPrice || data?.totalPrice || 0)
  const paidAmount = Number(data?.paidAmount || 0)
  const dueAmount = Number(data?.dueAmount || 0)
  const discountAmount = Number(data?.discountAmount || data?.discount || 0)
  const invoiceNumber = data?.invoiceNumber || data?.number || "N/A"
  const date = data?.date || data?.createdAt || new Date().toISOString()
  const isFullyPaid = dueAmount <= 0
  
  const patient = passedPatient || data?.patientAdmission?.patient || data?.patient
  const bed = passedBed || data?.patientAdmission?.bed

  const amountInWords = numberToWords(netTotal) + " TAKA ONLY"

  const ReceiptContent = ({ copyTitle }: { copyTitle: string }) => (
    <div className="relative p-2 md:p-4 pt-[5mm] md:pt-[5mm] flex-1 flex flex-col z-10 w-full mb-0 border-b border-black border-dashed pb-8 print:border-b-0 print:mb-0 print:pb-0">
        <div className="relative border border-black border-dashed p-4 text-[12px] font-medium font-sans w-full flex-1 flex flex-col bg-white">

        {/* PAID Hologram */}
        {isFullyPaid && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0 opacity-[0.08]">
                <div className="text-[150px] font-black uppercase text-red-600 -rotate-[35deg] border-[12px] border-red-600 px-12 py-6 rounded-[40px] tracking-[15px]">
                    PAID
                </div>
            </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', gap: '0' }} className="text-center mb-1 relative z-10">
             <div className="flex justify-center" style={{ marginBottom: '2px' }}>
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={data.branch?.logoUrl || "/Logo.png"} alt="Logo" style={{ height: '60px', width: 'auto', display: 'block', margin: '0 auto' }} />
             </div>
            <h1 style={{ margin: '0', padding: '0', fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1', width: '100%' }}>{general?.hospitalName || data.branch?.name || "HOSPITAL"}</h1>
            <p style={{ margin: '0', padding: '0', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2' }}>{general?.address || data.branch?.address || "Hospital Address"}</p>
            <p style={{ margin: '0', padding: '0', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2' }}>Ph: {general?.phone || data.branch?.phone || "Hospital Phone"}</p>
            
            <div className="flex justify-center gap-6 text-[11px] font-bold uppercase mt-1">
                {(data.branch?.licenseNumber || activeBranch?.licenseNumber) && <span>License No: {data.branch?.licenseNumber || activeBranch?.licenseNumber}</span>}
                {(data.branch?.taxRegistration || activeBranch?.taxRegistration) && <span>TX Registration No: {data.branch?.taxRegistration || activeBranch?.taxRegistration}</span>}
            </div>

            <div className="mt-2 inline-block border border-black rounded-full px-6 py-1 font-bold tracking-wider relative bg-gray-100/50">
                {copyTitle}
            </div>
        </div>

        {/* Info Table Box */}
        <div className="border border-black flex flex-col mb-2 bg-white relative z-10 mt-2">
            <div className="grid grid-cols-2 border-b border-black min-h-[30px]">
                <div className="p-2 border-r border-black flex items-center">
                    <span className="w-24 text-[10px] font-black uppercase">Inv. No:</span>
                    <span className="font-bold text-[12px]">{invoiceNumber}</span>
                </div>
                <div className="p-2 flex items-center">
                    <span className="w-24 text-[10px] font-black uppercase">Date:</span>
                    <span className="font-bold text-[12px]">{new Date(date).toLocaleString('en-GB')}</span>
                </div>
            </div>
            <div className="grid grid-cols-2 border-b border-black min-h-[30px]">
                <div className="p-2 border-r border-black flex items-center">
                    <span className="w-24 text-[10px] font-black uppercase">Patient:</span>
                    <span className="font-bold text-[12px] uppercase">{patient?.name || 'N/A'}</span>
                </div>
                <div className="p-2 flex items-center">
                    <span className="w-24 text-[10px] font-black uppercase">Reg. ID:</span>
                    <span className="font-bold text-[12px]">{patient?.uhid || patient?.patientNumber || 'N/A'}</span>
                </div>
            </div>
            {bed && (
            <div className="p-2 flex items-center min-h-[30px]">
                <span className="w-24 text-[10px] font-black uppercase">Ward/Bed:</span>
                <span className="font-bold text-[12px]">{bed?.section?.name} - {bed?.bedNumber}</span>
            </div>
            )}
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }} className="relative z-10 mb-2">
            <thead>
                <tr style={{ borderBottom: '2px solid black' }}>
                    <th style={{ textAlign: 'left', padding: '6px 4px', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.05em' }}>Service / Item</th>
                    <th style={{ textAlign: 'center', padding: '6px 4px', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.05em' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.05em' }}>Rate</th>
                    <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.05em' }}>Total</th>
                </tr>
            </thead>
            <tbody>
                {normalizedItems.map((item: any, idx: number) => {
                    const itemTotal = item.price * item.quantity
                    const itemDisc = item.discountAmount || (item.discountPercentage ? (itemTotal * item.discountPercentage) / 100 : 0)
                    const netItemTotal = itemTotal - itemDisc
                    return (
                        <tr key={idx} style={{ borderBottom: '1px dashed #ccc' }}>
                            <td style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '700' }}>{item.name}</td>
                            <td style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '600', textAlign: 'right' }}>{item.price.toFixed(2)}</td>
                            <td style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '900', textAlign: 'right' }}>{netItemTotal.toFixed(2)}</td>
                        </tr>
                    )
                })}
            </tbody>
        </table>

        {/* Financial Settlement */}
        <div className="border-t-2 border-black mt-2 pt-2 relative z-10 px-8">
            <div className="flex justify-between items-center py-0.5">
                <span className="text-[11px] font-black uppercase">Gross Total:</span>
                <span className="text-[12px] font-black">{grossTotal.toFixed(2)} ৳</span>
            </div>
            {(totalItemDiscount > 0 || discountAmount > 0) && (
            <div className="flex justify-between items-center py-0.5">
                <span className="text-[10px] font-black uppercase italic">Discount (-):</span>
                <span className="text-[11px] font-bold">{(totalItemDiscount + discountAmount).toFixed(2)} ৳</span>
            </div>
            )}
            <div className="border-b border-black w-full mb-1"></div>
            <div className="flex justify-between items-center py-0.5">
                <span className="text-[12px] font-black uppercase">Net Payable:</span>
                <span className="text-[14px] font-black">{netTotal.toFixed(2)} ৳</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
                <span className="text-[11px] font-bold uppercase italic">Paid Amount:</span>
                <span className="text-[11px] font-bold">{paidAmount.toFixed(2)} ৳</span>
            </div>
            <div className="border-b border-black w-full mb-1"></div>
            <div className="flex justify-between items-center py-0.5">
                <span className="text-[12px] font-black uppercase">{dueAmount > 0 ? 'Total Due:' : 'Return:'}</span>
                <span className="text-[14px] font-black">{dueAmount > 0 ? dueAmount.toFixed(2) : Math.max(0, paidAmount - netTotal).toFixed(2)} ৳</span>
            </div>
        </div>

        {/* In Words */}
        <div className="mt-2 px-8 relative z-10">
            <div className="border border-black border-dashed p-2 bg-gray-50/50">
                <span className="text-[9px] font-black uppercase opacity-50">In Words: </span>
                <span className="text-[10px] font-black uppercase">{amountInWords}</span>
            </div>
        </div>

        {/* Remarks Note */}
        {(data?.note || data?.payments?.[0]?.note) && (
            <div className="mt-2 p-2 bg-gray-50 border border-black border-dotted flex gap-2 items-start relative z-10 mx-8">
                <span className="shrink-0 uppercase text-[10px] font-black opacity-70">Remarks:</span>
                <span className="italic font-bold text-[10px] uppercase leading-tight">{data?.note || data?.payments?.[0]?.note}</span>
            </div>
        )}

        {/* Signature */}
        <div className="mt-16 flex justify-between px-8 relative z-10">
            <div className="text-center space-y-1">
                <div className="border-t border-black w-32 mx-auto"></div>
                <span className="text-[10px] font-black uppercase">Prepared By</span>
                <p className="text-[9px] font-bold text-black italic">{user?.fullName || 'Staff'}</p>
            </div>
            <div className="text-center space-y-1">
                <div className="border-t border-black w-32 mx-auto"></div>
                <span className="text-[10px] font-black uppercase">Authorized By</span>
            </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-black/10 text-[8px] text-gray-500 font-bold flex justify-between uppercase tracking-widest relative z-10">
            <span>* System Generated Hospital Bill</span>
            <span>Printed: {new Date().toLocaleString('en-GB')}</span>
        </div>
        </div>
    </div>
  )

  const handlePrint = () => {
        const el = printRef.current
        if (!el) return

        const printContent = el.innerHTML

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
                    <title>Hospital Bill - ${patient?.name || invoiceNumber}</title>
                    <style>
                        @page { size: A4; margin: 5mm; }
                        body { 
                            font-family: Arial, sans-serif; 
                            -webkit-print-color-adjust: exact; 
                            print-color-adjust: exact;
                            margin: 0;
                            padding: 0;
                            display: flex;
                            justify-content: center;
                            background: #f5f5f5;
                        }
                        .print-container {
                            width: 210mm;
                            min-height: 297mm;
                            background: white;
                            padding: 5mm;
                            box-sizing: border-box;
                            position: relative;
                            display: flex;
                            flex-direction: column;
                        }
                        /* Reset/normalize some Tailwind styles for absolute consistency */
                        .border { border: 1px solid black !important; }
                        .border-dashed { border-style: dashed !important; border-width: 1px !important; }
                        .border-dotted { border-style: dotted !important; }
                        .border-black { border-color: black !important; }
                        .border-t-0 { border-top-width: 0 !important; }
                        .border-b-0 { border-bottom-width: 0 !important; }
                        .border-r-0 { border-right-width: 0 !important; }
                        .border-l-0 { border-left-width: 0 !important; }
                        .border-b { border-bottom-width: 1px !important; }
                        .border-r { border-right-width: 1px !important; }
                        .border-t { border-top-width: 1px !important; }
                        .border-y { border-top-width: 1px !important; border-bottom-width: 1px !important; }
                        .grid { display: grid !important; }
                        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                        .flex { display: flex !important; }
                        .flex-col { flex-direction: column !important; }
                        .justify-center { justify-content: center !important; }
                        .justify-between { justify-content: space-between !important; }
                        .items-center { align-items: center !important; }
                        .items-start { align-items: flex-start !important; }
                        .items-end { align-items: flex-end !important; }
                        .gap-4 { gap: 1rem !important; }
                        .gap-6 { gap: 1.5rem !important; }
                        .p-2 { padding: 0.5rem !important; }
                        .p-4 { padding: 1rem !important; }
                        .p-8 { padding: 2rem !important; }
                        .px-3 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
                        .px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
                        .px-8 { padding-left: 2rem !important; padding-right: 2rem !important; }
                        .py-0\\.5 { padding-top: 0.125rem !important; padding-bottom: 0.125rem !important; }
                        .py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
                        .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
                        .pt-2 { padding-top: 0.5rem !important; }
                        .mb-1 { margin-bottom: 0.25rem !important; }
                        .mb-2 { margin-bottom: 0.5rem !important; }
                        .mb-4 { margin-bottom: 1rem !important; }
                        .mb-6 { margin-bottom: 1.5rem !important; }
                        .mt-1 { margin-top: 0.25rem !important; }
                        .mt-2 { margin-top: 0.5rem !important; }
                        .mt-3 { margin-top: 0.75rem !important; }
                        .mt-4 { margin-top: 1rem !important; }
                        .mt-16 { margin-top: 4rem !important; }
                        .mx-2 { margin-left: 0.5rem !important; margin-right: 0.5rem !important; }
                        .mx-8 { margin-left: 2rem !important; margin-right: 2rem !important; }
                        .w-12 { width: 3rem !important; }
                        .w-24 { width: 6rem !important; }
                        .w-32 { width: 8rem !important; }
                        .w-48 { width: 12rem !important; }
                        .w-full { width: 100% !important; }
                        .m-0 { margin: 0 !important; }
                        .p-0 { padding: 0 !important; }
                        .mb-0 { margin-bottom: 0 !important; }
                        .mt-0 { margin-top: 0 !important; }
                        .leading-none { line-height: 1 !important; }
                        .leading-tight { line-height: 1.1 !important; }
                        .gap-0 { gap: 0 !important; }
                        .min-h-\\[30px\\] { min-height: 30px !important; }
                        .min-h-\\[40px\\] { min-height: 40px !important; }
                        .text-center { text-align: center !important; }
                        .text-right { text-align: right !important; }
                        .text-gray-400 { color: #9ca3af !important; }
                        .text-gray-500 { color: #6b7280 !important; }
                        .text-red-600 { color: #dc2626 !important; }
                        .text-\\[8px\\] { font-size: 8px !important; }
                        .text-\\[9px\\] { font-size: 9px !important; }
                        .text-\\[10px\\] { font-size: 10px !important; }
                        .text-\\[11px\\] { font-size: 11px !important; }
                        .text-\\[12px\\] { font-size: 12px !important; }
                        .text-\\[13px\\] { font-size: 13px !important; }
                        .text-\\[14px\\] { font-size: 14px !important; }
                        .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
                        .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
                        .text-\\[150px\\] { font-size: 150px !important; }
                        .font-bold { font-weight: 700 !important; }
                        .font-black { font-weight: 900 !important; }
                        .font-medium { font-weight: 500 !important; }
                        .uppercase { text-transform: uppercase !important; }
                        .italic { font-style: italic !important; }
                        .tracking-wider { letter-spacing: 0.05em !important; }
                        .tracking-widest { letter-spacing: 0.1em !important; }
                        .tracking-\\[15px\\] { letter-spacing: 15px !important; }
                        .border-collapse { border-collapse: collapse !important; }
                        .rounded-full { border-radius: 9999px !important; }
                        .rounded-\\[40px\\] { border-radius: 40px !important; }
                        .border-2 { border-width: 2px !important; }
                        .border-\\[12px\\] { border-width: 12px !important; }
                        .inline-block { display: inline-block !important; }
                        .opacity-\\[0\\.08\\] { opacity: 0.08 !important; }
                        .z-0 { z-index: 0 !important; }
                        .z-10 { z-index: 10 !important; }
                        .inset-0 { top: 0; right: 0; bottom: 0; left: 0 !important; }
                        .relative { position: relative !important; }
                        .absolute { position: absolute !important; }
                        .pointer-events-none { pointer-events: none !important; }
                        .overflow-hidden { overflow: hidden !important; }
                        .-rotate-\\[35deg\\] { transform: rotate(-35deg) !important; }
                        .whitespace-nowrap { white-space: nowrap !important; }
                        .print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; }
                        .page-break { page-break-after: always !important; }
                        .border-t-2 { border-top: 2px solid black !important; }
                        .space-y-1 > * + * { margin-top: 0.25rem !important; }
                        body { margin: 0 !important; padding: 0 !important; }
                        @page { margin: 5mm !important; }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${printContent}
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
                Hospital Bill Receipt
            </DialogTitle>
            <div className="flex items-center gap-2">
                <Button onClick={handlePrint} size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Bill
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:bg-black/5" onClick={() => onOpenChange(false)}>
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
        
        <div className="p-4 overflow-y-auto bg-zinc-200/50 max-h-[85vh]" ref={printRef}>
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                    <span className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Bill...</span>
                </div>
            ) : (
                <div className="bg-white shadow-2xl mx-auto w-[210mm]">
                    <ReceiptContent copyTitle="HOSPITAL BILL — ORIGINAL COPY" />
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
