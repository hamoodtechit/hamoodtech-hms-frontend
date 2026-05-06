"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCurrency } from "@/hooks/use-currency"
import { useSettingsStore } from "@/store/use-settings-store"
import { useAuthStore } from "@/store/use-auth-store"
import { Printer, X, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { Commission, ReferralPerson } from "@/types/hr"
import { useEffect } from "react"

// Simple number to words converter (Indian numbering system format)
function numberToWords(num: number): string {
  if (num === 0) return "ZERO";
  const a = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
  const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " HUNDRED" + (n % 100 !== 0 ? " " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " THOUSAND" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " LAKH" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " CRORE" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  };

  return inWords(Math.floor(num));
}

interface CommissionReceiptDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    payoutData: {
        referral: Partial<ReferralPerson>
        commissions: Commission[]
        totalAmount: number
        paymentMethod: string
        date: string
        note?: string
    } | null
}

export function CommissionReceiptDialog({ open, onOpenChange, payoutData }: CommissionReceiptDialogProps) {
    const { general } = useSettingsStore()
    const { formatCurrency } = useCurrency()
    const { user } = useAuthStore()

    useEffect(() => {
        if (open && payoutData) {
            console.log("Commission Payout Receipt — Payout Data:", payoutData);
        }
    }, [open, payoutData]);

    if (!payoutData) return null

    const { referral, commissions, totalAmount, paymentMethod, date, note } = payoutData
    const amountInWords = numberToWords(totalAmount) + " TAKA ONLY"
    // Branch info is typically available on the referral object
    const branchName = referral.branch?.name || general?.hospitalName || "Hospital"

    const handlePrint = () => {
        const printContent = document.getElementById('commission-receipt-content')?.innerHTML;
        if (!printContent) return;

        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed; width:100vw; height:100vh; left:-100vw; top:-100vh; border:none;';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Payout Receipt</title>
                        <style>
                            @page { size: A4; margin: 10mm; }
                            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                            .print-container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 5mm; }
                            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid black; padding-bottom: 10px; }
                            .hospital-name { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 0; }
                            .hospital-info { font-size: 12px; font-weight: bold; margin: 2px 0; }
                            .receipt-title { display: inline-block; border: 1px solid black; padding: 5px 20px; font-weight: bold; margin-top: 10px; text-transform: uppercase; border-radius: 20px; background: #f0f0f0; }
                            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px dashed black; }
                            .info-table td { padding: 8px; border: 1px dashed black; font-size: 13px; font-weight: bold; }
                            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                            .items-table th { border-top: 1px solid black; border-bottom: 1px solid black; padding: 8px; text-align: left; font-size: 12px; font-weight: bold; text-transform: uppercase; }
                            .items-table td { padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; }
                            .totals { float: right; width: 250px; margin-top: 20px; }
                            .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-weight: bold; }
                            .net-payable { border-top: 1px dashed black; border-bottom: 1px dashed black; margin: 5px 0; padding: 8px 0; font-size: 16px; }
                            .footer { clear: both; margin-top: 40px; font-size: 11px; font-weight: bold; border-top: 1px dashed black; pt: 10px; }
                            .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
                            .sig-box { border-top: 1px dashed black; width: 180px; text-align: center; padding-top: 5px; font-size: 12px; font-weight: bold; }
                            .watermark { position: absolute; left: 0; top: 30%; width: 100%; text-align: center; font-size: 100px; opacity: 0.05; transform: rotate(-30deg); font-weight: bold; pointer-events: none; }
                            .text-primary { color: #000 !important; }
                            .text-emerald-600 { color: #059669 !important; }
                            .opacity-60 { opacity: 0.6 !important; }
                        </style>
                    </head>
                    <body>
                        <div class="print-container">
                            ${printContent}
                        </div>
                    </body>
                </html>
            `);
            iframeDoc.close();
            
            setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 500);
        }
    }

    const ReceiptBody = () => (
        <div className="bg-white p-8 relative min-h-[500px] text-black receipt-container">
            <style dangerouslySetInnerHTML={{ __html: `
                .receipt-container .text-primary { color: #0f172a !important; }
                .receipt-container .text-emerald-600 { color: #059669 !important; }
                .receipt-container .text-muted-foreground { color: #64748b !important; }
                .receipt-container table td, .receipt-container table th { color: #000 !important; }
            `}} />

            <div className="header text-center mb-8 pb-4 border-b-2 border-black">
                <h1 style={{ margin: '0', padding: '0', fontSize: '22px', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1', width: '100%', color: '#000' }}>{general?.hospitalName || "PATWARY GENERAL HOSPITAL"}</h1>
                <p style={{ margin: '0', padding: '0', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2', color: '#000' }}>{general?.address || "Address Not Set"}</p>
                <p style={{ margin: '0', padding: '0', fontSize: '11px', fontWeight: 'bold', lineHeight: '1.2', color: '#000' }}>Ph: {general?.phone || "Phone Not Set"}</p>
                <div className="receipt-title mt-4 px-8 py-1.5 border border-black rounded-full bg-gray-50 font-black tracking-widest text-sm inline-block text-black">
                    Commission Payout Receipt
                </div>
            </div>

            <table className="info-table w-full border-collapse mb-8 border border-dashed border-black">
                <tbody>
                    <tr>
                        <td className="p-4 border border-dashed border-black">
                            <span className="opacity-60 uppercase text-[10px] block mb-1">Referral Partner</span>
                            <span className="text-sm font-black uppercase text-black" style={{ color: '#000' }}>{referral.name}</span>
                        </td>
                        <td className="p-4 border border-dashed border-black">
                            <span className="opacity-60 uppercase text-[10px] block mb-1">Receipt Date</span>
                            <span className="text-sm font-black">{format(new Date(date), "dd MMM yyyy hh:mm a")}</span>
                        </td>
                    </tr>
                    <tr>
                        <td className="p-4 border border-dashed border-black">
                            <span className="opacity-60 uppercase text-[10px] block mb-1">Contact No.</span>
                            <span className="text-sm font-bold">{referral.phone}</span>
                        </td>
                        <td className="p-4 border border-dashed border-black">
                            <span className="opacity-60 uppercase text-[10px] block mb-1">Payment Method</span>
                            <span className="text-sm font-black uppercase text-emerald-600">{paymentMethod}</span>
                        </td>
                    </tr>
                </tbody>
            </table>

            <table className="items-table w-full mb-8">
                <thead>
                    <tr className="border-y border-black uppercase text-[11px] font-black tracking-wider">
                        <th className="py-3 text-left">SL</th>
                        <th className="py-3 text-left">Service / Item Details</th>
                        <th className="py-3 text-left">Invoice #</th>
                        <th className="py-3 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {commissions.map((comm, idx) => (
                        <tr key={comm.id} className="border-b border-gray-100">
                            <td className="py-3 text-xs">{idx + 1}</td>
                            <td className="py-3">
                                <p className="text-xs font-bold">{comm.serviceName}</p>
                                <p className="text-[10px] text-muted-foreground uppercase">{comm.patientName || (comm as any).sale?.patientName || (comm as any).sale?.patient?.name || "N/A"}</p>
                            </td>
                            <td className="py-3 text-xs font-mono">{(comm as any).invoiceNumber || comm.sale?.invoiceNumber || "N/A"}</td>
                            <td className="py-3 text-right text-xs font-bold">{formatCurrency(comm.commissionValue || (comm as any).commissionAmount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="totals float-right w-72 mt-4">
                <div className="total-row flex justify-between py-1 text-sm font-bold opacity-70">
                    <span>Subtotal Earned</span>
                    <span>{formatCurrency(totalAmount)}</span>
                </div>
                <div className="net-payable flex justify-between items-center py-4 border-y border-dashed border-black mt-2">
                    <span className="text-sm font-black uppercase text-black">Net Payout</span>
                    <span className="text-2xl font-black text-black tracking-tighter" style={{ color: '#0f172a' }}>{formatCurrency(totalAmount)}</span>
                </div>
            </div>

            <div className="footer clear-both mt-12 pt-4 border-t border-dashed border-black">
                <p className="text-[11px] font-black uppercase tracking-wider mb-2">Amount in Words: {amountInWords}</p>
                {note && <p className="text-[11px] font-medium italic opacity-60">Note: {note}</p>}
            </div>

            <div className="signatures mt-24 flex justify-between gap-16">
                <div className="sig-box text-center flex-1">
                    <div className="border-t border-dashed border-black pt-2">
                        <span className="text-[11px] font-black uppercase">Recipient Signature</span>
                    </div>
                </div>
                <div className="sig-box text-center flex-1">
                    <div className="border-t border-dashed border-black pt-2">
                        <span className="text-[11px] font-black uppercase">Authorized By</span>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center border-t border-gray-100 pt-4">
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    *Powered By HamoodTech
                </p>
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden sm:rounded-[2rem] border-none shadow-2xl bg-white print:shadow-none">
                <div className="no-print p-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black">Payout Successful</DialogTitle>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Receipt generated for {referral.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={handlePrint} size="sm" className="rounded-xl bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                            <Printer className="w-4 h-4 mr-2" />
                            Print Receipt
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => onOpenChange(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <ScrollArea className="max-h-[80vh] print:max-h-none">
                    <div id="commission-receipt-content">
                        <ReceiptBody />
                    </div>
                </ScrollArea>
                
                <div className="no-print p-4 bg-gray-50 flex justify-end">
                     <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-muted font-bold px-8 h-12">
                        Dismiss
                     </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
