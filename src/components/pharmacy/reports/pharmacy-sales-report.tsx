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
  const outdoorReturns = data?.outdoor?.returns || []
  const outdoorSubTotals = data?.outdoor?.subTotals || {}
  
  const indoorSales = data?.indoor?.sales || []
  const indoorReturns = data?.indoor?.returns || []
  const indoorSubTotals = data?.indoor?.subTotals || {}
  
  const dueCollections = data?.dueCollections || []
  const summary = data?.summary || {}

  const logoSrc = activeBranch?.logoUrl || "/Logo.png"

  return (
    <div id="pharmacy-sales-report" className="p-8 bg-white text-black font-sans print:p-0">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <img src={logoSrc} alt="Hospital Logo" className="h-16 w-auto mb-2" />
        <div className="text-center">
            <h1 className="text-2xl font-bold uppercase">PATWARY GENERAL HOSPITAL</h1>
            <h2 className="text-xl font-bold underline mt-1">Pharmacy Sales Statement</h2>
            <p className="text-sm mt-2">
            From {format(dateRange.from, "dd MMM yyyy")} to {format(dateRange.to, "dd MMM yyyy")}
            </p>
        </div>
      </div>

      {/* ── Outdoor Direct Sales ─────────────────────────────── */}
      <div className="mb-4">
        <h3 className="text-center font-bold border-y border-black py-1 mb-2 bg-gray-100 uppercase text-sm">Outdoor Direct Sales Report</h3>
        <table className="w-full border-collapse border border-black text-[10px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-black px-1 py-1">SL No</th>
              <th className="border border-black px-1 py-1">Patient ID</th>
              <th className="border border-black px-1 py-1">Bill ID</th>
              <th className="border border-black px-1 py-1 text-right">Total Amount</th>
              <th className="border border-black px-1 py-1 text-right">Discount</th>
              <th className="border border-black px-1 py-1 text-right">Tax</th>
              <th className="border border-black px-1 py-1 text-right">Net Amount</th>
              <th className="border border-black px-1 py-1 text-right">Paid</th>
              <th className="border border-black px-1 py-1 text-right">Due</th>
              <th className="border border-black px-1 py-1">Creator</th>
            </tr>
          </thead>
          <tbody>
            {outdoorSales.length > 0 ? outdoorSales.map((sale: any, idx: number) => (
              <tr key={sale.invoiceNumber}>
                <td className="border border-black px-1 py-1 text-center">{sale.slNo || idx + 1}</td>
                <td className="border border-black px-1 py-1">{sale.patientNumber}</td>
                <td className="border border-black px-1 py-1">{sale.invoiceNumber}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(sale.totalPrice).toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(sale.discountAmount).toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(sale.taxAmount).toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(sale.netAmount).toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(sale.paid).toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(sale.due).toFixed(2)}</td>
                <td className="border border-black px-1 py-1">{sale.createdBy}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={10} className="border border-black px-1 py-1 text-center italic">No outdoor sales in this period</td>
              </tr>
            )}
            <tr className="font-bold bg-gray-100">
              <td colSpan={3} className="border border-black px-1 py-1 text-right uppercase">Sub Total :</td>
              <td className="border border-black px-1 py-1 text-right">{Number(outdoorSubTotals.totalPrice || 0).toFixed(2)}</td>
              <td className="border border-black px-1 py-1 text-right">{Number(outdoorSubTotals.discountAmount || 0).toFixed(2)}</td>
              <td className="border border-black px-1 py-1 text-right">{Number(outdoorSubTotals.taxAmount || 0).toFixed(2)}</td>
              <td className="border border-black px-1 py-1 text-right">{Number(outdoorSubTotals.netAmount || 0).toFixed(2)}</td>
              <td className="border border-black px-1 py-1 text-right">{Number(outdoorSubTotals.paid || 0).toFixed(2)}</td>
              <td className="border border-black px-1 py-1 text-right">{Number(outdoorSubTotals.due || 0).toFixed(2)}</td>
              <td className="border border-black px-1 py-1"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Outdoor Returns ───────────────────────────────────── */}
      {outdoorReturns.length > 0 && (
        <div className="mb-4">
          <h3 className="text-center font-bold border-y border-black py-1 mb-2 bg-red-50 uppercase text-sm text-red-700">Outdoor Sales Returns</h3>
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-black px-1 py-1">SL No</th>
                <th className="border border-black px-1 py-1">Patient ID</th>
                <th className="border border-black px-1 py-1">Return Invoice</th>
                <th className="border border-black px-1 py-1 text-right">Return Amount</th>
                <th className="border border-black px-1 py-1 text-right">Tax</th>
                <th className="border border-black px-1 py-1">Date</th>
              </tr>
            </thead>
            <tbody>
              {outdoorReturns.map((ret: any, idx: number) => (
                <tr key={ret.invoiceNumber + idx}>
                  <td className="border border-black px-1 py-1 text-center">{ret.slNo || idx + 1}</td>
                  <td className="border border-black px-1 py-1">{ret.patientNumber}</td>
                  <td className="border border-black px-1 py-1">{ret.invoiceNumber}</td>
                  <td className="border border-black px-1 py-1 text-right">{Number(ret.totalReturn).toFixed(2)}</td>
                  <td className="border border-black px-1 py-1 text-right">{Number(ret.taxAmount).toFixed(2)}</td>
                  <td className="border border-black px-1 py-1">{ret.createdAt ? format(new Date(ret.createdAt), "dd MMM yy") : '-'}</td>
                </tr>
              ))}
              <tr className="font-bold bg-red-50">
                <td colSpan={3} className="border border-black px-1 py-1 text-right uppercase">Total Return :</td>
                <td className="border border-black px-1 py-1 text-right">{Number(outdoorSubTotals.totalReturn || 0).toFixed(2)}</td>
                <td colSpan={2} className="border border-black px-1 py-1"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Indoor Sales ─────────────────────────────────────── */}
      <div className="mb-4">
        <h3 className="text-center font-bold border-y border-black py-1 mb-2 bg-gray-100 uppercase text-sm">Indoor Sales Report</h3>
        <table className="w-full border-collapse border border-black text-[10px]">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-black px-1 py-1">SL No</th>
              <th className="border border-black px-1 py-1">Adm ID</th>
              <th className="border border-black px-1 py-1">Patient Name</th>
              <th className="border border-black px-1 py-1 text-right">Total Amount</th>
              <th className="border border-black px-1 py-1 text-right">Discount</th>
              <th className="border border-black px-1 py-1 text-right">Tax</th>
              <th className="border border-black px-1 py-1 text-right">Net Amount</th>
              <th className="border border-black px-1 py-1 text-right">Paid</th>
              <th className="border border-black px-1 py-1 text-right">Due</th>
            </tr>
          </thead>
          <tbody>
            {indoorSales.length > 0 ? indoorSales.map((sale: any, idx: number) => (
              <tr key={idx}>
                <td className="border border-black px-1 py-1 text-center">{sale.slNo || idx + 1}</td>
                <td className="border border-black px-1 py-1">{sale.admissionId || '-'}</td>
                <td className="border border-black px-1 py-1">{sale.patientName || sale.patientNumber || '-'}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(sale.totalPrice || 0).toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(sale.discountAmount || 0).toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(sale.taxAmount || 0).toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(sale.netAmount || 0).toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(sale.paid || 0).toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(sale.due || 0).toFixed(2)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={9} className="border border-black px-1 py-1 text-center italic">No indoor sales in this period</td>
              </tr>
            )}
            <tr className="font-bold bg-gray-100">
              <td colSpan={3} className="border border-black px-1 py-1 text-right uppercase">Sub Total :</td>
              <td className="border border-black px-1 py-1 text-right">{Number(indoorSubTotals.totalPrice || 0).toFixed(2)}</td>
              <td className="border border-black px-1 py-1 text-right">{Number(indoorSubTotals.discountAmount || 0).toFixed(2)}</td>
              <td className="border border-black px-1 py-1 text-right">{Number(indoorSubTotals.taxAmount || 0).toFixed(2)}</td>
              <td className="border border-black px-1 py-1 text-right">{Number(indoorSubTotals.netAmount || 0).toFixed(2)}</td>
              <td className="border border-black px-1 py-1 text-right">{Number(indoorSubTotals.paid || 0).toFixed(2)}</td>
              <td className="border border-black px-1 py-1 text-right">{Number(indoorSubTotals.due || 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Indoor Returns ────────────────────────────────────── */}
      {indoorReturns.length > 0 && (
        <div className="mb-4">
          <h3 className="text-center font-bold border-y border-black py-1 mb-2 bg-red-50 uppercase text-sm text-red-700">Indoor Sales Returns</h3>
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-black px-1 py-1">SL No</th>
                <th className="border border-black px-1 py-1">Patient ID</th>
                <th className="border border-black px-1 py-1">Return Invoice</th>
                <th className="border border-black px-1 py-1 text-right">Return Amount</th>
                <th className="border border-black px-1 py-1 text-right">Tax</th>
                <th className="border border-black px-1 py-1">Date</th>
              </tr>
            </thead>
            <tbody>
              {indoorReturns.map((ret: any, idx: number) => (
                <tr key={ret.invoiceNumber + idx}>
                  <td className="border border-black px-1 py-1 text-center">{ret.slNo || idx + 1}</td>
                  <td className="border border-black px-1 py-1">{ret.patientNumber}</td>
                  <td className="border border-black px-1 py-1">{ret.invoiceNumber}</td>
                  <td className="border border-black px-1 py-1 text-right">{Number(ret.totalReturn).toFixed(2)}</td>
                  <td className="border border-black px-1 py-1 text-right">{Number(ret.taxAmount).toFixed(2)}</td>
                  <td className="border border-black px-1 py-1">{ret.createdAt ? format(new Date(ret.createdAt), "dd MMM yy") : '-'}</td>
                </tr>
              ))}
              <tr className="font-bold bg-red-50">
                <td colSpan={3} className="border border-black px-1 py-1 text-right uppercase">Total Return :</td>
                <td className="border border-black px-1 py-1 text-right">{Number(indoorSubTotals.totalReturn || 0).toFixed(2)}</td>
                <td colSpan={2} className="border border-black px-1 py-1"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Due Collections ────────────────────────────────────── */}
      {dueCollections.length > 0 && (
        <div className="mb-4">
          <h3 className="text-center font-bold border-y border-black py-1 mb-2 bg-blue-50 uppercase text-sm text-blue-700">Due Collections</h3>
          <table className="w-full border-collapse border border-black text-[10px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-black px-1 py-1">SL No</th>
                <th className="border border-black px-1 py-1">Invoice Number</th>
                <th className="border border-black px-1 py-1">Patient ID</th>
                <th className="border border-black px-1 py-1 text-right">Collected Amount</th>
                <th className="border border-black px-1 py-1">Payment Method</th>
              </tr>
            </thead>
            <tbody>
              {dueCollections.map((col: any, idx: number) => (
                <tr key={idx}>
                  <td className="border border-black px-1 py-1 text-center">{col.slNo || idx + 1}</td>
                  <td className="border border-black px-1 py-1">{col.invoiceNumber}</td>
                  <td className="border border-black px-1 py-1">{col.patientNumber}</td>
                  <td className="border border-black px-1 py-1 text-right">{Number(col.collectedAmount).toFixed(2)}</td>
                  <td className="border border-black px-1 py-1 uppercase">{col.paymentMethod}</td>
                </tr>
              ))}
              <tr className="font-bold bg-blue-50 text-blue-800">
                <td colSpan={3} className="border border-black px-1 py-1 text-right uppercase">Total Due Collected :</td>
                <td className="border border-black px-1 py-1 text-right">{Number(summary.totalDueCollected || 0).toFixed(2)}</td>
                <td className="border border-black px-1 py-1"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── Summary ───────────────────────────────────────────── */}
      <div className="flex justify-end mt-4">
        <div className="w-72 border border-black">
          <div className="bg-gray-200 text-center font-bold border-b border-black py-1 uppercase text-xs">Summary</div>
          <div className="p-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Total Sale (Gross)</span>
              <span className="font-bold">{Number(summary.totalSale || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Tax</span>
              <span className="font-bold">{Number(summary.totalTax || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Total Discount</span>
              <span className="font-bold">- {Number(summary.totalDiscount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-black pt-1">
              <span>Net Sales</span>
              <span className="font-bold">{Number(summary.totalNetSale || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Total Return</span>
              <span className="font-bold">- {Number(summary.totalReturn || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-blue-700">
              <span>Total Due Collected</span>
              <span className="font-bold">{Number(summary.totalDueCollected || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-black pt-1">
              <span>Total Collection</span>
              <span>{Number(summary.totalCollection || 0).toFixed(2)}</span>
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
