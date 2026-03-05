"use client"

import { DiagnosticBillingForm } from "@/components/billing/diagnostic-billing-form"

export default function RadiologyBillingPage() {
    return (
        <DiagnosticBillingForm 
            type="radiology"
            title="Radiology Billing"
            description="Create bills and record orders for radiology and imaging tests."
        />
    )
}
