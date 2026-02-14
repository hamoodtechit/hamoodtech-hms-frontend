
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { pharmacyService } from "@/services/pharmacy-service"
import { Sale } from "@/types/pharmacy"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  DollarSign,
  FileText,
  Loader2,
  Package,
  Pill,
  Settings,
  ShieldCheck,
  ShoppingCart
} from "lucide-react"
import { useEffect, useState } from "react"

export default function PharmacyPage() {
  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Pharmacy Overview
          </h2>
          <p className="text-muted-foreground mt-1">
            Real-time inventory tracking and point of sale management.
          </p>
        </div>
        <Link href="/pharmacy/pos">
          <Button size="lg" className="shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Launch POS System
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-card to-secondary/10 border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Stock</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground">
              Across 12 categories
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Items require reordering
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              Processed today
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 md:col-span-2 lg:col-span-4 bg-gradient-to-br from-card to-accent/5">
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <Link href="/pharmacy/inventory">
                    <div className="flex flex-col items-center justify-center p-6 bg-background rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group">
                        <Pill className="h-10 w-10 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
                        <h3 className="font-semibold group-hover:text-primary transition-colors">Manage Inventory</h3>
                        <p className="text-xs text-center text-muted-foreground mt-1">Update stock levels & prices</p>
                    </div>
                </Link>
                <Link href="/pharmacy/reports">
                    <div className="flex flex-col items-center justify-center p-6 bg-background rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group">
                        <ArrowRight className="h-10 w-10 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
                        <h3 className="font-semibold group-hover:text-primary transition-colors">View Reports</h3>
                        <p className="text-xs text-center text-muted-foreground mt-1">Sales & inventory analytics</p>
                    </div>
                </Link>
                <Link href="/pharmacy/prescriptions">
                     <div className="flex flex-col items-center justify-center p-6 bg-background rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group">
                        <FileText className="h-10 w-10 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
                        <h3 className="font-semibold group-hover:text-primary transition-colors">Prescriptions</h3>
                        <p className="text-xs text-center text-muted-foreground mt-1">Digital Rx & Refills</p>
                    </div>
                </Link>
                <Link href="/pharmacy/insurance">
                     <div className="flex flex-col items-center justify-center p-6 bg-background rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group">
                        <ShieldCheck className="h-10 w-10 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
                        <h3 className="font-semibold group-hover:text-primary transition-colors">Insurance</h3>
                        <p className="text-xs text-center text-muted-foreground mt-1">Claims & Billing</p>
                    </div>
                </Link>
                <Link href="/pharmacy/reminders">
                     <div className="flex flex-col items-center justify-center p-6 bg-background rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group">
                        <Bell className="h-10 w-10 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
                        <h3 className="font-semibold group-hover:text-primary transition-colors">Reminders</h3>
                        <p className="text-xs text-center text-muted-foreground mt-1">Dosage Alerts</p>
                    </div>
                </Link>
                <Link href="/pharmacy/setup">
                     <div className="flex flex-col items-center justify-center p-6 bg-background rounded-xl border border-dashed hover:border-primary hover:bg-primary/5 cursor-pointer transition-all group">
                        <Settings className="h-10 w-10 text-muted-foreground group-hover:text-primary mb-3 transition-colors" />
                        <h3 className="font-semibold group-hover:text-primary transition-colors">Pharmacy Setup</h3>
                        <p className="text-xs text-center text-muted-foreground mt-1">Manage Master Data</p>
                    </div>
                </Link>
            </CardContent>
        </Card>
        
        <Card className="col-span-4 md:col-span-2 lg:col-span-3">
             <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>
                    Latest transactions from POS
                </CardDescription>
            </CardHeader>
            <CardContent>
                <RecentSalesList />
            </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RecentSalesList() {
    const [sales, setSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const response = await pharmacyService.getSales({ limit: 5 })
                setSales(response.data.sales)
            } catch (error) {
                console.error("Failed to fetch recent sales", error)
            } finally {
                setLoading(false)
            }
        }
        fetchSales()
    }, [])

    if (loading) {
        return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    }

    if (sales.length === 0) {
        return <div className="text-sm text-muted-foreground text-center py-4">No recent sales found.</div>
    }

    return (
        <div className="space-y-4">
            {sales.map((sale) => (
                <div key={sale.id} className="flex items-center">
                    <div className="space-y-1 overflow-hidden">
                        <p className="text-sm font-medium leading-none truncate">{sale.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">
                            {new Date(sale.createdAt).toLocaleTimeString()} - {sale.patient?.name || 'Walk-in'}
                        </p>
                    </div>
                    <div className="ml-auto font-medium whitespace-nowrap pl-2">
                        +${Number(sale.totalPrice || 0).toFixed(2)}
                    </div>
                </div>
            ))}
        </div>
    )
}
    

