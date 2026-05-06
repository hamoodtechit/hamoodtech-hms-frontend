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
    <div className="relative p-2 md:p-4 pt-[5mm] md:pt-[10mm] flex-1 flex flex-col z-10 w-full mb-0 border-b border-black border-dashed pb-8 print:border-b-0 print:mb-0 print:pb-0 text-black">
        <div className="relative border border-black border-dashed p-4 text-[12px] font-medium font-sans w-full flex-1 flex flex-col bg-white text-black">

        {/* PAID/DUE Stamps */}
        <div className="absolute top-[20%] right-[10%] pointer-events-none z-0 opacity-[0.15]">
            {isFullyPaid ? (
                <div className="text-[80px] font-black uppercase text-green-600 -rotate-[25deg] border-[8px] border-green-600 px-8 py-2 rounded-[20px] tracking-[10px]">
                    PAID
                </div>
            ) : (
                <div className="text-[80px] font-black uppercase text-red-600 -rotate-[25deg] border-[8px] border-red-600 px-8 py-2 rounded-[20px] tracking-[10px]">
                    DUE
                </div>
            )}
        </div>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', gap: '0' }} className="text-center mb-1 relative z-10">
             <div className="flex justify-center" style={{ marginBottom: '2px' }}>
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={data.branch?.logoUrl || "/Logo.png"} alt="Logo" style={{ height: '60px', width: 'auto', display: 'block', margin: '0 auto' }} />
             </div>
            <h1 style={{ margin: '0', padding: '0', fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1', width: '100%' }}>{general?.hospitalName || data.branch?.name || "HOSPITAL"}</h1>
            <p style={{ margin: '0', padding: '0', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2' }}>{general?.address || data.branch?.address || "Hospital Address"}</p>
            <p style={{ margin: '0', padding: '0', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2' }}>Ph: {general?.phone || data.branch?.phone || "Hospital Phone"}</p>
            <p style={{ margin: '0', padding: '0', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2' }}>Email: {general?.email || data.branch?.email || "N/A"}</p>
            
            <div className="flex justify-center gap-6 text-[11px] font-bold uppercase mt-1">
                {(data.branch?.licenseNumber || activeBranch?.licenseNumber) && <span>License No: {data.branch?.licenseNumber || activeBranch?.licenseNumber}</span>}
                {(data.branch?.taxRegistration || activeBranch?.taxRegistration) && <span>TX Registration No: {data.branch?.taxRegistration || activeBranch?.taxRegistration}</span>}
            </div>

            <div className="mt-2 inline-block border border-black rounded-full px-6 py-1 font-bold tracking-wider relative bg-gray-100/50">
                {copyTitle}
            </div>
        </div>

        {/* Info Table Box */}
        <div className="border border-black mb-2 relative z-10 mt-2 text-[13px]">
            <div className="grid grid-cols-2 border-b border-black">
                <div className="p-1 px-3 border-r border-black font-bold flex items-center">
                    UHID : {patient?.uhid || patient?.patientNumber || 'N/A'}
                </div>
                <div className="p-1 px-3 flex items-center justify-between font-bold">
                    <span>Bill No. : {invoiceNumber}</span>
                    <span className="text-[11px]">Lab No. : {data.labNumber || "N/A"}</span>
                </div>
            </div>
            <div className="grid grid-cols-2 border-b border-black">
                <div className="p-1 px-3 border-r border-black font-bold flex items-center">
                    Name <span className="mx-2">:</span> {patient?.name || 'N/A'}
                </div>
                <div className="p-1 px-3 font-bold flex items-center">
                    <span className="w-12">Date</span> <span className="mr-2">:</span> {new Date(date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                </div>
            </div>
            <div className="grid grid-cols-1 border-b border-black">
                <div className="p-1 px-3 font-bold flex flex-wrap items-center">
                    <div className="flex gap-3 mr-8">
                        <span>Age : {patient?.age || 'N/A'}Y</span>
                        <span>Sex : {patient?.gender || 'N/A'}</span>
                        <span>Contact : {patient?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex-1">
                        RefBy : {data.referredByName || data.consultantName || 'N/A'}
                    </div>
                </div>
            </div>
            {bed && (
            <div className="p-1 px-3 font-bold flex items-center border-b border-black">
                <span className="w-24 uppercase">Ward/Bed:</span>
                <span>{bed?.section?.name} - {bed?.bedNumber}</span>
            </div>
            )}
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }} className="relative z-10 mb-2 text-[13px]">
            <thead>
                <tr style={{ borderBottom: '2px solid black' }} className="font-black">
                    <th style={{ textAlign: 'left', padding: '6px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service / Item</th>
                    <th style={{ textAlign: 'center', padding: '6px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '6px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate</th>
                    <th style={{ textAlign: 'right', padding: '6px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
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
        <div className="flex justify-between items-start mt-2 mb-4 relative z-10 text-[13px]">
            <div className="pt-2 pl-4">
                {isFullyPaid ? (
                    <div className="border-4 border-green-600 text-green-600 font-black text-2xl px-6 py-2 rounded-xl rotate-[-5deg] inline-block uppercase">
                        Full Paid
                    </div>
                ) : (
                    <div className="border-4 border-red-600 text-red-600 font-black text-2xl px-6 py-2 rounded-xl rotate-[-5deg] inline-block uppercase">
                        Due
                    </div>
                )}
            </div>
            <div className="w-[250px]">
                <div className="flex justify-between py-0.5 font-black">
                    <span>Gross Total:</span>
                    <span>{grossTotal.toFixed(2)} ৳</span>
                </div>
                {(totalItemDiscount > 0 || discountAmount > 0) && (
                <div className="flex justify-between py-0.5 font-black italic">
                    <span>Discount (-):</span>
                    <span>{(totalItemDiscount + discountAmount).toFixed(2)} ৳</span>
                </div>
                )}
                <div className="flex justify-between py-0.5 font-black text-[16px] border-y border-black mt-1 pb-1">
                    <span>Net Payable:</span>
                    <span>{netTotal.toFixed(2)} ৳</span>
                </div>
                <div className="flex justify-between py-0.5 font-black">
                    <span>Paid Amount:</span>
                    <span>{paidAmount.toFixed(2)} ৳</span>
                </div>
                <div className="flex justify-between py-0.5 font-black text-red-600">
                    <span>Total Due:</span>
                    <span>{dueAmount.toFixed(2)} ৳</span>
                </div>
            </div>
        </div>

        {/* In Words */}
        <div className="mt-2 px-8 relative z-10">
            <div className="border border-black p-2 bg-gray-50/50 font-black text-[12px]">
                <span className="uppercase opacity-50">In Words: </span>
                <span className="uppercase">{amountInWords}</span>
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
        <div className="mt-12 flex justify-between px-8 relative z-10">
            <div className="text-center space-y-1">
                <div className="border-t border-black w-48 mx-auto"></div>
                <span className="text-[12px] font-black uppercase">Prepared By</span>
                <p className="text-[10px] font-bold text-black italic">{user?.fullName || 'Staff'}</p>
            </div>
            <div className="text-center space-y-1">
                <div className="border-t border-black w-48 mx-auto"></div>
                <span className="text-[12px] font-black uppercase">Authorized By</span>
            </div>
        </div>
        
        <div className="mt-auto pt-4 border-t border-black/10 text-[8px] text-black/50 font-bold flex justify-between uppercase tracking-widest relative z-10">
            <span>*Powered by Hamood Tech</span>
            <span>Printed: {new Date().toLocaleString('en-GB')}</span>
        </div>
        </div>
    </div>
  )

  const handlePrint = () => {
        const printContent = document.getElementById('hospital-receipt-content')?.innerHTML;
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
                    <title>Hospital Bill - ${patient?.name || invoiceNumber}</title>
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
                        .w-\\[250px\\] { width: 250px !important; }
                        .w-full { width: 100% !important; }
                        .m-0 { margin: 0 !important; }
                        .p-0 { padding: 0 !important; }
                        .mb-0 { margin-bottom: 0 !important; }
                        .mb-1 { margin-bottom: 4px !important; }
                        .mb-2 { margin-bottom: 8px !important; }
                        .mt-0 { margin-top: 0 !important; }
                        .mt-2 { margin-top: 8px !important; }
                        .mt-4 { margin-top: 16px !important; }
                        .mt-12 { margin-top: 3rem !important; }
                        .leading-none { line-height: 1 !important; }
                        .leading-tight { line-height: 1.1 !important; }
                        .gap-0 { gap: 0 !important; }
                        .gap-8 { gap: 2rem !important; }
                        .min-h-\\[30px\\] { min-height: 30px !important; }
                        .min-h-\\[40px\\] { min-height: 40px !important; }
                        .text-center { text-align: center !important; }
                        .text-right { text-align: right !important; }
                        .text-gray-400 { color: #9ca3af !important; }
                        .text-gray-500 { color: #6b7280 !important; }
                        .text-green-600 { color: #16a34a !important; }
                        .text-red-600 { color: #dc2626 !important; }
                        .text-\\[10px\\] { font-size: 10px !important; }
                        .text-\\[11px\\] { font-size: 11px !important; }
                        .text-\\[12px\\] { font-size: 12px !important; }
                        .text-\\[13px\\] { font-size: 13px !important; }
                        .text-\\[16px\\] { font-size: 16px !important; }
                        .text-sm { font-size: 0.875rem !important; line-height: 1.25rem !important; }
                        .text-2xl { font-size: 1.5rem !important; line-height: 2rem !important; }
                        .text-\\[80px\\] { font-size: 80px !important; }
                        .text-\\[150px\\] { font-size: 150px !important; }
                        .font-bold { font-weight: 700 !important; }
                        .font-black { font-weight: 900 !important; }
                        .font-medium { font-weight: 500 !important; }
                        .uppercase { text-transform: uppercase !important; }
                        .italic { font-style: italic !important; }
                        .tracking-wider { letter-spacing: 0.05em !important; }
                        .tracking-widest { letter-spacing: 0.1em !important; }
                        .tracking-\\[10px\\] { letter-spacing: 10px !important; }
                        .tracking-\\[15px\\] { letter-spacing: 15px !important; }
                        .border-collapse { border-collapse: collapse !important; }
                        .rounded-full { border-radius: 9999px !important; }
                        .rounded-\\[20px\\] { border-radius: 20px !important; }
                        .rounded-\\[40px\\] { border-radius: 40px !important; }
                        .border-4 { border-width: 4px !important; }
                        .border-8 { border-width: 8px !important; }
                        .border-2 { border-width: 2px !important; }
                        .border-\\[12px\\] { border-width: 12px !important; }
                        .inline-block { display: inline-block !important; }
                        .opacity-\\[0\\.08\\] { opacity: 0.08 !important; }
                        .opacity-\\[0\\.15\\] { opacity: 0.15 !important; }
                        .z-0 { z-index: 0 !important; }
                        .z-10 { z-index: 10 !important; }
                        .inset-0 { top: 0; right: 0; bottom: 0; left: 0 !important; }
                        .top-\\[20\\%\\] { top: 20% !important; }
                        .right-\\[10\\%\\] { right: 10% !important; }
                        .relative { position: relative !important; }
                        .absolute { position: absolute !important; }
                        .pointer-events-none { pointer-events: none !important; }
                        .overflow-hidden { overflow: hidden !important; }
                        .-rotate-\\[25deg\\] { transform: rotate(-25deg) !important; }
                        .-rotate-\\[5deg\\] { transform: rotate(-5deg) !important; }
                        .-rotate-\\[35deg\\] { transform: rotate(-35deg) !important; }
                        .whitespace-nowrap { white-space: nowrap !important; }
                        .print-container { width: 100% !important; margin: 0 !important; padding: 0 !important; }
                        .page-break { page-break-after: always !important; }
                        .border-t-2 { border-top: 2px solid black !important; }
                        .space-y-1 > * + * { margin-top: 0.25rem !important; }
                        body { margin: 0 !important; padding: 0 !important; }
                        @page { margin: 5mm !important; }
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
        
        <div className="p-0 max-h-[85vh] overflow-y-auto print:max-h-none print:p-0 flex flex-col bg-white text-black" id="hospital-receipt-content" style={{ width: "100%", maxWidth: "210mm", margin: "0 auto" }}>
            {isLoading ? (
                <div className="h-40 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
                </div>
            ) : (
                <ReceiptContent copyTitle="HOSPITAL BILL — ORIGINAL COPY" />
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
