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
import { Printer, X, User } from "lucide-react"
// @ts-ignore
import QRCode from "react-qr-code"
import { calculateExactAge } from "@/lib/age-calculator"

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
  const age = data.dob ? calculateExactAge(data.dob) : (data.age !== undefined ? `${data.age}Y` : "N/A")
  const bloodGroup = data.bloodGroup || "N/A"
  const gender = data.gender ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1) : "N/A"

  // Employee Info
  const empId = data.employeeNumber || "N/A"
  const empName = data.name || "N/A"
  const designation = data.designation?.name || "Staff"
  const department = data.department?.name || "General"

  const patientPhoto = data.photoUrl || null
  const empPhoto = data.photoUrl || null

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


  const patientFront = (
    <div style={{ width: '54mm', height: '86mm', background: '#fff', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0', fontFamily: 'Arial, sans-serif' }}>
                  <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', height: '20mm', width: '100%', position: 'absolute', top: 0, left: 0 }}></div>
                  <div style={{ position: 'absolute', top: '15mm', left: '-5mm', width: '64mm', height: '10mm', background: 'white', borderRadius: '50% 50% 0 0' }}></div>
                  
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '3mm 4mm', gap: '2mm', zIndex: 10 }}>
                    <img src={logoUrl} style={{ height: '7mm', width: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2)) brightness(0) invert(1)' }} alt="Logo" />
                    <div style={{ color: 'white', fontWeight: '900', fontSize: '9px', lineHeight: '1.1', letterSpacing: '0.5px' }}>
                      {hospitalName.toUpperCase()}
                    </div>
                  </div>

                  <div style={{ position: 'relative', textAlign: 'center', color: '#1e3a8a', fontSize: '8px', fontWeight: '800', letterSpacing: '1px', marginTop: '6mm', marginBottom: '2mm', zIndex: 10 }}>
                    PATIENT ID CARD
                  </div>

                  <div style={{ display: 'flex', padding: '0 4mm', gap: '3mm', position: 'relative', zIndex: 10 }}>
                    <div style={{ width: '18mm', height: '22mm', borderRadius: '2mm', background: '#f8fafc', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                       {patientPhoto ? (
                         <img src={patientPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Patient" />
                       ) : (
                         <div style={{ color: '#94a3b8' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                       )}
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5mm', justifyContent: 'center' }}>
                        <div style={{ color: '#0f172a', fontSize: '12px', fontWeight: '900', lineHeight: '1.1', marginBottom: '1mm', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{patientName.toUpperCase()}</div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '1mm', borderRadius: '1mm' }}>
                          <span style={{ color: '#475569', fontSize: '7px', fontWeight: '700' }}>UHID: </span>
                          <span style={{ fontSize: '8px', color: '#0f172a', fontWeight: '800' }}>{uhid}</span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5mm 1mm' }}>
                          <span style={{ color: '#64748b', fontSize: '7px', fontWeight: '600' }}>AGE/SEX: </span>
                          <span style={{ fontSize: '7px', color: '#0f172a', fontWeight: '700' }}>{age} / {gender.charAt(0).toUpperCase()}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5mm 1mm' }}>
                          <span style={{ color: '#64748b', fontSize: '7px', fontWeight: '600' }}>BLOOD: </span>
                          <span style={{ fontSize: '8px', fontWeight: '900', color: '#dc2626' }}>{bloodGroup}</span>
                        </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5mm', flexDirection: 'column', alignItems: 'center', gap: '1mm', position: 'relative', zIndex: 10 }}>
                    <div style={{ background: 'white', padding: '1.5mm', borderRadius: '1mm', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <QRCode value={qrValue} size={34} />
                    </div>
                  </div>

                  <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '8mm', background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: '6px', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.5px', fontWeight: 'bold' }}>VALID FOR HOSPITAL SERVICES</div>
                  </div>
                </div>
  )

  const patientBack = (
    <div style={{ width: '54mm', height: '86mm', background: '#fff', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' }}>
                  <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)', height: '20mm', width: '100%', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingTop: '2mm', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
                      <img src={logoUrl} style={{ height: '6mm', filter: 'brightness(0) invert(1)' }} alt="Logo" />
                      <div style={{ fontWeight: '900', fontSize: '9px', letterSpacing: '0.5px' }}>{hospitalName.toUpperCase()}</div>
                    </div>
                    <div style={{ fontSize: '7px', marginTop: '1.5mm', color: '#bfdbfe', letterSpacing: '1px' }}>PATIENT ID CARD</div>
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
  )

  const staffFront = (
    <div style={{ width: '54mm', height: '86mm', background: 'linear-gradient(135deg, #020617 0%, #1e293b 100%)', position: 'relative', overflow: 'hidden', border: '1px solid #0f172a', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2mm', position: 'relative', zIndex: 10 }}>
                    <div style={{ width: '12mm', height: '3mm', background: '#e2e8f0', borderRadius: '2mm' }}></div>
                  </div>

                  <div style={{ background: 'linear-gradient(90deg, #ca8a04 0%, #facc15 50%, #ca8a04 100%)', height: '12mm', width: '100%', marginTop: '3mm', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4mm', gap: '2mm', boxShadow: '0 2px 4px rgba(0,0,0,0.3)', position: 'relative', zIndex: 10 }}>
                     <img src={logoUrl} style={{ height: '7mm', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }} alt="Logo" />
                     <div style={{ color: '#020617', fontWeight: '900', fontSize: '8px', lineHeight: '1.1', letterSpacing: '0.5px' }}>{hospitalName.toUpperCase()}</div>
                  </div>

                  <div style={{ margin: '4mm', padding: '3mm', background: 'rgba(255,255,255,0.05)', borderRadius: '2mm', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '3mm', position: 'relative', zIndex: 10 }}>
                     <div style={{ width: '18mm', height: '22mm', borderRadius: '1.5mm', border: '1px solid #facc15', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                         {empPhoto ? (
                            <img src={empPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Employee" />
                         ) : (
                            <div style={{ color: '#94a3b8' }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
                         )}
                     </div>
                     <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                       <div style={{ color: '#facc15', fontSize: '10px', fontWeight: '900', lineHeight: '1.1', letterSpacing: '1px', marginBottom: '2mm' }}>STAFF ID</div>
                       <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: '900', lineHeight: '1.1', letterSpacing: '-0.3px' }}>{empName.toUpperCase()}</div>
                     </div>
                  </div>

                  <div style={{ padding: '0 4mm', textAlign: 'center', position: 'relative', zIndex: 10 }}>
                    <div style={{ color: 'white', fontSize: '7px', fontWeight: '600', marginBottom: '1mm', lineHeight: '1.2' }}>{designation.toUpperCase()}</div>
                    <div style={{ color: '#94a3b8', fontSize: '6px', fontWeight: '500', lineHeight: '1.2' }}>{department.toUpperCase()}</div>
                    
                    <div style={{ display: 'inline-block', background: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: '1mm', padding: '1mm 2mm', marginTop: '1.5mm' }}>
                        <span style={{ fontSize: '6px', color: '#cbd5e1', marginRight: '1mm' }}>EMP ID:</span>
                        <span style={{ fontSize: '8px', color: '#facc15', fontWeight: '800', letterSpacing: '0.5px' }}>{empId}</span>
                    </div>
                  </div>

                  <div style={{ flex: 1 }}></div>

                  <div style={{ background: 'white', padding: '2.5mm', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                     <QRCode value={qrValue} size={28} />
                     <div style={{ fontSize: '5px', fontWeight: '900', color: '#0f172a', letterSpacing: '1px', marginTop: '1.5mm' }}>SCAN TO VERIFY</div>
                  </div>
                  <div style={{ background: 'linear-gradient(90deg, #ca8a04 0%, #facc15 50%, #ca8a04 100%)', height: '2px', width: '100%', position: 'relative', zIndex: 10 }}></div>
                </div>
  )

  const staffBack = (
    <div style={{ width: '54mm', height: '86mm', background: 'linear-gradient(135deg, #020617 0%, #1e293b 100%)', position: 'relative', overflow: 'hidden', border: '1px solid #0f172a', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2mm' }}>
                    <div style={{ width: '12mm', height: '3mm', background: '#e2e8f0', borderRadius: '2mm' }}></div>
                  </div>
                  
                  <div style={{ textAlign: 'center', color: 'white', padding: '2mm' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1mm', marginBottom: '1mm' }}>
                      <img src={logoUrl} style={{ height: '4mm' }} alt="Logo" />
                      <div style={{ color: '#facc15', fontWeight: '900', fontSize: '8px', letterSpacing: '0.5px' }}>{hospitalName.toUpperCase()}</div>
                    </div>
                    <div style={{ fontSize: '6px', color: '#94a3b8', letterSpacing: '0.5px' }}>THIS SIDE IS FOR HOSPITAL USE</div>
                  </div>

                  <div style={{ background: '#eab308', flex: 1, margin: '0 2mm 2mm 2mm', borderRadius: '2mm', padding: '2mm' }}>
                    <div style={{ background: 'white', height: '100%', borderRadius: '1mm', padding: '2mm', color: '#0f172a' }}>
                      <div style={{ background: '#eab308', display: 'inline-block', padding: '1px 3px', fontSize: '7px', fontWeight: 'bold', marginBottom: '2mm', color: '#0f172a' }}>EMERGENCY CONTACTS</div>
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
  )

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
                {patientFront}
                <div className="page-break"></div>
                {patientBack}
              </>
            ) : (
              <>
                {staffFront}
                <div className="page-break"></div>
                {staffBack}
              </>
            )}
          </div>

          {/* Visual Display for User */}
          <div className="flex gap-8 justify-center overflow-x-auto w-full max-w-[800px]">
             {type === 'patient' ? (
              <>
                <div className="shrink-0 flex flex-col gap-2 items-center">
                  <span className="text-sm font-medium text-muted-foreground">Front Side</span>
                  <div className="shadow-xl overflow-hidden rounded-md relative flex flex-col">{patientFront}</div>
                </div>
                <div className="shrink-0 flex flex-col gap-2 items-center">
                  <span className="text-sm font-medium text-muted-foreground">Back Side</span>
                  <div className="shadow-xl overflow-hidden rounded-md relative flex flex-col">{patientBack}</div>
                </div>
              </>
             ) : (
              <>
                <div className="shrink-0 flex flex-col gap-2 items-center">
                  <span className="text-sm font-medium text-muted-foreground">Front Side</span>
                  <div className="shadow-xl overflow-hidden rounded-md relative flex flex-col">{staffFront}</div>
                </div>
                <div className="shrink-0 flex flex-col gap-2 items-center">
                  <span className="text-sm font-medium text-muted-foreground">Back Side</span>
                  <div className="shadow-xl overflow-hidden rounded-md relative flex flex-col">{staffBack}</div>
                </div>
              </>
             )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
