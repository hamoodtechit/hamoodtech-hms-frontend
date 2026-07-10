"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useSale } from "@/hooks/sales-queries"
import { calculateExactAge } from "@/lib/age-calculator"
import { useCurrency } from "@/hooks/use-currency"
import { cn } from "@/lib/utils"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { useAuthStore } from "@/store/use-auth-store"
import { Loader2, Printer } from "lucide-react"

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
  staffs?: any[] // To lookup staff name
  patient?: any // Optional: Pass patient object directly if not in transaction
  doctor?: any // Optional: Pass doctor object directly
}

export function DiagnosticReceiptDialog({ open, onOpenChange, transaction, doctors = [], staffs = [], patient: propPatient, doctor: propDoctor }: DiagnosticReceiptDialogProps) {
  const { general } = useSettingsStore()
  const { formatCurrency } = useCurrency()
  const { stores, activeStoreId } = useStoreContext()
  const activeStore = stores.find(s => s.id === activeStoreId)
  
  // Get sale ID - transaction might be the sale itself or have a nested sale object
  const saleId = transaction?.sale?.saleId || transaction?.saleId || transaction?.id || transaction?.sale?.id || transaction?.data?.sale?.id || transaction?.data?.id
  
  // Use useSale hook to get full details (branch, patient, doctor etc.)
  const { data: saleRes, isLoading } = useSale(saleId)
  
  // Combine prop/initial data with fetched rich data
  const initialData = transaction?.data?.sale || transaction?.sale || transaction?.data || transaction
  const isReturnReceipt = !!(transaction as any)?.sale?.saleReturnItems || !!(transaction as any)?.saleReturnItems
  const data = isReturnReceipt ? (transaction?.sale || transaction) : (saleRes?.data || initialData)
  
  if (!data && !isLoading) return null
  
  const items = isReturnReceipt ? (data?.saleReturnItems || []) : (data?.saleItems || [])
  
  const netTotal = isReturnReceipt ? Number(data?.totalPrice || 0) : Number(data?.netPrice || data?.totalPrice || 0)
  const grossTotal = items.length > 0 
      ? items.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0)
      : netTotal
  
  const paidAmount = isReturnReceipt ? netTotal : Number(data?.paidAmount || 0) // for returns, assume paid amount is the return total
  const dueAmount = isReturnReceipt ? 0 : Number(data?.dueAmount || 0)
  const taxAmount = Number(data?.taxAmount || 0)
  const discountAmount = Number(data?.discountAmount || data?.discount || 0)
  
  const patient = data?.patient || data?.patientAdmission?.patient || transaction?.patient || propPatient || {}
  const patientName = patient?.name || data?.customerName || data?.patientName || data?.name || "Walk-in Patient"
  const patientAge = patient?.dob ? calculateExactAge(patient.dob) : ((patient?.age !== undefined && patient?.age !== null) ? `${patient.age}Y` : (data?.customerAge ? `${data.customerAge}Y` : (data?.patientAge ? `${data.patientAge}Y` : (data?.age ? `${data.age}Y` : "N/A"))))
  const patientSex = patient?.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : (data?.gender || "N/A")
  const patientPhone = patient?.phone || data?.customerPhone || data?.patientPhone || data?.phone || "N/A"
  const patientId = patient?.patientNumber || patient?.uhid || patient?.id?.slice(0,8).toUpperCase() || data?.patientUhId || data?.uhid || data?.patientId || "N/A"
  
  const invoiceNumber = data?.invoiceNumber || "N/A"
  const labNumber = data?.id ? data.id.slice(-8).toUpperCase() : "N/A" // Pseudo lab number
  const date = data?.createdAt || new Date().toISOString()
  
  // Find consultant
  let consultantName = "Self"
  const doctorObj = data.doctor || data.patientAdmission?.doctor || propDoctor
  if (doctorObj) {
      const name = doctorObj.fullName || doctorObj.name
      const designation = doctorObj.designation
      if (name) {
          consultantName = designation ? `${name} (${designation})` : name
      }
  } else if (data.doctorId && doctors.length > 0) {
      const doc = doctors.find(d => d.id === data.doctorId)
      if (doc) {
          const name = doc.fullName || doc.name
          const designation = doc.designation
          consultantName = designation ? `${name} (${designation})` : (name || "Self")
      }
  } else if (data.referredByName) {
      consultantName = data.referredByName
  } else if (data.consultantName) {
      consultantName = data.consultantName
  } else if (data.patientAdmission?.refDoctorName) {
      consultantName = data.patientAdmission.refDoctorName
  }

  // Find assigned staff
  let assignedStaffName = "Billing By"
  if (data?.staffId && staffs.length > 0) {
      const staff = staffs.find(s => s.id === data.staffId)
      if (staff) assignedStaffName = staff.name
  } else if (data?.staffId) {
      assignedStaffName = data.staffId
  }

  // Find Assigned Referral Person
  const agentName = data?.referralPerson?.name || data?.commissionAgent?.name || data?.agentName || data?.commissionAgentName || data?.agent?.name || "Self"

  const deliveryDateRaw = items[0]?.deliveryDate || date;
  // Format as DD/MM/YYYY
  const formattedDeliveryDate = new Date(deliveryDateRaw).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const formattedDeliveryTime = "07:00 PM" // Mock default time as per receipt

  const amountInWords = numberToWords(netTotal) + " TAKA ONLY"
  
  const isFullPaid = dueAmount <= 0;

  const ReceiptContent = ({ copyTitle }: { copyTitle: string }) => {
    const { user } = useAuthStore()
    return (
    <div className="relative p-2 md:p-4 pt-[5mm] md:pt-[10mm] flex-1 flex flex-col z-10 w-full mb-0 pb-8 print:mb-0 print:pb-0">
        <div className="relative border border-black p-4 text-[12px] font-medium font-sans w-full flex-1 flex flex-col bg-white">

        {/* PAID/DUE Stamps */}
        <div className="absolute top-[20%] right-[10%] pointer-events-none z-0 opacity-[0.15]">
            {isFullPaid ? (
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
            <h1 style={{ margin: '0', padding: '0', fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1', width: '100%' }}>{general?.hospitalName || data.branch?.name || "PATWARY GENERAL HOSPITAL"}</h1>
            <p style={{ margin: '0', padding: '0', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2' }}>{general?.address || data.branch?.address || "Hospital Address"}</p>
            <p style={{ margin: '0', padding: '0', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2' }}>Ph: {general?.phone || data.branch?.phone || "Hospital Phone"}</p>
            {(general?.email || data.branch?.email) && (
                <p style={{ margin: '0', padding: '0', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2' }}>Email: {general?.email || data.branch?.email}</p>
            )}
            
            <div className="flex justify-center gap-6 text-[11px] font-bold uppercase mt-1">
                {(data.branch?.licenseNumber || activeStore?.licenseNumber) && <span>License No: {data.branch?.licenseNumber || activeStore?.licenseNumber}</span>}
                {(data.branch?.taxRegistration || activeStore?.taxRegistration) && <span>TX Registration No: {data.branch?.taxRegistration || activeStore?.taxRegistration}</span>}
            </div>

            <div className="mt-2 inline-block border border-black rounded-full px-6 py-1 font-bold tracking-wider relative bg-gray-100/50">
                {isReturnReceipt ? "RETURN RECEIPT" : copyTitle}
            </div>
        </div>

        {/* Info Table Box */}
        <div className="border border-black mb-2 relative z-10 text-[13px]">
            {/* Row 1 */}
            <div className="grid grid-cols-2 border-b border-black">
                <div className="p-1 px-3 border-r border-black font-bold flex items-center">
                    UHID : {patientId}
                </div>
                <div className="p-1 px-3 flex items-center justify-between font-bold">
                    <span>Bill No. : {invoiceNumber}</span>
                    <span className="text-[11px]">Lab No. : {labNumber}</span>
                </div>
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-2 border-b border-black">
                <div className="p-1 px-3 border-r border-black font-bold flex items-center">
                    Name <span className="mx-2">:</span> {patientName}
                </div>
                <div className="p-1 px-3 font-bold flex items-center">
                    <span className="w-12">Date</span> <span className="mr-2">:</span> {new Date(date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                </div>
            </div>
            {/* Row 3 */}
            <div className="grid grid-cols-1 border-b border-black">
                <div className="p-1 px-3 font-bold flex flex-wrap items-center">
                    <div className="flex gap-3 mr-8">
                        <span>Age : {patientAge}</span>
                        <span>Sex : {patientSex}</span>
                        <span>Contact : {patientPhone}</span>
                    </div>
                    <div className="flex-1">
                        RefBy : {agentName}
                    </div>
                </div>
            </div>
            {/* Row 4 */}
            <div className="grid grid-cols-1 font-sans">
                <div className="p-1 px-3 font-bold flex items-start gap-1">
                    <span className="shrink-0">Consultant :</span>
                        <span className="uppercase text-[12px]">{consultantName}</span>
                </div>
            </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left border-collapse mb-2 max-w-full relative z-10 text-[13px]">
            <thead>
                <tr className="border-y border-black font-black">
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
                        <tr key={index} className={cn("border-b border-gray-300/50", index === items.length - 1 && "border-b-0")}>
                            <td className="py-1 px-1 align-top">{index + 1}</td>
                            <td className="py-1 px-1">
                                <div>{item.itemName}</div>
                                {item.testBy && (
                                    <div className="text-[10px] text-gray-500 mt-0.5">Test By: {item.testBy}</div>
                                )}
                            </td>
                            <td className="py-1 px-1 text-right align-top">{Number(item.price).toFixed(2)}</td>
                            <td className="py-1 px-1 text-center align-top">{item.quantity}</td>
                            <td className="py-1 px-1 text-right align-top">{itemTotal.toFixed(2)}</td>
                        </tr>
                    )
                })}
            </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-between items-start mt-2 mb-4 relative z-10 text-[13px]">
            <div className="pt-2 pl-4">
                {isFullPaid ? (
                    <div style={{ border: '4px solid #16a34a', color: '#16a34a', fontSize: '24px', fontWeight: '900', padding: '8px 24px', borderRadius: '12px', transform: 'rotate(-5deg)', display: 'inline-block', textTransform: 'uppercase' }}>
                        Full Paid
                    </div>
                ) : (
                    <div style={{ border: '4px solid #dc2626', color: '#dc2626', fontSize: '28px', fontWeight: '900', padding: '8px 24px', borderRadius: '12px', transform: 'rotate(-5deg)', display: 'inline-block', textTransform: 'uppercase' }}>
                        Due
                    </div>
                )}
            </div>
            <div className="w-[250px]">
                <div className="flex justify-between py-0.5 font-black">
                    <span>Sub Total Tk.</span>
                    <span>{grossTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-0.5 font-black">
                    <span>+ Vat Tk.</span>
                    <span>{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-0.5 font-black">
                    <span>- Discount Tk.</span>
                    <span>{discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-0.5 font-black text-[16px] border-y border-black mt-1 pb-1">
                    <span>Net Payable Tk.</span>
                    <span>{netTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-0.5 font-black">
                    <span>Advanced Tk.</span>
                    <span>{paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 px-2 font-black text-[14px]" style={{ color: 'black', border: '1px solid black', backgroundColor: '#f3f4f6' }}>
                    <span>Due Tk.</span>
                    <span>{dueAmount.toFixed(2)}</span>
                </div>
            </div>
        </div>

        {/* Footer Info */}
        <div className="border-t border-black pt-2 font-black text-[12px] relative z-10 flex flex-col gap-1">
            <div className="grid grid-cols-2">
                <div className="space-y-1">
                    <div>In Word : {amountInWords}</div>
                    <div>Delivery : {formattedDeliveryDate} {formattedDeliveryTime}</div>
                </div>
                <div className="text-right space-y-1">
                    <div>TYPE : {data?.paymentMethod?.toUpperCase() || "CASH"}</div>
                    <div>Billing By : {(data as any)?.createdBy || user?.fullName || user?.username || assignedStaffName}</div>
                </div>
            </div>
            
            {/* Payment Note Section */}
            {(initialData?.note || data?.note || data?.payments?.[0]?.note) && (
                <div className="mt-1 p-1 bg-gray-50 border border-black border-dotted flex gap-1.5 items-start">
                    <span className="shrink-0 uppercase text-[9px] opacity-70 mt-0.5">Note:</span>
                    <span className="italic font-medium text-[10px] uppercase leading-tight">{initialData?.note || data?.note || data?.payments?.[0]?.note}</span>
                </div>
            )}
        </div>

        <div className="flex justify-between items-end mt-4 pt-4 font-black text-sm relative z-10">
            <div className="italic">
                যে সকল রুমে যাবেনঃ {data?.roomNumber || data?.chamberOrRoomNumber || "N/A"}
            </div>
            <div className="text-center">
                <div className="border-t border-black w-48 mb-1"></div>
                Authorized Signature
            </div>
        </div>
        <div className="mt-4 pt-2 border-t border-black/10 text-[8px] text-black/50 font-bold flex justify-between uppercase tracking-widest relative z-10">
            <span>*Powered by HamoodTech</span>
            <span>Printed: {new Date().toLocaleString('en-GB')}</span>
        </div>
    </div>
    </div>
  )
}
    
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] w-full p-0 overflow-hidden sm:rounded-none bg-white text-black border-none shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Diagnostic Receipt</DialogTitle>
        </DialogHeader>
        
        <div className="p-0 max-h-[85vh] overflow-y-auto print:max-h-none print:p-0 flex flex-col bg-white" id="receipt-content" style={{ width: "100%", maxWidth: "210mm", margin: "0 auto" }}>
            {isLoading ? (
                <div className="h-40 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <ReceiptContent copyTitle="OFFICE COPY" />
                    <div className="page-break" />
                    <ReceiptContent copyTitle="CUSTOMER COPY" />
                </>
            )}
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
                                  @page { 
                                      size: A4; 
                                      margin: 0; 
                                  }
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
                                  
                                  body { margin: 0 !important; padding: 0 !important; }
                                  @page { margin: 0; }
                                </style>
                    </style>
                          </head>
                          <body>
                              <div class="print-container">
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
