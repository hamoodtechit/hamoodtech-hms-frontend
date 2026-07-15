"use client"

import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, addMonths, subMonths, isSameDay } from "date-fns"
import { enUS } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "@/styles/calendar.css"
import { Schedule, Employee, ScheduleBulkPayload } from "@/types/hr"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Copy, Printer, AlertTriangle, Loader2 } from "lucide-react"
import { useCreateBulkSchedules } from "@/hooks/hr-queries"
import { toast } from "sonner"

const locales = { "en-US": enUS }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const getShiftColor = (shiftName: string = "") => {
    const name = shiftName.toLowerCase()
    if (name.includes("morning")) return "#0ea5e9" // Sky 500
    if (name.includes("evening")) return "#f59e0b" // Amber 500
    if (name.includes("night")) return "#6366f1"   // Indigo 500
    return "#10b981" // Emerald 500 (Default)
}

interface RosterCalendarProps {
    schedules: Schedule[]
    employees: Employee[]
    onSelectEvent: (schedule: Schedule) => void
    onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
}

export function RosterCalendar({ schedules, employees, onSelectEvent, onSelectSlot }: RosterCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const createMutation = useCreateBulkSchedules()

    // 1. Prepare Events and Detect Conflicts
    const { events, conflicts } = useMemo(() => {
        const eventsList: any[] = []
        const dateEmployeeMap: Record<string, string[]> = {} // "date_iso:uid" -> [scheduleIds]
        const conflictSet = new Set<number>() // Store schedule IDs that have conflicts

        // Build a uid -> name map
        const uidToName = new Map<string | number, string>()
        employees.forEach(emp => {
            const uid = emp.employeeNumber?.replace(/\D/g, '') || emp.id
            uidToName.set(Number(uid), emp.name)
            uidToName.set(uid.toString(), emp.name)
        })

        if (Array.isArray(schedules)) {
            schedules.forEach((sch) => {
                const dateKey = `${sch.scheduleDate.split('T')[0]}:${sch.uid}`
                if (!dateEmployeeMap[dateKey]) {
                    dateEmployeeMap[dateKey] = []
                }
                dateEmployeeMap[dateKey].push(sch.id.toString())
                
                if (dateEmployeeMap[dateKey].length > 1) {
                    dateEmployeeMap[dateKey].forEach(id => conflictSet.add(Number(id)))
                }

                const empName = uidToName.get(sch.uid) || uidToName.get(Number(sch.uid)) || uidToName.get(String(sch.uid)) || `UID: ${sch.uid}`

                eventsList.push({
                    id: sch.id,
                    title: `${empName} - ${sch.timetable?.name}`,
                    start: new Date(sch.scheduleDate),
                    end: new Date(sch.scheduleDate),
                    resource: sch,
                    empName: empName,
                    hasConflict: false // Will update below
                })
            })
        }

        // Mark conflicts in the event list
        eventsList.forEach(evt => {
            if (conflictSet.has(evt.id)) {
                evt.hasConflict = true
            }
        })

        return { events: eventsList, conflicts: conflictSet.size > 0 }
    }, [schedules, employees])

    // 2. Cloning Logic
    const handleClonePreviousMonth = async () => {
        const prevMonth = subMonths(currentDate, 1)
        const prevMonthSchedules = Array.isArray(schedules) 
            ? schedules.filter(sch => {
                const d = new Date(sch.scheduleDate)
                return d.getMonth() === prevMonth.getMonth() && d.getFullYear() === prevMonth.getFullYear()
            })
            : []

        if (prevMonthSchedules.length === 0) {
            toast.info("No schedules found in the previous month to copy.")
            return
        }

        const confirm = window.confirm(`Copy ${prevMonthSchedules.length} schedules from ${format(prevMonth, 'MMMM yyyy')}?`)
        if (!confirm) return

        try {
            const bulkPayload: ScheduleBulkPayload = { schedules: [] }

            for (const sch of prevMonthSchedules) {
                const newDate = addMonths(new Date(sch.scheduleDate), 1)
                bulkPayload.schedules.push({
                    uid: Number(sch.uid),
                    timetableId: Number(sch.timetableId),
                    scheduleDate: format(newDate, 'yyyy-MM-dd')
                })
            }

            await createMutation.mutateAsync(bulkPayload)
            toast.success(`Successfully cloned ${bulkPayload.schedules.length} schedules.`)
        } catch (error) {
            toast.error(`Failed to clone schedules.`)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
                    {conflicts && (
                        <div className="flex items-center gap-1 text-xs text-destructive font-medium bg-destructive/10 px-2 py-1 rounded-full">
                            <AlertTriangle className="h-3 w-3" />
                            Overlap Detected
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleClonePreviousMonth} disabled={createMutation.isPending}>
                        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        Clone Prev Month
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Roster
                    </Button>
                </div>
            </div>

            <div className="print:h-auto print:max-h-none print:overflow-visible h-175 w-full bg-background rounded-xl border shadow-sm calendar-container overflow-auto printable-roster">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    views={[Views.MONTH, Views.WEEK]}
                    defaultView={Views.MONTH}
                    date={currentDate}
                    onNavigate={(date) => setCurrentDate(date)}
                    onSelectEvent={(event: any) => onSelectEvent(event.resource as Schedule)}
                    onSelectSlot={onSelectSlot}
                    selectable={!!onSelectSlot}
                    popup
                    drilldownView={null}
                    className="font-sans"
                    eventPropGetter={(event: any) => ({
                        className: cn(
                            "rbc-event-custom border-l-4",
                            event.hasConflict && " ring-2 ring-destructive ring-offset-1 border-l-destructive"
                        ),
                        style: {
                            backgroundColor: getShiftColor(event.resource.timetable?.name),
                            opacity: event.hasConflict ? 0.9 : 1
                        }
                    })}
                    components={{
                        month: {
                            dateHeader: ({ label }: any) => (
                                <div className="rbc-button-link pointer-events-none">
                                    {label}
                                </div>
                            )
                        },
                        event: ({ event }: any) => (
                            <div className="flex flex-col truncate px-1 py-0.5">
                                <div className="flex items-center gap-1">
                                    {event.hasConflict && <AlertTriangle className="h-3 w-3 text-white" />}
                                    <span className="font-bold text-[11px] leading-tight">{event.empName}</span>
                                </div>
                                <span className="text-[9px] opacity-90">{event.resource.timetable?.name}</span>
                            </div>
                        ),
                    }}
                />
            </div>
        </div>
    )
}
