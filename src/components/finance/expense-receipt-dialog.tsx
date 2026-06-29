"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCurrency } from "@/hooks/use-currency"
import { useSettingsStore } from "@/store/use-settings-store"
import { usePosStore } from "@/store/use-pos-store"
import { useAuthStore } from "@/store/use-auth-store"
import { Printer, CheckCircle2 } from "lucide-react"
import { Expense } from "@/types/expense"

interface ExpenseReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
}

export function ExpenseReceiptDialog({ open, onOpenChange, expense }: ExpenseReceiptDialogProps) {
  const { general } = useSettingsStore()
  const { activeBranch } = usePosStore()
  const { user } = useAuthStore()

  if (!expense) return null

  const handlePrint = () => {
    const branch = activeBranch
    const branchLogo = branch?.logoUrl || "/Logo.png"
    const hospitalName = general?.hospitalName || branch?.name || "Hospital Name"
    const address = general?.address || branch?.address || "Hospital Address"
    const phone = general?.phone || branch?.phone || "Phone"
    const email = general?.email || branch?.email || ""

    const printableHtml = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <style>
              @page { size: 80mm auto; margin: 0; }
              body { 
                  font-family: 'Courier New', Courier, monospace; 
                  width: 80mm; 
                  margin: 0; 
                  padding: 5mm; 
                  box-sizing: border-box;
                  color: black;
                  background: white;
                  line-height: 1.2;
              }
              .container { width: 100%; display: flex; flex-direction: column; align-items: center; }
              .header { text-align: center; margin-bottom: 10px; width: 100%; }
              .hospital-name { font-size: 18px; font-weight: 900; margin: 0; text-transform: uppercase; }
              .tag { font-size: 11px; font-weight: 900; letter-spacing: 2px; color: #444; margin: 2px 0; border-top: 1px solid #ddd; border-bottom: 1px solid #ddd; padding: 2px 0; }
              .contact-info { font-size: 10px; font-weight: bold; margin: 2px 0; }
              .info-grid { width: 100%; border-top: 1px dashed black; border-bottom: 1px dashed black; padding: 5px 0; margin-top: 5px; font-size: 11px; font-weight: bold; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
              .details { width: 100%; margin-top: 10px; font-size: 12px; }
              .details-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
              .totals-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-weight: 900; font-size: 13px; border-top: 1px solid black; padding-top: 5px; }
              .totals-table td { padding: 4px 0; }
              .footer { text-align: center; margin-top: 15px; border-top: 1px dashed black; padding-top: 10px; font-size: 10px; text-transform: uppercase; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <img src="${branchLogo}" style="height: 60px; margin-bottom: 5px;" onerror="this.style.display='none'">
                  <h1 class="hospital-name">${hospitalName}</h1>
                  <div class="tag">EXPENSE VOUCHER</div>
                  <div class="contact-info">${address}</div>
                  <div class="contact-info">Phone: ${phone}</div>
                  ${email ? `<div class="contact-info">Email: ${email}</div>` : ''}
              </div>

              <div class="info-grid">
                  <div class="info-row">
                      <span>Voucher #: ${expense.expenseNumber}</span>
                  </div>
                  <div class="info-row">
                      <span>Date: ${new Date(expense.date).toLocaleDateString('en-GB')}</span>
                      <span>Time: ${new Date(expense.date).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
              </div>

              <div class="details">
                  <div class="details-row">
                      <span>Category:</span>
                      <span style="font-weight: bold;">${expense.category?.name || "N/A"}</span>
                  </div>
                  <div class="details-row">
                      <span>Paid From:</span>
                      <span style="font-weight: bold;">${expense.account?.name || "N/A"}</span>
                  </div>
                  ${expense.note ? `
                  <div class="details-row" style="flex-direction: column; margin-top: 4px;">
                      <span style="margin-bottom: 2px;">Note:</span>
                      <span style="font-weight: normal; font-style: italic;">${expense.note}</span>
                  </div>` : ''}
              </div>

              <table class="totals-table">
                  <tr style="font-size: 18px;">
                      <td>AMOUNT PAID</td>
                      <td style="text-align: right;">${Number(expense.amount).toFixed(2)} ৳</td>
                  </tr>
              </table>

              <div class="footer">
                  <p style="font-weight: 900; margin-bottom: 5px;">EXPENSE VOUCHER</p>
                  <p style="font-weight: 900; line-height: 1.4;">Recorded by: ${(expense as any)?.createdBy || (expense as any)?.recordedBy?.fullName || user?.fullName || 'Staff'}</p>
                  <p style="margin-top: 10px; font-weight: 900; color: black; text-transform: none;">*Powered by HamoodTech.</p>
              </div>
          </div>
      </body>
      </html>
    `

    const printWindow = window.open('', '', 'width=400,height=600')
    if (printWindow) {
      printWindow.document.write(printableHtml)
      printWindow.document.close()
      
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Expense Voucher Options</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium text-center">Expense Selected</h3>
          <p className="text-sm text-muted-foreground text-center">
            Voucher #{expense.expenseNumber} for {Number(expense.amount).toFixed(2)} ৳
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t">
          <Button onClick={handlePrint} className="w-full flex items-center justify-center">
            <Printer className="mr-2 h-4 w-4" />
            Print Thermal Voucher (80mm)
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
