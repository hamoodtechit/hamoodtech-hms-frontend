"use client"

import { useCurrency } from "@/hooks/use-currency"
import { Branch } from "@/types/pharmacy"
import { format } from "date-fns"
import { IOverallSummaryData, ISalesByType } from "@/types/report"

interface OverallSummaryPrintProps {
  reportData: IOverallSummaryData
  dateRange: { from: Date; to: Date }
  activeBranch?: Branch | null
}

export function OverallSummaryPrint({ reportData, dateRange, activeBranch }: OverallSummaryPrintProps) {
  const { formatCurrency } = useCurrency()
  
  const logoSrc = activeBranch?.logoUrl || "/Logo.png"
  const summary = reportData?.summary
  const consultations = reportData?.consultations
  const referrals = reportData?.referrals
  const salesByType = reportData?.salesByType || []

  return (
    <div id="overall-summary-report" className="p-8 bg-white text-black font-serif print:p-0">
      {/* Header */}
      <div className="flex flex-col items-center mb-6 border-b-2 border-black pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="Hospital Logo" className="h-16 w-auto mb-2" />
        <div className="text-center">
            <h1 className="text-2xl font-bold uppercase">{activeBranch?.name || 'PATWARY GENERAL HOSPITAL'}</h1>
            <h2 className="text-xl font-bold mt-1">Overall Financial Summary Report</h2>
            <p className="text-sm mt-2 font-medium">
                Period: {format(dateRange.from, "dd MMM yyyy")} - {format(dateRange.to, "dd MMM yyyy")}
            </p>
        </div>
      </div>

      {/* Main KPI Boxes */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="border border-black p-3 text-center bg-gray-50">
            <div className="text-xs font-bold uppercase mb-1">Total Sales</div>
            <div className="text-lg font-black">{formatCurrency(summary?.totalSales || 0)}</div>
        </div>
        <div className="border border-black p-3 text-center bg-gray-50">
            <div className="text-xs font-bold uppercase mb-1">Total Collection</div>
            <div className="text-lg font-black">{formatCurrency(summary?.totalPaid || 0)}</div>
        </div>
        <div className="border border-black p-3 text-center bg-gray-50">
            <div className="text-xs font-bold uppercase mb-1">Total Dues</div>
            <div className="text-lg font-black">{formatCurrency(summary?.totalDues || 0)}</div>
        </div>
        <div className="border border-black p-3 text-center bg-gray-50">
            <div className="text-xs font-bold uppercase mb-1">Total Discounts</div>
            <div className="text-lg font-black">{formatCurrency(summary?.totalDiscount || 0)}</div>
        </div>
      </div>

      {/* Profit & Loss Overview */}
      <div className="mb-8">
        <h3 className="font-bold border-b border-black mb-3 uppercase text-sm">Profit & Loss Overview</h3>
        <table className="w-full border-collapse border border-black text-sm">
            <tbody>
                <tr>
                    <td className="border border-black p-2 w-1/2 font-semibold bg-gray-50">Total Expenses</td>
                    <td className="border border-black p-2 w-1/2 text-right">{formatCurrency(summary?.totalExpenses || 0)}</td>
                </tr>
                <tr>
                    <td className="border border-black p-2 font-semibold bg-gray-50">Gross Profit (Sales - Purchases)</td>
                    <td className="border border-black p-2 text-right font-bold">{formatCurrency(summary?.grossProfit || 0)}</td>
                </tr>
                <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 uppercase text-lg">Net Profit</td>
                    <td className="border border-black p-2 text-right font-black text-lg bg-gray-100">{formatCurrency(summary?.netProfit || 0)}</td>
                </tr>
                <tr>
                    <td colSpan={2} className="border border-black p-1 text-center text-xs italic">
                        *Net Profit = Collection - (Expenses + Purchase Payments + Commissions)
                    </td>
                </tr>
            </tbody>
        </table>
      </div>

      {/* Two Column Section for Consultations and Referrals */}
      <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
              <h3 className="font-bold border-b border-black mb-3 uppercase text-sm">Doctor Consultations</h3>
              <table className="w-full border-collapse border border-black text-sm">
                  <tbody>
                      <tr>
                          <td className="border border-black p-2 font-medium">Charge Collected</td>
                          <td className="border border-black p-2 text-right">{formatCurrency(consultations?.chargePaid || 0)}</td>
                      </tr>
                      <tr>
                          <td className="border border-black p-2 font-medium">Charge Due</td>
                          <td className="border border-black p-2 text-right">{formatCurrency(consultations?.chargeDue || 0)}</td>
                      </tr>
                      <tr>
                          <td className="border border-black p-2 font-medium">Commission Paid</td>
                          <td className="border border-black p-2 text-right">{formatCurrency(consultations?.commissionPaid || 0)}</td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <div>
              <h3 className="font-bold border-b border-black mb-3 uppercase text-sm">Referrals / Agents</h3>
              <table className="w-full border-collapse border border-black text-sm">
                  <tbody>
                      <tr>
                          <td className="border border-black p-2 font-medium">Total Commission</td>
                          <td className="border border-black p-2 text-right">{formatCurrency(referrals?.totalCommission || 0)}</td>
                      </tr>
                      <tr>
                          <td className="border border-black p-2 font-medium">Commission Paid</td>
                          <td className="border border-black p-2 text-right">{formatCurrency(referrals?.commissionPaid || 0)}</td>
                      </tr>
                      <tr>
                          <td className="border border-black p-2 font-medium">Commission Due</td>
                          <td className="border border-black p-2 text-right">{formatCurrency(referrals?.commissionDue || 0)}</td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>

      {/* Departmental Breakdown */}
      <div className="mb-6">
        <h3 className="font-bold border-b border-black mb-3 uppercase text-sm">Departmental Sales Breakdown</h3>
        <table className="w-full border-collapse border border-black text-sm text-center">
            <thead className="bg-gray-100">
                <tr>
                    <th className="border border-black p-2 text-left uppercase">Department</th>
                    <th className="border border-black p-2 uppercase">Total Sales</th>
                    <th className="border border-black p-2 uppercase">Discounts</th>
                    <th className="border border-black p-2 uppercase">Collection</th>
                    <th className="border border-black p-2 uppercase">Dues</th>
                </tr>
            </thead>
            <tbody>
                {salesByType.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="border border-black p-4 text-center italic text-gray-500">
                            No departmental data available.
                        </td>
                    </tr>
                ) : (
                    salesByType.map((sale: ISalesByType, index: number) => (
                        <tr key={index}>
                            <td className="border border-black p-2 text-left capitalize font-semibold">{sale.type}</td>
                            <td className="border border-black p-2 text-right">{formatCurrency(sale.totalSales)}</td>
                            <td className="border border-black p-2 text-right">{formatCurrency(sale.totalDiscount)}</td>
                            <td className="border border-black p-2 text-right font-bold">{formatCurrency(sale.totalPaid)}</td>
                            <td className="border border-black p-2 text-right">{formatCurrency(sale.totalDues)}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      {/* Footer Signatures */}
      <div className="mt-20 flex justify-between px-8 text-xs font-bold">
        <div className="border-t border-black pt-1 w-40 text-center">Prepared By</div>
        <div className="border-t border-black pt-1 w-40 text-center">Accounts Manager</div>
        <div className="border-t border-black pt-1 w-40 text-center">Authorized Signature</div>
      </div>

      <div className="mt-8 pt-2 border-t border-gray-300 text-[10px] text-gray-500 font-bold flex justify-between uppercase tracking-widest text-center">
        <span>*Powered by HamoodTech</span>
        <span>Printed: {new Date().toLocaleString('en-GB')}</span>
      </div>
    </div>
  )
}
