import { PatientTable } from "@/components/patients/patient-table"

export default function PatientsPage() {
  return (
    <div className="space-y-6 pt-2">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Patient Management</h2>
            <p className="text-muted-foreground">Search and manage patient records across hospital departments.</p>
        </div>
        <PatientTable />
    </div>
  )
}
