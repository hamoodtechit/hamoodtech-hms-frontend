"use client"

import { PatientTable } from "@/components/patients/patient-table"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { useSearchParams } from "next/navigation"

export default function PatientsPage() {
  const searchParams = useSearchParams()
  const visitType = searchParams.get("visitType") as 'opd' | 'ipd' | 'emergency' | null

  const titleMap = {
    opd: { title: "OPD Patients", description: "Outpatient department — walk-in and consultation visits." },
    ipd: { title: "IPD Patients", description: "Inpatient department — admitted and hospitalized patients." },
    emergency: { title: "Emergency Patients", description: "Emergency department patients." },
  }

  const pageInfo = visitType ? titleMap[visitType] : {
    title: "Patient Management",
    description: "Search and manage patient records across hospital departments.",
  }

  return (
    <PermissionGuard permission="patient:read">
      <div className="space-y-6 pt-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{pageInfo.title}</h2>
          <p className="text-muted-foreground">{pageInfo.description}</p>
        </div>
        <PatientTable visitType={visitType ?? undefined} />
      </div>
    </PermissionGuard>
  )
}
