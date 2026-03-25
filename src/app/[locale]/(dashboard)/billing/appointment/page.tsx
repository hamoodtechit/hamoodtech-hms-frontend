"use client"

import { AppointmentBillingForm } from "@/components/billing/appointment-billing-form"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function AppointmentBillingPage() {
    return (
        <PermissionGuard permission="appointment:create">
            <AppointmentBillingForm />
        </PermissionGuard>
    )
}
