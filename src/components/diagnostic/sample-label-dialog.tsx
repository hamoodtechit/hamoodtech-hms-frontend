"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { DiagnosticReport } from "@/types/diagnostic"
import { Printer, X } from "lucide-react"
import QRCode from "react-qr-code"

interface SampleLabelDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    report: DiagnosticReport | null
}

export function SampleLabelDialog({ open, onOpenChange, report }: SampleLabelDialogProps) {
    if (!report) return null

    const patientId = report.patient?.patientNumber || report.patient?.uhid || report.patient?.id?.slice(0, 8).toUpperCase() || "N/A"

    const handlePrint = () => {
        const printContent = document.getElementById('sample-label-content')?.innerHTML
        if (!printContent) return

        const iframe = document.createElement('iframe')
        iframe.style.cssText = 'position:fixed; width:100vw; height:100vh; left:-100vw; top:-100vh; border:none;'
        document.body.appendChild(iframe)

        const iframeDoc = iframe.contentWindow?.document
        if (iframeDoc) {
            iframeDoc.open()
            iframeDoc.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <meta charset="UTF-8">
                        <title>Print Sample Label</title>
                        <style>
                            @page { 
                                size: 50mm 25mm; 
                                margin: 0; 
                            }
                            body { 
                                margin: 0;
                                padding: 2mm;
                                font-family: 'Courier New', Courier, monospace;
                                -webkit-print-color-adjust: exact;
                                width: 50mm;
                                height: 25mm;
                                box-sizing: border-box;
                                overflow: hidden;
                            }
                            .label-container {
                                display: flex;
                                gap: 2mm;
                                height: 100%;
                                align-items: center;
                            }
                            .qr-side {
                                flex-shrink: 0;
                            }
                            .info-side {
                                flex: 1;
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                                overflow: hidden;
                            }
                            .patient-name {
                                font-size: 8pt;
                                font-weight: bold;
                                text-transform: uppercase;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            }
                            .test-name {
                                font-size: 7pt;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                margin-bottom: 0.5mm;
                            }
                            .id-bits {
                                font-size: 6pt;
                                display: flex;
                                justify-content: space-between;
                            }
                            .date {
                                font-size: 5pt;
                                margin-top: 0.5mm;
                                color: #444;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="label-container">
                            <div class="qr-side">
                                ${document.getElementById('qr-to-print')?.innerHTML}
                            </div>
                            <div class="info-side">
                                <div class="patient-name">${report.patient?.name}</div>
                                <div class="test-name">${report.diagnosticTest?.name}</div>
                                <div class="id-bits">
                                    <span>UHID: ${patientId}</span>
                                    <span>LAB: ${report.barcode || report.id.slice(-8).toUpperCase()}</span>
                                </div>
                                <div class="date">${new Date().toLocaleString()}</div>
                            </div>
                        </div>
                    </body>
                </html>
            `)
            iframeDoc.close()

            setTimeout(() => {
                iframe.contentWindow?.focus()
                iframe.contentWindow?.print()
                setTimeout(() => {
                    document.body.removeChild(iframe)
                }, 1000)
            }, 500)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Print Sample Label</DialogTitle>
                </DialogHeader>
                
                <div className="flex flex-col items-center gap-6 py-4">
                    <div 
                        id="sample-label-content" 
                        className="border p-4 bg-white rounded shadow-inner flex items-center gap-4 w-[50mm] h-[25mm] box-content"
                    >
                        <div id="qr-to-print">
                            <QRCode 
                                value={report.id} 
                                size={60}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                            />
                        </div>
                        <div className="flex flex-col justify-center overflow-hidden flex-1 min-w-0">
                            <p className="text-[10px] font-bold truncate uppercase">{report.patient?.name}</p>
                            <p className="text-[9px] truncate text-muted-foreground">{report.diagnosticTest?.name}</p>
                            <div className="flex justify-between items-center mt-1 w-full text-[7px] font-mono leading-none">
                                <span>UHID: {patientId}</span>
                            </div>
                            <p className="text-[7px] font-mono leading-none mt-1">LAB: {report.barcode || report.id.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        This label is formatted for 50mm x 25mm thermal stickers.
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700">
                        <Printer className="mr-2 h-4 w-4" />
                        Print Label
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
