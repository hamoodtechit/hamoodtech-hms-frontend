"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTitle
} from "@/components/ui/dialog"
import { useSettingsStore } from "@/store/use-settings-store"
import { useAuthStore } from "@/store/use-auth-store"
import { AmbulanceBooking } from "@/types/ambulance"
import { Printer } from "lucide-react"
import { useRef } from "react"

interface AmbulancePrintDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    booking: AmbulanceBooking | null
}

export function AmbulancePrintDialog({ open, onOpenChange, booking }: AmbulancePrintDialogProps) {
    const { general } = useSettingsStore()
    const { user } = useAuthStore()
    const printRef = useRef<HTMLDivElement>(null)

    if (!booking) return null

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
                    <title>Ambulance Booking - ${booking.patientName}</title>
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
                        .gap-2 { gap: 0.5rem !important; }
                        .gap-4 { gap: 1rem !important; }
                        .w-full { width: 100% !important; }
                        .w-half { width: 50% !important; }
                        
                        /* Typography */
                        .font-bold { font-weight: bold !important; }
                        .font-black { font-weight: 900 !important; }
                        .text-xs { font-size: 0.75rem !important; }
                        .text-sm { font-size: 0.875rem !important; }
                        .text-base { font-size: 1rem !important; }
                        .text-lg { font-size: 1.125rem !important; }
                        .text-xl { font-size: 1.25rem !important; }
                        .text-2xl { font-size: 1.5rem !important; }
                        .uppercase { text-transform: uppercase !important; }
                        .tracking-wider { letter-spacing: 0.05em !important; }
                        .text-gray-500 { color: #6b7280 !important; }
                        .text-gray-600 { color: #4b5563 !important; }
                        
                        /* Spacing */
                        .mb-1 { margin-bottom: 0.25rem !important; }
                        .mb-2 { margin-bottom: 0.5rem !important; }
                        .mb-4 { margin-bottom: 1rem !important; }
                        .mb-6 { margin-bottom: 1.5rem !important; }
                        .mb-8 { margin-bottom: 2rem !important; }
                        .mt-2 { margin-top: 0.5rem !important; }
                        .mt-4 { margin-top: 1rem !important; }
                        .mt-8 { margin-top: 2rem !important; }
                        .p-4 { padding: 1rem !important; }
                        .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
                        .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
                        
                        /* Borders & Backgrounds */
                        .border { border: 1px solid #e5e7eb !important; }
                        .border-t { border-top: 1px solid #e5e7eb !important; }
                        .border-b { border-bottom: 1px solid #e5e7eb !important; }
                        .border-gray-300 { border-color: #d1d5db !important; }
                        .border-black { border-color: #000 !important; }
                        .rounded-lg { border-radius: 0.5rem !important; }
                        .bg-gray-50 { background-color: #f9fafb !important; }
                        
                        /* Table specific styles for print */
                        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                        th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
                        th { background-color: #f9fafb; font-weight: bold; font-size: 0.875rem; text-transform: uppercase; color: #4b5563; }
                        
                        @media print {
                            .no-print { display: none; }
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

        iframe.onload = () => {
            setTimeout(() => {
                iframe.contentWindow?.focus()
                iframe.contentWindow?.print()
                setTimeout(() => {
                    document.body.removeChild(iframe)
                }, 1000)
            }, 500)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[800px] p-0 overflow-hidden bg-zinc-100 rounded-[2.5rem] border-none shadow-2xl h-[90vh] flex flex-col">
                <DialogTitle className="sr-only">Print Ambulance Booking</DialogTitle>
                
                {/* Fixed Top Bar */}
                <div className="bg-white border-b px-8 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <Printer className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-lg text-slate-800">Booking Invoice Print Preview</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button onClick={handlePrint} size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                            <Printer className="w-4 h-4 mr-2" />
                            Print Invoice
                        </Button>
                    </div>
                </div>

                {/* Scrollable Preview Area */}
                <div className="flex-1 overflow-y-auto p-8 bg-zinc-100 flex justify-center">
                    {/* A4 Size Paper Simulation */}
                    <div className="bg-white shadow-2xl mx-auto p-12 w-[210mm] min-h-[297mm] relative" ref={printRef}>
                        <div className="flex flex-col h-full text-black">
                            {/* Document Header (Letterhead space) */}
                            <div className="text-center mb-8 border-b-2 border-black pb-4">
                                <h1 className="text-3xl font-black uppercase mb-1">{general?.hospitalName || "Hospital Management System"}</h1>
                                <p className="text-sm font-medium text-gray-600">{general?.address || "Address goes here"}</p>
                                <p className="text-sm font-medium text-gray-600">Phone: {general?.phone || "N/A"}</p>
                            </div>

                            <div className="text-center mb-6">
                                <h2 className="text-xl font-bold uppercase tracking-wider inline-block px-4 py-1 border-2 border-black rounded-lg">Ambulance Booking Invoice</h2>
                            </div>

                            {/* Booking Information */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="border border-gray-300 p-4 rounded-lg">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Patient Information</p>
                                    <p className="font-bold text-base">{booking.patientName}</p>
                                    <p className="text-sm">Patient ID: {booking.patient?.patientNumber || "N/A"}</p>
                                    {booking.guardianPhone && <p className="text-sm">Contact: {booking.guardianPhone}</p>}
                                </div>
                                <div className="border border-gray-300 p-4 rounded-lg text-right">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Dispatch Details</p>
                                    <p className="font-bold text-sm">Date: {new Date(booking.createdAt).toLocaleString()}</p>
                                    <p className="text-sm mt-1">Vehicle: {booking.ambulance?.vehicleNumber || "Pending"}</p>
                                    <p className="text-sm">Driver: {booking.ambulance?.driverName || "N/A"}</p>
                                </div>
                            </div>

                            {/* Route Information */}
                            <div className="border border-gray-300 p-4 rounded-lg mb-8">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Routing</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500">Pickup Location</p>
                                        <p className="font-medium text-sm">{booking.pickupLocation}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-500">Dropoff Location</p>
                                        <p className="font-medium text-sm">{booking.dropoffLocation}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="mb-8">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="border p-3 text-left w-3/4">Description</th>
                                            <th className="border p-3 text-right">Amount (৳)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border p-3">Ambulance Transport Fare</td>
                                            <td className="border p-3 text-right font-medium">{Number(booking.totalFare || 0).toFixed(2)}</td>
                                        </tr>
                                        {Number(booking.discountAmount || 0) > 0 && (
                                            <tr>
                                                <td className="border p-3 text-right italic text-gray-600">Less Discount:</td>
                                                <td className="border p-3 text-right text-gray-600">- {Number(booking.discountAmount || 0).toFixed(2)}</td>
                                            </tr>
                                        )}
                                        <tr className="bg-gray-50">
                                            <td className="border p-3 font-bold text-right">Net Payable:</td>
                                            <td className="border p-3 text-right font-bold">{Number(booking.netFare || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="border p-3 text-right">Amount Paid:</td>
                                            <td className="border p-3 text-right">{Number(booking.paidAmount || 0).toFixed(2)}</td>
                                        </tr>
                                        <tr className="bg-gray-50">
                                            <td className="border p-3 font-bold text-right">Due Balance:</td>
                                            <td className="border p-3 text-right font-bold">{Number(booking.dueAmount || 0).toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-auto pt-16">
                                <div className="flex justify-between items-end border-t border-gray-300 pt-4">
                                    <div className="text-xs text-gray-500">
                                        <p>This is a system generated invoice.</p>
                                        <span className="mt-1 block">Printed By: {user?.fullName?.toUpperCase()} - {new Date().toLocaleString()}</span>
                                    </div>
                                    <div className="text-center w-48">
                                        <div className="border-t-2 border-black border-dashed pt-1 mb-1">
                                            <p className="text-xs font-bold uppercase">Authorized Signature</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
