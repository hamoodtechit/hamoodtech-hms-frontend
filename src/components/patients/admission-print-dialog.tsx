"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTitle
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAdmission, usePatient } from "@/hooks/patient-queries"
import { formatCurrency } from "@/lib/utils"
import { useSettingsStore } from "@/store/use-settings-store"
import { useAuthStore } from "@/store/use-auth-store"
import { Loader2, Printer, X } from "lucide-react"
import { useRef } from "react"

interface AdmissionPrintDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    admissionId: string | null
}

export function AdmissionPrintDialog({ open, onOpenChange, admissionId }: AdmissionPrintDialogProps) {
    const { general } = useSettingsStore()
    const { user } = useAuthStore()
    const printRef = useRef<HTMLDivElement>(null)

    const { data: res, isLoading } = useAdmission(admissionId || "")
    const admission = res?.data?.patientAdmission
    const { data: patientRes } = usePatient(admission?.patientId || "")
    const sale = res?.data?.sale

    if (!admission && !isLoading) return null

    const freshPatient = patientRes?.data || admission?.patient
    const patient = freshPatient
    const branch = admission?.branch
    const bed = admission?.bed

    const isPaid = sale ? Number(sale.dueAmount) <= 0 : true
    const totalPaid = Number(sale?.paidAmount) || 0
    const totalDue = Number(sale?.dueAmount) || 0
    

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
                    <title>Admission Form - ${freshPatient?.name}</title>
                    <style>
                        @page { size: A4; margin: 5mm; }
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                            color: #000; 
                            line-height: 1; 
                            padding: 0; 
                            margin: 0; 
                            background: white;
                        }
                        .print-container { width: 210mm; margin: 0 auto; background: white; padding: 5mm; box-sizing: border-box; position: relative; }
                        .vertical-metadata {
                            position: absolute;
                            left: -5mm;
                            top: 50%;
                            transform: translateY(-50%) rotate(-90deg);
                            font-size: 8px;
                            color: rgba(0,0,0,0.4);
                            white-space: nowrap;
                            font-weight: bold;
                            letter-spacing: 1px;
                        }
                        
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
                        .m-0 { margin: 0 !important; }
                        .p-0 { padding: 0 !important; }
                        .mb-0 { margin-bottom: 0 !important; }
                        .mb-1 { margin-bottom: 4px !important; }
                        .mb-2 { margin-bottom: 8px !important; }
                        .mt-0 { margin-top: 0 !important; }
                        .mt-4 { margin-top: 16px !important; }
                        .leading-none { line-height: 1 !important; }
                        .leading-tight { line-height: 1.1 !important; }
                        .gap-0 { gap: 0 !important; }
                        
                        /* Borders */
                        .border { border: 1px solid black !important; }
                        .border-b { border-bottom: 1px solid black !important; }
                        .border-r { border-right: 1px solid black !important; }
                        .border-t { border-top: 1px solid black !important; }
                        .border-dashed { border-style: dashed !important; border-width: 1px !important; }
                        .border-black { border-color: black !important; }
                        
                        .px-1 { padding-left: 4px !important; padding-right: 4px !important; }
                        
                        /* Typography */
                        .font-bold { font-weight: bold !important; }
                        .font-black { font-weight: 900 !important; }
                        .uppercase { text-transform: uppercase !important; }
                        .text-xs { font-size: 11px !important; }
                        .text-sm { font-size: 16px !important; }
                        .text-base { font-size: 17px !important; }
                        .text-lg { font-size: 20px !important; }
                        .text-2xl { font-size: 28px !important; }
                        .text-\[10px\] { font-size: 10px !important; }
                        .text-\[14px\] { font-size: 16px !important; }
                        .w-24 { width: 7.5rem !important; }
                        .italic { font-style: italic !important; }
                        
                        /* Spacing */
                        .p-2 { padding: 8px !important; }
                        .px-3 { padding-left: 12px !important; padding-right: 12px !important; }
                        .p-4 { padding: 16px !important; }
                        .mb-4 { margin-bottom: 16px !important; }
                        .mt-4 { margin-top: 16px !important; }
                        .mt-8 { margin-top: 32px !important; }
                        .mt-12 { margin-top: 48px !important; }
                        .mt-16 { margin-top: 64px !important; }
                        
                        /* Image Handling */
                        img { max-height: 100px; width: auto !important; object-fit: contain !important; }
                        .h-16 { height: 64px !important; }

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
                            opacity: 0.08 !important;
                        }
                        .hologram-text {
                            font-size: 150px !important;
                            font-weight: 900 !important;
                            text-transform: uppercase !important;
                            transform: rotate(-35deg) !important;
                            border: 12px solid currentColor !important;
                            padding: 24px 48px !important;
                            border-radius: 40px !important;
                            letter-spacing: 15px !important;
                        }
                        .hologram-paid { color: #10b981 !important; } /* Emerald-500 */
                        .hologram-due { color: #f43f5e !important; } /* Rose-500 */
                        
                        .letterhead-spacer { height: 35mm !important; display: block !important; }

                        @media print {
                            .no-print { display: none; }
                            body { background: white; shadow: none; }
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
                        Professional Print Preview
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                        <Button onClick={handlePrint} size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                            <Printer className="w-4 h-4 mr-2" />
                            Print Now
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:bg-black/5" onClick={() => onOpenChange(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <ScrollArea className="max-h-[85vh] p-8 bg-zinc-200/50">
                    <div className="bg-white shadow-2xl mx-auto p-12 w-[210mm] min-h-[297mm] relative" ref={printRef}>
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-40 gap-4">
                                <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                                <span className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">Preparing Professional Copy</span>
                            </div>
                        ) : (
                            <div className="text-black bg-white antialiased font-sans">
                                {/* 
                                 * HOSPITAL HEADER REMOVED 
                                 * As per User Request: Utilizing pre-printed letterheads (pads).
                                 * We only print patient info and results.
                                 */}
                                <div className="h-4 letterhead-spacer" />
                                
                                <div className="text-center mb-4">
                                    <h1 className="text-2xl font-black uppercase tracking-[0.2em] border-b-2 border-black inline-block px-8 pb-1">Admission Form</h1>
                                </div>

                                {/* Structured Info Box */}
                                <div className="border border-black border-dashed mb-2 mt-4 overflow-hidden">
                                    {/* Row 1: Reg & Admission ID */}
                                    <div className="grid grid-cols-2 border-b border-black border-dashed">
                                        <div className="p-2 px-3 border-r border-black border-dashed flex items-center">
                                            <span className="w-24 text-[10px] font-black uppercase opacity-60">Reg. ID:</span>
                                            <span className="font-bold text-sm tracking-tight">{patient?.uhid || patient?.patientNumber || 'N/A'}</span>
                                        </div>
                                        <div className="p-2 px-3 flex items-center">
                                            <span className="w-24 text-[10px] font-black uppercase opacity-60">Admission ID:</span>
                                            <span className="font-bold text-sm italic">A{admission?.id?.slice(0, 8).toUpperCase() || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Main Info Grid */}
                                    <div className="grid grid-cols-2 border-b border-black border-dashed">
                                        {/* Left Column: Patient & Guardian Info */}
                                        <div className="border-r border-black border-dashed flex flex-col">
                                            <div className="p-2 px-3 border-b border-black border-dashed flex items-center">
                                                <span className="w-24 text-[10px] font-black uppercase opacity-60">Patient Name:</span>
                                                <span className="font-black text-sm uppercase">{(patient as any)?.title ? `${(patient as any).title} ` : ''}{patient?.name || 'N/A'}</span>
                                            </div>
                                            <div className="p-2 px-3 border-b border-black border-dashed flex items-center">
                                                <span className="w-24 text-[10px] font-black uppercase opacity-60">Age / Sex:</span>
                                                <span className="font-bold text-sm">{patient?.age} Y / {patient?.gender?.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div className="p-2 px-3 border-b border-black border-dashed flex items-center">
                                                <span className="w-24 text-[10px] font-black uppercase opacity-60">Guardian:</span>
                                                <span className="font-bold text-sm">{admission?.guardianName} ({admission?.guardianRelation})</span>
                                            </div>
                                            <div className="p-2 px-3 border-b border-black border-dashed flex items-center">
                                                <span className="w-24 text-[10px] font-black uppercase opacity-60">Religion:</span>
                                                <span className="font-bold text-sm">{patient?.religion || 'N/A'}</span>
                                            </div>
                                            <div className="p-2 px-3 border-b border-black border-dashed flex items-center">
                                                <span className="w-24 text-[10px] font-black uppercase opacity-60">Marital Status:</span>
                                                <span className="font-bold text-sm capitalize">{patient?.maritalStatus || 'N/A'}</span>
                                            </div>
                                            <div className="p-2 px-3 border-b border-black border-dashed flex items-center">
                                                <span className="w-24 text-[10px] font-black uppercase opacity-60">Occupation:</span>
                                                <span className="font-bold text-sm">{patient?.occupation || 'N/A'}</span>
                                            </div>
                                            <div className="p-2 px-3 flex items-center">
                                                <span className="w-24 text-[10px] font-black uppercase opacity-60">Nationality:</span>
                                                <span className="font-bold text-sm">{patient?.nationality || 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* Right Column: Address & Phone Info */}
                                        <div className="flex flex-col">
                                            <div className="p-2 px-3 border-b border-black border-dashed flex items-center">
                                                <span className="w-24 text-[10px] font-black uppercase opacity-60">Phone No:</span>
                                                <span className="font-bold text-sm">
                                                    {patient?.phone ? (patient.phone.startsWith('1') ? `0${patient.phone}` : patient.phone) : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="p-2 px-3 border-b border-black border-dashed flex items-center">
                                                <span className="w-24 text-[10px] font-black uppercase opacity-60">Village:</span>
                                                <span className="font-bold text-sm">{patient?.village || 'N/A'}</span>
                                            </div>
                                            <div className="p-2 px-3 border-b border-black border-dashed flex items-center">
                                                <span className="w-24 text-[10px] font-black uppercase opacity-60">Union:</span>
                                                <span className="font-bold text-sm">{patient?.union || 'N/A'}</span>
                                            </div>
                                            <div className="p-2 px-3 border-b border-black border-dashed flex items-center">
                                                <span className="w-24 text-[10px] font-black uppercase opacity-60">Post Office:</span>
                                                <span className="font-bold text-sm">{patient?.postOffice || 'N/A'}</span>
                                            </div>
                                            <div className="p-2 px-3 border-b border-black border-dashed flex items-center">
                                                <span className="w-24 text-[10px] font-black uppercase opacity-60">Police Station:</span>
                                                <span className="font-bold text-sm">{patient?.thana || 'N/A'}</span>
                                            </div>
                                            <div className="p-2 px-3 flex items-center">
                                                <span className="w-24 text-[10px] font-black uppercase opacity-60">District:</span>
                                                <span className="font-bold text-sm underline">{patient?.district || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Admission Details */}
                                    <div className="grid grid-cols-2 border-b border-black border-dashed">
                                        <div className="p-2 px-3 border-r border-black border-dashed flex items-center">
                                            <span className="w-24 text-[10px] font-black uppercase opacity-60">Ward / Bed:</span>
                                            <span className="font-black text-sm text-blue-700">{bed?.section?.name || 'N/A'} - {bed?.bedNumber || 'N/A'}</span>
                                        </div>
                                        <div className="p-2 px-3 flex items-center">
                                            <span className="w-24 text-[10px] font-black uppercase opacity-60">Adm. Date:</span>
                                            <span className="font-bold text-sm">
                                                {admission?.admissionDate ? new Date(admission.admissionDate).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Doctor & Department Assignment */}
                                    <div className="grid grid-cols-1 border-b border-black border-dashed">
                                        <div className="p-2 px-3 flex items-center">
                                            <span className="w-24 text-[10px] font-black uppercase opacity-60">Assigned Doctor:</span>
                                            <span className="font-black text-sm text-slate-900">
                                                {admission?.doctor?.fullName || 'N/A'} {admission?.doctor?.designation ? <span className="font-bold lowercase">({admission.doctor.designation})</span> : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 border-b border-black border-dashed">
                                        <div className="p-2 px-3 border-r border-black border-dashed flex items-center">
                                            <span className="w-24 text-[10px] font-black uppercase opacity-60">Ref By:</span>
                                            <span className="font-bold text-sm">{admission?.referralPerson?.name || 'N/A'}</span>
                                        </div>
                                        <div className="p-2 px-3 flex items-center">
                                            <span className="w-24 text-[10px] font-black uppercase opacity-60">Consultation Dr:</span>
                                            <span className="font-bold text-sm">{admission?.refDoctorName || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 border-b border-black border-dashed">
                                        <div className="p-2 px-3 flex items-center">
                                            <span className="w-24 text-[10px] font-black uppercase opacity-60">Department:</span>
                                            <span className="font-bold text-sm">{admission?.department?.name || 'N/A'}</span>
                                        </div>
                                    </div>

                                    <div className="border-b border-black border-dashed flex items-start">
                                        <span className="w-28 p-2 px-3 text-[11px] font-black uppercase opacity-60 border-r border-black border-dashed h-full">Reason:</span>
                                        <span className="p-2 px-3 font-bold text-sm">{admission?.reason || 'Routine Admission'}</span>
                                    </div>

                                    <div className="flex items-start">
                                        <span className="w-28 p-2 px-3 text-[11px] font-black uppercase opacity-60 border-r border-black border-dashed h-full">Full Address:</span>
                                        <span className="p-2 px-3 font-bold text-sm opacity-80">{patient?.address || 'N/A'}</span>
                                    </div>
                                </div>



                                {/* Consent Section */}
                                <div className="mt-8 text-center px-4">
                                    <h2 className="text-2xl font-black mb-4 font-serif border-b border-black w-fit mx-auto px-4 pb-1">অনুমতি পত্র</h2>
                                    <p className="text-justify leading-relaxed text-[15px] font-serif tracking-tight text-gray-900 border border-black/5 p-4 rounded bg-gray-50/50">
                                        আমি প্রতিজ্ঞাপূর্বক ক্লিনিক এর সংশ্লিষ্ট চিকিৎসক দ্বারা আমার রোগীর প্রয়োজনীয় প্রাথমিক চিকিৎসা/ অজ্ঞান করা ইয়া অস্ত্র প্রয়োগ করিতে দিতেছি। ইহাতে রোগীর যদি কোন প্রকার ভালো বা মন্দ হয় তার জন্যে ক্লিনিক কর্তৃপক্ষ অথবা কতব্যরত চিকিৎসক দায়ী থাকিবে না এবং আমি বা রোগীর কোন আত্মীয় কোন প্রকার দাবি করিতে পারিবোনা।
                                        <br/><br/>
                                        আমি স্ব-জ্ঞানে এবং নিম্ন উল্লেখিত সাক্ষীর উপস্থিতিতে অত্র অঙ্গীকার পত্রে দস্তখত করিলাম।
                                    </p>
                                </div>

                                {/* Signature Blocks */}
                                <div className="mt-16 flex justify-between px-10">
                                    <div className="text-center space-y-1">
                                        <div className="border-t border-black w-48 mx-auto"></div>
                                        <span className="text-[11px] font-black uppercase">Witness Signature</span>
                                        <p className="text-[11px] font-bold text-black italic">সাক্ষীর স্বাক্ষর</p>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <div className="border-t border-black w-64 mx-auto"></div>
                                        <span className="text-[11px] font-black uppercase">Guardian Signature</span>
                                        <p className="text-[11px] font-bold text-black italic">অভিভাবকের স্বাক্ষর / Responsible Person</p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="mt-8 pt-4 border-t border-black/5 text-[10px] text-zinc-400 font-black flex justify-between uppercase tracking-widest">
                                    <span>System Generated Admission Form</span>
                                    <span>Printed By: {user?.fullName?.toUpperCase()} {user?.phone ? `(${user.phone})` : ''} - {new Date().toLocaleString()}</span>
                                </div>

                            </div>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
