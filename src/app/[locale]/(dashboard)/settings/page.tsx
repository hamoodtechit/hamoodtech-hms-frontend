"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { settingsService } from "@/services/settings-service"
import { useSettingsStore } from "@/store/use-settings-store"
import { AppointmentConfig, GeneralConfig, PharmacyConfig } from "@/types/settings"
import { Loader2, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function SettingsPage() {
    const { general, pharmacy, appointments, fetchSettings } = useSettingsStore()
    const [loading, setLoading] = useState(false)
    
    const [generalForm, setGeneralForm] = useState<GeneralConfig | null>(null)
    const [pharmacyForm, setPharmacyForm] = useState<PharmacyConfig | null>(null)
    const [appointmentForm, setAppointmentForm] = useState<AppointmentConfig | null>(null)

    useEffect(() => {
        if (general) setGeneralForm(general)
        if (pharmacy) setPharmacyForm(pharmacy)
        if (appointments) setAppointmentForm(appointments)
    }, [general, pharmacy, appointments])

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

    if (!general && !pharmacy && !appointments) {
        return <div className="flex h-96 items-center justify-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading settings...</div>
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
            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
                    <TabsTrigger value="appointments">Appointments</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>Configure basic hospital information and localization.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {generalForm && (
                                <>
                                <div className="grid grid-cols-2 gap-4">
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
                                <div className="grid grid-cols-3 gap-4">
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
                
                 <TabsContent value="pharmacy">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pharmacy Configuration</CardTitle>
                            <CardDescription>Manage VAT, stock alerts, and inventory thresholds.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {pharmacyForm && (
                                <>
                                <div className="grid grid-cols-2 gap-4">
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

                <TabsContent value="appointments">
                    <Card>
                        <CardHeader>
                            <CardTitle>Appointment Settings</CardTitle>
                            <CardDescription>Configure scheduling slots and operating hours.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {appointmentForm && (
                                <>
                                <div className="grid grid-cols-2 gap-4">
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
            </Tabs>
        </div>
    )
}
