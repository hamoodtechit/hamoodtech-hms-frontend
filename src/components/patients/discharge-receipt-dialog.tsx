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
import { calculateExactAge } from "@/lib/age-calculator"
import { Loader2, Printer, X } from "lucide-react"
import { useRef, useMemo } from "react"
import { DischargeInitiateData, Admission } from "@/types/patient"

interface DischargeReceiptDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    admission: Admission | null
    data: DischargeInitiateData | null
    finalPaidAmount?: number
    overallDiscount?: number
    remarks?: string
}

export function DischargeReceiptDialog({ 
    open, 
    onOpenChange, 
    admission, 
    data,
    finalPaidAmount = 0,
    overallDiscount = 0,
    remarks = ""
}: DischargeReceiptDialogProps) {
    const { user } = useAuthStore()
    const printRef = useRef<HTMLDivElement>(null)

    // ── Bed Rent Calculation (must be before any conditional return) ──
    const bedRentCalc = useMemo(() => {
        if (!admission || !data) return null
        const bedType = admission?.bed?.bedType
        if (!bedType?.pricePerDay || !admission?.admissionDate) return null

        const pricePerDay = Number(bedType.pricePerDay)
        const admissionDate = new Date(admission.admissionDate)
        const today = new Date()
        const diffMs = today.getTime() - admissionDate.getTime()
        const stayDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

        const totalBedRent = stayDays * pricePerDay

        let alreadyCharged = 0
        data?.hospital?.bills?.forEach((bill: any) => {
            bill.saleItems?.forEach((item: any) => {
                if (item.isBedCharge || item.itemName?.toLowerCase().includes('bed') || item.itemName?.toLowerCase().includes('cabin')) {
                    alreadyCharged += Number(item.price || 0) * Number(item.quantity || 1)
                }
            })
        })

        return {
            stayDays,
            pricePerDay,
            totalBedRent,
            alreadyCharged,
        }
    }, [admission, data])

    if (!admission || !data) return null

    const patient = admission.patient

    // ── Helper: compute item discount info ──────────────────────────
    const getItemDiscount = (item: any) => {
        const pct = Number(item.discountPercentage || 0)
        const amt = Number(item.discountAmount || 0)
        if (pct > 0) {
            const computed = (Number(item.price) * Number(item.quantity || 1) * pct) / 100
            return { pct, amt: computed, label: `${pct}%` }
        }
        if (amt > 0) return { pct: 0, amt, label: formatCurrency(amt) }
        return null
    }

    // We already have the snapshot in data.
    // However, the 'finalPaidAmount' and 'overallDiscount' provided is what applies to the Discharge Action itself.
    
    // Use values directly from grandTotal as provided in the API response
    const netPrice = Number(data.grandTotal.netPrice || 0)
    
    const prevTotalPaid = Number(data.grandTotal.paidAmount || data.grandTotal.totalPaid || 0)
    
    

    // The Net Bill after the global discount applied in the discharge dialog
    const finalNetPayable = netPrice - overallDiscount

    // Total Paid is Previous Paid + finalPaidAmount collected during this discharge
    const totalActuallyPaid = prevTotalPaid + finalPaidAmount

    // Current Due after all payments and discounts
    const currentDue = Math.max(0, finalNetPayable - totalActuallyPaid)

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

                        .remarks-box {
                            margin-top: 10px;
                            padding: 10px;
                            border: 1px dotted black;
                            background-color: #fafafa;
                            width: 80%;
                            margin-left: auto;
                            margin-right: auto;
                        }
                        
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
                        
                        ${remarks ? `
                        <div class="remarks-box">
                            <span class="text-[10px] font-black uppercase opacity-70">Remarks:</span>
                            <span class="italic font-bold text-[11px] uppercase">${remarks}</span>
                        </div>
                        ` : ''}
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
                                        <span className="font-bold text-sm">{patient?.dob ? calculateExactAge(patient.dob) : (patient?.age ? `${patient.age}Y` : "N/A")} / {patient?.gender?.charAt(0).toUpperCase()}</span>
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
                                        <span className="font-bold text-sm">
                                            {admission?.doctor?.fullName || admission?.refDoctorName || 'N/A'}
                                            {(admission?.doctor?.designation || (admission?.doctor as any)?.employee?.designation?.name) ? (
                                                <span className="font-bold lowercase">
                                                    {' '}
                                                    ({admission?.doctor?.designation || (admission?.doctor as any)?.employee?.designation?.name})
                                                </span>
                                            ) : ''}
                                        </span>
                                    </div>
                            </div>

                            {/* Billing Summary Section */}
                            {data?.hospital?.bills && data.hospital.bills.length > 0 && (
                                <div className="w-[80%] mx-auto mt-6 relative z-10">
                                    <h3 className="text-[11px] font-black uppercase border-b border-black pb-1 mb-2">Hospital Bills Breakdown</h3>
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="border-b border-black text-[10px] font-black uppercase pb-1 w-24">Inv. No</th>
                                                <th className="border-b border-black text-[10px] font-black uppercase pb-1">Particulars</th>
                                                <th className="border-b border-black text-[10px] font-black uppercase pb-1 text-right w-14">Qty</th>
                                                <th className="border-b border-black text-[10px] font-black uppercase pb-1 text-right w-20">Price</th>
                                                <th className="border-b border-black text-[10px] font-black uppercase pb-1 text-right w-20">Discount</th>
                                                <th className="border-b border-black text-[10px] font-black uppercase pb-1 text-right w-24">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.hospital.bills.map((bill: any) => {
                                                const billSubtotal = bill.saleItems?.reduce((sum: number, it: any) => {
                                                    const disc = getItemDiscount(it)
                                                    return sum + (Number(it.price) * Number(it.quantity || 1)) - (disc?.amt || 0)
                                                }, 0) || 0
                                                return (
                                                    <tr key={bill.id}>
                                                        <td className="border-b border-dashed border-gray-300 py-1.5 text-[10px] font-bold align-top">{bill.invoiceNumber}</td>
                                                        <td className="border-b border-dashed border-gray-300 py-1.5 align-top">
                                                            <div className="text-[9px] uppercase font-black text-black">
                                                                {bill.type === 'admission' ? 'Admission & Bed Service' : bill.type}
                                                            </div>
                                                            {bill.saleItems?.map((item: any) => {
                                                                const disc = getItemDiscount(item)
                                                                return (
                                                                    <div key={item.id} className="text-[8px] font-bold text-black/60 mt-0.5">
                                                                        {item.itemName}
                                                                        {disc && <span className="text-amber-700/70 italic"> (-{disc.label})</span>}
                                                                    </div>
                                                                )
                                                            })}
                                                        </td>
                                                        <td className="border-b border-dashed border-gray-300 py-1.5 text-[10px] text-right align-top" colSpan={5}></td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                    {/* Per-item breakdown table */}
                                    <table className="w-full text-left border-collapse mt-0">
                                        <tbody>
                                            {data.hospital.bills.flatMap((bill: any, bi: number) =>
                                                bill.saleItems?.map((item: any, ii: number) => {
                                                    const disc = getItemDiscount(item)
                                                    const itemTotal = (Number(item.price) * Number(item.quantity || 1)) - (disc?.amt || 0)
                                                    return (
                                                        <tr key={item.id}>
                                                            <td className="border-b border-dashed border-gray-300 py-0.5 text-[9px] font-bold pl-2 w-24">{bi === 0 && ii === 0 ? '' : ''}</td>
                                                            <td className="border-b border-dashed border-gray-300 py-0.5 text-[9px] pl-4">  {item.itemName}</td>
                                                            <td className="border-b border-dashed border-gray-300 py-0.5 text-[9px] text-right w-14">{item.quantity || 1}</td>
                                                            <td className="border-b border-dashed border-gray-300 py-0.5 text-[9px] text-right w-20">{formatCurrency(Number(item.price))}</td>
                                                            <td className="border-b border-dashed border-gray-300 py-0.5 text-[9px] text-right w-20">{disc ? disc.label : '—'}</td>
                                                            <td className="border-b border-dashed border-gray-300 py-0.5 text-[9px] font-black text-right w-24">{formatCurrency(itemTotal)}</td>
                                                        </tr>
                                                    )
                                                }) || []
                                            )}
                                            {data.hospital.bills.length > 0 && (
                                                <tr>
                                                    <td colSpan={3}></td>
                                                    <td colSpan={2} className="border-t-2 border-black pt-1 text-[9px] font-black uppercase text-right">Subtotal:</td>
                                                    <td className="border-t-2 border-black pt-1 text-[10px] font-black text-right">{formatCurrency(netPrice)}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* ── Bed Rent Summary ────────────────────────────── */}
                            {bedRentCalc && (
                                <div className="w-[80%] mx-auto mt-4 relative z-10">
                                    <h3 className="text-[11px] font-black uppercase border-b border-black pb-1 mb-2">Bed Rent Summary</h3>
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-[10px] font-bold">Daily Rate ({admission?.bed?.bedType?.name}):</span>
                                        <span className="text-[10px] font-black">{formatCurrency(bedRentCalc.pricePerDay)} × {bedRentCalc.stayDays} Days</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-[10px] font-bold">Total Bed Rent:</span>
                                        <span className="text-[10px] font-black">{formatCurrency(bedRentCalc.totalBedRent)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-[10px] font-bold">Already Charged:</span>
                                        <span className="text-[10px] font-black">-{formatCurrency(bedRentCalc.alreadyCharged)}</span>
                                    </div>
                                    <div className="border-b border-black w-full mb-0.5"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase">Net Bed Rent Balance:</span>
                                        <span className="text-[11px] font-black">{formatCurrency(Math.max(0, bedRentCalc.totalBedRent - bedRentCalc.alreadyCharged))}</span>
                                    </div>
                                </div>
                            )}

                             {/* Final Financial Settlement */}
                            <div className="w-[80%] mx-auto border-t-2 border-black mt-8 pt-4 relative z-10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-black uppercase">Total Bill Amount:</span>
                                    <span className="text-sm font-black">{formatCurrency(netPrice)}</span>
                                </div>
                                {(overallDiscount > 0) && (
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-black uppercase italic">Global Discount (-):</span>
                                        <span className="text-sm font-bold">{formatCurrency(overallDiscount)}</span>
                                    </div>
                                )}
                                <div className="border-b border-black w-full mb-1"></div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-black uppercase">Net Payable Amount:</span>
                                    <span className="text-base font-black">{formatCurrency(finalNetPayable)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold uppercase italic text-gray-600">Previously Paid:</span>
                                    <span className="text-xs font-bold text-gray-600">{formatCurrency(prevTotalPaid)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold uppercase italic text-gray-600">Discharge Collection:</span>
                                    <span className="text-xs font-bold text-gray-600">{formatCurrency(finalPaidAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-2 mt-1">
                                    <span className="text-xs font-black uppercase">Total Paid Amount:</span>
                                    <span className="text-sm font-black">{formatCurrency(prevTotalPaid + finalPaidAmount)}</span>
                                </div>
                                <div className="border-b border-black w-full mb-1"></div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm font-black uppercase">Total Due Left:</span>
                                    <span className="text-lg font-black">{formatCurrency(Math.max(0, currentDue))}</span>
                                </div>
                            </div>
                            
                            {/* Discharge Note Section */}
                            {(data?.note || admission?.note) && (
                                <div className="mt-8 p-3 bg-gray-50 border border-black border-dotted flex gap-2 items-start relative z-10 w-[80%] mx-auto">
                                    <span className="shrink-0 uppercase text-[10px] font-black opacity-70 mt-0.5">Note:</span>
                                    <span className="italic font-bold text-[11px] uppercase leading-tight">{data?.note || admission?.note}</span>
                                </div>
                            )}

                            {/* Remarks Section */}
                            {remarks && (
                                <div className="mt-2 p-3 bg-gray-50 border border-black border-dotted flex gap-2 items-start relative z-10 w-[80%] mx-auto">
                                    <span className="shrink-0 uppercase text-[10px] font-black opacity-70 mt-0.5">Remarks:</span>
                                    <span className="italic font-bold text-[11px] uppercase leading-tight">{remarks}</span>
                                </div>
                            )}

                            {/* Signatures */}
                            <div className="mt-16 flex justify-between px-4 relative z-10">
                                <div className="text-center space-y-1">
                                    <div className="border-t border-black w-40 mx-auto"></div>
                                    <span className="text-[11px] font-black uppercase">Prepared By</span>
                                    <p className="text-[10px] font-bold text-black italic">{(data as any)?.createdBy || user?.fullName}</p>
                                </div>
                                <div className="text-center space-y-1">
                                    <div className="border-t border-black w-48 mx-auto"></div>
                                    <span className="text-[11px] font-black uppercase">Authorized Signature</span>
                                    <p className="text-[10px] font-bold text-black italic">Hospital Authority</p>
                                </div>
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
