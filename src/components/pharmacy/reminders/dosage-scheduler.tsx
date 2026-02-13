"use client"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useReminderStore } from "@/store/use-reminder-store"
import { Bell, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function DosageScheduler() {
    const { reminders, addReminder, toggleReminder, deleteReminder } = useReminderStore()
    
    // Form State
    const [patientName, setPatientName] = useState("")
    const [medication, setMedication] = useState("")
    const [time, setTime] = useState("09:00")
    const [contact, setContact] = useState("")

    const handleAdd = () => {
        if (!patientName || !medication || !contact) {
            toast.error("Missing required fields")
            return
        }

        addReminder({
            id: `REM-${Date.now()}`,
            patientName,
            medication,
            dosage: 'Standard',
            frequency: 'Daily',
            time: [time],
            startDate: new Date().toISOString().split('T')[0],
            active: true,
            method: 'SMS',
            contact
        })

        toast.success("Reminder setup successfully")
        setPatientName("")
        setMedication("")
        setContact("")
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        New Reminder
                    </CardTitle>
                    <CardDescription>Setup automated SMS/Email alerts for prescriptions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Patient Name</Label>
                        <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                        <Label>Medication</Label>
                        <Input value={medication} onChange={e => setMedication(e.target.value)} placeholder="e.g. Metformin" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Time</Label>
                            <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact (Phone/Email)</Label>
                            <Input value={contact} onChange={e => setContact(e.target.value)} placeholder="+1..." />
                        </div>
                    </div>
                    <Button onClick={handleAdd} className="w-full">Schedule Reminder</Button>
                </CardContent>
            </Card>

            {/* List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Active Schedules
                    </CardTitle>
                    <CardDescription>Managing {reminders.length} active alerts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        {reminders.map(rem => (
                            <div key={rem.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                                <div className="space-y-1">
                                    <h4 className="font-semibold text-sm">{rem.patientName}</h4>
                                    <p className="text-xs text-muted-foreground">{rem.medication} • {rem.time[0]}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={rem.active} onCheckedChange={() => toggleReminder(rem.id)} />
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteReminder(rem.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {reminders.length === 0 && (
                            <p className="text-center text-muted-foreground text-sm py-8">No reminders set.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
