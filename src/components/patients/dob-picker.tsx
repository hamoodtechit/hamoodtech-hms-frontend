import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"

interface DobPickerProps {
  value: string | undefined
  onChange: (date: string | undefined) => void
}

export function DobPicker({ value, onChange }: DobPickerProps) {
  const [open, setOpen] = useState(false)
  const [day, setDay] = useState<string>("")
  const [month, setMonth] = useState<string>("")
  const [year, setYear] = useState<string>("")

  // Sync state with value
  useEffect(() => {
    if (value) {
      const d = new Date(value)
      if (!isNaN(d.getTime())) {
        setDay(d.getDate().toString())
        setMonth((d.getMonth() + 1).toString())
        setYear(d.getFullYear().toString())
      }
    } else {
      setDay("")
      setMonth("")
      setYear("")
    }
  }, [value])

  const handleApply = () => {
    if (day && month && year) {
      // Pad with zeroes
      const paddedDay = day.padStart(2, '0')
      const paddedMonth = month.padStart(2, '0')
      const dateString = `${year}-${paddedMonth}-${paddedDay}`
      onChange(dateString)
      setOpen(false)
    }
  }

  const handleClear = () => {
    onChange(undefined)
    setOpen(false)
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 120 }, (_, i) => currentYear - i)
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]
  const daysInMonth = month && year ? new Date(parseInt(year), parseInt(month), 0).getDate() : 31
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-r-md transition-colors" 
          type="button" 
          tabIndex={-1}
          title="Pick Date of Birth"
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground pointer-events-none" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-center">Select Date of Birth</h4>
          <div className="grid grid-cols-3 gap-2">
            <Select value={day} onValueChange={setDay}>
              <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
              <SelectContent>
                {days.map(d => (
                  <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="w-full" onClick={handleClear}>Clear</Button>
            <Button className="w-full" onClick={handleApply} disabled={!day || !month || !year}>Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
