"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Check, ChevronDown, ChevronUp, Clock, Loader2, Moon, Sun, Sunrise } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

interface TimeSlotPickerProps {
    value: string
    onChange: (time: string) => void
    startTime?: string // "08:00"
    endTime?: string   // "20:00"
    duration?: number  // 15 or 30
    bookedSlots?: string[]  // Already booked time slots
    autoSelect?: boolean    // Auto-select next available slot
    loading?: boolean       // Loading booked slots
}

export function TimeSlotPicker({ 
    value, 
    onChange, 
    startTime = "08:00", 
    endTime = "21:00", 
    duration = 30,
    bookedSlots = [],
    autoSelect = false,
    loading = false,
}: TimeSlotPickerProps) {
    const [showAll, setShowAll] = useState(false)
    
    // Generate all possible slots
    const allSlots = useMemo(() => {
        const result: string[] = []
        const [startH, startM] = startTime.split(':').map(Number)
        const [endH, endM] = endTime.split(':').map(Number)

        let currH = startH
        let currM = startM

        // First slot starts after duration from start time
        currM += duration
        if (currM >= 60) {
            currH += Math.floor(currM / 60)
            currM = currM % 60
        }

        while (currH < endH || (currH === endH && currM <= endM)) {
            const ampm = currH >= 12 ? 'PM' : 'AM'
            const h12 = currH > 12 ? currH - 12 : (currH === 0 ? 12 : currH)
            const timeStr = `${h12}:${currM === 0 ? '00' : currM.toString().padStart(2, '0')} ${ampm}`
            result.push(timeStr)

            currM += duration
            if (currM >= 60) {
                currH += Math.floor(currM / 60)
                currM = currM % 60
            }
        }

        return result
    }, [startTime, endTime, duration])

    // Categorize slots
    const categorizedSlots = useMemo(() => {
        const morning: string[] = []
        const afternoon: string[] = []
        const evening: string[] = []

        allSlots.forEach(slot => {
            const isPM = slot.includes('PM')
            const hourStr = slot.split(':')[0]
            const hour = parseInt(hourStr)
            const hour24 = isPM ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour)

            if (hour24 < 12) morning.push(slot)
            else if (hour24 < 17) afternoon.push(slot)
            else evening.push(slot)
        })

        return { morning, afternoon, evening }
    }, [allSlots])

    // Normalize booked slots for comparison
    const normalizedBooked = useMemo(() => {
        return new Set(bookedSlots.map(s => s.trim().toUpperCase()))
    }, [bookedSlots])

    const isBooked = (slot: string) => normalizedBooked.has(slot.trim().toUpperCase())

    // Find next available slot
    const nextAvailable = useMemo(() => {
        return allSlots.find(slot => !isBooked(slot)) || null
    }, [allSlots, normalizedBooked])

    // Auto-select effect
    useEffect(() => {
        if (autoSelect && !loading && nextAvailable && !value) {
            onChange(nextAvailable)
        }
    }, [autoSelect, loading, nextAvailable]) // eslint-disable-line react-hooks/exhaustive-deps

    // When bookedSlots change and current value is now booked, auto-pick next
    useEffect(() => {
        if (autoSelect && !loading && value && isBooked(value) && nextAvailable) {
            onChange(nextAvailable)
        }
    }, [bookedSlots, loading]) // eslint-disable-line react-hooks/exhaustive-deps

    const bookedCount = allSlots.filter(s => isBooked(s)).length
    const availableCount = allSlots.length - bookedCount

    if (loading) {
        return (
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-bold text-muted-foreground">Checking available slots...</span>
            </div>
        )
    }

    // Auto-select mode: show the assigned slot prominently
    if (autoSelect && !showAll) {
        return (
            <div className="space-y-3">
                {/* Auto-assigned slot display */}
                <div className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all",
                    value 
                        ? "border-primary bg-primary/5" 
                        : "border-destructive/30 bg-destructive/5"
                )}>
                    <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                        value ? "bg-primary text-primary-foreground" : "bg-destructive/10 text-destructive"
                    )}>
                        <Clock className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            Auto-assigned Time Slot
                        </p>
                        {value ? (
                            <p className="text-xl font-black text-foreground tracking-tight">{value}</p>
                        ) : (
                            <p className="text-sm font-bold text-destructive">No available slots for this doctor today</p>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            {availableCount} available
                        </span>
                        {bookedCount > 0 && (
                            <span className="text-[10px] font-bold text-muted-foreground">
                                {bookedCount} booked
                            </span>
                        )}
                    </div>
                </div>

                {/* Option to manually pick */}
                <button
                    type="button"
                    onClick={() => setShowAll(true)}
                    className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors px-1"
                >
                    <ChevronDown className="h-3.5 w-3.5" />
                    Choose a different slot manually
                </button>
            </div>
        )
    }

    // Full grid mode (manual or when showAll is true)
    const SlotGrid = ({ times, label, icon: Icon }: { times: string[], label: string, icon: any }) => {
        if (times.length === 0) return null
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                    {times.map((time) => {
                        const booked = isBooked(time)
                        const selected = value === time
                        return (
                            <Button
                                key={time}
                                variant={selected ? "default" : "outline"}
                                size="sm"
                                disabled={booked}
                                className={cn(
                                    "h-9 text-[11px] font-bold transition-all relative",
                                    selected && "ring-2 ring-primary ring-offset-1 shadow-lg shadow-primary/20",
                                    booked && "opacity-40 line-through cursor-not-allowed",
                                    !booked && !selected && "hover:border-primary/50 hover:bg-primary/5"
                                )}
                                onClick={() => {
                                    if (!booked) onChange(time)
                                }}
                            >
                                {time}
                                {selected && (
                                    <Check className="h-3 w-3 absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5" />
                                )}
                            </Button>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 border rounded-2xl p-4 bg-muted/20">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-xs font-black uppercase tracking-wider">Select Time Slot</span>
                    {value && (
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                            {value}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-600">{availableCount} free</span>
                    {bookedCount > 0 && <span className="text-[10px] font-bold text-muted-foreground">• {bookedCount} booked</span>}
                    {autoSelect && (
                        <button
                            type="button"
                            onClick={() => setShowAll(false)}
                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                        >
                            <ChevronUp className="h-3 w-3" /> Auto
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                <SlotGrid times={categorizedSlots.morning} label="Morning" icon={Sunrise} />
                <SlotGrid times={categorizedSlots.afternoon} label="Afternoon" icon={Sun} />
                <SlotGrid times={categorizedSlots.evening} label="Evening" icon={Moon} />
            </div>

            {allSlots.length === 0 && (
                <div className="py-6 text-center text-sm font-medium text-muted-foreground">
                    No time slots available for this schedule.
                </div>
            )}
        </div>
    )
}
