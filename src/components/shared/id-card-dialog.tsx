"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { Printer, X } from "lucide-react"
// @ts-ignore
import QRCode from "react-qr-code"

interface IdCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: "patient" | "employee"
  data: any // Patient or Employee object
}

export function IdCardDialog({ open, onOpenChange, type, data }: IdCardDialogProps) {
  const { stores, activeStoreId } = useStoreContext()
  const { general } = useSettingsStore()
  const activeBranch = stores.find(s => s.id === activeStoreId) || stores[0]

  if (!data) return null

  const logoUrl = (general as any)?.logoUrl || activeBranch?.logoUrl || "/Logo.png"
  const hospitalName = general?.hospitalName || activeBranch?.name || "UNITY HOSPITAL"
  const address = general?.address || activeBranch?.address || "1400 Healing Way, Aurora, CO 80011"
  const phone = general?.phone || activeBranch?.phone || "1-800-UNITY-247"

  // Patient Info
  const uhid = data.uhid || data.patientNumber || "N/A"
  const patientName = data.name || "N/A"
  const age = data.age || "N/A"
  const bloodGroup = data.bloodGroup || "N/A"
  const gender = data.gender ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1) : "N/A"

  // Employee Info
  const empId = data.employeeNumber || "N/A"
  const empName = data.name || "N/A"
  const designation = data.designation?.name || "Staff"
  const department = data.department?.name || "General"

  const qrValue = type === "patient" ? `PT:${uhid}` : `EMP:${empId}`

  const handlePrint = () => {
    const printContent = document.getElementById('id-card-print-content')?.innerHTML
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
            <title>Print ID Card</title>
            <style>
              @page { 
                size: 54mm 86mm; /* Standard CR80 Size */
                margin: 0; 
              }
              body { 
                margin: 0;
                padding: 0;
                font-family: 'Arial', sans-serif;
                -webkit-print-color-adjust: exact;
                width: 54mm;
                height: 86mm;
                box-sizing: border-box;
                overflow: hidden;
                background: #fff !important;
                color: #000 !important;
              }
              * {
                box-sizing: border-box;
              }
              .page-break {
                page-break-before: always;
              }
            </style>
          </head>
          <body>
            \${printContent}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  setTimeout(() => {
                    window.parent.document.body.removeChild(window.frameElement);
                  }, 500);
                }, 500);
              };
            </script>
          </body>
        </html>
      `)
      iframeDoc.close()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-muted/30">
        <DialogHeader className="px-6 py-4 border-b bg-background flex flex-row items-center justify-between sticky top-0 z-20 shrink-0">
          <DialogTitle className="text-xl">
            {type === 'patient' ? 'Patient ID Card' : 'Staff ID Card'}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print Card
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center gap-8 pb-20">
          {/* Print Container (Hidden from main UI, but used for extraction) */}
          <div id="id-card-print-content" className="hidden">
            {type === 'patient' ? (
              <>
                {/* Patient Front */}
                <div style={{ width: '54mm', height: '86mm', background: '#fff', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  {/* Blue Top Header */}
                  <div style={{ background: '#bfdbfe', height: '15mm', width: '100%' }}></div>
                  <div style={{ position: 'absolute', top: '0', right: '0', width: '0', height: '0', borderBottom: '15mm solid white', borderRight: '15mm solid transparent' }}></div>
                  
                  {/* Logo and Hospital Name */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '4mm', gap: '2mm' }}>
                    <img src={logoUrl} style={{ height: '8mm', width: 'auto' }} alt="Logo" />
                    <div style={{ color: '#1e3a8a', fontWeight: '900', fontSize: '10px', lineHeight: '1.1' }}>
                      {hospitalName.toUpperCase()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', color: '#1e3a8a', fontSize: '9px', fontWeight: 'bold', paddingRight: '4mm', marginBottom: '2mm' }}>
                    PATIENT ID CARD
                  </div>

                  {/* Photo & Details Row */}
                  <div style={{ display: 'flex', padding: '0 4mm', gap: '3mm' }}>
                    <div style={{ width: '18mm', height: '22mm', border: '1px solid #3b82f6', display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      </div>
                      <div style={{ fontSize: '6px', textAlign: 'center', background: '#e2e8f0', padding: '1px' }}>PHOTO</div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1mm' }}>
                      <div>
                        <div style={{ color: '#1e3a8a', fontSize: '8px', fontWeight: 'bold' }}>Name:</div>
                        <div style={{ color: '#1e3a8a', fontSize: '11px', fontWeight: 'bold' }}>{patientName}</div>
                      </div>
                      <div style={{ borderBottom: '1px solid #bfdbfe', paddingBottom: '1mm' }}>
                        <span style={{ color: '#1e3a8a', fontSize: '8px', fontWeight: 'bold' }}>UHID: </span>
                        <span style={{ fontSize: '8px' }}>{uhid}</span>
                      </div>
                      <div style={{ borderBottom: '1px solid #bfdbfe', paddingBottom: '1mm' }}>
                        <span style={{ color: '#1e3a8a', fontSize: '8px', fontWeight: 'bold' }}>Age: </span>
                        <span style={{ fontSize: '8px' }}>{age}</span>
                      </div>
                      <div style={{ borderBottom: '1px solid #bfdbfe', paddingBottom: '1mm' }}>
                        <span style={{ color: '#1e3a8a', fontSize: '8px', fontWeight: 'bold' }}>Blood Group: </span>
                        <span style={{ fontSize: '8px', fontWeight: 'bold' }}>{bloodGroup}</span>
                      </div>
                      <div>
                        <span style={{ color: '#1e3a8a', fontSize: '8px', fontWeight: 'bold' }}>Gender: </span>
                        <span style={{ fontSize: '8px' }}>{gender}</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4mm', flexDirection: 'column', alignItems: 'center', gap: '1mm' }}>
                    <div style={{ background: 'white', padding: '1mm', display: 'inline-block' }}>
                      <QRCode value={qrValue} size={40} />
                    </div>
                    <div style={{ fontSize: '10px' }}>
                       {qrValue}
                    </div>
                  </div>

                  {/* Bottom Angles */}
                  <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '8mm', background: '#3b82f6' }}></div>
                  <div style={{ position: 'absolute', bottom: '0', right: '0', width: '0', height: '0', borderBottom: '10mm solid white', borderLeft: '30mm solid transparent' }}></div>
                </div>

                <div className="page-break"></div>

                {/* Patient Back */}
                <div style={{ width: '54mm', height: '86mm', background: '#fff', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                  {/* Blue Top */}
                  <div style={{ background: '#1e3a8a', height: '22mm', width: '100%', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingTop: '2mm' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
                      <img src={logoUrl} style={{ height: '6mm', filter: 'brightness(0) invert(1)' }} alt="Logo" />
                      <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{hospitalName.toUpperCase()}</div>
                    </div>
                    <div style={{ fontSize: '8px', marginTop: '1mm' }}>PATIENT ID CARD</div>
                  </div>
                  
                  {/* Emergency Contacts */}
                  <div style={{ padding: '4mm', color: '#0f172a' }}>
                    <div style={{ color: '#1e3a8a', fontSize: '9px', fontWeight: 'bold', marginBottom: '2mm', textAlign: 'center' }}>EMERGENCY CONTACTS</div>
                    <div style={{ fontSize: '8px', marginBottom: '1mm' }}>Name: ______________________</div>
                    <div style={{ fontSize: '8px', marginBottom: '1mm' }}>Relationship: ________________</div>
                    <div style={{ fontSize: '8px', marginBottom: '1mm' }}>Phone 1: ____________________</div>
                    <div style={{ fontSize: '8px', marginBottom: '3mm' }}>Phone 2: ____________________</div>

                    <div style={{ color: '#1e3a8a', fontSize: '9px', fontWeight: 'bold', marginBottom: '2mm', textAlign: 'center' }}>IMPORTANT INFORMATION</div>
                    <div style={{ fontSize: '7px', textAlign: 'center', marginBottom: '1mm' }}>
                      <strong style={{ color: '#1e3a8a' }}>24/7 HELPLINE:</strong><br/>{phone}
                    </div>
                    <div style={{ fontSize: '7px', textAlign: 'center' }}>
                      <strong style={{ color: '#1e3a8a' }}>HOSPITAL ADDRESS:</strong><br/>{address}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}></div>

                  {/* Return Disclaimer */}
                  <div style={{ background: '#3b82f6', color: 'white', padding: '3mm', textAlign: 'center', fontSize: '8px', fontWeight: 'bold' }}>
                    IF FOUND, PLEASE RETURN TO<br/>{hospitalName.toUpperCase()}<br/>
                    {phone}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Staff Front */}
                <div style={{ width: '54mm', height: '86mm', background: '#0f172a', position: 'relative', overflow: 'hidden', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
                  {/* Top Hole */}
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2mm' }}>
                    <div style={{ width: '12mm', height: '3mm', background: 'white', borderRadius: '2mm' }}></div>
                  </div>

                  {/* Gold Header */}
                  <div style={{ background: '#eab308', height: '14mm', width: '100%', marginTop: '3mm', display: 'flex', alignItems: 'center', padding: '0 4mm', gap: '2mm' }}>
                     <img src={logoUrl} style={{ height: '8mm' }} alt="Logo" />
                     <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '8px', lineHeight: '1.2' }}>{hospitalName.toUpperCase()}</div>
                  </div>

                  {/* Middle Content */}
                  <div style={{ display: 'flex', padding: '4mm', gap: '3mm' }}>
                     <div style={{ width: '20mm', height: '24mm', border: '1.5px solid #eab308', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                     </div>
                     <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                       <div style={{ color: '#eab308', fontSize: '12px', fontWeight: '900', lineHeight: '1' }}>STAFF</div>
                       <div style={{ color: '#eab308', fontSize: '12px', fontWeight: '900', lineHeight: '1', marginBottom: '2mm' }}>ID CARD</div>
                       <div style={{ color: 'white', fontSize: '7px', fontWeight: 'bold' }}>{designation.toUpperCase()}</div>
                     </div>
                  </div>

                  {/* Details */}
                  <div style={{ padding: '0 4mm' }}>
                    <div style={{ color: '#eab308', fontSize: '12px', fontWeight: 'bold', marginBottom: '2mm' }}>{empName.toUpperCase()}</div>
                    <div style={{ fontSize: '7px', color: '#94a3b8', marginBottom: '1mm' }}>
                      <strong style={{ color: '#eab308' }}>DESIGNATION:</strong> {designation}
                    </div>
                    <div style={{ fontSize: '7px', color: '#94a3b8', marginBottom: '1mm' }}>
                      <strong style={{ color: '#eab308' }}>EMPLOYEE ID:</strong> {empId}
                    </div>
                    <div style={{ fontSize: '7px', color: '#94a3b8' }}>
                      <strong style={{ color: '#eab308' }}>DEPARTMENT:</strong> {department}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}></div>

                  {/* Barcode / Footer */}
                  <div style={{ background: 'white', padding: '2mm', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                     <div style={{ fontSize: '12px', letterSpacing: '2px', fontFamily: 'monospace' }}>||||||||||||||||||||</div>
                     <div style={{ fontSize: '6px', fontWeight: 'bold' }}>{empId}</div>
                  </div>
                  <div style={{ background: '#0f172a', padding: '2mm', textAlign: 'center', borderTop: '1px solid #eab308' }}>
                    <div style={{ color: 'white', fontSize: '7px', fontWeight: 'bold' }}>{hospitalName.toUpperCase()}</div>
                  </div>
                </div>

                <div className="page-break"></div>

                {/* Staff Back */}
                <div style={{ width: '54mm', height: '86mm', background: '#0f172a', position: 'relative', overflow: 'hidden', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
                  {/* Top Hole */}
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2mm' }}>
                    <div style={{ width: '12mm', height: '3mm', background: 'white', borderRadius: '2mm' }}></div>
                  </div>
                  
                  <div style={{ textAlign: 'center', color: 'white', padding: '2mm' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1mm', marginBottom: '1mm' }}>
                      <img src={logoUrl} style={{ height: '4mm' }} alt="Logo" />
                      <div style={{ color: '#eab308', fontWeight: 'bold', fontSize: '9px' }}>{hospitalName.toUpperCase()}</div>
                    </div>
                    <div style={{ fontSize: '7px' }}>THIS SIDE IS FOR HOSPITAL USE</div>
                  </div>

                  <div style={{ background: '#eab308', flex: 1, margin: '0 2mm 2mm 2mm', borderRadius: '2mm', padding: '2mm' }}>
                    <div style={{ background: 'white', height: '100%', borderRadius: '1mm', padding: '2mm' }}>
                      <div style={{ background: '#eab308', display: 'inline-block', padding: '1px 3px', fontSize: '7px', fontWeight: 'bold', marginBottom: '2mm' }}>EMERGENCY CONTACTS</div>
                      <div style={{ fontSize: '6px', marginBottom: '1px' }}><strong>1. NAME:</strong> ____________________</div>
                      <div style={{ fontSize: '6px', marginBottom: '3px' }}><strong>   CONTACT:</strong> _________________</div>
                      <div style={{ fontSize: '6px', marginBottom: '1px' }}><strong>2. NAME:</strong> ____________________</div>
                      <div style={{ fontSize: '6px', marginBottom: '4mm' }}><strong>   CONTACT:</strong> _________________</div>

                      <div style={{ display: 'flex' }}>
                        <div style={{ flex: 1, color: '#0f172a' }}>
                          <div style={{ fontSize: '7px', fontWeight: 'bold', marginBottom: '2mm' }}>EMPLOYEE INFO</div>
                          <div style={{ fontSize: '6px', marginBottom: '1mm' }}><strong>BLOOD GROUP:</strong></div>
                          <div style={{ background: '#eab308', display: 'inline-block', padding: '1px 3px', fontSize: '7px', fontWeight: 'bold', marginBottom: '2mm', color: '#0f172a' }}>{bloodGroup}</div>
                          <div style={{ fontSize: '6px' }}><strong>DATE OF ISSUE:</strong></div>
                          <div style={{ fontSize: '6px', marginBottom: '2mm' }}>{new Date().toLocaleDateString('en-GB')}</div>
                        </div>
                        <div>
                           <div style={{ padding: '1px', border: '1px solid #eab308' }}>
                             <QRCode value={qrValue} size={30} />
                           </div>
                           <div style={{ fontSize: '5px', textAlign: 'center', fontWeight: 'bold', marginTop: '1px', color: '#0f172a' }}>SCAN FOR HR</div>
                        </div>
                      </div>

                      <div style={{ fontSize: '5.5px', marginTop: '2mm', lineHeight: '1.2', color: '#0f172a' }}>
                        This card is the property of <strong>{hospitalName}</strong> and must be surrendered upon termination of employment.
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '2mm', textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '6px', marginBottom: '1mm' }}>If found, please return immediately to:</div>
                    <div style={{ fontSize: '6px', marginBottom: '1mm' }}>Human Resources Department,</div>
                    <div style={{ fontSize: '6px' }}>{address}</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Visual Display for User */}
          <div className="flex gap-8 justify-center overflow-x-auto w-full max-w-[800px]">
             {/* We render the same thing as above but visually using DangerouslySetInnerHTML from the ID.
                 Wait, a safer React approach is to just re-render the components. We'll duplicate the structure. */}
             
             {type === 'patient' ? (
              <>
                <div className="shrink-0 flex flex-col gap-2 items-center">
                  <span className="text-sm font-medium text-muted-foreground">Front Side</span>
                  <div className="bg-white shadow-xl overflow-hidden rounded-md relative" style={{ width: '54mm', height: '86mm', border: '1px solid #e2e8f0' }}>
                    <div style={{ background: '#bfdbfe', height: '15mm', width: '100%' }}></div>
                    <div style={{ position: 'absolute', top: '0', right: '0', width: '0', height: '0', borderBottom: '15mm solid white', borderRight: '15mm solid transparent' }}></div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', padding: '4mm', gap: '2mm' }}>
                      <img src={logoUrl} style={{ height: '8mm', width: 'auto' }} alt="Logo" />
                      <div style={{ color: '#1e3a8a', fontWeight: '900', fontSize: '10px', lineHeight: '1.1' }}>
                        {hospitalName.toUpperCase()}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', color: '#1e3a8a', fontSize: '9px', fontWeight: 'bold', paddingRight: '4mm', marginBottom: '2mm' }}>
                      PATIENT ID CARD
                    </div>

                    <div style={{ display: 'flex', padding: '0 4mm', gap: '3mm' }}>
                      <div style={{ width: '18mm', height: '22mm', border: '1px solid #3b82f6', display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <div style={{ fontSize: '6px', textAlign: 'center', background: '#e2e8f0', padding: '1px' }}>PHOTO</div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1mm' }}>
                        <div>
                          <div style={{ color: '#1e3a8a', fontSize: '8px', fontWeight: 'bold' }}>Name:</div>
                          <div style={{ color: '#1e3a8a', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patientName}</div>
                        </div>
                        <div style={{ borderBottom: '1px solid #bfdbfe', paddingBottom: '1mm' }}>
                          <span style={{ color: '#1e3a8a', fontSize: '8px', fontWeight: 'bold' }}>UHID: </span>
                          <span style={{ fontSize: '8px', color: '#0f172a' }}>{uhid}</span>
                        </div>
                        <div style={{ borderBottom: '1px solid #bfdbfe', paddingBottom: '1mm' }}>
                          <span style={{ color: '#1e3a8a', fontSize: '8px', fontWeight: 'bold' }}>Age: </span>
                          <span style={{ fontSize: '8px', color: '#0f172a' }}>{age}</span>
                        </div>
                        <div style={{ borderBottom: '1px solid #bfdbfe', paddingBottom: '1mm' }}>
                          <span style={{ color: '#1e3a8a', fontSize: '8px', fontWeight: 'bold' }}>Blood: </span>
                          <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#0f172a' }}>{bloodGroup}</span>
                        </div>
                        <div>
                          <span style={{ color: '#1e3a8a', fontSize: '8px', fontWeight: 'bold' }}>Gender: </span>
                          <span style={{ fontSize: '8px', color: '#0f172a' }}>{gender}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4mm', flexDirection: 'column', alignItems: 'center', gap: '1mm' }}>
                      <div style={{ background: 'white', padding: '1mm', display: 'inline-block' }}>
                        <QRCode value={qrValue} size={40} />
                      </div>
                    </div>

                    <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '8mm', background: '#3b82f6' }}></div>
                    <div style={{ position: 'absolute', bottom: '0', right: '0', width: '0', height: '0', borderBottom: '10mm solid white', borderLeft: '30mm solid transparent' }}></div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col gap-2 items-center">
                  <span className="text-sm font-medium text-muted-foreground">Back Side</span>
                  <div className="bg-white shadow-xl overflow-hidden rounded-md relative flex flex-col" style={{ width: '54mm', height: '86mm', border: '1px solid #e2e8f0' }}>
                    <div style={{ background: '#1e3a8a', height: '22mm', width: '100%', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingTop: '2mm' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
                        <img src={logoUrl} style={{ height: '6mm', filter: 'brightness(0) invert(1)' }} alt="Logo" />
                        <div style={{ fontWeight: 'bold', fontSize: '10px' }}>{hospitalName.toUpperCase()}</div>
                      </div>
                      <div style={{ fontSize: '8px', marginTop: '1mm' }}>PATIENT ID CARD</div>
                    </div>
                    
                    <div style={{ padding: '4mm', color: '#0f172a' }}>
                      <div style={{ color: '#1e3a8a', fontSize: '9px', fontWeight: 'bold', marginBottom: '2mm', textAlign: 'center' }}>EMERGENCY CONTACTS</div>
                      <div style={{ fontSize: '8px', marginBottom: '1mm', color: '#64748b' }}>Name: <span style={{display: 'inline-block', width: '25mm', borderBottom: '1px solid #cbd5e1'}}></span></div>
                      <div style={{ fontSize: '8px', marginBottom: '1mm', color: '#64748b' }}>Rel.: <span style={{display: 'inline-block', width: '27mm', borderBottom: '1px solid #cbd5e1'}}></span></div>
                      <div style={{ fontSize: '8px', marginBottom: '1mm', color: '#64748b' }}>Ph 1: <span style={{display: 'inline-block', width: '27mm', borderBottom: '1px solid #cbd5e1'}}></span></div>
                      <div style={{ fontSize: '8px', marginBottom: '3mm', color: '#64748b' }}>Ph 2: <span style={{display: 'inline-block', width: '27mm', borderBottom: '1px solid #cbd5e1'}}></span></div>

                      <div style={{ color: '#1e3a8a', fontSize: '9px', fontWeight: 'bold', marginBottom: '2mm', textAlign: 'center' }}>IMPORTANT INFO</div>
                      <div style={{ fontSize: '7px', textAlign: 'center', marginBottom: '1mm' }}>
                        <strong style={{ color: '#1e3a8a' }}>24/7 HELPLINE:</strong><br/><span style={{ color: '#0f172a' }}>{phone}</span>
                      </div>
                      <div style={{ fontSize: '7px', textAlign: 'center' }}>
                        <strong style={{ color: '#1e3a8a' }}>HOSPITAL ADDRESS:</strong><br/><span style={{ color: '#0f172a' }}>{address}</span>
                      </div>
                    </div>

                    <div style={{ flex: 1 }}></div>

                    <div style={{ background: '#3b82f6', color: 'white', padding: '3mm', textAlign: 'center', fontSize: '8px', fontWeight: 'bold' }}>
                      IF FOUND, PLEASE RETURN TO<br/>{hospitalName.toUpperCase()}<br/>
                      {phone}
                    </div>
                  </div>
                </div>
              </>
             ) : (
              <>
                <div className="shrink-0 flex flex-col gap-2 items-center">
                  <span className="text-sm font-medium text-muted-foreground">Front Side</span>
                  <div className="bg-slate-900 shadow-xl overflow-hidden rounded-md relative flex flex-col" style={{ width: '54mm', height: '86mm', border: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2mm' }}>
                      <div style={{ width: '12mm', height: '3mm', background: 'white', borderRadius: '2mm' }}></div>
                    </div>

                    <div style={{ background: '#eab308', height: '14mm', width: '100%', marginTop: '3mm', display: 'flex', alignItems: 'center', padding: '0 4mm', gap: '2mm' }}>
                       <img src={logoUrl} style={{ height: '8mm' }} alt="Logo" />
                       <div style={{ color: '#0f172a', fontWeight: '900', fontSize: '8px', lineHeight: '1.2' }}>{hospitalName.toUpperCase()}</div>
                    </div>

                    <div style={{ display: 'flex', padding: '4mm', gap: '3mm' }}>
                       <div style={{ width: '20mm', height: '24mm', border: '1.5px solid #eab308', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                       </div>
                       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                         <div style={{ color: '#eab308', fontSize: '12px', fontWeight: '900', lineHeight: '1' }}>STAFF</div>
                         <div style={{ color: '#eab308', fontSize: '12px', fontWeight: '900', lineHeight: '1', marginBottom: '2mm' }}>ID CARD</div>
                         <div style={{ color: 'white', fontSize: '7px', fontWeight: 'bold' }}>{designation.toUpperCase()}</div>
                       </div>
                    </div>

                    <div style={{ padding: '0 4mm' }}>
                      <div style={{ color: '#eab308', fontSize: '12px', fontWeight: 'bold', marginBottom: '2mm', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{empName.toUpperCase()}</div>
                      <div style={{ fontSize: '7px', color: '#94a3b8', marginBottom: '1mm', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <strong style={{ color: '#eab308' }}>DESIGNATION:</strong> {designation}
                      </div>
                      <div style={{ fontSize: '7px', color: '#94a3b8', marginBottom: '1mm' }}>
                        <strong style={{ color: '#eab308' }}>EMPLOYEE ID:</strong> {empId}
                      </div>
                      <div style={{ fontSize: '7px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <strong style={{ color: '#eab308' }}>DEPARTMENT:</strong> {department}
                      </div>
                    </div>

                    <div style={{ flex: 1 }}></div>

                    <div style={{ background: 'white', padding: '2mm', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                       <div style={{ fontSize: '12px', letterSpacing: '2px', fontFamily: 'monospace', color: '#0f172a' }}>||||||||||||||||||||</div>
                       <div style={{ fontSize: '6px', fontWeight: 'bold', color: '#0f172a' }}>{empId}</div>
                    </div>
                    <div style={{ background: '#0f172a', padding: '2mm', textAlign: 'center', borderTop: '1px solid #eab308' }}>
                      <div style={{ color: 'white', fontSize: '7px', fontWeight: 'bold' }}>{hospitalName.toUpperCase()}</div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col gap-2 items-center">
                  <span className="text-sm font-medium text-muted-foreground">Back Side</span>
                  <div className="bg-slate-900 shadow-xl overflow-hidden rounded-md relative flex flex-col" style={{ width: '54mm', height: '86mm', border: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2mm' }}>
                      <div style={{ width: '12mm', height: '3mm', background: 'white', borderRadius: '2mm' }}></div>
                    </div>
                    
                    <div style={{ textAlign: 'center', color: 'white', padding: '2mm' }}>
                      <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'center', gap: '1mm', marginBottom: '1mm' }}>
                        <img src={logoUrl} style={{ height: '4mm' }} alt="Logo" />
                        <div style={{ color: '#eab308', fontWeight: 'bold', fontSize: '9px' }}>{hospitalName.toUpperCase()}</div>
                      </div>
                      <div style={{ fontSize: '7px' }}>THIS SIDE IS FOR HOSPITAL USE</div>
                    </div>

                    <div style={{ background: '#eab308', flex: 1, margin: '0 2mm 2mm 2mm', borderRadius: '2mm', padding: '2mm' }}>
                      <div style={{ background: 'white', height: '100%', borderRadius: '1mm', padding: '2mm' }}>
                        <div style={{ background: '#eab308', color: '#0f172a', display: 'inline-block', padding: '1px 3px', fontSize: '7px', fontWeight: 'bold', marginBottom: '2mm' }}>EMERGENCY CONTACTS</div>
                        <div style={{ fontSize: '6px', marginBottom: '1px', color: '#64748b' }}><strong className="text-slate-900">1. NAME:</strong> <span style={{display: 'inline-block', width: '25mm', borderBottom: '1px solid #cbd5e1'}}></span></div>
                        <div style={{ fontSize: '6px', marginBottom: '3px', color: '#64748b' }}><strong className="text-slate-900">   CONTACT:</strong> <span style={{display: 'inline-block', width: '22mm', borderBottom: '1px solid #cbd5e1'}}></span></div>
                        <div style={{ fontSize: '6px', marginBottom: '1px', color: '#64748b' }}><strong className="text-slate-900">2. NAME:</strong> <span style={{display: 'inline-block', width: '25mm', borderBottom: '1px solid #cbd5e1'}}></span></div>
                        <div style={{ fontSize: '6px', marginBottom: '4mm', color: '#64748b' }}><strong className="text-slate-900">   CONTACT:</strong> <span style={{display: 'inline-block', width: '22mm', borderBottom: '1px solid #cbd5e1'}}></span></div>

                        <div style={{ display: 'flex' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '7px', fontWeight: 'bold', marginBottom: '2mm', color: '#0f172a' }}>EMPLOYEE INFO</div>
                            <div style={{ fontSize: '6px', marginBottom: '1mm', color: '#0f172a' }}><strong>BLOOD GROUP:</strong></div>
                            <div style={{ background: '#eab308', color: '#0f172a', display: 'inline-block', padding: '1px 3px', fontSize: '7px', fontWeight: 'bold', marginBottom: '2mm' }}>{bloodGroup}</div>
                            <div style={{ fontSize: '6px', color: '#0f172a' }}><strong>DATE OF ISSUE:</strong></div>
                            <div style={{ fontSize: '6px', marginBottom: '2mm', color: '#64748b' }}>{new Date().toLocaleDateString('en-GB')}</div>
                          </div>
                          <div>
                             <div style={{ padding: '1px', border: '1px solid #eab308' }}>
                               <QRCode value={qrValue} size={30} />
                             </div>
                             <div style={{ fontSize: '5px', textAlign: 'center', fontWeight: 'bold', marginTop: '1px', color: '#0f172a' }}>SCAN FOR HR</div>
                          </div>
                        </div>

                        <div style={{ fontSize: '5.5px', marginTop: '2mm', lineHeight: '1.2', color: '#64748b' }}>
                          This card is the property of <strong className="text-slate-900">{hospitalName}</strong> and must be surrendered upon termination of employment.
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '2mm', textAlign: 'center', color: 'white' }}>
                      <div style={{ fontSize: '6px', marginBottom: '1mm' }}>If found, please return immediately to:</div>
                      <div style={{ fontSize: '6px', marginBottom: '1mm' }}>Human Resources Department,</div>
                      <div style={{ fontSize: '6px' }}>{address}</div>
                    </div>
                  </div>
                </div>
              </>
             )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
