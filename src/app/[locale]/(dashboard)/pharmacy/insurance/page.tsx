"use client"

import { ClaimsList } from "@/components/pharmacy/insurance/claims-list"
import { NewClaimDialog } from "@/components/pharmacy/insurance/new-claim-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, FileCheck, ShieldCheck } from "lucide-react"

export default function InsurancePage() {
  return (
    <div className="space-y-6 pt-2">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Insurance & Claims</h2>
                <p className="text-muted-foreground">Manage ongoing claims, approvals, and provider policies.</p>
            </div>
            <NewClaimDialog />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
             <Card className="shadow-sm border-l-4 border-l-yellow-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$1,250.00</div>
                    <p className="text-xs text-muted-foreground">5 claims awaiting approval</p>
                </CardContent>
             </Card>
             <Card className="shadow-sm border-l-4 border-l-emerald-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved (Monthly)</CardTitle>
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">$8,450.00</div>
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
             </Card>
             <Card className="shadow-sm border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
                    <FileCheck className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground">Direct billing enabled</p>
                </CardContent>
             </Card>
        </div>
        
        <ClaimsList />
    </div>
  )
}
