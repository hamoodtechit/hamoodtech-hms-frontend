"use client"

import { DiagnosticBillingForm } from "@/components/billing/diagnostic-billing-form"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function PathologyBillingPage() {
    return (
        <PermissionGuard permission="pathology:create">
            <DiagnosticBillingForm 
                type="pathology"
                title="Pathology Billing"
                description="Create bills and record orders for pathology laboratory tests."
            />
        </PermissionGuard>
    )
}
