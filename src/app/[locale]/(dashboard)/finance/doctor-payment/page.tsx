"use client"

import { DoctorPaymentList } from "@/components/finance/doctor-payment-list"
import { DoctorPaymentHistory } from "@/components/finance/doctor-payment-history"
import { PermissionGuard } from "@/components/shared/permission-guard"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Clock, Loader2, Wallet } from "lucide-react"
import { useEffect, useState } from "react"

export default function DoctorPaymentPage() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="flex h-[450px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
            </div>
        )
    }

    return (
        <PermissionGuard permission="account:read">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Doctor Payment</h1>
                    <p className="text-muted-foreground">Manage doctor consultation commissions and payments.</p>
                </div>

                <Tabs defaultValue="pending" className="w-full">
                    <div className="flex justify-center sm:justify-start mb-8">
                        <TabsList className="h-11 bg-muted/40 p-1.5 rounded-[0.9rem] border border-white/20 inline-flex w-auto shadow-sm">
                            <TabsTrigger
                                value="pending"
                                className="rounded-lg px-5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-bold text-xs flex items-center gap-2 transition-all duration-200"
                            >
                                <Wallet className="h-4 w-4" />
                                Pending Commissions
                            </TabsTrigger>
                            <TabsTrigger
                                value="history"
                                className="rounded-lg px-5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-bold text-xs flex items-center gap-2 transition-all duration-200"
                            >
                                <Clock className="h-4 w-4" />
                                Payment History
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="pending" className="space-y-6">
                        <DoctorPaymentList />
                    </TabsContent>

                    <TabsContent value="history" className="space-y-6">
                        <DoctorPaymentHistory />
                    </TabsContent>
                </Tabs>
            </div>
        </PermissionGuard>
    )
}
