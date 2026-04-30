"use client"

import { CommunicationSettings } from "@/components/communication/communication-settings"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { Separator } from "@/components/ui/separator"

export default function CommunicationPage() {
    return (
        <PermissionGuard permission="settings:read">
            <div className="space-y-6 p-6 pb-16">
                <div className="space-y-0.5">
                    <h2 className="text-2xl font-bold tracking-tight">Communication Hub</h2>
                    <p className="text-muted-foreground">
                        Broadcast alerts and manage hospital-wide announcements.
                    </p>
                </div>
                <Separator className="my-6" />
                <CommunicationSettings />
            </div>
        </PermissionGuard>
    )
}
