"use client"

import { useCurrency } from "@/hooks/use-currency"
import { Branch } from "@/types/pharmacy"
import { format } from "date-fns"

interface PurchaseReportProps {
  data: any
  dateRange: { from: Date; to: Date }
  activeBranch?: Branch | null
}

export function PharmacyPurchaseReport({ data, dateRange, activeBranch }: PurchaseReportProps) {
  const { formatCurrency } = useCurrency()
  
  const pharmacyData = data?.pharmacy || { purchases: [], subTotals: {} }
  const hospitalData = data?.hospital || { purchases: [], subTotals: {} }
  const clinicData = data?.clinic || { purchases: [], subTotals: {} }
  const summary = data?.summary || {}

  const logoSrc = activeBranch?.logoUrl || "/Logo.png"

  const renderPurchaseTable = (title: string, sectionData: any) => {
    const purchases = sectionData.purchases || []
    const returns = sectionData.returns || []
    const subTotals = sectionData.subTotals || {}

    if (purchases.length === 0 && returns.length === 0) return null

    return (
      <div className="mb-6">
        <h3 className="text-center font-bold border-y border-black py-1 mb-2 bg-gray-100 uppercase text-[11px]">{title}</h3>
        {purchases.length > 0 && (
          <table className="w-full border-collapse border border-black text-[9px] mb-4">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-black px-1 py-1">SL No</th>
                <th className="border border-black px-1 py-1">Date</th>
                <th className="border border-black px-1 py-1">PO Number</th>
                <th className="border border-black px-1 py-1">Supplier</th>
                <th className="border border-black px-1 py-1 text-right">Gross Price</th>
                <th className="border border-black px-1 py-1 text-right">Discount</th>
                <th className="border border-black px-1 py-1 text-right">Net Amount</th>
                <th className="border border-black px-1 py-1 text-right">Paid</th>
                <th className="border border-black px-1 py-1 text-right">Due</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((po: any, idx: number) => (
                <tr key={po.id || idx}>
                  <td className="border border-black px-1 py-1 text-center">{po.slNo || idx + 1}</td>
                  <td className="border border-black px-1 py-1">{po.createdAt ? format(new Date(po.createdAt), "dd MMM yy") : '-'}</td>
                  <td className="border border-black px-1 py-1 font-medium">{po.poNumber}</td>
                  <td className="border border-black px-1 py-1">{po.supplierName || 'N/A'}</td>
                  <td className="border border-black px-1 py-1 text-right">{Number(po.totalPrice || 0).toFixed(2)}</td>
                  <td className="border border-black px-1 py-1 text-right">{Number(po.discountAmount || 0).toFixed(2)}</td>
                  <td className="border border-black px-1 py-1 text-right">{Number(po.netAmount || (Number(po.totalPrice) - Number(po.discountAmount))).toFixed(2)}</td>
                  <td className="border border-black px-1 py-1 text-right">{Number(po.paidAmount || po.paid || 0).toFixed(2)}</td>
                  <td className="border border-black px-1 py-1 text-right font-semibold">{Number(po.dueAmount || po.due || 0).toFixed(2)}</td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-50">
                <td colSpan={4} className="border border-black px-2 py-1 text-right uppercase text-[10px]">Sub Totals :</td>
                <td className="border border-black px-1 py-1 text-right">{Number(subTotals.totalPrice || 0).toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(subTotals.discountAmount || 0).toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(subTotals.netAmount || 0).toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(subTotals.paid || 0).toFixed(2)}</td>
                <td className="border border-black px-1 py-1 text-right">{Number(subTotals.due || 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        )}

        {returns.length > 0 && (
          <div className="mt-2">
            <h4 className="text-[10px] font-bold mb-1 ml-1 text-red-700">Returns</h4>
            <table className="w-full border-collapse border border-black text-[9px]">
              <thead>
                <tr className="bg-red-50">
                  <th className="border border-black px-1 py-1">SL No</th>
                  <th className="border border-black px-1 py-1">Date</th>
                  <th className="border border-black px-1 py-1">PO Number</th>
                  <th className="border border-black px-1 py-1">Supplier</th>
                  <th className="border border-black px-1 py-1 text-right">Return Amount</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((ret: any, idx: number) => (
                  <tr key={idx}>
                    <td className="border border-black px-1 py-1 text-center">{idx + 1}</td>
                    <td className="border border-black px-1 py-1">{ret.createdAt ? format(new Date(ret.createdAt), "dd MMM yy") : '-'}</td>
                    <td className="border border-black px-1 py-1">{ret.poNumber}</td>
                    <td className="border border-black px-1 py-1">{ret.supplierName}</td>
                    <td className="border border-black px-1 py-1 text-right">{Number(ret.totalReturn || 0).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-red-50">
                  <td colSpan={4} className="border border-black px-2 py-1 text-right uppercase text-[10px]">Total Return :</td>
                  <td className="border border-black px-1 py-1 text-right">{Number(subTotals.totalReturn || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <div id="pharmacy-purchase-report" className="p-8 bg-white text-black font-serif print:p-0">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <img src={logoSrc} alt="Hospital Logo" className="h-16 w-auto mb-2" />
        <div className="text-center">
            <h1 className="text-2xl font-bold uppercase">{activeBranch?.name || 'PATWARY GENERAL HOSPITAL'}</h1>
            <h2 className="text-xl font-bold underline mt-1 italic">Pharmacy Purchase Statement</h2>
            <p className="text-sm mt-2">
            Date Range: {format(dateRange.from, "dd MMM yyyy")} to {format(dateRange.to, "dd MMM yyyy")}
            </p>
        </div>
      </div>

      {/* Sections */}
      {renderPurchaseTable("Pharmacy Purchases", pharmacyData)}
      {renderPurchaseTable("Hospital Purchases", hospitalData)}
      {renderPurchaseTable("Clinic Purchases", clinicData)}

      {/* ── Summary ───────────────────────────────────────────── */}
      <div className="flex justify-end mt-6">
        <div className="w-72 border border-black shadow-sm">
          <div className="bg-gray-200 text-center font-bold border-b border-black py-1 uppercase text-xs">Consolidated Summary</div>
          <div className="p-3 space-y-2 text-[11px]">
            <div className="flex justify-between">
              <span className="font-medium">Gross Purchase</span>
              <span className="font-bold">{formatCurrency(Number(summary.totalPurchase || 0))}</span>
            </div>
            <div className="flex justify-between text-blue-800">
              <span className="font-medium">Total Discount Received</span>
              <span className="font-bold">- {formatCurrency(Number(summary.totalDiscount || 0))}</span>
            </div>
            <div className="flex justify-between border-t border-black pt-2 font-black text-sm">
              <span>Total Net Payable</span>
              <span>{formatCurrency(Number(summary.totalNetPurchase || 0))}</span>
            </div>
            <div className="flex justify-between text-emerald-700 pt-1 border-t border-dashed border-black/20">
              <span className="font-medium">Total Amount Paid</span>
              <span className="font-bold">{formatCurrency(Number(summary.totalPaid || 0))}</span>
            </div>
            <div className="flex justify-between text-red-600 border-t border-black pt-1 font-bold text-[12px]">
              <span>Outstanding Balance</span>
              <span>{formatCurrency(Number(summary.totalNetPurchase - summary.totalPaid || 0))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-20 flex justify-between px-8 text-xs italic">
        <div className="flex flex-col items-center">
            <div className="border-t border-black pt-1 w-40 text-center text-[10px] font-bold uppercase">Prepared By</div>
            <span className="text-[9px] text-muted-foreground mt-1">Pharmacy Department</span>
        </div>
        <div className="flex flex-col items-center">
            <div className="border-t border-black pt-1 w-40 text-center text-[10px] font-bold uppercase">Accounts Dept</div>
            <span className="text-[9px] text-muted-foreground mt-1">Verified & Verified</span>
        </div>
        <div className="flex flex-col items-center">
            <div className="border-t border-black pt-1 w-48 text-center text-[10px] font-bold uppercase">Authorized Signature</div>
            <span className="text-[9px] text-muted-foreground mt-1">Hospital Management</span>
        </div>
      </div>

      <div className="mt-8 text-[8px] text-muted-foreground italic text-center border-t pt-2">
        This is a system generated report. Printed on {format(new Date(), "PPP p")}
      </div>
    </div>
  )
}
