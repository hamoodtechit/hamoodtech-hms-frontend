"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTitle
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from "@/lib/utils"
import { useAuthStore } from "@/store/use-auth-store"
import { Loader2, Printer, X } from "lucide-react"
import { useRef } from "react"
import { DischargeInitiateData, Admission } from "@/types/patient"

interface DischargeReceiptDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    admission: Admission | null
    data: DischargeInitiateData | null
    finalPaidAmount?: number
    overallDiscount?: number
}

export function DischargeReceiptDialog({ 
    open, 
    onOpenChange, 
    admission, 
    data,
    finalPaidAmount = 0,
    overallDiscount = 0
}: DischargeReceiptDialogProps) {
    const { user } = useAuthStore()
    const printRef = useRef<HTMLDivElement>(null)

    if (!admission || !data) return null

    const patient = admission.patient
    // We already have the snapshot in data.
    // However, the 'finalPaidAmount' and 'overallDiscount' provided is what applies to the Discharge Action itself.
    
    // Original Totals from Initiate Data
    const grossHospitalBill = data.hospital.totals.totalBill || data.hospital.totals.totalPrice || data.hospital.totals.netPrice || 0
    const grossPharmacyBill = data.pharmacy.totals.totalBill || data.pharmacy.totals.totalPrice || data.pharmacy.totals.netPrice || 0
    const grossTotalBill = data.grandTotal.totalBill || data.grandTotal.totalPrice || data.grandTotal.netPrice || 0

    // Calculate applied discounts (if any item-level discounts exist, they are reflected in totalBill vs subtotal, but we rely on what's given)
    // The previous paid amounts BEFORE this discharge:
    const prevHospitalPaid = data.hospital.totals.totalPaid || data.hospital.totals.paidAmount || 0
    const prevPharmacyPaid = data.pharmacy.totals.totalPaid || data.pharmacy.totals.paidAmount || 0
    const prevTotalPaid = data.grandTotal.totalPaid || data.grandTotal.paidAmount || 0

    // The Net Bill after the global discount (which the user says is "outside of items")
    const netPayable = grossTotalBill - overallDiscount

    // Total Paid is Previous Paid + finalPaidAmount
    const totalActuallyPaid = prevTotalPaid + finalPaidAmount

    // Current Due
    const currentDue = netPayable - totalActuallyPaid

    const isFullyPaid = currentDue <= 0

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
                    <title>Discharge Receipt - ${patient?.name}</title>
                    <style>
                        @page { size: A4; margin: 5mm; }
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                            color: #000; 
                            line-height: 1.2; 
                            padding: 0; 
                            margin: 0; 
                            background: white;
                        }
                        .print-container { width: 210mm; margin: 0 auto; background: white; padding: 5mm; box-sizing: border-box; position: relative; min-height: 297mm; }
                        
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
                        .text-\[10px\] { font-size: 10px !important; }
                        .italic { font-style: italic !important; }
                        
                        /* Spacing */
                        .p-2 { padding: 8px !important; }
                        .px-2 { padding-left: 8px !important; padding-right: 8px !important; }
                        .py-1 { padding-top: 4px !important; padding-bottom: 4px !important; }
                        .mb-2 { margin-bottom: 8px !important; }
                        .mb-4 { margin-bottom: 16px !important; }
                        .mt-4 { margin-top: 16px !important; }
                        .mt-8 { margin-top: 32px !important; }
                        .mt-12 { margin-top: 48px !important; }

                        /* Hologram Styles */
                        .hologram-container {
                            position: absolute;
                            inset: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            pointer-events: none;
                            overflow: hidden;
                            z-index: 0;
                            opacity: 0.1 !important;
                        }
                        .hologram-text {
                            font-size: 120px !important;
                            font-weight: 900 !important;
                            text-transform: uppercase !important;
                            transform: rotate(-35deg) !important;
                            border: 12px solid currentColor !important;
                            padding: 24px 48px !important;
                            border-radius: 40px !important;
                            letter-spacing: 15px !important;
                        }
                        .hologram-paid { color: #10b981 !important; }
                        .hologram-due { color: #f43f5e !important; }
                        
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
            <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden bg-white border-none shadow-2xl light">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50/80 backdrop-blur text-slate-900">
                    <DialogTitle className="text-xl font-black flex items-center gap-2 text-slate-900">
                        <Printer className="w-5 h-5 text-blue-600" />
                        Discharge Receipt Preview
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

                <ScrollArea className="max-h-[85vh] p-8 bg-zinc-200/50">
                    <div className="bg-white shadow-2xl mx-auto p-12 w-[210mm] min-h-[297mm] relative" ref={printRef}>
                        <div className="text-black bg-white antialiased font-sans flex flex-col h-full">
                            
                            {/* Wait for Letterhead Space */}
                            <div className="h-4 letterhead-spacer" />

                            <div className="text-center mb-4">
                                <h2 className="text-xl font-black uppercase tracking-widest border-b-2 border-black inline-block pb-1">Discharge Bill & Receipt</h2>
                            </div>

                            {/* Info Box */}
                            <div className="border border-black flex flex-col mb-4 bg-white relative z-10">
                                <div className="grid grid-cols-2 border-b border-black">
                                    <div className="p-2 border-r border-black flex">
                                        <span className="w-24 text-[10px] font-black uppercase">Reg. ID:</span>
                                        <span className="font-bold text-sm">{patient?.uhid || patient?.patientNumber || 'N/A'}</span>
                                    </div>
                                    <div className="p-2 flex">
                                        <span className="w-24 text-[10px] font-black uppercase">Adm. ID:</span>
                                        <span className="font-bold text-sm">A{admission?.id?.slice(0, 8).toUpperCase() || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 border-b border-black">
                                    <div className="p-2 border-r border-black flex">
                                        <span className="w-24 text-[10px] font-black uppercase">Patient Name:</span>
                                        <span className="font-bold text-sm uppercase">{patient?.name || 'N/A'}</span>
                                    </div>
                                    <div className="p-2 flex">
                                        <span className="w-24 text-[10px] font-black uppercase">Age / Sex:</span>
                                        <span className="font-bold text-sm">{patient?.age} Y / {patient?.gender?.charAt(0).toUpperCase()}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 border-b border-black">
                                    <div className="p-2 border-r border-black flex">
                                        <span className="w-24 text-[10px] font-black uppercase">Admission:</span>
                                        <span className="font-bold text-xs">{admission?.admissionDate ? new Date(admission.admissionDate).toLocaleString('en-GB') : 'N/A'}</span>
                                    </div>
                                    <div className="p-2 flex">
                                        <span className="w-24 text-[10px] font-black uppercase">Discharge:</span>
                                        <span className="font-bold text-xs">{new Date().toLocaleString('en-GB')}</span>
                                    </div>
                                </div>
                                <div className="p-2 flex">
                                    <span className="w-24 text-[10px] font-black uppercase">Doctor:</span>
                                    <span className="font-bold text-sm">{admission?.doctor?.fullName || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Billing Summary Section */}
                            {/* Billing Summary Section Removed Per Request */}

                            {/* Final Financial Settlement */}
                            <div className="w-[80%] mx-auto border-t-2 border-black mt-8 pt-4 relative z-10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-black uppercase">Gross Total Amount:</span>
                                    <span className="text-sm font-black">{formatCurrency(grossTotalBill)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-black uppercase italic">Global Discount (-):</span>
                                    <span className="text-sm font-bold">{formatCurrency(overallDiscount)}</span>
                                </div>
                                <div className="border-b border-black w-full mb-1"></div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-black uppercase">Net Payable Amount:</span>
                                    <span className="text-base font-black">{formatCurrency(netPayable)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold uppercase italic">Previously Paid:</span>
                                    <span className="text-xs font-bold">{formatCurrency(prevTotalPaid)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold uppercase italic">Discharge Collection:</span>
                                    <span className="text-xs font-bold">{formatCurrency(finalPaidAmount)}</span>
                                </div>
                                <div className="border-b border-black w-full mb-1"></div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm font-black uppercase">Total Due Left:</span>
                                    <span className="text-lg font-black">{formatCurrency(Math.max(0, currentDue))}</span>
                                </div>
                            </div>

                            {/* Signatures */}
                            <div className="mt-16 flex justify-between px-4 relative z-10">
                                <div className="text-center space-y-1">
                                    <div className="border-t border-black w-40 mx-auto"></div>
                                    <span className="text-[11px] font-black uppercase">Prepared By</span>
                                    <p className="text-[10px] font-bold text-black italic">{user?.fullName}</p>
                                </div>
                                <div className="text-center space-y-1">
                                    <div className="border-t border-black w-48 mx-auto"></div>
                                    <span className="text-[11px] font-black uppercase">Authorized Signature</span>
                                    <p className="text-[10px] font-bold text-black italic">Hospital Authority</p>
                                </div>
                            </div>

                            {/* Hologram */}
                            {/* Hologram */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0 opacity-10">
                                {isFullyPaid ? (
                                    <div className="text-[120px] font-black uppercase -rotate-[35deg] border-[12px] border-emerald-500 text-emerald-500 px-12 py-6 rounded-[40px] tracking-[15px]">PAID</div>
                                ) : (
                                    <div className="text-[120px] font-black uppercase -rotate-[35deg] border-[12px] border-rose-500 text-rose-500 px-12 py-6 rounded-[40px] tracking-[15px]">DUE</div>
                                )}
                            </div>
                            
                            <div className="mt-8 pt-4 border-t border-black/10 text-[9px] text-gray-500 font-bold flex justify-between uppercase tracking-widest relative z-10">
                                <span>* This is a computer generated receipt</span>
                                <span>Printed: {new Date().toLocaleString('en-GB')}</span>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
