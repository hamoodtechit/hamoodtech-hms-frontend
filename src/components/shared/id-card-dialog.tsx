"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { calculateExactAge } from "@/lib/age-calculator"
import { useSettingsStore } from "@/store/use-settings-store"
import { useStoreContext } from "@/store/use-store-context"
import { Printer, X, User } from "lucide-react"
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
            ${printContent}
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


  const primaryBlue = "#0c4a6e";
  const primaryTeal = "#0f766e";

  const patientFront = (
    <div style={{ width: '54mm', height: '86mm', background: '#ffffff', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Top Banner with Logo and Hospital Name */}
      <div style={{ background: `linear-gradient(135deg, ${primaryBlue} 0%, ${primaryTeal} 100%)`, padding: '3.5mm 0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <img src={logoUrl} style={{ height: '9mm', width: 'auto', filter: 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.2))', marginBottom: '1.5mm' }} alt="Logo" />
        <div style={{ color: 'white', fontWeight: '900', fontSize: '8px', lineHeight: '1.1', letterSpacing: '0.5px', textAlign: 'center' }}>
          {hospitalName.toUpperCase()}
        </div>
      </div>

      <div style={{ textAlign: 'center', color: primaryBlue, fontSize: '8px', fontWeight: '900', letterSpacing: '1px', padding: '1.5mm 0', borderBottom: '1px solid #e2e8f0' }}>
        PATIENT ID CARD
      </div>

      <div style={{ padding: '1.5mm 4mm', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Photo */}
        <div style={{ width: '18mm', height: '18mm', borderRadius: '3mm', background: '#f8fafc', border: `2px solid ${primaryTeal}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '1.5mm', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
           {patientPhoto ? (
             <img src={patientPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Patient" />
           ) : (
             <div style={{ color: '#94a3b8' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
           )}
        </div>

        {/* Name */}
        <div style={{ color: '#0f172a', fontSize: '12px', fontWeight: '900', lineHeight: '1.2', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2mm' }}>
          {patientName.toUpperCase()}
        </div>

        {/* Info Grid */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5mm' }}>
            <span style={{ color: '#64748b', fontSize: '7px', fontWeight: '700' }}>UHID:</span>
            <span style={{ fontSize: '8px', color: '#0f172a', fontWeight: '900' }}>{uhid}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5mm' }}>
            <span style={{ color: '#64748b', fontSize: '7px', fontWeight: '700' }}>AGE/SEX:</span>
            <span style={{ fontSize: '8px', color: '#0f172a', fontWeight: '900' }}>{age} / {gender.charAt(0).toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5mm' }}>
            <span style={{ color: '#64748b', fontSize: '7px', fontWeight: '700' }}>BLOOD GRP:</span>
            <span style={{ fontSize: '9px', fontWeight: '900', color: '#dc2626' }}>{bloodGroup}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5mm' }}>
            <span style={{ color: '#64748b', fontSize: '7px', fontWeight: '700' }}>PHONE:</span>
            <span style={{ fontSize: '8px', color: '#0f172a', fontWeight: '900' }}>{data.phone || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* QR Code and Footer */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '3mm', alignItems: 'center', gap: '2mm', marginTop: 'auto' }}>
        <QRCode value={qrValue} size={32} />
      </div>

      <div style={{ background: `linear-gradient(90deg, ${primaryBlue} 0%, ${primaryTeal} 100%)`, height: '4mm', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '5px', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', fontWeight: 'bold' }}>VALID FOR HOSPITAL SERVICES</div>
      </div>
    </div>
  )

  const patientBack = (
    <div style={{ width: '54mm', height: '86mm', background: '#fff', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: `linear-gradient(135deg, ${primaryBlue} 0%, ${primaryTeal} 100%)`, padding: '3.5mm 0', width: '100%', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <img src={logoUrl} style={{ height: '9mm', width: 'auto', filter: 'brightness(0) invert(1)', marginBottom: '1.5mm' }} alt="Logo" />
        <div style={{ fontWeight: '900', fontSize: '8px', lineHeight: '1.1', letterSpacing: '0.5px', textAlign: 'center' }}>{hospitalName.toUpperCase()}</div>
      </div>
      
      {/* Emergency Contacts */}
      <div style={{ padding: '4mm', color: '#0f172a', flex: 1 }}>
        <div style={{ color: primaryBlue, fontSize: '9px', fontWeight: '900', marginBottom: '2mm', textAlign: 'center', borderBottom: `1px solid ${primaryTeal}`, paddingBottom: '1mm' }}>EMERGENCY CONTACT</div>
        <div style={{ fontSize: '8px', marginBottom: '1.5mm', fontWeight: '700' }}>Name: ______________________</div>
        <div style={{ fontSize: '8px', marginBottom: '1.5mm', fontWeight: '700' }}>Age: ________________________</div>
        <div style={{ fontSize: '8px', marginBottom: '1.5mm', fontWeight: '700' }}>Phone 1: ____________________</div>
        <div style={{ fontSize: '8px', marginBottom: '3mm', fontWeight: '700' }}>Phone 2: ____________________</div>

        <div style={{ color: primaryBlue, fontSize: '9px', fontWeight: '900', marginBottom: '2mm', textAlign: 'center', borderBottom: `1px solid ${primaryTeal}`, paddingBottom: '1mm' }}>IMPORTANT INFORMATION</div>
        <div style={{ fontSize: '8px', textAlign: 'center', marginBottom: '1.5mm', fontWeight: '700' }}>
          <strong style={{ color: primaryTeal }}>24/7 HELPLINE:</strong><br/>{phone}
        </div>
        <div style={{ fontSize: '7px', textAlign: 'center', fontWeight: '700' }}>
          <strong style={{ color: primaryTeal }}>HOSPITAL ADDRESS:</strong><br/>{address}
        </div>
      </div>

      {/* Return Disclaimer */}
      <div style={{ background: primaryBlue, color: 'white', padding: '3mm', textAlign: 'center', fontSize: '7px', fontWeight: '900', letterSpacing: '0.5px' }}>
        IF FOUND, PLEASE RETURN TO<br/>{hospitalName.toUpperCase()}<br/>
        {phone}
      </div>
    </div>
  )

  const staffFront = (
    <div style={{ width: '54mm', height: '86mm', background: '#ffffff', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0', fontFamily: 'Arial, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Top Banner with Logo and Hospital Name */}
      <div style={{ background: `linear-gradient(135deg, ${primaryBlue} 0%, #000000 100%)`, padding: '3.5mm 0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <img src={logoUrl} style={{ height: '9mm', width: 'auto', filter: 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.2))', marginBottom: '1.5mm' }} alt="Logo" />
        <div style={{ color: '#ffffff', fontWeight: '900', fontSize: '8px', lineHeight: '1.1', letterSpacing: '0.5px', textAlign: 'center' }}>
          {hospitalName.toUpperCase()}
        </div>
      </div>

      <div style={{ textAlign: 'center', color: '#000000', fontSize: '8px', fontWeight: '900', letterSpacing: '1.5px', padding: '1.5mm 0', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        STAFF ID CARD
      </div>

      <div style={{ padding: '1.5mm 4mm', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Photo */}
        <div style={{ width: '18mm', height: '18mm', borderRadius: '3mm', background: '#f8fafc', border: `2px solid ${primaryBlue}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '1.5mm', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
           {empPhoto ? (
             <img src={empPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Employee" />
           ) : (
             <div style={{ color: '#94a3b8' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
           )}
        </div>

        {/* Name and Designation */}
        <div style={{ color: primaryBlue, fontSize: '11px', fontWeight: '900', lineHeight: '1.2', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '0.5mm' }}>
          {empName.toUpperCase()}
        </div>
        <div style={{ color: '#ef4444', fontSize: '8px', fontWeight: '900', textAlign: 'center', marginBottom: '2mm', letterSpacing: '0.5px' }}>
          {designation.toUpperCase()}
        </div>

        {/* Info Grid */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1mm' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5mm' }}>
            <span style={{ color: '#64748b', fontSize: '7px', fontWeight: '700' }}>EMP ID:</span>
            <span style={{ fontSize: '8px', color: '#0f172a', fontWeight: '900' }}>{empId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5mm' }}>
            <span style={{ color: '#64748b', fontSize: '7px', fontWeight: '700' }}>DEPT:</span>
            <span style={{ fontSize: '8px', color: '#0f172a', fontWeight: '900' }}>{department.toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5mm' }}>
            <span style={{ color: '#64748b', fontSize: '7px', fontWeight: '700' }}>BLOOD GRP:</span>
            <span style={{ fontSize: '8px', fontWeight: '900', color: '#dc2626' }}>{bloodGroup}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5mm' }}>
            <span style={{ color: '#64748b', fontSize: '7px', fontWeight: '700' }}>PHONE:</span>
            <span style={{ fontSize: '8px', color: '#0f172a', fontWeight: '900' }}>{data.phone || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* QR Code and Footer */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '3mm', alignItems: 'center', gap: '2mm', marginTop: 'auto' }}>
        <QRCode value={qrValue} size={32} />
      </div>

      <div style={{ background: `linear-gradient(90deg, ${primaryBlue} 0%, #000000 100%)`, height: '4mm', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '5px', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', fontWeight: 'bold' }}>SCAN TO VERIFY IDENTITY</div>
      </div>
    </div>
  )

  const staffBack = (
    <div style={{ width: '54mm', height: '86mm', background: '#fff', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ background: `linear-gradient(135deg, ${primaryBlue} 0%, #000000 100%)`, padding: '3.5mm 0', width: '100%', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <img src={logoUrl} style={{ height: '9mm', width: 'auto', filter: 'brightness(0) invert(1)', marginBottom: '1.5mm' }} alt="Logo" />
        <div style={{ fontWeight: '900', fontSize: '8px', lineHeight: '1.1', letterSpacing: '0.5px', textAlign: 'center' }}>{hospitalName.toUpperCase()}</div>
      </div>
      
      {/* Emergency Contacts */}
      <div style={{ padding: '4mm', color: '#0f172a', flex: 1 }}>
        <div style={{ color: primaryBlue, fontSize: '9px', fontWeight: '900', marginBottom: '2mm', textAlign: 'center', borderBottom: `1px solid ${primaryBlue}`, paddingBottom: '1mm' }}>EMERGENCY CONTACT</div>
        <div style={{ fontSize: '8px', marginBottom: '1.5mm', fontWeight: '700' }}>Name: ______________________</div>
        <div style={{ fontSize: '8px', marginBottom: '1.5mm', fontWeight: '700' }}>Age: ________________________</div>
        <div style={{ fontSize: '8px', marginBottom: '1.5mm', fontWeight: '700' }}>Phone 1: ____________________</div>
        <div style={{ fontSize: '8px', marginBottom: '3mm', fontWeight: '700' }}>Phone 2: ____________________</div>

        <div style={{ color: primaryBlue, fontSize: '9px', fontWeight: '900', marginBottom: '2mm', textAlign: 'center', borderBottom: `1px solid ${primaryBlue}`, paddingBottom: '1mm' }}>EMPLOYEE INFO</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1mm' }}>
          <strong style={{ fontSize: '7px' }}>BLOOD GROUP:</strong>
          <span style={{ background: '#ef4444', color: 'white', padding: '1px 4px', borderRadius: '2px', fontSize: '8px', fontWeight: 'bold' }}>{bloodGroup}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3mm' }}>
          <strong style={{ fontSize: '7px' }}>DATE OF ISSUE:</strong>
          <span style={{ fontSize: '7px', fontWeight: '700' }}>{new Date().toLocaleDateString('en-GB')}</span>
        </div>
        
        <div style={{ fontSize: '6px', textAlign: 'center', fontWeight: '600', color: '#64748b' }}>
          This card is the property of <strong style={{ color: '#0f172a' }}>{hospitalName}</strong> and must be surrendered upon termination of employment.
        </div>
      </div>

      {/* Return Disclaimer */}
      <div style={{ background: primaryBlue, color: 'white', padding: '3mm', textAlign: 'center', fontSize: '7px', fontWeight: '900', letterSpacing: '0.5px' }}>
        IF FOUND, PLEASE RETURN TO HR DEPT<br/>{hospitalName.toUpperCase()}<br/>
        {phone}
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
