"use client"

import { DiagnosticBillingForm } from "@/components/billing/diagnostic-billing-form"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function OPDBillingPage() {
    return (
        <PermissionGuard permission={["pathology:create", "sale:create"]}>
            <DiagnosticBillingForm 
                type="opd"
                title="OPD Billing"
                description="Consolidated billing for pathology and radiology laboratory services."
            />
        </PermissionGuard>
    )
}
