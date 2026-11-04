"use client"

import { useCurrency } from "@/hooks/use-currency"
import { IAmbulanceReportData } from "@/types/report"
import { Branch } from "@/types/pharmacy"
import { format } from "date-fns"

interface AmbulanceReportPrintProps {
  reportData: IAmbulanceReportData
  dateRange: { from: Date; to: Date }
  activeBranch?: Branch | null
}

export function AmbulanceReportPrint({ reportData, dateRange, activeBranch }: AmbulanceReportPrintProps) {
  const { formatCurrency } = useCurrency()
  const summary = reportData.summary

  return (
    <div className="bg-white p-8 font-sans text-black print:p-0">
      <div className="mb-6 flex flex-col items-center border-b-2 border-black pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={activeBranch?.logoUrl || "/Logo.png"} alt="Hospital Logo" className="mb-2 h-16 w-auto" />
        <div className="text-center"><h1 className="text-2xl font-bold uppercase">PATWARY GENERAL HOSPITAL</h1><h2 className="mt-1 text-xl font-bold">Ambulance Service Report</h2><p className="mt-2 text-sm font-medium">Period: {format(dateRange.from, "dd MMM yyyy")} - {format(dateRange.to, "dd MMM yyyy")}</p></div>
      </div>
      <div className="mb-6 grid grid-cols-4 gap-3">
        <PrintMetric label="Bookings" value={summary.bookingCount} />
        <PrintMetric label="Net Fare" value={formatCurrency(summary.netFare)} />
        <PrintMetric label="Collections" value={formatCurrency(summary.collectedInPeriod)} />
        <PrintMetric label="Outstanding Due" value={formatCurrency(summary.outstandingDue)} />
      </div>
      <table className="w-full border-collapse border border-black text-[10px]"><thead className="bg-gray-50"><tr><th className="border border-black px-1 py-1">Date</th><th className="border border-black px-1 py-1">Patient</th><th className="border border-black px-1 py-1">Vehicle</th><th className="border border-black px-1 py-1">Route</th><th className="border border-black px-1 py-1">Status</th><th className="border border-black px-1 py-1 text-right">Net Fare</th><th className="border border-black px-1 py-1 text-right">Paid</th><th className="border border-black px-1 py-1 text-right">Due</th></tr></thead><tbody>{reportData.bookings.length === 0 ? <tr><td colSpan={8} className="border border-black p-3 text-center italic">No bookings found.</td></tr> : reportData.bookings.map((booking) => <tr key={booking.id}><td className="border border-black px-1 py-1">{format(new Date(booking.createdAt), "dd MMM yy")}</td><td className="border border-black px-1 py-1">{booking.patientName}<br />{booking.guardianPhone || ""}</td><td className="border border-black px-1 py-1">{booking.ambulance?.vehicleNumber || "-"}</td><td className="border border-black px-1 py-1">{booking.pickupLocation} → {booking.dropoffLocation}</td><td className="border border-black px-1 py-1 capitalize">{booking.status}</td><td className="border border-black px-1 py-1 text-right">{formatCurrency(Number(booking.netFare))}</td><td className="border border-black px-1 py-1 text-right">{formatCurrency(Number(booking.paidAmount))}</td><td className="border border-black px-1 py-1 text-right">{formatCurrency(Number(booking.dueAmount))}</td></tr>)}<tr className="bg-gray-100 font-bold"><td colSpan={5} className="border border-black px-1 py-1 text-right uppercase">Grand Total</td><td className="border border-black px-1 py-1 text-right">{formatCurrency(summary.netFare)}</td><td className="border border-black px-1 py-1 text-right">{formatCurrency(summary.paid)}</td><td className="border border-black px-1 py-1 text-right">{formatCurrency(summary.due)}</td></tr></tbody></table>
      <div className="mt-20 flex justify-between px-8 text-xs font-bold"><div className="w-40 border-t border-black pt-1 text-center">Prepared By</div><div className="w-40 border-t border-black pt-1 text-center">Accounts Manager</div><div className="w-40 border-t border-black pt-1 text-center">Authorized Signature</div></div>
    </div>
  )
}

function PrintMetric({ label, value }: { label: string; value: string | number }) {
  return <div className="border border-black bg-gray-50 p-2 text-center"><div className="text-[10px] font-bold uppercase">{label}</div><div className="text-sm font-black">{value}</div></div>
}
