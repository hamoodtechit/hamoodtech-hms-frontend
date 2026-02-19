"use client"

import { StoreSwitcher } from "@/components/layout/store-switcher"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { settingsService } from "@/services/settings-service"
import { useSettingsStore } from "@/store/use-settings-store"
import { AppointmentConfig, FinanceConfig, GeneralConfig, PharmacyConfig } from "@/types/settings"
import { Banknote, Building2, Calendar, Loader2, Pill, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function SettingsPage() {
    const { general, pharmacy, appointments, finance, fetchSettings } = useSettingsStore()
    const [loading, setLoading] = useState(false)
    
    const [generalForm, setGeneralForm] = useState<GeneralConfig | null>(null)
    const [pharmacyForm, setPharmacyForm] = useState<PharmacyConfig | null>(null)
    const [appointmentForm, setAppointmentForm] = useState<AppointmentConfig | null>(null)
    const [financeForm, setFinanceForm] = useState<FinanceConfig | null>(null)

    useEffect(() => {
        if (general) setGeneralForm(general)
        if (pharmacy) setPharmacyForm(pharmacy)
        if (appointments) setAppointmentForm(appointments)
        if (finance) setFinanceForm(finance)
    }, [general, pharmacy, appointments, finance])

    const handleSaveGeneral = async () => {
        if (!generalForm) return
        try {
            setLoading(true)
            await settingsService.updateSetting('general', generalForm)
            toast.success("General settings updated")
            fetchSettings()
        } catch (error) {
            toast.error("Failed to update settings")
        } finally {
            setLoading(false)
        }
    }

    const handleSavePharmacy = async () => {
        if (!pharmacyForm) return
        try {
            setLoading(true)
            await settingsService.updateSetting('pharmacy', pharmacyForm)
            toast.success("Pharmacy settings updated")
            fetchSettings()
        } catch (error) {
            toast.error("Failed to update settings")
        } finally {
            setLoading(false)
        }
    }

    const handleSaveAppointments = async () => {
        if (!appointmentForm) return
        try {
            setLoading(true)
            await settingsService.updateSetting('appointments', appointmentForm)
            toast.success("Appointment settings updated")
            fetchSettings()
        } catch (error) {
            toast.error("Failed to update settings")
        } finally {
            setLoading(false)
        }
    }

    const handleSaveFinance = async () => {
        if (!financeForm) return
        try {
            setLoading(true)
            await settingsService.updateSetting('finance', financeForm)
            toast.success("Finance settings updated")
            fetchSettings()
        } catch (error) {
            toast.error("Failed to update settings")
        } finally {
            setLoading(false)
        }
    }

    if (!general && !pharmacy && !appointments) {
        return (
            <div className="space-y-6 p-6 pb-16">
                <div className="space-y-0.5">
                    <Skeleton className="h-8 w-[150px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </div>
                <Separator className="my-6" />
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
                    <div className="w-full lg:w-64 space-y-2 shrink-0">
                        <Skeleton className="h-11 w-full rounded-lg" />
                        <Skeleton className="h-11 w-full rounded-lg" />
                        <Skeleton className="h-11 w-full rounded-lg" />
                        <Skeleton className="h-11 w-full rounded-lg" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-[200px]" />
                                <Skeleton className="h-4 w-[300px] mt-2" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-[180px]" />
                                    <Skeleton className="h-4 w-[250px]" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-[150px]" />
                                <Skeleton className="h-4 w-[250px] mt-2" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                                <Separator />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6 pb-16 block">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your application preferences and configurations.
                </p>
            </div>
            <Separator className="my-6" />
            

             
             {/* Retrying the render structure for proper vertical tabs */}
             <Tabs defaultValue="general" orientation="vertical" className="flex flex-col lg:flex-row gap-6 lg:gap-10">
                <TabsList className="flex flex-col h-auto w-full lg:w-64 items-stretch bg-transparent p-0 gap-1 shrink-0">
                    <TabsTrigger 
                        value="general"
                        className="justify-start px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:bg-secondary data-[state=active]:text-foreground hover:bg-secondary/50 transition-all rounded-lg"
                    >
                        <Building2 className="mr-3 h-4 w-4" />
                        General & Branch
                    </TabsTrigger>
                    <TabsTrigger 
                        value="pharmacy"
                        className="justify-start px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:bg-secondary data-[state=active]:text-foreground hover:bg-secondary/50 transition-all rounded-lg"
                    >
                        <Pill className="mr-3 h-4 w-4" />
                        Pharmacy
                    </TabsTrigger>
                    <TabsTrigger 
                        value="appointments"
                        className="justify-start px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:bg-secondary data-[state=active]:text-foreground hover:bg-secondary/50 transition-all rounded-lg"
                    >
                        <Calendar className="mr-3 h-4 w-4" />
                        Appointments
                    </TabsTrigger>
                    <TabsTrigger 
                        value="finance"
                        className="justify-start px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:bg-secondary data-[state=active]:text-foreground hover:bg-secondary/50 transition-all rounded-lg"
                    >
                        <Banknote className="mr-3 h-4 w-4" />
                        Finance & Accounts
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 min-w-0">
                    <TabsContent value="general" className="mt-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Branch Configuration</CardTitle>
                                <CardDescription>Manage the active branch for this session.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Label>Active Branch</Label>
                                    <div className="flex items-center gap-4">
                                        <StoreSwitcher />
                                        <p className="text-sm text-muted-foreground">
                                            Switching branches will update the dashboard data and POS context.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>General Settings</CardTitle>
                                <CardDescription>Configure basic hospital information and localization.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {generalForm && (
                                    <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Hospital Name</Label>
                                            <Input 
                                                value={generalForm.hospitalName} 
                                                onChange={(e) => setGeneralForm({...generalForm, hospitalName: e.target.value})} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone</Label>
                                            <Input 
                                                value={generalForm.phone} 
                                                onChange={(e) => setGeneralForm({...generalForm, phone: e.target.value})} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input 
                                                value={generalForm.email} 
                                                onChange={(e) => setGeneralForm({...generalForm, email: e.target.value})} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Address</Label>
                                            <Input 
                                                value={generalForm.address} 
                                                onChange={(e) => setGeneralForm({...generalForm, address: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                         <div className="space-y-2">
                                            <Label>Currency Code</Label>
                                            <Input 
                                                value={generalForm.currency} 
                                                onChange={(e) => setGeneralForm({...generalForm, currency: e.target.value})} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Currency Symbol</Label>
                                            <Input 
                                                value={generalForm.currencySymbol} 
                                                onChange={(e) => setGeneralForm({...generalForm, currencySymbol: e.target.value})} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Timezone</Label>
                                            <Input 
                                                value={generalForm.timezone} 
                                                onChange={(e) => setGeneralForm({...generalForm, timezone: e.target.value})} 
                                            />
                                        </div>
                                    </div>
                                    </>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSaveGeneral} disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="pharmacy" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pharmacy Configuration</CardTitle>
                                <CardDescription>Manage VAT, stock alerts, and inventory thresholds.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {pharmacyForm && (
                                    <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>VAT Percentage (%)</Label>
                                            <Input 
                                                type="number"
                                                value={pharmacyForm.vatPercentage} 
                                                onChange={(e) => setPharmacyForm({...pharmacyForm, vatPercentage: Number(e.target.value)})} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Low Stock Threshold</Label>
                                            <Input 
                                                type="number"
                                                value={pharmacyForm.lowStockThreshold} 
                                                onChange={(e) => setPharmacyForm({...pharmacyForm, lowStockThreshold: Number(e.target.value)})} 
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-4">
                                        <Switch 
                                            checked={pharmacyForm.enableStockAlerts}
                                            onCheckedChange={(checked) => setPharmacyForm({...pharmacyForm, enableStockAlerts: checked})}
                                        />
                                        <Label>Enable Stock Alerts</Label>
                                    </div>
                                    </>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSavePharmacy} disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <TabsContent value="appointments" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Appointment Settings</CardTitle>
                                <CardDescription>Configure scheduling slots and operating hours.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {appointmentForm && (
                                    <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Start Time</Label>
                                            <Input 
                                                type="time"
                                                value={appointmentForm.startTime} 
                                                onChange={(e) => setAppointmentForm({...appointmentForm, startTime: e.target.value})} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Time</Label>
                                            <Input 
                                                type="time"
                                                value={appointmentForm.endTime} 
                                                onChange={(e) => setAppointmentForm({...appointmentForm, endTime: e.target.value})} 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Slot Duration (minutes)</Label>
                                            <Input 
                                                type="number"
                                                value={appointmentForm.slotDuration} 
                                                onChange={(e) => setAppointmentForm({...appointmentForm, slotDuration: Number(e.target.value)})} 
                                            />
                                        </div>
                                    </div>
                                    </>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSaveAppointments} disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>


                    <TabsContent value="finance" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Finance Configuration</CardTitle>
                                <CardDescription>Map payment methods to specific accounts for financial tracking.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {financeForm && (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Payment Method</TableHead>
                                                <TableHead>Account Name</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {['cash', 'card', 'online', 'cheque', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer'].map((method) => (
                                                <TableRow key={method}>
                                                    <TableCell className="font-medium capitalize flex items-center gap-2">
                                                        <div className="bg-primary/10 p-1 rounded">
                                                            <Banknote className="h-4 w-4 text-primary" />
                                                        </div>
                                                        {method}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input 
                                                            value={financeForm.paymentMethodAccounts?.[method]?.name || ''} 
                                                            onChange={(e) => {
                                                                const newAccounts = { ...(financeForm.paymentMethodAccounts || {}) }
                                                                // Keep existing ID if it exists (from backend), otherwise undefined. DO NOT GENERATE.
                                                                const existingId = newAccounts[method]?.id
                                                                
                                                                newAccounts[method] = { 
                                                                    ...(newAccounts[method] || {}), 
                                                                    id: existingId || '', // Send empty string or undefined if no ID yet
                                                                    name: e.target.value 
                                                                }
                                                                setFinanceForm({ ...financeForm, paymentMethodAccounts: newAccounts })
                                                            }}
                                                            placeholder={`Account Name for ${method}`}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleSaveFinance} disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
