"use client"

import { DiagnosticBillingForm } from "@/components/billing/diagnostic-billing-form"

export default function PathologyBillingPage() {
    return (
        <DiagnosticBillingForm 
            type="pathology"
            title="Pathology Billing"
            description="Create bills and record orders for pathology laboratory tests."
        />
    )
}
