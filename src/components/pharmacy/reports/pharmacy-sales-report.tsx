"use client"

import { useCurrency } from "@/hooks/use-currency"
import { Branch } from "@/types/pharmacy"
import { format } from "date-fns"

interface SalesReportProps {
  data: any
  dateRange: { from: Date; to: Date }
  activeBranch?: Branch | null
}

export function PharmacySalesReport({ data, dateRange, activeBranch }: SalesReportProps) {
  const { formatCurrency } = useCurrency()
  
  const outdoorSales = data?.outdoor?.sales || []
  const outdoorSubTotals = data?.outdoor?.subTotals || {}
  
  const indoorSales = data?.indoor?.sales || []
  const indoorSubTotals = data?.indoor?.subTotals || {}
  
  const summary = data?.summary || {}

  const logoSrc = activeBranch?.logoUrl || "/Logo.png"

  return (
    <div id="pharmacy-sales-report" className="p-8 bg-white text-black font-serif print:p-0">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <img src={logoSrc} alt="Hospital Logo" className="h-16 w-auto mb-2" />
        <div className="text-center">
            <h1 className="text-2xl font-bold uppercase">PATWARY GENERAL HOSPITAL</h1>
            <h2 className="text-xl font-bold underline mt-1">Pharmacy Sales Statement</h2>
            <p className="text-sm mt-2">
            From {format(dateRange.from, "EEE MMM dd HH:mm:ss 'BDT' yyyy")} to {format(dateRange.to, "EEE MMM dd HH:mm:ss 'BDT' yyyy")}
            </p>
        </div>
      </div>

      {/* Outdoor Direct Sales Report */}
      <div className="mb-6">
        <h3 className="text-center font-bold border-y border-black py-1 mb-2 bg-gray-100 uppercase text-sm">Outdoor Direct Sales Report</h3>
        <table className="w-full border-collapse border border-black text-[10px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-black px-1 py-1">SL No</th>
              <th className="border border-black px-1 py-1">Patient ID</th>
              <th className="border border-black px-1 py-1">Patient Name</th>
              <th className="border border-black px-1 py-1">Bill ID</th>
              <th className="border border-black px-1 py-1">Actual Amount</th>
              <th className="border border-black px-1 py-1">Less</th>
              <th className="border border-black px-1 py-1">Paid</th>
              <th className="border border-black px-1 py-1">Due</th>
              <th className="border border-black px-1 py-1">Creator</th>
            </tr>
          </thead>
          <tbody>
            {outdoorSales.map((sale: any, idx: number) => (
              <tr key={sale.invoiceNumber}>
                <td className="border border-black px-1 py-1 text-center">{sale.slNo || idx + 1}</td>
                <td className="border border-black px-1 py-1">{sale.patientNumber}</td>
                <td className="border border-black px-1 py-1">{sale.patientName || '-'}</td>
                <td className="border border-black px-1 py-1">{sale.invoiceNumber}</td>
                <td className="border border-black px-1 py-1 text-right">{sale.totalPrice?.toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{sale.discountAmount?.toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{sale.paid?.toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{sale.due?.toFixed(2)}</td>
                <td className="border border-black px-1 py-1">{sale.createdBy}</td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-100">
              <td colSpan={4} className="border border-black px-1 py-1 text-right uppercase">Sub Total :</td>
              <td className="border border-black px-1 py-1 text-right">{outdoorSubTotals.totalPrice?.toFixed(2)}</td>
              <td className="border border-black px-1 py-1 text-right">{outdoorSubTotals.discountAmount?.toFixed(2)}</td>
              <td className="border border-black px-1 py-1 text-right">{outdoorSubTotals.paid?.toFixed(2)}</td>
              <td className="border border-black px-1 py-1 text-right">{outdoorSubTotals.due?.toFixed(2)}</td>
              <td className="border border-black px-1 py-1"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Indoor Sales Report */}
      <div className="mb-6">
        <h3 className="text-center font-bold border-y border-black py-1 mb-2 bg-gray-100 uppercase text-sm">Indoor Sales Report</h3>
        <table className="w-full border-collapse border border-black text-[10px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-black px-1 py-1">SL No</th>
              <th className="border border-black px-1 py-1">Adm ID</th>
              <th className="border border-black px-1 py-1">Patient Name</th>
              <th className="border border-black px-1 py-1">Actual Amount</th>
              <th className="border border-black px-1 py-1">Current Sale</th>
              <th className="border border-black px-1 py-1">Less</th>
              <th className="border border-black px-1 py-1">Adjust</th>
              <th className="border border-black px-1 py-1">Paid</th>
              <th className="border border-black px-1 py-1">Due</th>
              <th className="border border-black px-1 py-1">Return</th>
            </tr>
          </thead>
          <tbody>
            {indoorSales.length > 0 ? indoorSales.map((sale: any, idx: number) => (
              <tr key={idx}>
                <td className="border border-black px-1 py-1 text-center">{sale.slNo || idx + 1}</td>
                <td className="border border-black px-1 py-1">{sale.admissionId}</td>
                <td className="border border-black px-1 py-1">{sale.patientName}</td>
                <td className="border border-black px-1 py-1 text-right">{sale.actualAmount?.toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{sale.currentSale?.toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{sale.less?.toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{sale.adjust?.toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{sale.paid?.toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{sale.due?.toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{sale.return?.toFixed(2)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={10} className="border border-black px-1 py-1 text-center italic">No indoor sales in this period</td>
              </tr>
            )}
            <tr className="font-bold bg-gray-100">
              <td colSpan={3} className="border border-black px-1 py-1 text-right uppercase">Sub Total :</td>
              <td className="border border-black px-1 py-1 text-right">{indoorSubTotals.actualAmount?.toFixed(2) || '0.00'}</td>
              <td className="border border-black px-1 py-1 text-right">{indoorSubTotals.currentSale?.toFixed(2) || '0.00'}</td>
              <td className="border border-black px-1 py-1 text-right">{indoorSubTotals.less?.toFixed(2) || '0.00'}</td>
              <td className="border border-black px-1 py-1 text-right">{indoorSubTotals.adjust?.toFixed(2) || '0.00'}</td>
              <td className="border border-black px-1 py-1 text-right">{indoorSubTotals.paid?.toFixed(2) || '0.00'}</td>
              <td className="border border-black px-1 py-1 text-right">{indoorSubTotals.due?.toFixed(2) || '0.00'}</td>
              <td className="border border-black px-1 py-1 text-right">{indoorSubTotals.return?.toFixed(2) || '0.00'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="flex justify-end mt-4">
        <div className="w-64 border border-black">
          <div className="bg-gray-200 text-center font-bold border-b border-black py-1 uppercase text-xs">Summary</div>
          <div className="p-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Total Sale</span>
              <span className="font-bold">{summary.totalSale?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Collection</span>
              <span className="font-bold">{summary.totalCollection?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Less Return</span>
              <span className="font-bold">{summary.totalDiscount?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="border-t border-black pt-1 flex justify-between">
              <span>Net Collection</span>
              <span className="font-bold">{summary.netCollection?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-16 flex justify-between px-8 text-xs italic">
        <div className="border-t border-black pt-1 w-32 text-center text-[10px]">Prepared By</div>
        <div className="border-t border-black pt-1 w-32 text-center text-[10px]">Verified By</div>
        <div className="border-t border-black pt-1 w-32 text-center text-[10px]">Authorized Signature</div>
      </div>
    </div>
  )
}
