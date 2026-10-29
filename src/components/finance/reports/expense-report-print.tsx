"use client"

import { useCurrency } from "@/hooks/use-currency"
import { ExpenseReportResponse, ExpenseGroup } from "@/types/finance"
import { Branch } from "@/types/pharmacy"
import { format } from "date-fns"

interface ExpenseReportPrintProps {
  reportData: ExpenseReportResponse
  dateRange: { from: Date; to: Date }
  activeBranch?: Branch | null
}

export function ExpenseReportPrint({ reportData, dateRange, activeBranch }: ExpenseReportPrintProps) {
  const { formatCurrency } = useCurrency()
  const logoSrc = activeBranch?.logoUrl || "/Logo.png"

  return (
    <div id="expense-report-print" className="bg-white p-8 font-sans text-black print:p-0">
      <div className="mb-6 flex flex-col items-center border-b-2 border-black pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="Hospital Logo" className="mb-2 h-16 w-auto" />
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase">{activeBranch?.name || "PATWARY GENERAL HOSPITAL"}</h1>
          <h2 className="mt-1 text-xl font-bold">Expense Report</h2>
          <p className="mt-2 text-sm font-medium">Period: {format(dateRange.from, "dd MMM yyyy")} - {format(dateRange.to, "dd MMM yyyy")}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4">
        <div className="border border-black bg-gray-50 p-3 text-center">
          <div className="mb-1 text-xs font-bold uppercase">Total Expenditure</div>
          <div className="text-lg font-black">{formatCurrency(reportData.summary?.totalExpenditure || 0)}</div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-3 border-b border-black pb-2 text-sm font-bold uppercase">Expense Breakdown</h3>
        {reportData.groups.length === 0 ? (
          <p className="py-4 text-center text-sm italic">No expense data available for the selected dates.</p>
        ) : reportData.groups.map((group: ExpenseGroup, index: number) => (
          <div key={index} className="mb-5">
            <h4 className="mb-2 border-y border-black bg-gray-100 py-1 text-center text-sm font-bold uppercase">{group.category} Expenses</h4>
            <table className="w-full border-collapse border border-black text-[10px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-black px-1 py-1">SL No</th>
                  <th className="border border-black px-1 py-1">Date</th>
                  <th className="border border-black px-1 py-1">Expense No</th>
                  <th className="border border-black px-1 py-1">Note</th>
                  <th className="border border-black px-1 py-1">Recorded By</th>
                  <th className="border border-black px-1 py-1 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {group.expenses.map((expense) => (
                  <tr key={expense.slNo}>
                    <td className="border border-black px-1 py-1 text-center">{expense.slNo}</td>
                    <td className="border border-black px-1 py-1">{format(new Date(expense.date), "dd MMM yy")}</td>
                    <td className="border border-black px-1 py-1">{expense.expenseNumber}</td>
                    <td className="border border-black px-1 py-1">{expense.note || "-"}</td>
                    <td className="border border-black px-1 py-1">{expense.recordedBy || "-"}</td>
                    <td className="border border-black px-1 py-1 text-right">{formatCurrency(expense.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={5} className="border border-black px-1 py-1 text-right uppercase">Category Sub Total:</td>
                  <td className="border border-black px-1 py-1 text-right">{formatCurrency(group.subTotals.amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="mt-20 flex justify-between px-8 text-xs font-bold">
        <div className="w-40 border-t border-black pt-1 text-center">Prepared By</div>
        <div className="w-40 border-t border-black pt-1 text-center">Accounts Manager</div>
        <div className="w-40 border-t border-black pt-1 text-center">Authorized Signature</div>
      </div>
      <div className="mt-8 flex justify-between border-t border-gray-300 pt-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
        <span>Powered by HamoodTech</span><span>Printed: {new Date().toLocaleString("en-GB")}</span>
      </div>
    </div>
  )
}
