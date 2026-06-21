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
import { Users, FileDown, Activity, DollarSign, Wallet, CreditCard, Stethoscope } from "lucide-react"

export function DoctorSummaryDashboard() {
  const { activeStoreId } = useStoreContext()
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
    csvContent += `Total Consultation Charges,${summary?.totalConsultationCharge || 0}\n`
    csvContent += `Total Appointment Sales,${summary?.totalAppointmentSale || 0}\n`
    csvContent += `Total Amount Paid,${summary?.totalAmountPaid || 0}\n`
    csvContent += `Total Amount Due,${summary?.totalAmountDue || 0}\n\n`

    // Details
    csvContent += "Doctor Name,Patients Visited,Consultation Charges,Appointment Sales,Amount Paid,Amount Due\n"
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
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Consultation</CardTitle>
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
                                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Consultation</th>
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
    </div>
  )
}
