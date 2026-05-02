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
import { useAuthStore } from "@/store/use-auth-store"
import { Loader2, Printer, X } from "lucide-react"
import { useRef } from "react"
import { useStoreContext } from "@/store/use-store-context"

interface HospitalReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: any | null
  patient?: any
  bed?: any
}

export function HospitalReceiptDialog({ open, onOpenChange, transaction, patient: passedPatient, bed: passedBed }: HospitalReceiptDialogProps) {
  const { stores, activeStoreId } = useStoreContext()
  const activeBranch = stores.find(s => s.id === activeStoreId) || stores[0]
  
  const saleId = transaction?.id || transaction?.sale?.id || transaction?.data?.sale?.id
  const { data: saleRes, isLoading } = useSale(saleId || "")
  
  // saleRes.data is the response from salesService.getSale: { success, message, data: Sale }
  // So the actual sale object is in saleRes.data.data
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

  const netTotal = Number(data?.netPrice || data?.total || 0)
  const paidAmount = Number(data?.paidAmount || 0)
  const dueAmount = Number(data?.dueAmount || 0)
  const discountAmount = Number(data?.discountAmount || data?.discount || 0)
  const invoiceNumber = data?.invoiceNumber || data?.number || "N/A"
  const date = data?.date || data?.createdAt || new Date().toISOString()
  const isFullyPaid = dueAmount <= 0
  
  const patient = passedPatient || data?.patientAdmission?.patient || data?.patient
  const bed = passedBed || data?.patientAdmission?.bed
  
  const handlePrint = () => {
        const content = printRef.current?.innerHTML
        if (!content) return

        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '100%'
        iframe.style.bottom = '100%'
        iframe.style.width = '0'
        iframe.style.height = '0'
        iframe.style.border = 'none'
        document.body.appendChild(iframe)

        const doc = iframe.contentWindow?.document
        if (!doc) return

        doc.open()
        doc.write(`
            <html>
                <head>
                    <title>Hospital Bill - ${patient?.name || invoiceNumber}</title>
                    <style>
                        @page { size: A5; margin: 5mm; }
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                            color: #000; 
                            line-height: 1.2; 
                            padding: 0; 
                            margin: 0; 
                            background: white;
                        }
                        .print-container { width: 148mm; margin: 0 auto; background: white; padding: 5mm; box-sizing: border-box; position: relative; min-height: 210mm; }
                        
                        /* Layout Utilities */
                        .flex { display: flex !important; }
                        .flex-col { flex-direction: column !important; }
                        .justify-between { justify-content: space-between !important; }
                        .justify-center { justify-content: center !important; }
                        .items-center { align-items: center !important; }
                        .items-end { align-items: flex-end !important; }
                        .text-center { text-align: center !important; }
                        .text-right { text-align: right !important; }
                        .grid { display: grid !important; }
                        .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                        .w-full { width: 100% !important; }
                        
                        /* Borders */
                        .border { border: 1px solid black !important; }
                        .border-b { border-bottom: 1px solid black !important; }
                        .border-r { border-right: 1px solid black !important; }
                        .border-t { border-top: 1px solid black !important; }
                        .border-dashed { border-style: dashed !important; border-width: 1px !important; }
                        .border-black { border-color: black !important; }
                        
                        /* Typography */
                        .font-bold { font-weight: bold !important; }
                        .font-black { font-weight: 900 !important; }
                        .uppercase { text-transform: uppercase !important; }
                        .text-xs { font-size: 11px !important; }
                        .text-sm { font-size: 14px !important; }
                        .text-base { font-size: 17px !important; }
                        .text-lg { font-size: 20px !important; }
                        .text-2xl { font-size: 28px !important; }
                        .text-\\[10px\\] { font-size: 10px !important; }
                        .text-\\[11px\\] { font-size: 11px !important; }
                        .text-\\[12px\\] { font-size: 12px !important; }
                        .italic { font-style: italic !important; }
                        
                        /* Spacing */
                        .p-2 { padding: 6px !important; }
                        .px-2 { padding-left: 6px !important; padding-right: 6px !important; }
                        .py-1 { padding-top: 4px !important; padding-bottom: 4px !important; }
                        .mb-1 { margin-bottom: 4px !important; }
                        .mb-2 { margin-bottom: 8px !important; }
                        .mb-4 { margin-bottom: 16px !important; }
                        .mt-2 { margin-top: 8px !important; }
                        .mt-4 { margin-top: 16px !important; }
                        .mt-8 { margin-top: 32px !important; }
                        .mt-12 { margin-top: 48px !important; }
                        
                        .letterhead-spacer { height: 35mm !important; display: block !important; }
                        
                        /* Core Components */
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th { text-align: left; padding: 6px; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid black; }
                        td { padding: 6px; border-bottom: 1px dashed #ccc; font-size: 12px; }
                        
                        @media print {
                            .no-print { display: none; }
                            body { background: white; }
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        ${content}
                    </div>
                </body>
            </html>
        `)
        doc.close()

        setTimeout(() => {
            iframe.contentWindow?.focus()
            iframe.contentWindow?.print()
            setTimeout(() => {
                document.body.removeChild(iframe)
            }, 1000)
        }, 500)
    }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-white border-none shadow-2xl light">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50/80 backdrop-blur text-slate-900">
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-slate-900">
                <Printer className="w-5 h-5 text-blue-600" />
                Hospital Bill Preview (A5)
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
        
        <div className="p-4 max-h-[85vh] overflow-y-auto bg-zinc-200/50">
            <div className="bg-white shadow-2xl mx-auto p-8 w-[148mm] min-h-[210mm] relative" ref={printRef}>
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                        <span className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Loading Bill...</span>
                    </div>
                ) : (
                    <div className="text-black bg-white antialiased font-sans flex flex-col h-full">
                        {/* Letterhead Space */}
                        <div className="h-4 letterhead-spacer" />

                        <div className="text-center mb-4">
                            <h2 className="text-xl font-black uppercase tracking-widest border-b-2 border-black inline-block pb-1">Hospital Bill</h2>
                        </div>

                        {/* Info Box */}
                        <div className="border border-black flex flex-col mb-4 bg-white relative z-10">
                            <div className="grid grid-cols-2 border-b border-black">
                                <div className="p-2 border-r border-black flex">
                                    <span className="w-20 text-[10px] font-black uppercase">Inv. No:</span>
                                    <span className="font-bold text-sm">{invoiceNumber}</span>
                                </div>
                                <div className="p-2 flex">
                                    <span className="w-20 text-[10px] font-black uppercase">Date:</span>
                                    <span className="font-bold text-sm">{new Date(date).toLocaleString('en-GB')}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 border-b border-black">
                                <div className="p-2 border-r border-black flex">
                                    <span className="w-20 text-[10px] font-black uppercase">Patient:</span>
                                    <span className="font-bold text-sm uppercase">{patient?.name || 'N/A'}</span>
                                </div>
                                <div className="p-2 flex">
                                    <span className="w-20 text-[10px] font-black uppercase">Reg. ID:</span>
                                    <span className="font-bold text-sm">{patient?.uhid || patient?.patientNumber || 'N/A'}</span>
                                </div>
                            </div>
                            {bed && (
                            <div className="p-2 flex">
                                <span className="w-20 text-[10px] font-black uppercase">Ward/Bed:</span>
                                <span className="font-bold text-sm">{bed?.section?.name} - {bed?.bedNumber}</span>
                            </div>
                            )}
                        </div>

                        {/* Billing Summary Section */}
                        <table className="w-full relative z-10 mb-4">
                            <thead>
                                <tr>
                                    <th className="w-1/2">Service / Item</th>
                                    <th className="text-center">Qty</th>
                                    <th className="text-right">Rate</th>
                                    <th className="text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {normalizedItems.map((item: any, idx: number) => {
                                    const itemTotal = item.price * item.quantity
                                    const itemDisc = item.discountAmount || (item.discountPercentage ? (itemTotal * item.discountPercentage) / 100 : 0)
                                    const netItemTotal = itemTotal - itemDisc
                                    return (
                                        <tr key={idx}>
                                            <td className="font-bold text-[11px]">{item.name}</td>
                                            <td className="text-center text-[11px] font-semibold">{item.quantity}</td>
                                            <td className="text-right text-[11px] font-semibold">{item.price.toFixed(2)}</td>
                                            <td className="text-right text-[11px] font-black">{netItemTotal.toFixed(2)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>

                        {/* Final Financial Settlement */}
                        <div className="w-[80%] mx-auto border-t-2 border-black mt-4 pt-2 relative z-10">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[11px] font-black uppercase">Gross Total:</span>
                                <span className="text-[12px] font-black">{grossTotal.toFixed(2)} ৳</span>
                            </div>
                            {(totalItemDiscount > 0 || discountAmount > 0) && (
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black uppercase italic">Discount (-):</span>
                                <span className="text-[11px] font-bold">{(totalItemDiscount + discountAmount).toFixed(2)} ৳</span>
                            </div>
                            )}
                            <div className="border-b border-black w-full mb-1"></div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[12px] font-black uppercase">Net Payable:</span>
                                <span className="text-[14px] font-black">{netTotal.toFixed(2)} ৳</span>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[11px] font-bold uppercase italic">Paid Amount:</span>
                                <span className="text-[11px] font-bold">{paidAmount.toFixed(2)} ৳</span>
                            </div>
                            <div className="border-b border-black w-full mb-1"></div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[12px] font-black uppercase">{dueAmount > 0 ? 'Total Due:' : 'Return:'}</span>
                                <span className="text-[14px] font-black">{dueAmount > 0 ? dueAmount.toFixed(2) : Math.max(0, paidAmount - netTotal).toFixed(2)} ৳</span>
                            </div>
                        </div>

                        {/* Remarks Note */}
                        {(data?.note || data?.payments?.[0]?.note) && (
                            <div className="mt-4 p-2 bg-gray-50 border border-black border-dotted flex gap-2 items-start relative z-10 w-[80%] mx-auto">
                                <span className="shrink-0 uppercase text-[10px] font-black opacity-70">Remarks:</span>
                                <span className="italic font-bold text-[10px] uppercase leading-tight">{data?.note || data?.payments?.[0]?.note}</span>
                            </div>
                        )}

                        <div className="mt-8 flex justify-between px-4 relative z-10">
                            <div className="text-center space-y-1">
                                <div className="border-t border-black w-32 mx-auto"></div>
                                <span className="text-[10px] font-black uppercase">Prepared By</span>
                                <p className="text-[9px] font-bold text-black italic">{user?.fullName || 'Staff'}</p>
                            </div>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-black/10 text-[8px] text-gray-500 font-bold flex justify-between uppercase tracking-widest relative z-10">
                            <span>* System generated Hospital Bill</span>
                            <span>Printed: {new Date().toLocaleString('en-GB')}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
