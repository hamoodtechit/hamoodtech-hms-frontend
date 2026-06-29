"use client"

import { IncomeCategoryList } from "@/components/finance/income-category-list"
import { IncomeList } from "@/components/finance/income-list"
import { PermissionGuard } from "@/components/shared/permission-guard"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { usePermissions } from "@/hooks/use-permissions"
import { Banknote, Loader2, Plus } from "lucide-react"
import { useEffect, useState } from "react"

export default function IncomesPage() {
    const { hasPermission } = usePermissions()
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
        <PermissionGuard permission="income:read">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Income Tracking</h1>
                    <p className="text-muted-foreground">Manage hospital incomes and categorizations.</p>
                </div>

                <Tabs defaultValue="list" className="w-full">
                    <div className="flex justify-center sm:justify-start mb-8">
                        <TabsList className="h-11 bg-muted/40 p-1.5 rounded-[0.9rem] border border-white/20 inline-flex w-auto shadow-sm">
                            <TabsTrigger 
                                value="list" 
                                className="rounded-lg px-5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-bold text-xs flex items-center gap-2 transition-all duration-200"
                            >
                                <Banknote className="h-4 w-4" />
                                Income List
                            </TabsTrigger>
                            {hasPermission('income-category:read') && (
                                <TabsTrigger 
                                    value="categories" 
                                    className="rounded-lg px-5 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md font-bold text-xs flex items-center gap-2 transition-all duration-200"
                                >
                                    <Plus className="h-4 w-4" />
                                    Categories
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    <TabsContent value="list" className="space-y-6">
                        <PermissionGuard permission="income:read" mode="silent">
                            <IncomeList />
                        </PermissionGuard>
                    </TabsContent>

                    <TabsContent value="categories" className="space-y-6">
                        <PermissionGuard permission="income-category:read" mode="silent">
                            <IncomeCategoryList />
                        </PermissionGuard>
                    </TabsContent>
                </Tabs>
            </div>
        </PermissionGuard>
    )
}
