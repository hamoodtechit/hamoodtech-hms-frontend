"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useCurrency } from "@/hooks/use-currency"
import { useSettingsStore } from "@/store/use-settings-store"
import { usePosStore } from "@/store/use-pos-store"
import { useAuthStore } from "@/store/use-auth-store"
import { Printer, CheckCircle2 } from "lucide-react"

interface BulkPaymentReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: any
  patientName: string
}

export function BulkPaymentReceiptDialog({ open, onOpenChange, data, patientName }: BulkPaymentReceiptDialogProps) {
  const { general } = useSettingsStore()
  const { activeBranch } = usePosStore()
  const { formatCurrency } = useCurrency()
  const { user } = useAuthStore()

  if (!data) return null

  const paymentData = data.data || data
  const paidSales = paymentData.paidSales || []
  const totalPaid = paidSales.reduce((sum: number, sale: any) => sum + Number(sale.paidAmount || 0), 0)
  const date = new Date().toISOString()

  const handlePrint = () => {
    const branch = activeBranch
    const branchLogo = branch?.logoUrl || "/Logo.png"
    const hospitalName = general?.hospitalName || branch?.name || "Hospital Name"
    const address = general?.address || branch?.address || "Hospital Address"
    const phone = general?.phone || branch?.phone || "Phone"
    const email = general?.email || branch?.email || ""

    const rows = paidSales.map((sale: any) => `
      <tr style="font-size: 10px; border-bottom: 1px dashed #e0e0e0;">
        <td style="text-align: left; font-weight: 900; padding: 5px 0;">${sale.invoiceNumber}</td>
        <td style="text-align: right; font-weight: 900; padding: 5px 0;">${Number(sale.paidAmount).toFixed(2)}</td>
      </tr>
    `).join('')

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
              .info-grid { width: 100%; border-top: 1px solid black; border-bottom: 1px solid black; padding: 5px 0; margin-top: 5px; font-size: 11px; font-weight: bold; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
              .items-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              .items-table th { font-size: 10px; border-bottom: 2px solid black; padding-bottom: 2px; text-align: left; }
              .totals-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-weight: 900; font-size: 13px; }
              .totals-table td { padding: 2px 0; }
              .footer { text-align: center; margin-top: 15px; border-top: 1px dashed black; padding-top: 10px; font-size: 10px; text-transform: uppercase; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <img src="${branchLogo}" style="height: 60px; margin-bottom: 5px;">
                  <h1 class="hospital-name">${hospitalName}</h1>
                  <div class="tag">BULK PAYMENT RECEIPT</div>
                  <div class="contact-info">${address}</div>
                  <div class="contact-info">Phone: ${phone}</div>
                  ${email ? `<div class="contact-info">Email: ${email}</div>` : ''}
              </div>

              <div class="info-grid">
                  <div class="info-row">
                      <span>Patient: ${patientName}</span>
                  </div>
                  <div class="info-row">
                      <span>Date: ${new Date(date).toLocaleDateString('en-GB')}</span>
                      <span>Time: ${new Date(date).toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
              </div>

              <table class="items-table">
                  <thead>
                      <tr>
                          <th style="width: 70%;">INVOICE</th>
                          <th style="width: 30%; text-align: right;">PAID</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${rows}
                  </tbody>
              </table>

              <div style="border-top: 1px dashed black; margin-top: 5px;"></div>

              <table class="totals-table">
                  <tr style="font-size: 16px;">
                      <td>TOTAL PAID</td>
                      <td style="text-align: right;">${totalPaid.toFixed(2)} ৳</td>
                  </tr>
                  ${paymentData.newPatientBalance !== undefined ? `
                  <tr style="font-size: 12px; color: #444;">
                      <td>NEW BALANCE</td>
                      <td style="text-align: right;">${Number(paymentData.newPatientBalance).toFixed(2)} ৳</td>
                  </tr>` : ''}
              </table>

              <div class="footer">
                  <p style="font-weight: 900; margin-bottom: 5px;">PAYMENT RECEIVED WITH THANKS</p>
                  <p style="font-weight: 900; line-height: 1.4;">Collected by: ${user?.fullName || 'Staff'}</p>
                  <p style="margin-top: 10px; font-weight: 900; color: black; text-transform: none;">*Powered by HamoodTech.</p>
              </div>
          </div>
      </body>
      </html>
    `

    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed; width:100vw; height:100vh; left:-100vw; top:-100vh; border:none;'
    document.body.appendChild(iframe)
    const iframeDoc = iframe.contentWindow?.document
    if (iframeDoc) {
      iframeDoc.open()
      iframeDoc.write(printableHtml)
      iframeDoc.close()
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => document.body.removeChild(iframe), 1000)
      }, 500)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
            Payment Successful
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground uppercase font-bold tracking-wider">Total Collected</p>
            <h2 className="text-3xl font-black text-foreground">{formatCurrency(totalPaid)}</h2>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Patient Name</span>
              <span className="font-bold">{patientName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bills Settled</span>
              <span className="font-bold">{paidSales.length} Invoices</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">New Balance</span>
                <span className="font-bold text-emerald-600">{formatCurrency(paymentData.newPatientBalance || 0)}</span>
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 space-y-2 max-h-[150px] overflow-y-auto">
            <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Invoice Summary</p>
            {paidSales.map((sale: any, idx: number) => (
              <div key={idx} className="flex justify-between text-xs font-medium">
                <span>{sale.invoiceNumber}</span>
                <span>{formatCurrency(sale.paidAmount)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handlePrint} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Printer className="h-4 w-4" />
            Print Receipt
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
