"use client"

import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "@/styles/calendar.css"
import { AnnualCalendar } from "@/types/hr"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"

const getEventColor = (type: string) => {
  switch (type) {
    case 'holiday':
      return "#dc2626" // Rose 600 (Red for holidays)
    case 'vacation':
      return "#2563eb" // Blue 600 (Blue for vacations)
    case 'event':
      return "#059669" // Emerald 600 (Green for events)
    default:
      return "#4f46e5" // Indigo 600
  }
};

const locales = {
  "en-US": enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface AnnualCalendarProps {
  calendars: AnnualCalendar[]
  onSelectEvent: (calendar: AnnualCalendar) => void
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
}

export function AnnualCalendarComponent({ calendars, onSelectEvent, onSelectSlot }: AnnualCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const events = useMemo(() => {
    return calendars.map((cal) => ({
      id: cal.id,
      title: cal.name,
      start: new Date(cal.startDate),
      end: new Date(cal.endDate),
      allDay: true,
      resource: cal,
    }))
  }, [calendars])

  return (
    <div className="h-175 w-full p-4 bg-background rounded-xl border shadow-sm calendar-container overflow-auto">
      <div className="h-full min-h-150 min-w-75">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          views={[Views.MONTH]}
          defaultView={Views.MONTH}
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          onSelectEvent={(event: any) => onSelectEvent(event.resource as AnnualCalendar)}
          onSelectSlot={onSelectSlot}
          selectable={!!onSelectSlot}
          popup
          drilldownView={null}
          className="font-sans"
          eventPropGetter={(event: any) => ({
            className: "rbc-event-custom",
            style: {
              backgroundColor: getEventColor(event.resource.type)
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
              <div className="flex flex-col truncate px-1">
                <span className="font-bold leading-tight">{event.title}</span>
              </div>
            ),
          }}
        />
      </div>
    </div>
  )
}
