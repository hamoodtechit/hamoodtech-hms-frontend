"use client"

import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import { format, parse, startOfWeek, getDay, addMonths, subMonths, isSameDay } from "date-fns"
import { enUS } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "@/styles/calendar.css"
import { AssignedRoster, AssignedRosterPayload } from "@/types/hr"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Copy, Printer, AlertTriangle, Loader2 } from "lucide-react"
import { useCreateAssignedRoster } from "@/hooks/hr-queries"
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
    assignments: AssignedRoster[]
    onSelectEvent: (assignment: AssignedRoster) => void
    onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
    branchId: string
}

export function RosterCalendar({ assignments, onSelectEvent, onSelectSlot, branchId }: RosterCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const createMutation = useCreateAssignedRoster()

    // 1. Prepare Events and Detect Conflicts
    const { events, conflicts } = useMemo(() => {
        const eventsList: any[] = []
        const dateEmployeeMap: Record<string, string[]> = {} // "date_iso:employeeId" -> [rosterIds]
        const conflictSet = new Set<string>() // Store assignment IDs that have conflicts

        if (Array.isArray(assignments)) {
            assignments.forEach((asgn) => {
                const dateKey = `${asgn.startDate.split('T')[0]}:${asgn.employeeId}`
                if (!dateEmployeeMap[dateKey]) {
                    dateEmployeeMap[dateKey] = []
                }
                dateEmployeeMap[dateKey].push(asgn.id)
                
                if (dateEmployeeMap[dateKey].length > 1) {
                    dateEmployeeMap[dateKey].forEach(id => conflictSet.add(id))
                }

                eventsList.push({
                    id: asgn.id,
                    title: `${asgn.employee?.name} - ${asgn.roster?.shift?.name}`,
                    start: new Date(asgn.startDate),
                    end: new Date(asgn.endDate),
                    resource: asgn,
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
    }, [assignments])

    // 2. Cloning Logic
    const handleClonePreviousMonth = async () => {
        const prevMonth = subMonths(currentDate, 1)
        const prevMonthAssignments = Array.isArray(assignments) 
            ? assignments.filter(asgn => 
                new Date(asgn.startDate).getMonth() === prevMonth.getMonth() &&
                new Date(asgn.startDate).getFullYear() === prevMonth.getFullYear()
            )
            : []

        if (prevMonthAssignments.length === 0) {
            toast.info("No assignments found in the previous month to copy.")
            return
        }

        const confirm = window.confirm(`Copy ${prevMonthAssignments.length} assignments from ${format(prevMonth, 'MMMM yyyy')}?`)
        if (!confirm) return

        let successCount = 0
        try {
            for (const asgn of prevMonthAssignments) {
                const newStart = addMonths(new Date(asgn.startDate), 1)
                const newEnd = addMonths(new Date(asgn.endDate), 1)

                const payload: AssignedRosterPayload = {
                    branchId, // Ensure branchId is saved during cloning
                    employeeId: asgn.employeeId,
                    rosterId: asgn.rosterId,
                    buildingId: asgn.buildingId,
                    floorId: asgn.floorId,
                    sectionId: asgn.sectionId,
                    startDate: newStart.toISOString(),
                    endDate: newEnd.toISOString(),
                    buildingName: asgn.buildingName,
                    floorName: asgn.floorName,
                    sectionName: asgn.sectionName,
                    assignedBy: "Cloned"
                }
                await createMutation.mutateAsync(payload)
                successCount++
            }
            toast.success(`Successfully cloned ${successCount} assignments.`)
        } catch (error) {
            toast.error(`Cloning stopped after ${successCount} items due to an error.`)
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

            <div className="h-175 w-full bg-background rounded-xl border shadow-sm calendar-container overflow-auto printable-roster">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    views={[Views.MONTH, Views.WEEK]}
                    defaultView={Views.MONTH}
                    date={currentDate}
                    onNavigate={(date) => setCurrentDate(date)}
                    onSelectEvent={(event: any) => onSelectEvent(event.resource as AssignedRoster)}
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
                            backgroundColor: getShiftColor(event.resource.roster?.shift?.name),
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
                                    <span className="font-bold text-[11px] leading-tight">{event.resource.employee?.name}</span>
                                </div>
                                <span className="text-[9px] opacity-90">{event.resource.roster?.shift?.name}</span>
                            </div>
                        ),
                    }}
                />
            </div>
        </div>
    )
}
