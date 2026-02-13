"use client"

import { PrescriptionList } from "@/components/pharmacy/prescriptions/prescription-list"
import { PrescriptionUploadDialog } from "@/components/pharmacy/prescriptions/prescription-upload-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, FileText } from "lucide-react"

export default function PrescriptionsPage() {
  return (
    <div className="space-y-6 pt-2">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Prescriptions</h2>
                <p className="text-muted-foreground">Manage digital prescriptions, refills, and doctor notes.</p>
            </div>
            <PrescriptionUploadDialog />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
             <Card className="shadow-sm border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
                    <FileText className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">12</div>
                    <p className="text-xs text-muted-foreground">New uploads today</p>
                </CardContent>
             </Card>
             <Card className="shadow-sm border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Refills Due</CardTitle>
                    <Bell className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">5</div>
                    <p className="text-xs text-muted-foreground">Scheduled for this week</p>
                </CardContent>
             </Card>
        </div>
        
        <PrescriptionList />
    </div>
  )
}
