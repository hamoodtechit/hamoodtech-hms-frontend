"use client"

import { DiagnosticBillingForm } from "@/components/billing/diagnostic-billing-form"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function RadiologyBillingPage() {
    return (
        <PermissionGuard permission="radiology:create">
            <DiagnosticBillingForm 
                type="radiology"
                title="Radiology Billing"
                description="Create bills and record orders for radiology and imaging tests."
            />
        </PermissionGuard>
    )
}
