"use client"

import { useCurrency } from "@/hooks/use-currency"
import { IncomeGroup, IncomeReportResponse } from "@/types/finance"
import { Branch } from "@/types/pharmacy"
import { format } from "date-fns"

interface SalesFinancePrintProps {
  reportData: IncomeReportResponse
  dateRange: { from: Date; to: Date }
  activeBranch?: Branch | null
}

export function SalesFinancePrint({ reportData, dateRange, activeBranch }: SalesFinancePrintProps) {
  const { formatCurrency } = useCurrency()
  const incomeGroups = reportData.groups || []
  const totalIncome = reportData.summary?.totalCollection || 0
  const logoSrc = activeBranch?.logoUrl || "/Logo.png"

  return (
    <div id="sales-finance-report" className="bg-white p-8 font-sans text-black print:p-0">
      <div className="mb-6 flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="Hospital Logo" className="mb-2 h-16 w-auto" />
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase">PATWARY GENERAL HOSPITAL</h1>
          <h2 className="mt-1 text-xl font-bold underline">Sales & Finance Statement</h2>
          <p className="mt-2 text-sm">From {format(dateRange.from, "dd MMM yyyy")} to {format(dateRange.to, "dd MMM yyyy")}</p>
        </div>
      </div>

      <div className="mb-6 flex justify-around border-y border-black bg-gray-50 py-2 font-bold">
        <div>Total Income: {formatCurrency(totalIncome)}</div>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 border-y border-black bg-emerald-50 py-1 text-center text-sm font-bold uppercase text-emerald-800">Income Breakdown</h3>
        {incomeGroups.length === 0 ? <div className="py-2 text-center text-sm italic">No income data in this period.</div> : incomeGroups.map((group: IncomeGroup, index: number) => (
          <div key={index} className="mb-4">
            <h4 className="mb-1 text-sm font-bold uppercase">{group.type}</h4>
            <table className="w-full border-collapse border border-black text-[10px]"><thead><tr className="bg-gray-50"><th className="border border-black px-1 py-1">SL No</th><th className="border border-black px-1 py-1">Patient No</th><th className="border border-black px-1 py-1">Patient Name</th><th className="border border-black px-1 py-1">Invoice No</th><th className="border border-black px-1 py-1 text-right">Total Price</th><th className="border border-black px-1 py-1 text-right">Discount</th><th className="border border-black px-1 py-1 text-right">Net Amount</th><th className="border border-black px-1 py-1 text-right">Paid</th><th className="border border-black px-1 py-1 text-right">Due</th><th className="border border-black px-1 py-1">Created By</th></tr></thead><tbody>{group.sales.map((sale) => <tr key={sale.slNo}><td className="border border-black px-1 py-1 text-center">{sale.slNo}</td><td className="border border-black px-1 py-1">{sale.patientNumber}</td><td className="border border-black px-1 py-1">{sale.patientName}</td><td className="border border-black px-1 py-1">{sale.invoiceNumber}</td><td className="border border-black px-1 py-1 text-right">{Number(sale.totalPrice).toFixed(2)}</td><td className="border border-black px-1 py-1 text-right">{Number(sale.discountAmount).toFixed(2)}</td><td className="border border-black px-1 py-1 text-right">{Number(sale.netAmount).toFixed(2)}</td><td className="border border-black px-1 py-1 text-right text-emerald-700">{Number(sale.paid).toFixed(2)}</td><td className="border border-black px-1 py-1 text-right text-red-700">{Number(sale.due).toFixed(2)}</td><td className="border border-black px-1 py-1">{sale.createdBy || "-"}</td></tr>)}<tr className="bg-gray-100 font-bold"><td colSpan={4} className="border border-black px-1 py-1 text-right uppercase">Sub Total:</td><td className="border border-black px-1 py-1 text-right">{Number(group.subTotals.totalPrice || 0).toFixed(2)}</td><td className="border border-black px-1 py-1 text-right">{Number(group.subTotals.discountAmount || 0).toFixed(2)}</td><td className="border border-black px-1 py-1 text-right">{Number(group.subTotals.netAmount || 0).toFixed(2)}</td><td className="border border-black px-1 py-1 text-right text-emerald-800">{Number(group.subTotals.paid || 0).toFixed(2)}</td><td className="border border-black px-1 py-1 text-right text-red-800">{Number(group.subTotals.due || 0).toFixed(2)}</td><td className="border border-black px-1 py-1" /></tr></tbody></table>
          </div>
        ))}
      </div>

      <div className="mt-16 flex justify-between px-8 text-xs font-bold"><div className="w-32 border-t border-black pt-1 text-center">Prepared By</div><div className="w-32 border-t border-black pt-1 text-center">Accounts Dept.</div><div className="w-32 border-t border-black pt-1 text-center">Authorized By</div></div>
    </div>
  )
}
