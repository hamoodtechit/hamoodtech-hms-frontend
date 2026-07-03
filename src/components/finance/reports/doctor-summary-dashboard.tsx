"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDoctorSummaryReport } from "@/hooks/finance-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useStoreContext } from "@/store/use-store-context"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { endOfDay, format, startOfMonth } from "date-fns"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { DoctorSummary } from "@/types/finance"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Users, FileDown, Activity, DollarSign, Wallet, CreditCard, Stethoscope, Printer } from "lucide-react"
import { useSettingsStore } from "@/store/use-settings-store"

export function DoctorSummaryDashboard() {
  const { activeStoreId, stores } = useStoreContext()
  const activeStore = stores.find(s => s.id === activeStoreId)
  const { general } = useSettingsStore()
  const { formatCurrency } = useCurrency()
  const [date, setDate] = useState<DateRange | undefined>()

  useEffect(() => {
    setDate({
        from: startOfMonth(new Date()),
        to: endOfDay(new Date()),
    })
  }, [])

  const startDate = date?.from ? format(date.from, 'yyyy-MM-dd') : undefined
  const endDate = date?.to ? format(date.to, 'yyyy-MM-dd') : undefined

  const { data: reportData, isLoading } = useDoctorSummaryReport({
    branchId: activeStoreId || undefined,
    startDate,
    endDate
  }, { enabled: !!date?.from && !!date?.to })

  if (isLoading) {
    return (
      <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-5">
              {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <Skeleton className="h-4 w-[100px]" />
                          <Skeleton className="h-4 w-4" />
                      </CardHeader>
                      <CardContent>
                          <Skeleton className="h-8 w-[120px] mb-2" />
                      </CardContent>
                  </Card>
              ))}
          </div>
          <Card className="h-[400px]">
              <CardHeader><Skeleton className="h-6 w-[200px]" /></CardHeader>
              <CardContent><Skeleton className="h-full w-full" /></CardContent>
          </Card>
      </div>
    )
  }

  const response = reportData?.data
  const summary = response?.summary
  const doctors = response?.doctors || []

  const handleExportCSV = () => {
    if (!doctors.length) return

    let csvContent = "data:text/csv;charset=utf-8,"
    
    // Summary
    csvContent += "DOCTOR SUMMARY REPORT\n"
    csvContent += `Total Patients,${summary?.totalPatientVisited || 0}\n`
    csvContent += `Total Consultation Commission,${summary?.totalConsultationCharge || 0}\n`
    csvContent += `Total Appointment Sales,${summary?.totalAppointmentSale || 0}\n`
    csvContent += `Total Amount Paid,${summary?.totalAmountPaid || 0}\n`
    csvContent += `Total Amount Due,${summary?.totalAmountDue || 0}\n\n`

    // Details
    csvContent += "Doctor Name,Patients Visited,Consultation Commission,Appointment Sales,Amount Paid,Amount Due\n"
    doctors.forEach((doctor) => {
        csvContent += `"${doctor.doctorName}",${doctor.patientVisited},${doctor.consultationChargeGot},${doctor.appointmentSale},${doctor.amountPaid},${doctor.amountDue}\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `doctor_summary_report_${startDate}_to_${endDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrintPDF = () => {
    if (!doctors.length) return

    const printContent = document.getElementById('doctor-summary-print-content')?.innerHTML;
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
                    <title>Doctor Summary Report</title>
                    ${Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(el => el.outerHTML).join('\n')}
                    <style>
                        @page { size: A4; margin: 0; }
                        body { background: white !important; margin: 0; padding: 0; font-family: sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; display: flex; justify-content: center; }
                        .print-container { width: 210mm; min-height: 297mm; padding: 10mm; box-sizing: border-box; }
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

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-3xl font-bold tracking-tight">Doctor Analytics</h2>
            <div className="flex items-center space-x-2">
                <DatePickerWithRange date={date} setDate={setDate} />
                <Button variant="outline" className="gap-2" onClick={handleExportCSV} disabled={!doctors.length}>
                    <FileDown className="h-4 w-4" />
                    Export CSV
                </Button>
                <Button variant="default" className="gap-2" onClick={handlePrintPDF} disabled={!doctors.length}>
                    <Printer className="h-4 w-4" />
                    Export PDF
                </Button>
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-5">
            <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Patients</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-700">{summary?.totalPatientVisited || 0}</div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-indigo-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Appt. Sales</CardTitle>
                    <Activity className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-indigo-600">{formatCurrency(summary?.totalAppointmentSale || 0)}</div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Consultation Commission</CardTitle>
                    <Stethoscope className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{formatCurrency(summary?.totalConsultationCharge || 0)}</div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid to Docs</CardTitle>
                    <Wallet className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{formatCurrency(summary?.totalAmountPaid || 0)}</div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rose-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Due to Docs</CardTitle>
                    <CreditCard className="h-4 w-4 text-rose-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-rose-600">{formatCurrency(summary?.totalAmountDue || 0)}</div>
                </CardContent>
            </Card>
        </div>

        {/* Details Table */}
        <Card className="shadow-lg border-border/60">
            <CardHeader className="bg-muted/30 border-b">
                <CardTitle>Doctor Performance Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {doctors.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground italic">
                        No doctor activity recorded for the selected period.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Doctor Name</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-center">Patients</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Appt. Sales</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Consultation Commission</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Paid</th>
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {doctors.map((doctor) => (
                                    <tr key={doctor.doctorId} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground">{doctor.doctorName}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-xs">{doctor.patientVisited}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(doctor.appointmentSale)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600/80">{formatCurrency(doctor.consultationChargeGot)}</td>
                                        <td className="px-6 py-4 text-right font-medium text-amber-600/80">{formatCurrency(doctor.amountPaid)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-rose-600/80">{formatCurrency(doctor.amountDue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Hidden Print Layout */}
        <div className="hidden">
            <div id="doctor-summary-print-content" className="w-full text-black bg-white">
                <div className="text-center mb-4 pb-2 border-b-2 border-black">
                    <div className="flex justify-center mb-1">
                        <img src={activeStore?.logoUrl || "/Logo.png"} alt="Logo" style={{ height: '60px', width: 'auto' }} />
                    </div>
                    <h1 className="text-2xl font-black uppercase leading-tight m-0">{general?.hospitalName || activeStore?.name || "HOSPITAL NAME"}</h1>
                    <p className="text-xs font-bold leading-tight m-0">{general?.address || activeStore?.address || "Address"}</p>
                    <p className="text-xs font-bold leading-tight m-0">Ph: {general?.phone || activeStore?.phone || "Phone"}</p>
                    <div className="mt-4 inline-block border-2 border-black rounded-full px-6 py-1 font-black tracking-widest text-sm uppercase">
                        DOCTOR SUMMARY REPORT
                    </div>
                </div>

                <div className="border-2 border-black mb-4 flex flex-col font-bold text-sm">
                    <div className="grid grid-cols-2 border-b border-black">
                        <div className="p-2 border-r border-black">
                            Total Patients: {summary?.totalPatientVisited || 0}
                        </div>
                        <div className="p-2">
                            Date: {startDate && endDate 
                                ? `${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}`
                                : startDate ? `From ${format(new Date(startDate), 'dd MMM yyyy')}`
                                : endDate ? `Until ${format(new Date(endDate), 'dd MMM yyyy')}`
                                : 'All Dates'
                            }
                        </div>
                    </div>
                    <div className="grid grid-cols-2">
                        <div className="p-2 border-r border-black flex gap-4">
                            <span>Total Consultation Commission: <span className="text-emerald-600">{formatCurrency(summary?.totalConsultationCharge || 0)}</span></span>
                            <span>Total Due: <span className="text-red-600">{formatCurrency(summary?.totalAmountDue || 0)}</span></span>
                        </div>
                        <div className="p-2">
                            Report Generated: {format(new Date(), 'dd MMM yyyy, hh:mm a')}
                        </div>
                    </div>
                </div>

                <table className="w-full text-left border-collapse border-2 border-black font-bold text-xs mb-8">
                    <thead>
                        <tr className="border-b-2 border-black bg-gray-100">
                            <th className="p-2 border-r border-black w-10 text-center">SL</th>
                            <th className="p-2 border-r border-black">Doctor Name</th>
                            <th className="p-2 border-r border-black text-center">Patients</th>
                            <th className="p-2 border-r border-black text-right">Appt. Sales</th>
                            <th className="p-2 border-r border-black text-right">Consultation Commission</th>
                            <th className="p-2 border-r border-black text-right">Paid</th>
                            <th className="p-2 text-right">Due</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doctors.map((doctor: any, idx: number) => (
                            <tr key={idx} className="border-b border-black">
                                <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                                <td className="p-2 border-r border-black">{doctor.doctorName}</td>
                                <td className="p-2 border-r border-black text-center">{doctor.patientVisited}</td>
                                <td className="p-2 border-r border-black text-right">{formatCurrency(doctor.appointmentSale)}</td>
                                <td className="p-2 border-r border-black text-right text-emerald-600">{formatCurrency(doctor.consultationChargeGot)}</td>
                                <td className="p-2 border-r border-black text-right">{formatCurrency(doctor.amountPaid)}</td>
                                <td className="p-2 text-right text-red-600">{formatCurrency(doctor.amountDue)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-between mt-24 pt-2 font-bold text-sm">
                    <div className="w-48 text-center border-t border-black pt-1">
                        Prepared By
                    </div>
                    <div className="w-48 text-center border-t border-black pt-1">
                        Authorized Signature
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}
