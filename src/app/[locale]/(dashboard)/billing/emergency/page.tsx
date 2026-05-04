"use client"

import { DiagnosticBillingForm } from "@/components/billing/diagnostic-billing-form"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function EmergencyBillingPage() {
    return (
        <PermissionGuard permission={["sale:create"]}>
            <DiagnosticBillingForm 
                type="emergency"
                title="Emergency Billing"
                description="Billing for emergency department services with adjustable pricing."
            />
        </PermissionGuard>
    )
}
