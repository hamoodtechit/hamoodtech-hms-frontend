"use client"

import { DosageScheduler } from "@/components/pharmacy/reminders/dosage-scheduler"

export default function RemindersPage() {
  return (
    <div className="space-y-6 pt-2">
         <div>
            <h2 className="text-3xl font-bold tracking-tight">Auto Dosage Reminders</h2>
            <p className="text-muted-foreground">Schedule automated notifications to improve patient adherence.</p>
        </div>
        <DosageScheduler />
    </div>
  )
}
