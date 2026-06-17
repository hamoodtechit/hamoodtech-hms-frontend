"use client"

import { useCurrency } from "@/hooks/use-currency"
import { Branch } from "@/types/pharmacy"
import { format } from "date-fns"
import { IncomeGroup, ExpenseGroup } from "@/types/finance"

interface FinanceStatementReportProps {
  incomeData: any
  expenseData: any
  dateRange: { from: Date; to: Date }
  activeBranch?: Branch | null
}

export function FinanceStatementReport({ incomeData, expenseData, dateRange, activeBranch }: FinanceStatementReportProps) {
  const { formatCurrency } = useCurrency()
  
  const incomeGroups = incomeData?.groups || []
  const expenseGroups = expenseData?.groups || []
  
  const totalIncome = incomeData?.summary?.totalCollection || 0
  const totalExpense = expenseData?.summary?.totalExpenditure || 0
  const cashInHand = totalIncome - totalExpense

  const logoSrc = activeBranch?.logoUrl || "/Logo.png"

  return (
    <div id="finance-statement-report" className="p-8 bg-white text-black font-serif print:p-0">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <img src={logoSrc} alt="Hospital Logo" className="h-16 w-auto mb-2" />
        <div className="text-center">
            <h1 className="text-2xl font-bold uppercase">{activeBranch?.name || 'PATWARY GENERAL HOSPITAL'}</h1>
            <h2 className="text-xl font-bold underline mt-1">Finance Income & Expense Statement</h2>
            <p className="text-sm mt-2">
            From {format(dateRange.from, "dd MMM yyyy")} to {format(dateRange.to, "dd MMM yyyy")}
            </p>
        </div>
      </div>

      {/* Global Summary */}
      <div className="mb-6 flex justify-around border-y border-black py-2 bg-gray-50 font-bold">
          <div>Total Income: {formatCurrency(totalIncome)}</div>
          <div>Total Expenditure: {formatCurrency(totalExpense)}</div>
          <div className="text-blue-800">Cash in Hand: {formatCurrency(cashInHand)}</div>
      </div>

      {/* ── Income Report ─────────────────────────────── */}
      <div className="mb-6">
        <h3 className="text-center font-bold border-y border-black py-1 mb-2 bg-emerald-50 uppercase text-sm text-emerald-800">Income Breakdown</h3>
        {incomeGroups.length === 0 ? (
            <div className="text-center italic py-2 text-sm">No income data in this period.</div>
        ) : (
            incomeGroups.map((group: IncomeGroup, idx: number) => (
                <div key={idx} className="mb-4">
                    <h4 className="font-bold text-sm mb-1 uppercase">{group.type}</h4>
                    <table className="w-full border-collapse border border-black text-[10px]">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="border border-black px-1 py-1">SL No</th>
                                <th className="border border-black px-1 py-1">Patient No</th>
                                <th className="border border-black px-1 py-1">Patient Name</th>
                                <th className="border border-black px-1 py-1">Invoice No</th>
                                <th className="border border-black px-1 py-1 text-right">Total Price</th>
                                <th className="border border-black px-1 py-1 text-right">Discount</th>
                                <th className="border border-black px-1 py-1 text-right">Net Amount</th>
                                <th className="border border-black px-1 py-1 text-right">Paid</th>
                                <th className="border border-black px-1 py-1 text-right">Due</th>
                                <th className="border border-black px-1 py-1">Created By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.sales.map((sale: any) => (
                                <tr key={sale.slNo}>
                                    <td className="border border-black px-1 py-1 text-center">{sale.slNo}</td>
                                    <td className="border border-black px-1 py-1">{sale.patientNumber}</td>
                                    <td className="border border-black px-1 py-1">{sale.patientName}</td>
                                    <td className="border border-black px-1 py-1">{sale.invoiceNumber}</td>
                                    <td className="border border-black px-1 py-1 text-right">{Number(sale.totalPrice).toFixed(2)}</td>
                                    <td className="border border-black px-1 py-1 text-right">{Number(sale.discountAmount).toFixed(2)}</td>
                                    <td className="border border-black px-1 py-1 text-right">{Number(sale.netAmount).toFixed(2)}</td>
                                    <td className="border border-black px-1 py-1 text-right text-emerald-700 font-medium">{Number(sale.paid).toFixed(2)}</td>
                                    <td className="border border-black px-1 py-1 text-right text-red-700">{Number(sale.due).toFixed(2)}</td>
                                    <td className="border border-black px-1 py-1">{sale.createdBy || '-'}</td>
                                </tr>
                            ))}
                            <tr className="font-bold bg-gray-100">
                                <td colSpan={4} className="border border-black px-1 py-1 text-right uppercase">Sub Total:</td>
                                <td className="border border-black px-1 py-1 text-right">{Number(group.subTotals.totalPrice || 0).toFixed(2)}</td>
                                <td className="border border-black px-1 py-1 text-right">{Number(group.subTotals.discountAmount || 0).toFixed(2)}</td>
                                <td className="border border-black px-1 py-1 text-right">{Number(group.subTotals.netAmount || 0).toFixed(2)}</td>
                                <td className="border border-black px-1 py-1 text-right text-emerald-800">{Number(group.subTotals.paid || 0).toFixed(2)}</td>
                                <td className="border border-black px-1 py-1 text-right text-red-800">{Number(group.subTotals.due || 0).toFixed(2)}</td>
                                <td className="border border-black px-1 py-1"></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ))
        )}
      </div>

      {/* ── Expense Report ─────────────────────────────── */}
      <div className="mb-6">
        <h3 className="text-center font-bold border-y border-black py-1 mb-2 bg-rose-50 uppercase text-sm text-rose-800">Expense Breakdown</h3>
        {expenseGroups.length === 0 ? (
            <div className="text-center italic py-2 text-sm">No expense data in this period.</div>
        ) : (
            expenseGroups.map((group: ExpenseGroup, idx: number) => (
                <div key={idx} className="mb-4">
                    <h4 className="font-bold text-sm mb-1 uppercase">{group.category}</h4>
                    <table className="w-full border-collapse border border-black text-[10px]">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="border border-black px-1 py-1">SL No</th>
                                <th className="border border-black px-1 py-1">Date</th>
                                <th className="border border-black px-1 py-1">Expense No</th>
                                <th className="border border-black px-1 py-1">Note</th>
                                <th className="border border-black px-1 py-1">Recorded By</th>
                                <th className="border border-black px-1 py-1 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {group.expenses.map((expense: any) => (
                                <tr key={expense.slNo}>
                                    <td className="border border-black px-1 py-1 text-center">{expense.slNo}</td>
                                    <td className="border border-black px-1 py-1">{format(new Date(expense.date), "dd MMM yy")}</td>
                                    <td className="border border-black px-1 py-1">{expense.expenseNumber}</td>
                                    <td className="border border-black px-1 py-1">{expense.note}</td>
                                    <td className="border border-black px-1 py-1">{expense.recordedBy}</td>
                                    <td className="border border-black px-1 py-1 text-right text-rose-700 font-medium">{Number(expense.amount).toFixed(2)}</td>
                                </tr>
                            ))}
                            <tr className="font-bold bg-gray-100">
                                <td colSpan={5} className="border border-black px-1 py-1 text-right uppercase">Category Sub Total:</td>
                                <td className="border border-black px-1 py-1 text-right text-rose-800">{Number(group.subTotals.amount || 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ))
        )}
      </div>
      
      {/* Footer Signatures */}
      <div className="mt-16 flex justify-between px-8 text-xs font-bold">
        <div className="border-t border-black pt-1 w-32 text-center">Prepared By</div>
        <div className="border-t border-black pt-1 w-32 text-center">Accounts Dept.</div>
        <div className="border-t border-black pt-1 w-32 text-center">Authorized By</div>
      </div>
    </div>
  )
}
