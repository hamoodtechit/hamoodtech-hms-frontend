import {
    endOfDay,
    format,
    startOfDay,
    startOfMonth,
    subDays
} from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: {
  className?: string
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}) {
  const presets = [
    {
      label: "Today",
      value: { from: startOfDay(new Date()), to: endOfDay(new Date()) },
    },
    {
      label: "Yesterday",
      value: { 
        from: startOfDay(subDays(new Date(), 1)), 
        to: endOfDay(subDays(new Date(), 1)) 
      },
    },
    {
      label: "Last 7 Days",
      value: { from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) },
    },
    {
      label: "This Month",
      value: { from: startOfMonth(new Date()), to: endOfDay(new Date()) },
    },
    {
        label: "Last Month",
        value: { 
            from: startOfMonth(subDays(startOfMonth(new Date()), 1)), 
            to: endOfDay(subDays(startOfMonth(new Date()), 1)) 
        },
    },
  ]

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-col sm:flex-row" align="start">
          <div className="flex flex-col border-b sm:border-b-0 sm:border-r p-2 bg-muted/20 min-w-[120px]">
             <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 mb-1">Presets</p>
             {presets.map((preset) => (
                <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "justify-start text-left font-medium text-xs py-1.5 px-2 h-auto",
                        date?.from?.getTime() === preset.value.from.getTime() && 
                        date?.to?.getTime() === preset.value.to.getTime() && 
                        "bg-primary/10 text-primary hover:bg-primary/15"
                    )}
                    onClick={() => setDate(preset.value)}
                >
                    {preset.label}
                </Button>
             ))}
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
