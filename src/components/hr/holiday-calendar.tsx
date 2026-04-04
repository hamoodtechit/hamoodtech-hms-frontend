"use client"

import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "@/styles/calendar.css"
import { Holiday } from "@/types/hr"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"

const getHolidayColor = (title: string) => {
  const colors = [
    "#059669", // Emerald 600
    "#2563eb", // Blue 600
    "#7c3aed", // Violet 600
    "#d97706", // Amber 600
    "#dc2626", // Rose 600
    "#4f46e5", // Indigo 600
    "#0891b2", // Cyan 600
    "#9333ea", // Purple 600
    "#ea580c", // Orange 600
    "#0d9488", // Teal 600
  ];
  if (!title) return colors[0];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
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

interface HolidayCalendarProps {
  holidays: Holiday[]
  onSelectEvent: (holiday: Holiday) => void
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
}

export function HolidayCalendar({ holidays, onSelectEvent, onSelectSlot }: HolidayCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const events = useMemo(() => {
    return holidays.map((holiday) => ({
      id: holiday.id,
      title: holiday.name,
      start: new Date(holiday.startDate),
      end: new Date(holiday.endDate),
      allDay: true,
      resource: holiday,
    }))
  }, [holidays])

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
          onSelectEvent={(event: any) => onSelectEvent(event.resource as Holiday)}
          onSelectSlot={onSelectSlot}
          selectable={!!onSelectSlot}
          popup
          className="font-sans"
          eventPropGetter={(event: any) => ({
            className: "rbc-event-custom",
            style: {
              backgroundColor: getHolidayColor(event.title)
            }
          })}
          components={{
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
